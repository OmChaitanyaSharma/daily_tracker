import { useState, useMemo } from 'react';
import { db, type Goal, type GoalMeasurement } from '../db';
import { getMeasurementDates, getTodayStr } from '../utils/dateUtils';
import { format } from 'date-fns';
import { ChevronRight, Check, Settings, Plus, X, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { auth } from '../firebase';
import { deleteDocumentFromCloud } from '../services/cloudSync';

export function GoalRow({ 
  goal, 
  measurements, 
  onClick, 
  onEdit,
  draggable,
  onDragStart,
  onDragOver,
  onDrop
}: { 
  goal: Goal, 
  measurements: GoalMeasurement[], 
  onClick: () => void, 
  onEdit: () => void,
  draggable?: boolean,
  onDragStart?: (e: React.DragEvent) => void,
  onDragOver?: (e: React.DragEvent) => void,
  onDrop?: (e: React.DragEvent) => void
}) {
  const dates = useMemo(() => getMeasurementDates(goal.startDate), [goal.startDate]);
  
  const actualStartMeasurement = measurements.find(m => m.date === dates[0])?.value;
  const startingValue = actualStartMeasurement !== undefined ? actualStartMeasurement : goal.startingValue;
  
  const validMeasurements = measurements.filter(m => m.date >= dates[0]);
  validMeasurements.sort((a, b) => b.date.localeCompare(a.date));
  const currentMeasurementValue = validMeasurements.length > 0 ? validMeasurements[0].value : startingValue;
  
  const renderValue = (val: string | number | undefined) => {
    if (val === undefined || val === null || val === '') return '???';
    return `${val}${goal.unit ? ` ${goal.unit}` : ''}`;
  };

  const progressPercent = useMemo(() => {
    if (goal.type === 'qualitative' || !goal.targetValue || isNaN(Number(currentMeasurementValue)) || isNaN(Number(startingValue))) return null;
    const current = Number(currentMeasurementValue);
    const target = Number(goal.targetValue);
    const start = Number(startingValue);
    if (target === start) return 100;
    
    const range = Math.abs(target - start);
    const progress = Math.abs(current - start);
    const rawPercent = (progress / range) * 100;
    return Math.min(Math.max(rawPercent, 0), 100);
  }, [goal.type, currentMeasurementValue, goal.targetValue, startingValue]);

  return (
    <div 
      className={clsx(
        "bg-bg-surface border border-border-subtle rounded-3xl p-5 sm:p-6 md:p-8 hover-lift transition-all flex flex-col group",
        draggable && "cursor-grab active:cursor-grabbing"
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex flex-col md:flex-row gap-5 md:gap-6 items-start md:items-center justify-between w-full">
        <div className="flex-1 flex items-center gap-3 sm:gap-4 w-full">
          <button onClick={onClick} className="flex-1 text-left tap-press">
            <h3 className="text-lg sm:text-xl font-serif text-text-main mb-1.5 sm:mb-2 hover:text-accent-blue transition-colors break-words line-clamp-2" title={goal.title}>{goal.title}</h3>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs sm:text-sm text-text-muted">
              <span>Target: <span className="font-medium text-text-main">{renderValue(goal.targetValue) || 'Qualitative'}</span></span>
            </div>
          </button>
          <button
            onClick={onEdit}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main bg-bg-base border border-border-strong rounded-xl transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-105 shrink-0 tap-press"
            aria-label="Edit goal settings"
          >
            <Settings size={18} />
          </button>
        </div>
        
        <div className="flex items-center gap-6 sm:gap-8 text-sm cursor-pointer w-full md:w-auto justify-between md:justify-end tap-press" onClick={onClick}>
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-text-muted mb-1 opacity-70">Starting</span>
            <span className="font-sans font-medium text-base sm:text-lg text-text-main">
              {renderValue(startingValue)}
            </span>
          </div>
          <ChevronRight size={18} className="text-border-strong group-hover:text-accent-blue transition-colors group-hover:translate-x-1" />
          <div className="flex flex-col items-end sm:items-start">
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-text-muted mb-1 opacity-70">Current</span>
            <span className="font-sans font-medium text-base sm:text-lg text-text-main">
              {renderValue(currentMeasurementValue)}
            </span>
          </div>
        </div>
      </div>

      {progressPercent !== null && (
        <div className="mt-5 sm:mt-6">
          <div className="flex justify-between text-[10px] uppercase tracking-widest text-text-muted mb-2 font-medium">
            <span>Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full h-1.5 bg-bg-base rounded-full overflow-hidden border border-border-subtle">
            <div 
              className="h-full bg-accent-blue transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function GoalDetail({ 
  goal, 
  measurements, 
  onBack,
  onEdit 
}: { 
  goal: Goal; 
  measurements: GoalMeasurement[]; 
  onBack: () => void;
  onEdit?: () => void;
}) {
  const scheduleDates = useMemo(() => getMeasurementDates(goal.startDate), [goal.startDate]);
  const measurementDates = measurements.map(m => m.date);
  
  const progressStats = useMemo(() => {
    if (goal.type === 'qualitative' || !goal.targetValue) return null;
    
    const sorted = [...measurements].sort((a,b) => a.date.localeCompare(b.date));
    if (sorted.length === 0) return { percent: 0, label: '0%' };
    
    const latestVal = parseFloat(sorted[sorted.length - 1].value as string);
    const startVal = parseFloat((goal.startingValue as string) || '0');
    const targetVal = parseFloat(goal.targetValue as string);
    
    if (isNaN(latestVal) || isNaN(targetVal)) return null;
    
    const totalDiff = targetVal - startVal;
    const currentDiff = latestVal - startVal;
    
    if (totalDiff === 0) return { percent: latestVal >= targetVal ? 100 : 0, label: latestVal >= targetVal ? '100%' : '0%' };
    
    let percent = (currentDiff / totalDiff) * 100;
    percent = Math.max(0, Math.min(100, percent)); // Clamp between 0-100
    
    return { percent, label: `${Math.round(percent)}%` };
  }, [goal, measurements]);
  
  const allUniqueDates = Array.from(new Set([...scheduleDates, ...measurementDates])).sort();
  const todayStr = getTodayStr();
  
  const [addingDate, setAddingDate] = useState<string | null>(null);

  return (
    <div className="bg-bg-surface border border-border-strong rounded-3xl p-5 sm:p-8 md:p-12 shadow-sm animate-scale-in">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-base border border-transparent hover:border-border-subtle transition-all tap-press cursor-pointer"
          aria-label="Back to goals"
        >
          <ArrowLeft size={20} />
        </button>

        {onEdit && (
          <button
            onClick={onEdit}
            className="min-h-[44px] flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-text-muted hover:text-text-main bg-bg-base border border-border-strong rounded-xl transition-all tap-press cursor-pointer hover:border-text-muted"
            aria-label="Edit goal settings"
          >
            <Settings size={16} />
            <span>Goal Settings</span>
          </button>
        )}
      </div>
      
      <div className="mb-8 sm:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif italic text-text-main mb-4">{goal.title}</h2>
          
          {progressStats && (
            <div className="mb-6 max-w-sm">
              <div className="flex justify-between text-xs text-text-muted mb-1.5 font-medium tracking-wide">
                <span>Progress</span>
                <span>{progressStats.label}</span>
              </div>
              <div className="h-1.5 w-full bg-border-subtle rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-blue rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressStats.percent}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-6 sm:gap-8 text-sm pb-4 sm:pb-6">
            <div>
              <span className="block text-xs uppercase tracking-widest text-text-muted mb-1">Target</span>
              <span className="font-medium text-text-main text-base sm:text-lg">
                {goal.targetValue ? `${goal.targetValue}${goal.unit ? ` ${goal.unit}` : ''}` : 'Qualitative'}
              </span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-widest text-text-muted mb-1">Type</span>
              <span className="font-medium text-text-main text-base sm:text-lg capitalize">{goal.type}</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setAddingDate(todayStr)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-text-main text-bg-base rounded-xl text-sm font-medium hover:opacity-90 whitespace-nowrap self-stretch sm:self-center tap-press"
        >
          <Plus size={18} /> Add Entry
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold tracking-widest uppercase text-text-muted mb-4 sm:mb-6 border-b border-border-subtle pb-4">Measurement History</h3>
        
        {addingDate && (
          <MeasurementRow 
            goal={goal}
            date={addingDate}
            label="Custom Entry"
            existingMeasurement={undefined}
            isFuture={false}
            isScheduled={false}
            onCancel={() => setAddingDate(null)}
            autoEdit={true}
          />
        )}

        {allUniqueDates.map((date) => {
          const measurement = measurements.find(m => m.date === date);
          const isScheduled = scheduleDates.includes(date);
          const isFutureDate = date > todayStr;
          
          let label = "Actual Measurement";
          if (isScheduled) {
            const idx = scheduleDates.indexOf(date);
            label = `Scheduled: +${idx * 15} days`;
            if (idx === 0) label = 'Scheduled: Initial';
            if (idx === scheduleDates.length - 1) label = 'Scheduled: Final (Dec 31)';
          }

          return (
            <MeasurementRow 
              key={date}
              goal={goal}
              date={date}
              label={label}
              existingMeasurement={measurement}
              isFuture={isFutureDate}
              isScheduled={isScheduled}
            />
          );
        })}
      </div>
    </div>
  );
}

function MeasurementRow({ goal, date, label, existingMeasurement, isFuture, isScheduled, onCancel, autoEdit = false }: { 
  goal: Goal, 
  date: string, 
  label: string, 
  existingMeasurement?: GoalMeasurement, 
  isFuture: boolean, 
  isScheduled: boolean,
  onCancel?: () => void,
  autoEdit?: boolean
}) {
  const [isEditing, setIsEditing] = useState(autoEdit);
  const [editDate, setEditDate] = useState(date);
  const [inputValue, setInputValue] = useState(existingMeasurement?.value.toString() || '');
  const [inputUnit, setInputUnit] = useState(existingMeasurement?.unit || goal.unit || '');

  const saveMeasurement = async () => {
    if (!inputValue.trim()) {
      if (onCancel) onCancel();
      return setIsEditing(false);
    }
    
    let valueToSave: string | number = inputValue;
    if (['numeric', 'count', 'distance', 'percentage', 'duration'].includes(goal.type)) {
      const num = parseFloat(inputValue);
      if (!isNaN(num)) valueToSave = num;
    }

    if (existingMeasurement) {
      await db.goalMeasurements.update(existingMeasurement.id, {
        date: editDate,
        value: valueToSave,
        unit: inputUnit
      });
    } else {
      await db.goalMeasurements.add({
        id: crypto.randomUUID(),
        goalId: goal.id,
        date: editDate,
        value: valueToSave,
        unit: inputUnit
      });
    }
    setIsEditing(false);
    if (onCancel && !existingMeasurement) onCancel();
  };

  const deleteMeasurement = async () => {
    if (existingMeasurement) {
      await db.goalMeasurements.delete(existingMeasurement.id);
      if (auth.currentUser) {
        deleteDocumentFromCloud(auth.currentUser.uid, 'goalMeasurements', existingMeasurement.id).catch(() => {});
      }
    }
  };

  const hasValue = !!existingMeasurement;

  return (
    <div className={clsx(
      "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-colors gap-3 sm:gap-4",
      editDate === getTodayStr() ? "bg-accent-red-bg/20 border-accent-red/30" : "bg-bg-base border-border-subtle",
      isFuture && !hasValue && "opacity-50"
    )}>
      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
        {isEditing && !isScheduled ? (
          <input 
            type="date"
            value={editDate}
            onChange={e => setEditDate(e.target.value)}
            aria-label="Measurement date"
            className="w-36 min-h-[44px] bg-bg-surface border border-border-strong rounded-xl px-3 py-2 text-base sm:text-sm outline-none"
          />
        ) : (
          <div className="w-28 shrink-0 text-sm font-medium text-text-main">
            {format(new Date(date), 'MMM d, yyyy')}
          </div>
        )}
        <div className="text-xs uppercase tracking-widest text-text-muted">
          {label}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
        {isFuture && !hasValue ? (
          <span className="text-sm text-text-muted italic">Upcoming</span>
        ) : isEditing ? (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input 
              type={goal.type === 'qualitative' ? 'text' : 'number'}
              step="any"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Value"
              aria-label="Measurement value"
              className="bg-bg-surface border border-border-strong rounded-xl px-3 py-2 min-h-[44px] text-base sm:text-sm text-text-main focus:outline-none w-28 sm:w-32 flex-1 sm:flex-initial"
              autoFocus
            />
            <input 
              type="text"
              value={inputUnit}
              onChange={e => setInputUnit(e.target.value)}
              placeholder="Unit"
              aria-label="Measurement unit"
              className="bg-bg-surface border border-border-strong rounded-xl px-2.5 py-2 min-h-[44px] text-base sm:text-sm text-text-main focus:outline-none w-20"
            />
            <button 
              onClick={saveMeasurement}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-text-main text-bg-base rounded-xl hover:opacity-90 tap-press"
              aria-label="Save measurement"
            >
              <Check size={18} />
            </button>
            <button 
              onClick={() => {
                if (onCancel) onCancel();
                setIsEditing(false);
              }}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-bg-surface border border-border-strong rounded-xl hover:bg-bg-surface-hover tap-press"
              aria-label="Cancel editing"
            >
              <X size={18} />
            </button>
          </div>
        ) : hasValue ? (
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="font-serif text-lg text-text-main font-medium">
              {existingMeasurement.value} {existingMeasurement.unit}
            </span>
            <div className="flex gap-1 sm:gap-2">
              <button 
                onClick={() => setIsEditing(true)}
                className="min-h-[44px] px-3 flex items-center text-xs font-medium text-text-muted hover:text-text-main underline underline-offset-2 tap-press"
              >
                Edit
              </button>
              <button 
                onClick={deleteMeasurement}
                className="min-h-[44px] px-3 flex items-center text-xs font-medium text-accent-red hover:opacity-80 underline underline-offset-2 tap-press"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-sm text-border-strong italic">Not recorded</span>
            <button 
              onClick={() => setIsEditing(true)}
              className="min-h-[44px] px-3 flex items-center text-xs font-medium text-text-muted hover:text-text-main underline underline-offset-2 tap-press"
            >
              Log entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
