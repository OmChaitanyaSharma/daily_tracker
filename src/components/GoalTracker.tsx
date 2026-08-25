import { useState, useMemo } from 'react';
import { db, type Goal, type GoalMeasurement } from '../db';
import { getMeasurementDates, getTodayStr } from '../utils/dateUtils';
import { format } from 'date-fns';
import { ChevronRight, Check, Settings, Plus, X, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

export function GoalRow({ 
  goal, 
  measurements, 
  onClick, 
  onEdit 
}: { 
  goal: Goal, 
  measurements: GoalMeasurement[], 
  onClick: () => void, 
  onEdit: () => void 
}) {
  const dates = useMemo(() => getMeasurementDates(goal.startDate), [goal.startDate]);
  
  const actualStartMeasurement = measurements.find(m => m.date === dates[0])?.value;
  const startingValue = actualStartMeasurement !== undefined ? actualStartMeasurement : goal.startingValue;
  
  const validMeasurements = measurements.filter(m => m.date >= dates[0]);
  validMeasurements.sort((a, b) => b.date.localeCompare(a.date));
  const currentMeasurementValue = validMeasurements.length > 0 ? validMeasurements[0].value : startingValue;
  
  const currentActualDate = validMeasurements.length > 0 ? validMeasurements[0].date : dates[0];
  let nextLogDateStr: string | null = dates.find(d => d > currentActualDate) || null;

  const renderValue = (val: string | number | undefined) => {
    if (val === undefined || val === null || val === '') return '—';
    return `${val}${goal.unit ? ` ${goal.unit}` : ''}`;
  };

  const nextLogHasPassed = nextLogDateStr && nextLogDateStr < getTodayStr();

  return (
    <div className="bg-bg-surface border border-border-strong rounded-2xl p-5 hover:bg-bg-surface-hover transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group">
      <div className="flex-1 flex items-center gap-3">
        <button onClick={onClick} className="flex-1 text-left">
          <h3 className="text-lg font-medium text-text-main mb-1 hover:underline underline-offset-4">{goal.title}</h3>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted mt-1">
            <span>Target: <span className="font-medium text-text-main">{renderValue(goal.targetValue) || 'Qualitative'}</span></span>
          </div>
        </button>
        <button onClick={onEdit} className="p-2 text-text-muted hover:text-text-main bg-bg-base border border-border-strong rounded-lg transition-colors">
          <Settings size={16} />
        </button>
      </div>
      
      <div className="flex items-center gap-8 text-sm cursor-pointer" onClick={onClick}>
        <div className="flex flex-col items-end">
          <span className="text-xs uppercase tracking-widest text-text-muted mb-1">Starting</span>
          <span className="font-serif italic text-lg text-text-main">
            {renderValue(startingValue)}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs uppercase tracking-widest text-text-muted mb-1">Current</span>
          <span className="font-serif italic text-lg text-text-main">
            {renderValue(currentMeasurementValue)}
          </span>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-xs uppercase tracking-widest text-text-muted mb-1">Next Log</span>
          <span className={clsx("font-medium", nextLogHasPassed ? "text-accent-red" : "text-text-main")}>
            {nextLogDateStr ? (
              <>
                {format(new Date(nextLogDateStr), 'MMM d')}
                {nextLogHasPassed && <span className="block text-xs font-normal">Missed</span>}
              </>
            ) : 'Completed'}
          </span>
        </div>
        
        <ChevronRight className="text-border-strong group-hover:text-text-main transition-colors" />
      </div>
    </div>
  );
}

export function GoalDetail({ goal, measurements, onBack }: { goal: Goal, measurements: GoalMeasurement[], onBack: () => void }) {
  const scheduleDates = useMemo(() => getMeasurementDates(goal.startDate), [goal.startDate]);
  const measurementDates = measurements.map(m => m.date);
  
  const allUniqueDates = Array.from(new Set([...scheduleDates, ...measurementDates])).sort();
  const todayStr = getTodayStr();
  
  const [addingDate, setAddingDate] = useState<string | null>(null);

  return (
    <div className="bg-bg-surface border border-border-strong rounded-[2rem] p-8 md:p-12 shadow-sm animate-scale-in">
      <button onClick={onBack} className="text-sm font-medium text-text-muted hover:text-text-main mb-8 flex items-center gap-2">
        <ArrowLeft size={16} /> Back to goals
      </button>
      
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-serif italic text-text-main mb-4">{goal.title}</h2>
          <div className="flex gap-8 text-sm pb-6">
            <div>
              <span className="block text-xs uppercase tracking-widest text-text-muted mb-1">Target</span>
              <span className="font-medium text-text-main text-lg">
                {goal.targetValue ? `${goal.targetValue}${goal.unit ? ` ${goal.unit}` : ''}` : 'Qualitative'}
              </span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-widest text-text-muted mb-1">Type</span>
              <span className="font-medium text-text-main text-lg capitalize">{goal.type}</span>
            </div>
          </div>
        </div>
        
        <button onClick={() => setAddingDate(todayStr)} className="flex items-center gap-2 px-4 py-2 bg-text-main text-bg-base rounded-lg text-sm font-medium hover:opacity-90 whitespace-nowrap self-start md:self-center">
          <Plus size={16} /> Add Entry
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold tracking-widest uppercase text-text-muted mb-6 border-b border-border-subtle pb-4">Measurement History</h3>
        
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
    }
  };

  const hasValue = !!existingMeasurement;

  return (
    <div className={clsx(
      "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-colors",
      editDate === getTodayStr() ? "bg-accent-red-bg/20 border-accent-red/30" : "bg-bg-base border-border-subtle",
      isFuture && !hasValue && "opacity-50"
    )}>
      <div className="flex items-center gap-4 mb-3 sm:mb-0 w-full sm:w-auto">
        {isEditing && !isScheduled ? (
          <input 
            type="date"
            value={editDate}
            onChange={e => setEditDate(e.target.value)}
            className="w-32 bg-bg-surface border border-border-strong rounded px-2 py-1 text-sm outline-none"
          />
        ) : (
          <div className="w-24 shrink-0 text-sm font-medium text-text-main">
            {format(new Date(date), 'MMM d, yyyy')}
          </div>
        )}
        <div className="text-xs uppercase tracking-widest text-text-muted">
          {label}
        </div>
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
        {isFuture && !hasValue ? (
          <span className="text-sm text-text-muted italic">Upcoming</span>
        ) : isEditing ? (
          <div className="flex items-center gap-2">
            <input 
              type={goal.type === 'qualitative' ? 'text' : 'number'}
              step="any"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Value"
              className="bg-bg-surface border border-border-strong rounded-lg px-3 py-1.5 text-sm text-text-main focus:outline-none w-24 sm:w-32"
              autoFocus
            />
            <input 
              type="text"
              value={inputUnit}
              onChange={e => setInputUnit(e.target.value)}
              placeholder="Unit"
              className="bg-bg-surface border border-border-strong rounded-lg px-2 py-1.5 text-sm text-text-main focus:outline-none w-16"
            />
            <button 
              onClick={saveMeasurement}
              className="p-1.5 bg-text-main text-bg-base rounded-md hover:opacity-90"
            >
              <Check size={16} />
            </button>
            <button 
              onClick={() => {
                if (onCancel) onCancel();
                setIsEditing(false);
              }}
              className="p-1.5 bg-bg-surface border border-border-strong rounded-md hover:bg-bg-surface-hover"
            >
              <X size={16} />
            </button>
          </div>
        ) : hasValue ? (
          <div className="flex items-center gap-4">
            <span className="font-serif text-lg text-text-main font-medium">
              {existingMeasurement.value} {existingMeasurement.unit}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditing(true)}
                className="text-xs font-medium text-text-muted hover:text-text-main underline underline-offset-2"
              >
                Edit
              </button>
              <button 
                onClick={deleteMeasurement}
                className="text-xs font-medium text-accent-red hover:opacity-80 underline underline-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <span className="text-sm text-border-strong italic">Not recorded</span>
            <button 
              onClick={() => setIsEditing(true)}
              className="text-xs font-medium text-text-muted hover:text-text-main underline underline-offset-2"
            >
              Log entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
