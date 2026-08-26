import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Habit } from '../db';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, parseISO } from 'date-fns';
import { getTodayStr } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, Plus, ArrowLeft, MoreHorizontal, Edit2, Archive, X, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import clsx from 'clsx';

export function Habits() {
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
  const [hoursType, setHoursType] = useState<'studyHours' | 'webDevHours' | 'dsaHours'>('studyHours');
  const [hoursAmount, setHoursAmount] = useState('');

  const allHabits = useLiveQuery(() => db.habits.toArray()) || [];
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

  const habitLogs = useLiveQuery(() => 
    db.habitLogs.where('date').between(monthStartStr, monthEndStr, true, true).toArray()
  , [monthStartStr, monthEndStr]) || [];

  const hourLogs = useLiveQuery(() => 
    db.hourLogs.where('date').between(monthStartStr, monthEndStr, true, true).toArray()
  , [monthStartStr, monthEndStr]) || [];

  // Determine which habits to show: active ones, PLUS archived ones if they have logs this month
  const visibleHabits = useMemo(() => {
    return allHabits.filter(h => {
      if (!h.archived) return true;
      return habitLogs.some(l => l.habitId === h.id);
    });
  }, [allHabits, habitLogs]);

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
  };

  const renderCell = (status: string | undefined) => {
    if (status === 'completed') return <span className="text-xl">●</span>;
    if (status === 'partial') return <span className="text-xl">◐</span>;
    return <span className="text-xl text-transparent">○</span>; // transparent placeholder for sizing
  };

  const handleAddHours = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(hoursAmount);
    if (isNaN(amount) || amount <= 0) return;

    await db.hourLogs.add({
      id: crypto.randomUUID(),
      date: hoursDate,
      activity: hoursType === 'studyHours' ? 'Study' : hoursType === 'webDevHours' ? 'WebDev' : 'DSA',
      hours: amount
    });
    setHoursAmount('');
  };

  // Prepare graph data
  const graphData = useMemo(() => {
    return daysInMonth.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dailyHours = hourLogs.filter(log => log.date === dateStr);
      
      const studyHours = dailyHours.filter(l => l.activity === 'Study').reduce((acc, curr) => acc + curr.hours, 0);
      const webDevHours = dailyHours.filter(l => l.activity === 'WebDev').reduce((acc, curr) => acc + curr.hours, 0);
      const dsaHours = dailyHours.filter(l => l.activity === 'DSA').reduce((acc, curr) => acc + curr.hours, 0);

      return {
        date: format(date, 'd'),
        fullDate: dateStr,
        Study: studyHours,
        WebDev: webDevHours,
        DSA: dsaHours
      };
    });
  }, [daysInMonth, hourLogs]);

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
          <Link to="/" className="text-text-muted hover:text-text-main transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-serif italic text-text-main">Habit Tracker</h1>
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
              {daysInMonth.map(date => (
                <div 
                  key={date.toISOString()} 
                  className={clsx(
                    "h-10 flex items-center justify-center text-sm font-medium border-b border-border-subtle",
                    isToday(date) ? "text-accent-red bg-accent-red-bg/50" : "text-text-main"
                  )}
                >
                  {format(date, 'd')}
                </div>
              ))}
              {/* Score Placeholder */}
              <div className="h-16 flex items-center justify-center text-[10px] font-semibold tracking-widest uppercase text-text-muted pt-2">
                Score
              </div>
            </div>

            {/* Habit Columns */}
            {visibleHabits.map(habit => (
              <div key={habit.id} className="w-14 shrink-0 border-r border-border-subtle flex flex-col items-center group/col">
                <div className="h-40 w-full flex flex-col items-center justify-end pb-4 border-b border-border-strong relative sticky top-0 bg-bg-surface z-20 group/header">
                  
                  {/* Management Menu Trigger */}
                  <div className="absolute top-0 left-0 right-0 flex justify-center z-30 bg-bg-surface pt-2 pb-1">
                    <div className="relative">
                      <button 
                        onClick={() => setActiveMenuHabitId(activeMenuHabitId === habit.id ? null : habit.id)}
                        className={clsx(
                          "p-1 rounded text-text-muted hover:text-text-main hover:bg-bg-surface-hover transition-all",
                          activeMenuHabitId === habit.id ? "opacity-100 bg-bg-surface-hover" : "opacity-0 group-hover/header:opacity-100"
                        )}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      
                      {/* Menu Dropdown */}
                      {activeMenuHabitId === habit.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveMenuHabitId(null)} />
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-bg-base border border-border-strong rounded-xl shadow-lg z-50 overflow-hidden text-sm">
                            <button 
                              onClick={() => {
                                setEditName(habit.name);
                                setEditStartDate(habit.startDate || '');
                                setEditingHabit(habit);
                                setActiveMenuHabitId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left text-text-main hover:bg-bg-surface-hover transition-colors"
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                            <button 
                              onClick={() => {
                                setArchivingHabit(habit);
                                setActiveMenuHabitId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left text-accent-red hover:bg-accent-red-bg transition-colors"
                            >
                              <Archive size={14} /> Archive
                            </button>
                            <button 
                              onClick={() => {
                                setDeletingHabit(habit);
                                setActiveMenuHabitId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left text-accent-red hover:bg-accent-red-bg transition-colors border-t border-border-strong"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <span 
                    className="rotate-180 text-sm font-serif italic text-text-main whitespace-nowrap opacity-90 max-h-24 overflow-hidden"
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    {habit.name}
                  </span>
                </div>
                {daysInMonth.map(date => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const log = habitLogs.find(l => l.date === dateStr && l.habitId === habit.id);
                  const startDateStr = habit.startDate || '2000-01-01';
                  const isEligible = dateStr >= startDateStr;
                  
                  return (
                    <button
                      key={dateStr}
                      disabled={!isEligible}
                      onClick={() => toggleHabit(habit.id, dateStr, log?.status, log?.id)}
                      className={clsx(
                        "h-10 w-full flex items-center justify-center border-b border-border-subtle transition-colors",
                        isEligible ? "hover:bg-bg-surface-hover cursor-pointer" : "opacity-30 cursor-default bg-bg-base/50",
                        isToday(date) && "bg-accent-red-bg/20"
                      )}
                    >
                      {isEligible ? renderCell(log?.status) : <span className="text-sm font-medium text-border-strong">-</span>}
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
        <div className="border-t border-border-subtle pt-12">
          <h2 className="text-xl font-serif italic text-text-main mb-8">Hours Tracked</h2>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-strong)', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '14px' }}
                  labelStyle={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '14px', color: 'var(--text-main)' }} />
                
                <Line type="linear" dataKey="WebDev" stroke="#ef4444" strokeWidth={2} dot={{ r: 6, strokeWidth: 2 }} activeDot={{ r: 8 }} />
                <Line type="linear" dataKey="Study" stroke="#3b82f6" strokeWidth={2} dot={{ r: 6, strokeWidth: 2 }} activeDot={{ r: 8 }} />
                <Line type="linear" dataKey="DSA" stroke="#10b981" strokeWidth={2} dot={{ r: 6, strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Add Hours Control */}
          <div className="mt-8 pt-8 border-t border-border-subtle flex flex-wrap items-end gap-4">
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
                value={hoursType}
                onChange={e => setHoursType(e.target.value as any)}
                className="block bg-bg-base border border-border-strong rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-text-muted"
              >
                <option value="webDevHours">WebDev</option>
                <option value="studyHours">Study</option>
                <option value="dsaHours">DSA</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-widest uppercase text-text-muted">Hours to add</label>
              <input 
                type="number" 
                step="0.5"
                min="0.5"
                value={hoursAmount}
                onChange={e => setHoursAmount(e.target.value)}
                placeholder="e.g. 1.5"
                className="block w-24 bg-bg-base border border-border-strong rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-text-muted"
              />
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
                      onChange={async (e) => await db.hourLogs.update(log.id, { activity: e.target.value as any })}
                      className="bg-bg-surface border border-border-strong rounded px-2 py-1 outline-none"
                    >
                      <option value="WebDev">WebDev</option>
                      <option value="Study">Study</option>
                      <option value="DSA">DSA</option>
                    </select>
                    <input 
                      type="number"
                      step="0.5"
                      value={log.hours}
                      onChange={async (e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) await db.hourLogs.update(log.id, { hours: v });
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
