import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Habit } from '../db';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, parseISO, isBefore } from 'date-fns';
const EMPTY_ARRAY: any[] = [];
import { getTodayStr, MIN_DATE_STR } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, Plus, ArrowLeft, MoreHorizontal, Edit2, Archive, X, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import confetti from 'canvas-confetti';
import { useSound } from '../hooks/useSound';

export function ProductivityHabits() {
  const { playClick, playCheck, playFanfare, playThump } = useSound();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Habit Management State
  const [newHabitName, setNewHabitName] = useState('');
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [activeMenuHabitId, setActiveMenuHabitId] = useState<string | null>(null);
  
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editName, setEditName] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editFrequencyType, setEditFrequencyType] = useState<'daily' | 'specific_days'>('daily');
  const [editSpecificDays, setEditSpecificDays] = useState<number[]>([]);
  const [editPriority, setEditPriority] = useState<1|2|3>(2);
  
  const [archivingHabit, setArchivingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        if (e.key === 'Backspace') {
          const activeTag = (document.activeElement?.tagName || '').toUpperCase();
          if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag) || (document.activeElement as HTMLElement)?.isContentEditable) {
            return;
          }
        }

        if (isAddingHabit || activeMenuHabitId || editingHabit || archivingHabit || deletingHabit) {
          e.preventDefault();
          e.stopPropagation();
          setIsAddingHabit(false);
          setActiveMenuHabitId(null);
          setEditingHabit(null);
          setArchivingHabit(null);
          setDeletingHabit(null);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isAddingHabit, activeMenuHabitId, editingHabit, archivingHabit, deletingHabit]);

  const allHabits = useLiveQuery(() => db.habits.toArray()) ?? EMPTY_ARRAY;
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

  const habitLogs = useLiveQuery(() => 
    db.habitLogs.where('date').between(monthStartStr, monthEndStr, true, true).toArray()
  , [monthStartStr, monthEndStr]) ?? EMPTY_ARRAY;

  // Streak logic moved to Home.tsx

  // Determine which habits to show: active ones, PLUS archived ones if they have logs this month
  const visibleHabits = useMemo(() => {
    return allHabits.filter(h => {
      if (!h.archived) return true;
      return habitLogs.some(l => l.habitId === h.id);
    }).sort((a, b) => {
      const pA = a.priority ?? 2;
      const pB = b.priority ?? 2;
      if (pA !== pB) return pA - pB;
      
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
    await db.habits.update(editingHabit.id, { name: editName.trim(), startDate: editStartDate || undefined, frequencyType: editFrequencyType, specificDays: editSpecificDays, priority: editPriority });
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
      playThump();
    } else if (logId) {
      await db.habitLogs.update(logId, { status: nextStatus as any });
      if (nextStatus === 'completed') {
        const otherLogs = habitLogs.filter(l => l.date === date && l.habitId !== habitId);
        const otherCompletedCount = otherLogs.filter(l => l.status === 'completed').length;
        if (otherCompletedCount + 1 >= visibleHabits.length && visibleHabits.length > 0) {
          playFanfare();
          confetti({
            particleCount: 55,
            spread: 60,
            origin: { y: 0.65 }
          });
        } else {
          playCheck();
        }
      } else {
        playClick();
      }
    } else {
      await db.habitLogs.add({
        id: crypto.randomUUID(),
        date,
        habitId,
        status: nextStatus as any
      });
      if (nextStatus === 'completed') {
        const otherLogs = habitLogs.filter(l => l.date === date && l.habitId !== habitId);
        const otherCompletedCount = otherLogs.filter(l => l.status === 'completed').length;
        if (otherCompletedCount + 1 >= visibleHabits.length && visibleHabits.length > 0) {
          playFanfare();
          confetti({
            particleCount: 55,
            spread: 60,
            origin: { y: 0.65 }
          });
        } else {
          playCheck();
        }
      } else {
        playClick();
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-fade-in relative">
      
      {/* Edit Habit Modal */}
      {/* Edit Habit Modal */}
      {editingHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/60 backdrop-blur-sm animate-fade-in p-4" role="dialog" aria-modal="true" aria-labelledby="edit-habit-title">
          <div className="bg-bg-surface border border-border-strong rounded-2xl p-6 sm:p-8 shadow-xl max-w-sm w-full animate-scale-in relative">
            <button onClick={() => setEditingHabit(null)} className="absolute top-4 right-4 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main rounded-full hover:bg-bg-base/60 transition-colors cursor-pointer tap-press" aria-label="Close modal">
              <X size={20} />
            </button>
            <h3 id="edit-habit-title" className="text-xl font-serif italic text-text-main mb-6">Edit Habit</h3>
            <form onSubmit={saveEditHabit} className="space-y-4">
              <div>
                <label htmlFor="edit-habit-name" className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Habit Name</label>
                <input 
                  id="edit-habit-name"
                  type="text" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-3 text-base sm:text-sm text-text-main focus:outline-none focus:border-text-muted"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="edit-habit-start-date" className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Starting Date</label>
                <input 
                  id="edit-habit-start-date"
                  type="date" 
                  value={editStartDate}
                  onChange={e => setEditStartDate(e.target.value)}
                  className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-3 text-base sm:text-sm text-text-main focus:outline-none focus:border-text-muted"
                />
              </div>
              
                <div className="mb-6">
                  <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Priority Block</label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(p => (
                      <button 
                        key={p} 
                        type="button" 
                        onClick={() => setEditPriority(p as 1|2|3)} 
                        className={`flex-1 min-h-[44px] py-2 rounded-lg border text-sm font-medium transition-all tap-press cursor-pointer ${editPriority === p ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-border-strong text-text-muted hover:border-text-muted'}`}
                      >
                        {p === 1 ? '1 (High)' : p === 2 ? '2 (Mid)' : '3 (Low)'}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Frequency</label>
                  <div className="flex gap-2 mb-3">
                    <button type="button" onClick={() => setEditFrequencyType('daily')} className={`flex-1 min-h-[44px] py-2 rounded-lg border text-sm font-medium transition-all tap-press cursor-pointer ${editFrequencyType === 'daily' ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-border-strong text-text-muted hover:border-text-muted'}`}>Daily</button>
                    <button type="button" onClick={() => setEditFrequencyType('specific_days')} className={`flex-1 min-h-[44px] py-2 rounded-lg border text-sm font-medium transition-all tap-press cursor-pointer ${editFrequencyType === 'specific_days' ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-border-strong text-text-muted hover:border-text-muted'}`}>Specific Days</button>
                  </div>
                  {editFrequencyType === 'specific_days' && (
                    <div className="flex justify-between gap-1 mt-2">
                      {['S','M','T','W','T','F','S'].map((day, i) => (
                        <button 
                          key={i} 
                          type="button"
                          onClick={() => setEditSpecificDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i])}
                          className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all tap-press cursor-pointer ${editSpecificDays.includes(i) ? 'bg-accent-blue text-bg-base' : 'bg-bg-base border border-border-strong text-text-muted hover:border-text-muted'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-4">
                <button type="submit" className="min-h-[44px] bg-text-main text-bg-base px-6 py-2.5 rounded-full font-medium text-sm hover:opacity-90 tap-press cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Habit Modal */}
      {archivingHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/60 backdrop-blur-sm animate-fade-in p-4" role="dialog" aria-modal="true" aria-labelledby="archive-habit-title">
          <div className="bg-bg-surface border border-border-strong rounded-2xl p-6 sm:p-8 shadow-xl max-w-sm w-full animate-scale-in relative text-center">
            <h3 id="archive-habit-title" className="text-xl font-semibold text-text-main mb-2">Archive {archivingHabit.name}?</h3>
            <p className="text-sm text-text-muted mb-8 leading-relaxed">
              It will no longer appear as an active habit, but your previous records will be preserved.
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setArchivingHabit(null)} className="min-h-[44px] px-6 py-2.5 rounded-full border border-border-strong text-text-main hover:bg-bg-surface-hover font-medium text-sm tap-press cursor-pointer">
                Cancel
              </button>
              <button onClick={confirmArchive} className="min-h-[44px] px-6 py-2.5 rounded-full bg-accent-red text-bg-base font-medium text-sm hover:opacity-90 tap-press cursor-pointer">
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Habit Modal */}
      {deletingHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/60 backdrop-blur-sm animate-fade-in p-4" role="dialog" aria-modal="true" aria-labelledby="delete-habit-title">
          <div className="bg-bg-surface border border-border-strong rounded-2xl p-6 sm:p-8 shadow-xl max-w-sm w-full animate-scale-in relative text-center">
            <h3 id="delete-habit-title" className="text-xl font-semibold text-text-main mb-2">Delete {deletingHabit.name}?</h3>
            <p className="text-sm text-text-muted mb-8 leading-relaxed">
              This will permanently remove the habit and all its history. This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setDeletingHabit(null)} className="min-h-[44px] px-6 py-2.5 rounded-full border border-border-strong text-text-main hover:bg-bg-surface-hover font-medium text-sm tap-press cursor-pointer">
                Cancel
              </button>
              <button onClick={confirmDelete} className="min-h-[44px] px-6 py-2.5 rounded-full bg-accent-red text-bg-base font-medium text-sm hover:opacity-90 tap-press cursor-pointer">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-subtle pb-6 mb-8 sm:mb-12 gap-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/habits" className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main transition-colors rounded-full hover:bg-bg-surface tap-press cursor-pointer" aria-label="Go back to habits">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif italic text-text-main font-semibold">Daily Habits</h1>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">Daily habits matrix and consistency tracking</p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
          <button onClick={goToToday} className="min-h-[44px] px-3.5 py-2 rounded-full text-sm font-medium text-text-muted hover:text-text-main hover:bg-bg-surface tap-press cursor-pointer">
            Today
          </button>
          <div className="flex items-center gap-1 sm:gap-2 bg-bg-surface border border-border-strong rounded-full p-1">
            <button onClick={prevMonth} disabled={isBefore(endOfMonth(subMonths(currentDate, 1)), parseISO(MIN_DATE_STR + "T00:00:00"))} className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-bg-surface-hover rounded-full text-text-muted hover:text-text-main disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-text-muted disabled:hover:bg-transparent tap-press cursor-pointer" aria-label="Previous month">
              <ChevronLeft size={18} />
            </button>
            <span className="w-28 sm:w-32 text-center font-serif text-sm sm:text-base font-medium text-text-main">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button onClick={nextMonth} className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-bg-surface-hover rounded-full text-text-muted hover:text-text-main tap-press cursor-pointer" aria-label="Next month">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Unified Tracker Container */}
      <section className="bg-bg-surface border border-border-strong rounded-2xl sm:rounded-[2rem] shadow-sm overflow-hidden p-4 sm:p-8 md:p-12 flex flex-col gap-8 sm:gap-12">
        
        {/* Empty State Callout */}
        {visibleHabits.length === 0 && (
          <div className="bg-bg-base/60 border border-border-subtle rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
            <div>
              <h3 className="text-sm font-semibold text-text-main">No habits created yet</h3>
              <p className="text-xs text-text-muted mt-0.5">Your matrix is completely empty. Click the '+' button in the grid header to create your first habit.</p>
            </div>
            <button
              onClick={() => setIsAddingHabit(true)}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-text-main text-bg-base text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 tap-press shrink-0"
            >
              <Plus size={14} />
              <span>Add Habit</span>
            </button>
          </div>
        )}

        {/* Habit Grid */}
        <div className="overflow-x-auto overflow-y-auto max-h-[75vh] pb-6 -mx-2 px-2 sm:-mx-4 sm:px-4 md:-mx-8 md:px-8">
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
                      "h-11 flex items-center justify-center gap-1.5 text-sm font-medium",
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
            {visibleHabits.map((habit, index) => {
              const currentPriority = habit.priority ?? 2;
              const nextPriority = index < visibleHabits.length - 1 ? (visibleHabits[index + 1].priority ?? 2) : currentPriority;
              const isLastInPriority = currentPriority !== nextPriority;
              
              return (
              <div key={habit.id} className={`w-14 shrink-0 flex flex-col items-center group/col ${isLastInPriority ? 'border-r-4 border-text-muted/20' : 'border-r border-border-subtle'}`}>
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
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 opacity-100 sm:opacity-0 sm:group-hover/header:opacity-100 transition-opacity duration-300">
                    <div className="relative">
                      <button 
                        onClick={() => setActiveMenuHabitId(activeMenuHabitId === habit.id ? null : habit.id)}
                        className={clsx(
                          "w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-text-main bg-bg-base/80 backdrop-blur shadow-sm border border-border-subtle transition-all hover:scale-110 tap-press cursor-pointer",
                          activeMenuHabitId === habit.id ? "opacity-100 ring-2 ring-accent-blue/30" : ""
                        )}
                        aria-label="Manage habit"
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
setEditPriority(habit.priority || 2);
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
                  
                  const statusLabel = !isEligible 
                    ? 'Not scheduled' 
                    : currentStatus === 'completed' 
                      ? 'Completed' 
                      : currentStatus === 'partial' 
                        ? 'Partially completed' 
                        : 'Incomplete';
                  const dateLabel = format(date, 'EEEE, MMM d, yyyy');
                  
                  return (
                    <button
                      key={dateStr}
                      disabled={!isEligible}
                      onClick={() => toggleHabit(habit.id, dateStr, log?.status, log?.id)}
                      aria-label={`${habit.name}, ${dateLabel}: ${statusLabel}`}
                      title={`${habit.name} (${format(date, 'MMM d')}): ${statusLabel}`}
                      className={clsx(
                        "w-full h-11 flex items-center justify-center transition-all group tap-press",
                        !isEligible ? "bg-bg-base/30 cursor-not-allowed opacity-40" : "hover:bg-bg-surface-hover cursor-pointer",
                        isToday(date) && "bg-accent-red-bg/20",
                        isSunday ? "border-b-[3px] border-b-border-strong" : "border-b border-b-border-subtle"
                      )}
                    >
                      <span 
                        aria-hidden="true"
                        className={clsx(
                          "text-xl transition-transform duration-200 group-active:scale-90",
                          currentStatus === 'completed' && "animate-check-spring",
                          isEligible && currentStatus !== 'none' ? (currentStatus === 'completed' ? "text-text-main" : "text-text-muted opacity-80") : "text-text-muted opacity-20"
                        )}
                      >
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
              );
            })}

            {/* Add Habit Column */}
            <div className="w-16 shrink-0 flex flex-col items-center">
              <div className="h-40 w-full flex items-end justify-center pb-4 border-b border-border-strong sticky top-0 bg-bg-surface z-20">
                {isAddingHabit ? (
                  <form onSubmit={handleAddHabit} className="flex flex-col items-center gap-2">
                    <input
                      autoFocus
                      id="new-habit-name"
                      aria-label="New habit name"
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
                    className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-text-muted hover:text-text-main hover:bg-bg-base border border-border-subtle transition-all tap-press cursor-pointer"
                    aria-label="Add new habit"
                  >
                    <Plus size={18} />
                  </button>
                )}
              </div>
              {daysInMonth.map(date => (
                <div key={date.toISOString()} className="h-11 border-b border-border-subtle w-full" />
              ))}
              <div className="h-24 w-full pt-2" />
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}
