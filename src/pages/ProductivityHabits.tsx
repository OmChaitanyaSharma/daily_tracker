import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Habit, type HourCategory } from '../db';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, parseISO, isBefore, isAfter, isSameMonth } from 'date-fns';
const EMPTY_ARRAY: any[] = [];
import { getTodayStr, MIN_DATE_STR } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, Plus, ArrowLeft, MoreHorizontal, Edit2, Archive, ArchiveRestore, X, Trash2, Sparkles, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';
import { useSound } from '../hooks/useSound';
import { HABIT_PRESETS, type HabitPreset } from '../utils/settings';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const totalItem = payload.find((p: any) => p.dataKey === 'Total');
    const totalVal = totalItem ? totalItem.value : null;
    const fullDate = payload[0]?.payload?.fullDate || '';
    
    return (
      <div className="bg-[#0e0f13]/95 border border-[#23262f] backdrop-blur-md rounded-2xl p-4 shadow-2xl min-w-[200px] text-xs font-sans">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#23262f]">
          <span className="font-mono text-[#71717a] font-medium text-[11px]">
            {fullDate ? format(parseISO(`${fullDate}T12:00:00`), 'EEE, MMM d, yyyy') : `Day ${label}`}
          </span>
          <span className="font-mono text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded-full">
            {totalVal !== null && totalVal !== undefined ? `${totalVal} hrs` : 'No logs'}
          </span>
        </div>
        
        <div className="space-y-1.5">
          {payload.map((item: any, i: number) => {
            if (item.dataKey === 'Total' || item.dataKey === 'RollingAvg') return null;
            if (item.value === null || item.value === undefined || item.value === 0) return null;
            return (
              <div key={i} className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.stroke || item.color }} />
                  <span className="text-[#a1a1aa] font-medium">{item.name}</span>
                </div>
                <span className="font-mono font-semibold text-white">
                  {item.value}h
                </span>
              </div>
            );
          })}
          {payload.some((p: any) => p.dataKey === 'RollingAvg' && p.value !== null) && (
            <div className="flex items-center justify-between pt-1 mt-1 border-t border-[#23262f]/60 text-[11px] text-[#71717a]">
              <span>7-Day Trend</span>
              <span className="font-mono font-medium text-[#a1a1aa]">
                {payload.find((p: any) => p.dataKey === 'RollingAvg')?.value ?? 0}h
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function ProductivityHabits() {
  const { playClick } = useSound();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Graph state
  const [graphViewMode, setGraphViewMode] = useState<'flow' | 'categories'>('flow');
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  
  // Habit Management State
  const [newHabitName, setNewHabitName] = useState('');
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [activeMenuHabitId, setActiveMenuHabitId] = useState<string | null>(null);
  
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editName, setEditName] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editFrequencyType, setEditFrequencyType] = useState<'daily' | 'specific_days'>('daily');
  const [editSpecificDays, setEditSpecificDays] = useState<number[]>([]);
  
  const [archivingHabit, setArchivingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);

  // Habit Presets modal state
  const [showHabitPresetsModal, setShowHabitPresetsModal] = useState(false);
  const [presetActionType, setPresetActionType] = useState<'replace' | 'append'>('replace');

  // Hours input state
  const [hoursDate, setHoursDate] = useState(getTodayStr());
  const [hoursType, setHoursType] = useState<string>('');
  const [hoursAmount, setHoursAmount] = useState('');

  // Category management state
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8b5cf6');
  const [editingCat, setEditingCat] = useState<HourCategory | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatColor, setEditCatColor] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        if (e.key === 'Backspace') {
          const activeTag = document.activeElement?.tagName || '';
          if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) {
            if (document.activeElement?.hasAttribute('data-edit-mode')) return;
          }
        }

        if (isAddingHabit || activeMenuHabitId || editingHabit || archivingHabit || deletingHabit || showManageCategories || showHabitPresetsModal) {
          e.preventDefault();
          e.stopPropagation();
          setIsAddingHabit(false);
          setActiveMenuHabitId(null);
          setEditingHabit(null);
          setArchivingHabit(null);
          setDeletingHabit(null);
          setShowManageCategories(false);
          setShowHabitPresetsModal(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isAddingHabit, activeMenuHabitId, editingHabit, archivingHabit, deletingHabit, showManageCategories, showHabitPresetsModal]);

  const allHabits = useLiveQuery(() => db.habits.toArray()) ?? EMPTY_ARRAY;
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

  const habitLogs = useLiveQuery(() => 
    db.habitLogs.where('date').between(monthStartStr, monthEndStr, true, true).toArray()
  , [monthStartStr, monthEndStr]) ?? EMPTY_ARRAY;

  const hourLogs = useLiveQuery(() => 
    db.hourLogs.where('date').between(monthStartStr, monthEndStr, true, true).toArray()
  , [monthStartStr, monthEndStr]) ?? EMPTY_ARRAY;

  const hourCategories = useLiveQuery(() => db.hourCategories.toArray()) ?? EMPTY_ARRAY;

  // Streak logic moved to Home.tsx

  // Determine which habits to show: active ones, PLUS archived ones if they have logs this month
  const visibleHabits = useMemo(() => {
    return allHabits.filter(h => {
      if (!h.archived) return true;
      return habitLogs.some(l => l.habitId === h.id);
    }).sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 9999;
      const orderB = b.order !== undefined ? b.order : 9999;
      if (orderA === orderB) {
        return a.createdAt.localeCompare(b.createdAt);
      }
      return orderA - orderB;
    });
  }, [allHabits, habitLogs]);

  const handleHabitDrop = async (e: React.DragEvent, targetHabitId: string) => {
    e.preventDefault();
    const draggedHabitId = e.dataTransfer.getData('habitId');
    if (!draggedHabitId || draggedHabitId === targetHabitId) return;

    const currentOrder = visibleHabits.map(h => h.id);
    const draggedIndex = currentOrder.indexOf(draggedHabitId);
    const targetIndex = currentOrder.indexOf(targetHabitId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    currentOrder.splice(draggedIndex, 1);
    currentOrder.splice(targetIndex, 0, draggedHabitId);

    try {
      await db.transaction('rw', db.habits, async () => {
        for (let i = 0; i < currentOrder.length; i++) {
          await db.habits.update(currentOrder[i], { order: i });
        }
      });
    } catch (err) {
      console.error("Failed to reorder habits", err);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => {
    const prev = subMonths(currentDate, 1);
    const minDate = parseISO(MIN_DATE_STR + "T00:00:00");
    if (!isBefore(endOfMonth(prev), minDate)) {
      setCurrentDate(prev);
    }
  };
  const goToToday = () => setCurrentDate(new Date());

  const handleAddHabit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newHabitName.trim()) return;
    await db.habits.add({
      id: crypto.randomUUID(),
      name: newHabitName.trim(),
      createdAt: new Date().toISOString(),
      startDate: getTodayStr(),
      archived: false
    });
    setNewHabitName('');
    setIsAddingHabit(false);
  };

  const saveEditHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHabit || !editName.trim()) return;
    await db.habits.update(editingHabit.id, { name: editName.trim(), startDate: editStartDate || undefined, frequencyType: editFrequencyType, specificDays: editSpecificDays });
    setEditingHabit(null);
    setEditName('');
    setEditStartDate('');
  };

  const confirmArchive = async () => {
    if (!archivingHabit) return;
    await db.habits.update(archivingHabit.id, { archived: true });
    setArchivingHabit(null);
  };

  const confirmDelete = async () => {
    if (!deletingHabit) return;
    await db.habits.delete(deletingHabit.id);
    const logsToDelete = await db.habitLogs.where('habitId').equals(deletingHabit.id).toArray();
    await Promise.all(logsToDelete.map(l => db.habitLogs.delete(l.id)));
    setDeletingHabit(null);
  };

  const handleApplyPreset = async (preset: HabitPreset) => {
    const today = getTodayStr();
    if (presetActionType === 'replace') {
      const confirmReplace = window.confirm(`Replace all current habits with the "${preset.name}" starter pack? Previous habits will be cleared, while historical logs remain.`);
      if (!confirmReplace) return;

      const currentHabits = await db.habits.toArray();
      await Promise.all(currentHabits.map(h => db.habits.delete(h.id)));
    }

    const currentHabits = await db.habits.toArray();
    const existingNames = new Set(currentHabits.map(h => h.name.toLowerCase().trim()));

    let order = currentHabits.length;
    for (const habitName of preset.habits) {
      if (!existingNames.has(habitName.toLowerCase().trim())) {
        await db.habits.add({
          id: crypto.randomUUID(),
          name: habitName,
          createdAt: new Date().toISOString(),
          startDate: today,
          archived: false,
          order: order++
        });
      }
    }
    setShowHabitPresetsModal(false);
  };

  const handleClearAllHabits = async () => {
    const confirmClear = window.confirm("Are you sure you want to remove all habits? You can start with an empty board and add your own custom habits or choose a template.");
    if (!confirmClear) return;

    const currentHabits = await db.habits.toArray();
    await Promise.all(currentHabits.map(h => db.habits.delete(h.id)));
    setShowHabitPresetsModal(false);
  };

  const toggleHabit = async (habitId: string, date: string, currentStatus: string | undefined, logId?: string) => {
    const nextStatus = currentStatus === 'partial' ? 'completed' 
                       : currentStatus === 'completed' ? 'none' 
                       : 'partial';
    
    if (nextStatus === 'none' && logId) {
      await db.habitLogs.delete(logId);
    } else if (logId) {
      await db.habitLogs.update(logId, { status: nextStatus as any });
    } else {
      await db.habitLogs.add({
        id: crypto.randomUUID(),
        date,
        habitId,
        status: nextStatus as any
      });
    }
    playClick();
  };



  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await db.hourCategories.add({
      id: crypto.randomUUID(),
      name: newCatName.trim(),
      color: newCatColor,
      createdAt: new Date().toISOString()
    });
    setNewCatName('');
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editCatName.trim()) return;
    
    // Also update all hour logs that used the old name
    const oldName = editingCat.name;
    const newName = editCatName.trim();
    
    if (oldName !== newName) {
      const logsToUpdate = await db.hourLogs.filter(l => l.activity === oldName).toArray();
      for (const log of logsToUpdate) {
        await db.hourLogs.update(log.id, { activity: newName });
      }
    }
    
    await db.hourCategories.update(editingCat.id, {
      name: newName,
      color: editCatColor
    });
    setEditingCat(null);
  };

  const handleDeleteCategory = async (cat: HourCategory) => {
    if (confirm(`Delete category "${cat.name}"? This will ALSO delete all historical hours logged under this category. This cannot be undone.`)) {
      const logsToDelete = await db.hourLogs.filter(l => l.activity === cat.name).toArray();
      const keys = logsToDelete.map(l => l.id);
      await db.hourLogs.bulkDelete(keys);
      await db.hourCategories.delete(cat.id);
    }
  };

  const handleToggleArchiveCategory = async (cat: HourCategory) => {
    await db.hourCategories.update(cat.id, { archived: !cat.archived });
    if (!cat.archived && hoursType === cat.name) {
      // If we just archived the currently selected type for new hours, switch it
      const nextAvailable = hourCategories.find(c => c.id !== cat.id && !c.archived);
      if (nextAvailable) setHoursType(nextAvailable.name);
      else setHoursType('');
    }
  };

  const [errorMsg, setErrorMsg] = useState('');

  const handleAddHours = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(hoursAmount);
    if (isNaN(amount) || amount <= 0) return;

    const selectedActivity = hoursType || hourCategories[0]?.name;
    
    if (!selectedActivity) {
      setErrorMsg('Please select an activity.');
      setTimeout(() => setErrorMsg(''), 5000);
      return;
    }

    const dateHourLogs = await db.hourLogs.where('date').equals(hoursDate).toArray();
    const currentTotal = dateHourLogs.reduce((acc, curr) => acc + curr.hours, 0);
    const subjectTotal = dateHourLogs.filter(log => log.activity === selectedActivity).reduce((acc, curr) => acc + curr.hours, 0);

    if (subjectTotal + amount > 12) {
      setErrorMsg(`Maximum 12 hours can be logged per subject.`);
      setTimeout(() => setErrorMsg(''), 5000);
      return;
    }

    if (currentTotal + amount > 19) {
      setErrorMsg(`Maximum 19 hours total can be logged per day.`);
      setTimeout(() => setErrorMsg(''), 5000);
      return;
    }

    setErrorMsg('');

    await db.hourLogs.add({
      id: crypto.randomUUID(),
      date: hoursDate,
      activity: selectedActivity,
      hours: amount
    });
    setHoursAmount('');
  };

  const handleUpdateLogHours = async (logId: string, newHours: number, date: string, activity: string) => {
    if (isNaN(newHours) || newHours <= 0) return;
    const dateHourLogs = await db.hourLogs.where('date').equals(date).toArray();
    
    // We must exclude the CURRENT log we are editing from the totals to see if the NEW amount is valid
    const currentTotal = dateHourLogs.reduce((acc, curr) => curr.id === logId ? acc : acc + curr.hours, 0);
    const subjectTotal = dateHourLogs.filter(l => l.activity === activity).reduce((acc, curr) => curr.id === logId ? acc : acc + curr.hours, 0);

    if (subjectTotal + newHours > 12) {
      alert(`Maximum 12 hours can be logged per subject.`);
      return;
    }

    if (currentTotal + newHours > 19) {
      alert(`Maximum 19 hours total can be logged per day.`);
      return;
    }

    await db.hourLogs.update(logId, { hours: newHours });
  };

  const handleUpdateLogActivity = async (logId: string, newActivity: string, date: string, hours: number) => {
    const dateHourLogs = await db.hourLogs.where('date').equals(date).toArray();
    const subjectTotal = dateHourLogs.filter(l => l.activity === newActivity).reduce((acc, curr) => curr.id === logId ? acc : acc + curr.hours, 0);

    if (subjectTotal + hours > 12) {
      alert(`Maximum 12 hours can be logged per subject.`);
      return;
    }

    await db.hourLogs.update(logId, { activity: newActivity });
  };

  // Monthly productivity statistics
  const monthlyTotalHours = useMemo(() => {
    return hourLogs.reduce((acc, curr) => acc + curr.hours, 0);
  }, [hourLogs]);

  const daysElapsedInMonth = useMemo(() => {
    const today = new Date();
    const isCurrent = isSameMonth(currentDate, today);
    if (isCurrent) {
      return Math.min(daysInMonth.length, today.getDate());
    }
    return daysInMonth.length;
  }, [daysInMonth, currentDate]);

  const monthlyDailyAvg = useMemo(() => {
    return daysElapsedInMonth > 0 ? (monthlyTotalHours / daysElapsedInMonth) : 0;
  }, [monthlyTotalHours, daysElapsedInMonth]);

  const monthlyPeakHours = useMemo(() => {
    const totalsByDay: Record<string, number> = {};
    hourLogs.forEach(l => {
      totalsByDay[l.date] = (totalsByDay[l.date] || 0) + l.hours;
    });
    const values = Object.values(totalsByDay);
    return values.length > 0 ? Math.max(...values) : 0;
  }, [hourLogs]);

  const yAxisConfig = useMemo(() => {
    const peak = Math.max(12, monthlyPeakHours);
    if (peak <= 12) {
      return {
        domain: [0, 12],
        ticks: [0, 4, 8, 12] // Matches Monkeytype 0, 40, 80, 120 spacing
      };
    }
    const roundedMax = Math.ceil(peak / 4) * 4;
    return {
      domain: [0, roundedMax],
      ticks: [0, Math.round(roundedMax * 0.33), Math.round(roundedMax * 0.66), roundedMax]
    };
  }, [monthlyPeakHours]);

  // Prepare graph data
  const graphData = useMemo(() => {
    const today = new Date();
    const todayStr = getTodayStr();
    const isCurrent = isSameMonth(currentDate, today);

    const dailyPoints = daysInMonth.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const isFuture = isCurrent && isAfter(date, today) && dateStr !== todayStr;
      const dailyHours = hourLogs.filter(log => log.date === dateStr);
      const totalHours = dailyHours.reduce((acc, curr) => acc + curr.hours, 0);

      const catHours: Record<string, number | null> = {};
      hourCategories.forEach(cat => {
        if (isFuture) {
          catHours[cat.name] = null;
        } else {
          const h = dailyHours.filter(l => l.activity === cat.name).reduce((acc, curr) => acc + curr.hours, 0);
          catHours[cat.name] = h;
        }
      });

      return {
        date,
        dateStr,
        dayNum: format(date, 'd'),
        isFuture,
        totalHours: isFuture ? null : totalHours,
        catHours
      };
    });

    return dailyPoints.map((dp, idx) => {
      if (dp.isFuture) {
        return {
          date: dp.dayNum,
          fullDate: dp.dateStr,
          Total: null,
          RollingAvg: null,
          ...dp.catHours
        };
      }

      // Compute smooth 7-day rolling average
      const windowStart = Math.max(0, idx - 6);
      const windowSlice = dailyPoints.slice(windowStart, idx + 1).filter(p => !p.isFuture);
      const windowSum = windowSlice.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
      const rollingAvg = windowSlice.length > 0 ? parseFloat((windowSum / windowSlice.length).toFixed(1)) : 0;

      return {
        date: dp.dayNum,
        fullDate: dp.dateStr,
        Total: dp.totalHours,
        RollingAvg: rollingAvg,
        ...dp.catHours
      };
    });
  }, [daysInMonth, hourLogs, hourCategories, currentDate]);

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-fade-in relative">
      
      {/* Edit Habit Modal */}
      {editingHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-border-strong rounded-2xl p-8 shadow-xl max-w-sm w-full animate-scale-in relative">
            <button onClick={() => setEditingHabit(null)} className="absolute top-4 right-4 text-text-muted hover:text-text-main">
              <X size={20} />
            </button>
            <h3 className="text-xl font-serif italic text-text-main mb-6">Edit Habit</h3>
            <form onSubmit={saveEditHabit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Habit Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-text-muted"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Starting Date</label>
                <input 
                  type="date" 
                  value={editStartDate}
                  onChange={e => setEditStartDate(e.target.value)}
                  className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-text-muted"
                />
              </div>
              
                <div>
                  <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Frequency</label>
                  <div className="flex gap-2 mb-3">
                    <button type="button" onClick={() => setEditFrequencyType('daily')} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${editFrequencyType === 'daily' ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-border-strong text-text-muted hover:border-text-muted'}`}>Daily</button>
                    <button type="button" onClick={() => setEditFrequencyType('specific_days')} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${editFrequencyType === 'specific_days' ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-border-strong text-text-muted hover:border-text-muted'}`}>Specific Days</button>
                  </div>
                  {editFrequencyType === 'specific_days' && (
                    <div className="flex justify-between gap-1 mt-2">
                      {['S','M','T','W','T','F','S'].map((day, i) => (
                        <button 
                          key={i} 
                          type="button"
                          onClick={() => setEditSpecificDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i])}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${editSpecificDays.includes(i) ? 'bg-accent-blue text-bg-base' : 'bg-bg-base border border-border-strong text-text-muted hover:border-text-muted'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-4">
                <button type="submit" className="bg-text-main text-bg-base px-6 py-2 rounded-full font-medium text-sm hover:opacity-90">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Habit Modal */}
      {archivingHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-border-strong rounded-2xl p-8 shadow-xl max-w-sm w-full animate-scale-in relative text-center">
            <h3 className="text-xl font-semibold text-text-main mb-2">Archive {archivingHabit.name}?</h3>
            <p className="text-sm text-text-muted mb-8 leading-relaxed">
              It will no longer appear as an active habit, but your previous records will be preserved.
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setArchivingHabit(null)} className="px-6 py-2 rounded-full border border-border-strong text-text-main hover:bg-bg-surface-hover font-medium text-sm">
                Cancel
              </button>
              <button onClick={confirmArchive} className="px-6 py-2 rounded-full bg-accent-red text-bg-base font-medium text-sm hover:opacity-90">
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Habit Modal */}
      {deletingHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-border-strong rounded-2xl p-8 shadow-xl max-w-sm w-full animate-scale-in relative text-center">
            <h3 className="text-xl font-semibold text-text-main mb-2">Delete {deletingHabit.name}?</h3>
            <p className="text-sm text-text-muted mb-8 leading-relaxed">
              This will permanently remove the habit and all its history. This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setDeletingHabit(null)} className="px-6 py-2 rounded-full border border-border-strong text-text-main hover:bg-bg-surface-hover font-medium text-sm">
                Cancel
              </button>
              <button onClick={confirmDelete} className="px-6 py-2 rounded-full bg-accent-red text-bg-base font-medium text-sm hover:opacity-90">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Habit Presets & Templates Modal */}
      {showHabitPresetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/80 backdrop-blur-sm animate-fade-in p-4" onClick={() => setShowHabitPresetsModal(false)}>
          <div className="bg-bg-surface border border-border-strong rounded-3xl p-6 sm:p-8 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col relative animate-scale-in" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowHabitPresetsModal(false)}
              className="absolute top-6 right-6 text-text-muted hover:text-text-main p-1.5 rounded-full hover:bg-bg-base transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 mb-6 pr-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-accent-yellow-bg text-accent-yellow border border-accent-yellow/20 shrink-0">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-serif text-text-main">Habit Starter Packs & Presets</h3>
                <p className="text-text-muted text-xs tracking-wider uppercase font-medium mt-0.5">
                  Pick a curated setup or clear all to start fresh
                </p>
              </div>
            </div>

            {/* Mode Selector (Replace vs Append) */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-bg-base border border-border-subtle mb-6">
              <span className="text-xs text-text-muted font-medium">When applying a pack:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPresetActionType('replace')}
                  className={clsx(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                    presetActionType === 'replace'
                      ? "bg-accent-blue text-bg-base shadow-sm"
                      : "text-text-muted hover:text-text-main hover:bg-bg-surface"
                  )}
                >
                  Replace All Habits
                </button>
                <button
                  type="button"
                  onClick={() => setPresetActionType('append')}
                  className={clsx(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                    presetActionType === 'append'
                      ? "bg-accent-blue text-bg-base shadow-sm"
                      : "text-text-muted hover:text-text-main hover:bg-bg-surface"
                  )}
                >
                  Add Missing Only
                </button>
              </div>
            </div>

            {/* Presets List */}
            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 space-y-4 mb-6">
              {HABIT_PRESETS.map(preset => (
                <div 
                  key={preset.id} 
                  className="bg-bg-base border border-border-subtle hover:border-accent-blue/50 rounded-2xl p-4 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h4 className="text-base font-semibold text-text-main group-hover:text-accent-blue transition-colors">
                        {preset.name}
                      </h4>
                      <p className="text-xs text-text-muted mt-0.5">{preset.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-4 py-1.5 bg-bg-surface border border-border-strong group-hover:border-accent-blue text-xs font-semibold rounded-xl text-text-main hover:bg-accent-blue hover:text-bg-base transition-all shrink-0 cursor-pointer shadow-sm"
                    >
                      {presetActionType === 'replace' ? 'Apply & Replace' : 'Add Pack'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {preset.habits.map((h, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-bg-surface border border-border-subtle text-[11px] text-text-muted">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Clear All Option */}
            <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
              <div className="text-xs text-text-muted">
                Don't like any preset? Clear the board completely.
              </div>
              <button
                type="button"
                onClick={handleClearAllHabits}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-accent-red hover:bg-accent-red-bg rounded-xl border border-accent-red/20 hover:border-accent-red transition-all cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Clear All Habits (Blank Slate)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-subtle pb-6 mb-12 gap-4">
        <div className="flex items-center gap-6">
          <Link to="/habits" className="text-text-muted hover:text-text-main transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-serif italic text-text-main">Productivity Tracking</h1>
            <button
              onClick={() => setShowHabitPresetsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border-strong bg-bg-surface text-text-muted hover:text-text-main text-xs font-semibold hover:border-accent-blue/50 transition-colors shadow-sm cursor-pointer"
              title="Browse starter packs & templates or start fresh"
            >
              <Sparkles size={13} className="text-accent-yellow" />
              <span>Presets & Templates</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={goToToday} className="text-sm font-medium text-text-muted hover:text-text-main cursor-pointer">
            Today
          </button>
          <div className="flex items-center gap-2 bg-bg-surface border border-border-strong rounded-full p-1">
            <button onClick={prevMonth} disabled={isBefore(endOfMonth(subMonths(currentDate, 1)), parseISO(MIN_DATE_STR + "T00:00:00"))} className="p-1.5 hover:bg-bg-surface-hover rounded-full text-text-muted hover:text-text-main disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-text-muted disabled:hover:bg-transparent">
              <ChevronLeft size={18} />
            </button>
            <span className="w-32 text-center font-serif font-medium text-text-main">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-bg-surface-hover rounded-full text-text-muted hover:text-text-main">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Unified Tracker Container */}
      <section className="bg-bg-surface border border-border-strong rounded-[2rem] shadow-sm overflow-hidden p-8 md:p-12 flex flex-col gap-16">
        
        {/* Empty State Banner if No Habits exist */}
        {visibleHabits.length === 0 && (
          <div className="p-8 rounded-2xl bg-bg-base/60 border border-dashed border-border-strong text-center flex flex-col items-center justify-center gap-3 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 text-accent-blue border border-accent-blue/20 flex items-center justify-center">
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-main">No Habits Added Yet</h3>
              <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                Add your first habit using the '+' button on the grid, or load a curated starter pack.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowHabitPresetsModal(true)}
              className="mt-2 px-5 py-2 bg-text-main text-bg-base rounded-full text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
            >
              <Sparkles size={14} /> Browse Starter Packs
            </button>
          </div>
        )}

        {/* Habit Grid */}
        <div className="overflow-x-auto overflow-y-auto max-h-[75vh] pb-6 -mx-4 px-4 md:-mx-8 md:px-8">
          <div className="min-w-max flex">
            {/* Days Column */}
            <div className="w-12 shrink-0 border-r border-border-strong sticky left-0 bg-bg-surface z-30">
              <div className="h-40 flex items-end justify-center pb-4 text-xs font-semibold tracking-widest uppercase text-text-muted border-b border-border-strong sticky top-0 bg-bg-surface z-40">
                Day
              </div>
              {daysInMonth.map(date => {
                const isSunday = date.getDay() === 0;
                return (
                  <div 
                    key={date.toISOString()} 
                    className={clsx(
                      "h-10 flex items-center justify-center gap-1.5 text-sm font-medium",
                      isToday(date) ? "text-accent-red bg-accent-red-bg/50" : "text-text-main",
                      isSunday ? "border-b-[3px] border-b-border-strong" : "border-b border-b-border-subtle"
                    )}
                  >
                    <span className="text-[10px] text-text-muted font-bold opacity-60 w-3">{format(date, 'eeeee')}</span>
                    <span className="w-5 text-left">{format(date, 'd')}</span>
                  </div>
                )
              })}
              {/* Score Placeholder */}
              <div className="h-16 flex items-center justify-center text-[10px] font-semibold tracking-widest uppercase text-text-muted pt-2">
                Score
              </div>
            </div>

            {/* Habit Columns */}
            {visibleHabits.map(habit => (
              <div key={habit.id} className="w-14 shrink-0 border-r border-border-subtle flex flex-col items-center group/col">
                <div 
                  className="h-40 w-full flex flex-col items-center justify-end pb-4 border-b-2 border-border-subtle relative sticky top-0 bg-bg-surface z-20 group/header cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('habitId', habit.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => handleHabitDrop(e, habit.id)}
                >
                  
                  {/* Management Menu Trigger */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover/header:opacity-100 transition-opacity duration-300">
                    <div className="relative">
                      <button 
                        onClick={() => setActiveMenuHabitId(activeMenuHabitId === habit.id ? null : habit.id)}
                        className={clsx(
                          "p-1.5 rounded-full text-text-muted hover:text-text-main bg-bg-base/80 backdrop-blur shadow-sm border border-border-subtle transition-all hover:scale-110",
                          activeMenuHabitId === habit.id ? "opacity-100 ring-2 ring-accent-blue/30" : ""
                        )}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      
                      {/* Menu Dropdown - Floating Pill */}
                      {activeMenuHabitId === habit.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveMenuHabitId(null)} />
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-36 glass-panel rounded-2xl shadow-lg z-50 overflow-hidden text-sm flex flex-col animate-slide-up">
                            <button 
                              onClick={() => {
                                setEditName(habit.name);
setEditStartDate(habit.startDate || '');
setEditFrequencyType(habit.frequencyType || 'daily');
setEditSpecificDays(habit.specificDays || []);
setEditingHabit(habit);
                                setActiveMenuHabitId(null);
                              }}
                              className="px-4 py-2.5 text-left text-text-main hover:bg-bg-surface-hover flex items-center gap-2 transition-colors font-medium"
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                            <button 
                              onClick={() => {
                                setArchivingHabit(habit);
                                setActiveMenuHabitId(null);
                              }}
                              className="px-4 py-2.5 text-left text-text-main hover:bg-bg-surface-hover flex items-center gap-2 transition-colors border-t border-border-subtle font-medium"
                            >
                              <Archive size={14} /> Archive
                            </button>
                            <button 
                              onClick={() => {
                                setDeletingHabit(habit);
                                setActiveMenuHabitId(null);
                              }}
                              className="px-4 py-2.5 text-left text-accent-red hover:bg-accent-red-bg flex items-center gap-2 transition-colors border-t border-border-subtle font-medium"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <span 
                    className="rotate-180 text-[13px] font-sans tracking-wide text-text-main whitespace-nowrap opacity-80 max-h-24 overflow-hidden mt-6"
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    {habit.name}
                  </span>
                </div>
                {daysInMonth.map(date => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const log = habitLogs.find(l => l.date === dateStr && l.habitId === habit.id);
                  const currentStatus = log?.status || 'none';
                  const startDateStr = habit.startDate || '2000-01-01';
                  let isEligible = dateStr >= startDateStr;
if (isEligible && habit.frequencyType === 'specific_days' && habit.specificDays) { isEligible = habit.specificDays.includes(date.getDay()); }
const isSunday = date.getDay() === 0;
                  
                  return (
                    <button
                      key={dateStr}
                      disabled={!isEligible}
                      onClick={() => toggleHabit(habit.id, dateStr, log?.status, log?.id)}
                      className={clsx(
                        "w-full h-10 flex items-center justify-center transition-all group",
                        !isEligible ? "bg-bg-base/30 cursor-not-allowed opacity-40" : "hover:bg-bg-surface-hover cursor-pointer",
                        isToday(date) && "bg-accent-red-bg/20",
                        isSunday ? "border-b-[3px] border-b-border-strong" : "border-b border-b-border-subtle"
                      )}
                    >
                      <span className={clsx(
                        "text-xl transition-transform duration-300 group-active:scale-75",
                        isEligible && currentStatus !== 'none' ? (currentStatus === 'completed' ? "text-text-main" : "text-text-muted opacity-80") : "text-text-muted opacity-20"
                      )}>
                        {isEligible ? (currentStatus === 'completed' ? '●' : currentStatus === 'partial' ? '◐' : '○') : '-'}
                      </span>
                    </button>
                  );
                })}
                {(() => {
                  const startDateStr = habit.startDate || '2000-01-01';
                  
                  let score = 0;
                  let eligibleDays = 0;
                  
                  daysInMonth.forEach(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    let isEligible = dateStr >= startDateStr;
if (isEligible && habit.frequencyType === 'specific_days' && habit.specificDays) { isEligible = habit.specificDays.includes(date.getDay()); }
if (isEligible) {
eligibleDays++;
const log = habitLogs.find(l => l.date === dateStr && l.habitId === habit.id);
                      if (log?.status === 'completed') score += 1;
                      if (log?.status === 'partial') score += 0.5;
                    }
                  });

                  return (
                    <div className="h-24 w-full flex flex-col items-center justify-center pt-2 border-t-2 border-border-strong">
                      <div className="flex flex-col items-center mb-1">
                        <span className="text-[9px] font-bold text-text-muted tracking-widest uppercase">Starts</span>
                        <span className="text-[10px] text-text-main font-medium text-center">
                          {habit.startDate ? format(parseISO(habit.startDate), 'd MMM') : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-[2px]">
                        <span className="text-sm font-semibold text-text-main">{score}</span>
                        <span className="text-[10px] text-text-muted">/ {eligibleDays}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}

            {/* Add Habit Column */}
            <div className="w-16 shrink-0 flex flex-col items-center">
              <div className="h-40 w-full flex items-end justify-center pb-4 border-b border-border-strong sticky top-0 bg-bg-surface z-20">
                {isAddingHabit ? (
                  <form onSubmit={handleAddHabit} className="flex flex-col items-center gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={newHabitName}
                      onChange={e => setNewHabitName(e.target.value)}
                      onBlur={() => {
                        if (newHabitName.trim()) {
                          handleAddHabit();
                        } else {
                          setIsAddingHabit(false);
                        }
                      }}
                      placeholder="Name"
                      className="w-24 -rotate-90 origin-bottom-left absolute translate-x-12 translate-y-[-40px] text-sm bg-bg-base border border-border-strong rounded px-2 py-1 outline-none shadow-sm"
                    />
                  </form>
                ) : (
                  <button 
                    onClick={() => setIsAddingHabit(true)}
                    className="p-1.5 rounded-full text-text-muted hover:text-text-main hover:bg-bg-base border border-transparent hover:border-border-strong transition-all"
                  >
                    <Plus size={18} />
                  </button>
                )}
              </div>
              {daysInMonth.map(date => (
                <div key={date.toISOString()} className="h-10 border-b border-border-subtle w-full" />
              ))}
              <div className="h-24 w-full pt-2" />
            </div>
          </div>
        </div>

        {/* Progress Graph integrated inside the container - MONKEYTYPE AESTHETIC */}
        <div className="border-t border-border-subtle pt-16">
          <div className="bg-[#0f1013] border border-[#23262f] rounded-3xl p-6 sm:p-8 relative shadow-2xl overflow-hidden">
            
            {/* Graph Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-4 border-b border-[#1f2229] gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-serif text-white font-medium">Hours Tracked</h3>
                  <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-[#d4d4d8] border border-white/10">
                    {format(currentDate, 'MMMM yyyy')}
                  </span>
                </div>
                <p className="text-xs text-[#71717a] mt-1 font-mono">
                  {monthlyTotalHours.toFixed(1)}h total logged • {monthlyDailyAvg.toFixed(1)}h daily avg • Peak: {monthlyPeakHours.toFixed(1)}h
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
                <div className="bg-[#18191f] border border-[#272a34] p-1 rounded-xl flex items-center gap-1 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setGraphViewMode('flow')}
                    className={clsx(
                      "px-3 py-1 rounded-lg transition-all cursor-pointer font-medium flex items-center gap-1.5",
                      graphViewMode === 'flow' 
                        ? "bg-white text-black font-semibold shadow-sm" 
                        : "text-[#71717a] hover:text-[#d4d4d8]"
                    )}
                  >
                    <Sparkles size={12} />
                    <span>Flow (Dual Line)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGraphViewMode('categories')}
                    className={clsx(
                      "px-3 py-1 rounded-lg transition-all cursor-pointer font-medium flex items-center gap-1.5",
                      graphViewMode === 'categories' 
                        ? "bg-white text-black font-semibold shadow-sm" 
                        : "text-[#71717a] hover:text-[#d4d4d8]"
                    )}
                  >
                    <Layers size={12} />
                    <span>Categories</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Legend & quick indicators */}
            <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
              {graphViewMode === 'flow' ? (
                <div className="flex items-center gap-5 text-xs font-mono text-[#a1a1aa]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                    <span className="text-white font-medium">Daily Total Hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-[#525660] rounded-full" />
                    <span className="text-[#8e95a5]">7-Day Trend</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 mr-2 text-xs font-mono text-[#71717a]">
                    <div className="w-2.5 h-0.5 bg-white/70" />
                    <span>Total</span>
                  </div>
                  {hourCategories.filter(c => !c.archived).map(cat => {
                    const isHidden = hiddenCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setHiddenCategories(prev => 
                            prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                          );
                        }}
                        className={clsx(
                          "px-2.5 py-0.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer",
                          isHidden 
                            ? "border-transparent bg-transparent text-[#525660] opacity-50 line-through" 
                            : "border-[#2b2e38] bg-[#16171d] text-white hover:border-[#3f4352]"
                        )}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="text-[11px] font-mono text-[#525660]">
                Streak Goal: 3.0h+ daily
              </div>
            </div>

            {/* Monkeytype Chart Area */}
            <div className="h-[380px] w-full relative pt-2">
              {/* Monospace watermark identical to Monkeytype read_ahead_easy */}
              <div className="absolute bottom-6 left-12 pointer-events-none select-none text-[12px] font-mono text-[#2f333e] tracking-wider z-0">
                daily_focus_hours // {graphViewMode === 'flow' ? 'flow_mode' : 'category_breakdown'}
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="none" vertical={false} stroke="#1f2229" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#555b68', fontSize: 13, fontFamily: 'monospace' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    domain={yAxisConfig.domain}
                    ticks={yAxisConfig.ticks}
                    tick={{ fill: '#555b68', fontSize: 13, fontFamily: 'monospace' }}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                  />
                  
                  {graphViewMode === 'flow' ? (
                    <>
                      {/* Muted Slate Curve (7-day trend) */}
                      <Line 
                        type="monotone" 
                        dataKey="RollingAvg" 
                        name="7-Day Trend"
                        stroke="#525660" 
                        strokeWidth={2.5} 
                        connectNulls={false}
                        dot={(props: any) => {
                          if (props.value === null || props.value === undefined || props.value === 0) return null;
                          return (
                            <circle 
                              key={props.key || props.index} 
                              cx={props.cx} 
                              cy={props.cy} 
                              r={3.5} 
                              fill="#525660" 
                              stroke="#0f1013" 
                              strokeWidth={1.5} 
                            />
                          );
                        }}
                        activeDot={{ r: 5, fill: '#525660', stroke: '#8e96a4', strokeWidth: 1.5 }}
                      />

                      {/* Crisp White Curve (Total Hours) */}
                      <Line 
                        type="monotone" 
                        dataKey="Total" 
                        name="Total Hours"
                        stroke="#f4f4f5" 
                        strokeWidth={3} 
                        connectNulls={false}
                        dot={(props: any) => {
                          if (props.value === null || props.value === undefined || props.value === 0) return null;
                          return (
                            <circle 
                              key={props.key || props.index} 
                              cx={props.cx} 
                              cy={props.cy} 
                              r={3.5} 
                              fill="#f4f4f5" 
                              stroke="#0f1013" 
                              strokeWidth={1.5} 
                            />
                          );
                        }}
                        activeDot={{ 
                          r: 6, 
                          fill: '#ffffff', 
                          stroke: '#f4f4f5', 
                          strokeWidth: 2, 
                          style: { filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))' } 
                        }}
                      />
                    </>
                  ) : (
                    <>
                      {/* Total curve as subtle reference */}
                      <Line 
                        type="monotone" 
                        dataKey="Total" 
                        name="Total Hours"
                        stroke="#ffffff" 
                        strokeWidth={2} 
                        strokeOpacity={0.4}
                        strokeDasharray="4 4"
                        connectNulls={false}
                        dot={false}
                        activeDot={false}
                      />

                      {/* Category curves */}
                      {hourCategories.filter(c => !c.archived && !hiddenCategories.includes(c.id)).map(cat => (
                        <Line 
                          key={cat.id}
                          type="monotone" 
                          dataKey={cat.name} 
                          stroke={cat.color} 
                          strokeWidth={2.5} 
                          connectNulls={false}
                          dot={(props: any) => {
                            if (props.value === null || props.value === undefined || props.value === 0) return null;
                            return (
                              <circle 
                                key={props.key || props.index} 
                                cx={props.cx} 
                                cy={props.cy} 
                                r={3.5} 
                                fill={props.stroke} 
                                stroke="#0f1013" 
                                strokeWidth={1.5} 
                              />
                            );
                          }} 
                          activeDot={{ 
                            r: 5, 
                            fill: cat.color, 
                            stroke: '#ffffff', 
                            strokeWidth: 2, 
                            style: { filter: `drop-shadow(0 0 8px ${cat.color})` } 
                          }} 
                        />
                      ))}
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Management */}
          <div className="mt-8 pt-8 border-t border-border-subtle">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold tracking-widest uppercase text-text-muted">Graph Categories</h3>
              <button 
                onClick={() => setShowManageCategories(!showManageCategories)}
                className="text-xs font-semibold text-accent-blue hover:underline"
              >
                {showManageCategories ? 'Hide' : 'Manage'}
              </button>
            </div>
            
            {showManageCategories && (
              <div className="bg-bg-base border border-border-strong rounded-xl p-4 mb-6 space-y-6">
                
                {/* Existing Categories */}
                <div className="flex flex-wrap gap-2">
                  {hourCategories.map(cat => (
                    <div key={cat.id} className={clsx("flex items-center gap-2 border rounded-lg px-3 py-1.5 text-sm transition-opacity", cat.archived ? "bg-bg-base border-border-subtle opacity-60" : "bg-bg-surface border-border-subtle")}>
                      <div className={clsx("w-3 h-3 rounded-full", cat.archived && "grayscale")} style={{ backgroundColor: cat.color }} />
                      <span className={clsx("font-medium text-text-main", cat.archived && "line-through text-text-muted")}>{cat.name}</span>
                      
                      <button 
                        onClick={() => {
                          let hex = cat.color;
                          if (hex === 'var(--accent-red)') hex = '#ff7e79';
                          if (hex === 'var(--accent-purple)') hex = '#a78bfa';
                          if (hex === 'var(--accent-green)') hex = '#4fb693';
                          if (hex === 'var(--accent-yellow)') hex = '#f1db75';
                          if (hex === 'var(--accent-blue)') hex = '#6ea8fe';
                          setEditingCat(cat);
                          setEditCatName(cat.name);
                          setEditCatColor(hex);
                        }}
                        className="text-text-muted hover:text-text-main ml-2"
                        title="Edit"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={() => handleToggleArchiveCategory(cat)}
                        className="text-text-muted hover:text-accent-yellow"
                        title={cat.archived ? "Unarchive" : "Archive"}
                      >
                        {cat.archived ? <ArchiveRestore size={12} /> : <Archive size={12} />}
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(cat)}
                        className="text-text-muted hover:text-accent-red"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Edit Category Form */}
                {editingCat && (
                  <form onSubmit={handleEditCategory} className="flex flex-wrap items-end gap-3 p-3 bg-bg-surface-hover rounded-lg border border-border-subtle">
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted">Edit Name</label>
                      <input 
                        type="text" 
                        value={editCatName}
                        onChange={e => setEditCatName(e.target.value)}
                        className="block bg-bg-base border border-border-strong rounded-lg px-3 py-1.5 text-sm outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted">Edit Color</label>
                      <div className="flex items-center gap-2 bg-bg-base border border-border-strong rounded-lg px-2 py-1">
                        <input 
                          type="color" 
                          value={editCatColor}
                          onChange={e => setEditCatColor(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <span className="text-sm font-mono text-text-muted uppercase">{editCatColor}</span>
                      </div>
                    </div>
                    <button type="submit" className="bg-text-main text-bg-base px-4 py-1.5 rounded-lg text-sm font-medium h-9">Save</button>
                    <button type="button" onClick={() => setEditingCat(null)} className="text-text-muted text-sm font-medium hover:text-text-main h-9">Cancel</button>
                  </form>
                )}

                {/* Add Category Form */}
                {!editingCat && (
                  <form onSubmit={handleAddCategory} className="flex flex-wrap items-end gap-3 pt-4 border-t border-border-subtle">
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted">New Category</label>
                      <input 
                        type="text" 
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        placeholder="e.g. Reading"
                        className="block bg-bg-base border border-border-strong rounded-lg px-3 py-1.5 text-sm outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted">Color</label>
                      <div className="flex items-center gap-2 bg-bg-base border border-border-strong rounded-lg px-2 py-1">
                        <input 
                          type="color" 
                          value={newCatColor}
                          onChange={e => setNewCatColor(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <span className="text-sm font-mono text-text-muted uppercase">{newCatColor}</span>
                      </div>
                    </div>
                    <button type="submit" className="bg-text-main text-bg-base px-4 py-1.5 rounded-lg text-sm font-medium h-9">Add</button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Add Hours Control */}
          <div className="pt-4 flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-widest uppercase text-text-muted">Date</label>
              <input 
                type="date" 
                value={hoursDate}
                onChange={e => setHoursDate(e.target.value)}
                className="block bg-bg-base border border-border-strong rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-text-muted"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-widest uppercase text-text-muted">Activity</label>
              <select 
                value={hoursType || (hourCategories.filter(c => !c.archived).length > 0 ? hourCategories.filter(c => !c.archived)[0].name : '')}
                onChange={e => setHoursType(e.target.value)}
                className="block bg-bg-base border border-border-strong rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-text-muted"
              >
                {hourCategories.filter(c => !c.archived).map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 relative">
              <label className="text-xs font-semibold tracking-widest uppercase text-text-muted">Hours to add</label>
              <input 
                type="number" 
                step="0.5"
                min="0.5"
                max="12"
                value={hoursAmount}
                onChange={e => setHoursAmount(e.target.value)}
                placeholder="e.g. 1.5"
                className="block w-24 bg-bg-base border border-border-strong rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-text-muted"
              />
              {errorMsg && (
                <div className="absolute top-full left-0 mt-2 w-max bg-accent-red-bg border border-accent-red/20 text-accent-red px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm animate-slide-up z-50">
                  {errorMsg}
                </div>
              )}
            </div>
            <button 
              onClick={handleAddHours}
              className="bg-text-main text-bg-base px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity mb-[2px]"
            >
              Add Hours
            </button>
          </div>

          {/* Edit Historical Hours */}
          {hourLogs.length > 0 && (
            <div className="mt-12">
              <h3 className="text-sm font-semibold tracking-widest uppercase text-text-muted mb-4">Logged Hours History</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {[...hourLogs].sort((a,b) => b.date.localeCompare(a.date)).map(log => (
                  <div key={log.id} className="flex items-center gap-4 bg-bg-base border border-border-subtle rounded-lg p-3 text-sm">
                    <input 
                      type="date"
                      value={log.date}
                      onChange={async (e) => await db.hourLogs.update(log.id, { date: e.target.value })}
                      className="bg-bg-surface border border-border-strong rounded px-2 py-1 outline-none focus:border-text-muted"
                    />
                    <select 
                      value={log.activity}
                      onChange={async (e) => await handleUpdateLogActivity(log.id, e.target.value, log.date, log.hours)}
                      className="bg-bg-surface border border-border-strong rounded px-2 py-1 outline-none"
                    >
                      {hourCategories.filter(cat => !cat.archived || cat.name === log.activity).map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                    <input 
                      type="number"
                      step="0.5"
                      value={log.hours}
                      onChange={async (e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) await handleUpdateLogHours(log.id, v, log.date, log.activity);
                      }}
                      className="w-16 bg-bg-surface border border-border-strong rounded px-2 py-1 outline-none"
                    />
                    <span className="text-text-muted">hours</span>
                    <button 
                      onClick={async () => await db.hourLogs.delete(log.id)}
                      className="ml-auto p-1.5 text-accent-red hover:bg-accent-red-bg rounded transition-colors"
                      title="Delete log"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </section>
    </div>
  );
}
