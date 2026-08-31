import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Habit, type HourCategory } from '../db';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, parseISO } from 'date-fns';
const EMPTY_ARRAY: any[] = [];
import { getTodayStr } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, Plus, ArrowLeft, MoreHorizontal, Edit2, Archive, X, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import clsx from 'clsx';
import { useSound } from '../hooks/useSound';

export function ProductivityHabits() {
  const { playClick } = useSound();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Habit Management State
  const [newHabitName, setNewHabitName] = useState('');
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [activeMenuHabitId, setActiveMenuHabitId] = useState<string | null>(null);
  
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editName, setEditName] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  
  const [archivingHabit, setArchivingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);

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

        if (isAddingHabit || activeMenuHabitId || editingHabit || archivingHabit || deletingHabit || showManageCategories) {
          e.preventDefault();
          e.stopPropagation();
          setIsAddingHabit(false);
          setActiveMenuHabitId(null);
          setEditingHabit(null);
          setArchivingHabit(null);
          setDeletingHabit(null);
          setShowManageCategories(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isAddingHabit, activeMenuHabitId, editingHabit, archivingHabit, deletingHabit, showManageCategories]);

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
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    await db.habits.update(editingHabit.id, { 
      name: editName.trim(),
      startDate: editStartDate || undefined
    });
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

  // Prepare graph data
  const graphData = useMemo(() => {
    return daysInMonth.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dailyHours = hourLogs.filter(log => log.date === dateStr);
      
      const dataPoint: any = {
        date: format(date, 'd'),
        fullDate: dateStr,
      };

      // Populate dynamic categories
      hourCategories.forEach(cat => {
        const hours = dailyHours.filter(l => l.activity === cat.name).reduce((acc, curr) => acc + curr.hours, 0);
        dataPoint[cat.name] = hours > 0 ? hours : null;
      });

      return dataPoint;
    });
  }, [daysInMonth, hourLogs, hourCategories]);

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

      <header className="flex items-center justify-between border-b border-border-subtle pb-6 mb-12">
        <div className="flex items-center gap-6">
          <Link to="/habits" className="text-text-muted hover:text-text-main transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-serif italic text-text-main">Productivity Tracking</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={goToToday} className="text-sm font-medium text-text-muted hover:text-text-main">
            Today
          </button>
          <div className="flex items-center gap-2 bg-bg-surface border border-border-strong rounded-full p-1">
            <button onClick={prevMonth} className="p-1.5 hover:bg-bg-surface-hover rounded-full text-text-muted hover:text-text-main">
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
                  const isEligible = dateStr >= startDateStr;
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
                    if (dateStr >= startDateStr) {
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
                        if (!newHabitName) setIsAddingHabit(false);
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

        {/* Progress Graph integrated inside the container */}
        <div className="border-t border-border-subtle pt-16">
          <h2 className="text-2xl font-serif text-text-main mb-10 font-medium">Hours Tracked</h2>
          
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="none" vertical={true} stroke="var(--border-strong)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={{ stroke: 'var(--border-strong)' }} 
                  tickLine={{ stroke: 'var(--border-strong)' }} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={{ stroke: 'var(--border-strong)' }} 
                  tickLine={{ stroke: 'var(--border-strong)' }} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(var(--bg-surface), 0.8)', 
                    backdropFilter: 'blur(12px)',
                    borderColor: 'var(--border-strong)', 
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-soft)'
                  }}
                  itemStyle={{ fontSize: '14px', fontWeight: 600 }}
                  labelStyle={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}
                />
                <Legend verticalAlign="top" height={40} wrapperStyle={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 500 }} />
                
                {hourCategories.map(cat => (
                  <Line 
                    key={cat.id}
                    type="linear" 
                    dataKey={cat.name} 
                    stroke={cat.color} 
                    strokeWidth={2} 
                    connectNulls={false}
                    dot={(props: any) => props.value ? <circle key={props.key || props.index} cx={props.cx} cy={props.cy} r={4} fill={props.stroke} stroke="var(--bg-surface)" strokeWidth={1} /> : null} 
                    activeDot={{ r: 6, fill: cat.color, strokeWidth: 0, style: { filter: `drop-shadow(0 0 8px ${cat.color})` } }} 
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
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
                    <div key={cat.id} className="flex items-center gap-2 bg-bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium text-text-main">{cat.name}</span>
                      
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
                value={hoursType || (hourCategories.length > 0 ? hourCategories[0].name : '')}
                onChange={e => setHoursType(e.target.value)}
                className="block bg-bg-base border border-border-strong rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-text-muted"
              >
                {hourCategories.map(cat => (
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
                      {hourCategories.map(cat => (
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
