import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, startOfYear, endOfYear, getQuarter, startOfQuarter, endOfQuarter, getMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, ArrowLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { getTodayStr } from '../utils/dateUtils';

type Period = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';

const MOOD_EMOJIS: Record<string, string> = {
  'excellent': '😄',
  'good': '🙂',
  'okay': '😐',
  'not-great': '😕',
  'bad': '😞'
};

export function Logs() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('Monthly');

  // Fetch all data needed for the calendar and stats
  const allEntries = useLiveQuery(() => db.dayEntries.toArray()) || [];
  const allHabitLogs = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const allHourLogs = useLiveQuery(() => db.hourLogs.toArray()) || [];
  const allHabits = useLiveQuery(() => db.habits.toArray()) || [];
  const allGoals = useLiveQuery(() => db.goals.toArray()) || [];
  const allGoalMeasurements = useLiveQuery(() => db.goalMeasurements.toArray()) || [];

  const completedGoalsCount = useMemo(() => {
    let count = 0;
    allGoals.forEach(goal => {
      if (goal.targetValue === undefined || goal.targetValue === null || goal.targetValue === '') return;
      
      const measurements = allGoalMeasurements
        .filter(m => m.goalId === goal.id)
        .sort((a, b) => b.date.localeCompare(a.date)); // descending
        
      if (measurements.length === 0) return;
      
      const latestValue = measurements[0].value;
      
      if (goal.type === 'qualitative') {
        if (String(latestValue).toLowerCase().trim() === String(goal.targetValue).toLowerCase().trim()) {
          count++;
        }
      } else {
        const currentNum = Number(latestValue);
        const targetNum = Number(goal.targetValue);
        const startNum = Number(goal.startingValue);
        
        if (!isNaN(currentNum) && !isNaN(targetNum)) {
          if (!isNaN(startNum) && startNum > targetNum) {
            // Decrease goal (e.g. Weight loss)
            if (currentNum <= targetNum) count++;
          } else {
            // Increase goal
            if (currentNum >= targetNum) count++;
          }
        }
      }
    });
    return count;
  }, [allGoals, allGoalMeasurements]);

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Pad with empty days for grid alignment (assuming Monday start)
  const startDayOfWeek = getDay(monthStart); // 0 = Sunday, 1 = Monday
  const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Selected Day View Logic
  const selectedEntry = selectedDate ? allEntries.find(e => e.date === selectedDate) : null;
  const selectedHabitLogs = selectedDate ? allHabitLogs.filter(l => l.date === selectedDate) : [];
  const selectedHourLogs = selectedDate ? allHourLogs.filter(l => l.date === selectedDate) : [];

  const exportData = async () => {
    try {
      const backupData = {
        exportDate: new Date().toISOString(),
        dayEntries: await db.dayEntries.toArray(),
        habits: await db.habits.toArray(),
        habitLogs: await db.habitLogs.toArray(),
        hourLogs: await db.hourLogs.toArray(),
        goals: await db.goals.toArray(),
        goalMeasurements: await db.goalMeasurements.toArray()
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-tracker-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data.");
    }
  };

  // Stats Logic based on period
  const stats = useMemo(() => {
    let start: Date, end: Date;
    const year = currentDate.getFullYear();
    const currentMonth = getMonth(currentDate); // 0-11

    if (period === 'Monthly') {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    } else if (period === 'Quarterly') {
      start = startOfQuarter(currentDate);
      end = endOfQuarter(currentDate);
    } else if (period === 'Half-Yearly') {
      const isH1 = currentMonth < 6;
      start = new Date(year, isH1 ? 0 : 6, 1);
      end = new Date(year, isH1 ? 6 : 12, 0);
    } else {
      start = startOfYear(currentDate);
      end = endOfYear(currentDate);
    }

    let appStartDateStr = '2026-08-27';
    allHabits.forEach(h => {
      if (h.startDate && h.startDate < appStartDateStr) appStartDateStr = h.startDate;
    });
    allGoals.forEach(g => {
      if (g.startDate && g.startDate < appStartDateStr) appStartDateStr = g.startDate;
    });
    allEntries.forEach(e => {
      if (e.date < appStartDateStr) appStartDateStr = e.date;
    });

    const rangeStartStr = format(start, 'yyyy-MM-dd');
    const rangeEndStr = format(end, 'yyyy-MM-dd');
    const todayStr = getTodayStr();

    const periodEntries = allEntries.filter(e => e.date >= rangeStartStr && e.date <= rangeEndStr);

    const effectiveStartStr = rangeStartStr > appStartDateStr ? rangeStartStr : appStartDateStr;
    const effectiveEndStr = rangeEndStr < todayStr ? rangeEndStr : todayStr;

    let totalDaysInPeriod = 0;
    if (effectiveStartStr <= effectiveEndStr) {
      const effStart = parseISO(`${effectiveStartStr}T12:00:00`);
      const effEnd = parseISO(`${effectiveEndStr}T12:00:00`);
      totalDaysInPeriod = eachDayOfInterval({ start: effStart, end: effEnd }).length;
    }

    const daysLogged = periodEntries.length;
    
    // Mood mapping: excellent=5, good=4, okay=3, not-great=2, bad=1
    const moodValues: Record<string, number> = { 'excellent': 5, 'good': 4, 'okay': 3, 'not-great': 2, 'bad': 1 };
    const validMoods = periodEntries.filter(e => e.mood && moodValues[e.mood]);
    const avgMoodScore = validMoods.length > 0 
      ? validMoods.reduce((sum, e) => sum + moodValues[e.mood], 0) / validMoods.length 
      : 0;

    return {
      title: period === 'Monthly' ? format(currentDate, 'MMMM yyyy') :
             period === 'Quarterly' ? `Q${getQuarter(currentDate)} ${year}` :
             period === 'Half-Yearly' ? `H${currentMonth < 6 ? 1 : 2} ${year}` :
             `${year}`,
      daysLogged,
      totalDays: totalDaysInPeriod,
      avgMood: avgMoodScore > 0 ? avgMoodScore.toFixed(1) : '0'
    };
  }, [currentDate, period, allEntries, allHabits, allGoals]);

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-fade-in flex flex-col gap-16">
      
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-text-muted hover:text-text-main transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-4xl font-serif italic text-text-main">Logs</h1>
            <p className="text-text-muted uppercase tracking-widest text-sm font-medium mt-1">
              History & Progress
            </p>
          </div>
        </div>
        <button 
          onClick={exportData} 
          className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors bg-bg-surface hover:bg-bg-surface-hover border border-border-strong px-4 py-2 rounded-xl"
        >
          <Download size={16} /> Export JSON
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Side: Calendar & Stats */}
        <div className="lg:col-span-7 space-y-12">
          
          {/* Monthly Calendar */}
          <section className="bg-bg-surface border border-border-strong rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif italic text-text-main">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 hover:bg-bg-surface-hover rounded-full text-text-muted hover:text-text-main transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={nextMonth} className="p-2 hover:bg-bg-surface-hover rounded-full text-text-muted hover:text-text-main transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold tracking-widest uppercase text-text-muted">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: paddingDays }).map((_, i) => (
                <div key={`pad-${i}`} className="aspect-square" />
              ))}
              {calendarDays.map(date => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const hasEntry = allEntries.some(e => e.date === dateStr);
                const isSelected = selectedDate === dateStr;
                const isTodayDate = isToday(date);
                
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={clsx(
                      "aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200 border",
                      isSelected 
                        ? "bg-text-main text-bg-base border-text-main shadow-md scale-105" 
                        : hasEntry
                          ? "bg-bg-surface-hover border-border-strong text-text-main hover:border-text-main"
                          : "bg-transparent border-transparent text-text-muted hover:border-border-subtle hover:bg-bg-surface"
                    )}
                  >
                    <div className="relative">
                      {format(date, 'd')}
                      {isTodayDate && !isSelected && (
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-red rounded-full" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Time Period Analysis */}
          <section className="space-y-6">
            <div className="flex flex-wrap gap-2 border-b border-border-subtle pb-4">
              {(['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={clsx(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    period === p
                      ? "bg-text-main text-bg-base"
                      : "text-text-muted hover:bg-bg-surface hover:text-text-main"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            <div>
              <h3 className="text-xl font-serif italic text-text-main mb-6">
                Overview for {stats.title}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bg-surface border border-border-strong rounded-xl p-5">
                  <div className="text-xs font-semibold tracking-widest uppercase text-text-muted mb-1">Days Logged</div>
                  <div className="text-2xl font-light text-text-main">
                    {stats.daysLogged} <span className="text-sm text-text-muted">/ {stats.totalDays}</span>
                  </div>
                </div>
                
                <div className="bg-bg-surface border border-border-strong rounded-xl p-5">
                  <div className="text-xs font-semibold tracking-widest uppercase text-text-muted mb-1">Average Mood</div>
                  <div className="text-2xl font-light text-text-main">
                    {stats.avgMood} <span className="text-sm text-text-muted">/ 5</span>
                  </div>
                </div>

                <div className="bg-bg-surface border border-border-strong rounded-xl p-5">
                  <div className="text-xs font-semibold tracking-widest uppercase text-text-muted mb-1">Goals Completed</div>
                  <div className="text-3xl font-serif italic text-text-main mt-1">
                    {completedGoalsCount} <span className="text-sm text-text-muted">/ {allGoals.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Right Side: Daily Log View */}
        <div className="lg:col-span-5">
          {selectedDate ? (
            <div className="bg-bg-surface border border-border-strong rounded-2xl p-6 lg:p-8 shadow-lg sticky top-24 min-h-[500px]">
              
              <header className="mb-8 border-b border-border-subtle pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-serif italic text-text-main">
                    {format(parseISO(selectedDate), 'MMMM do, yyyy')}
                  </h2>
                  <p className="text-text-muted uppercase tracking-widest text-xs font-medium mt-1">
                    {format(parseISO(selectedDate), 'EEEE')}
                  </p>
                </div>
                {selectedEntry && selectedEntry.mood && (
                  <div className="text-3xl" title={selectedEntry.mood}>
                    {MOOD_EMOJIS[selectedEntry.mood]}
                  </div>
                )}
              </header>

              {selectedEntry ? (
                <div className="space-y-8">
                  {selectedEntry.oneLineSummary && (
                    <div>
                      <h3 className="text-xs font-semibold tracking-widest uppercase text-text-muted mb-2">Today in one line</h3>
                      <p className="text-text-main font-serif italic">"{selectedEntry.oneLineSummary}"</p>
                    </div>
                  )}

                  {selectedEntry.highlight && (
                    <div>
                      <h3 className="text-xs font-semibold tracking-widest uppercase text-text-muted mb-2">Highlight of the day</h3>
                      <p className="text-text-main whitespace-pre-wrap leading-relaxed">{selectedEntry.highlight}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-semibold tracking-widest uppercase text-text-muted mb-3">Habits</h3>
                    {allHabits.filter(h => !h.archived || selectedHabitLogs.some(l => l.habitId === h.id && l.status !== 'none')).length > 0 ? (
                      <ul className="space-y-2">
                        {allHabits.filter(h => !h.archived || selectedHabitLogs.some(l => l.habitId === h.id && l.status !== 'none')).map(habit => {
                          const log = selectedHabitLogs.find(l => l.habitId === habit.id);
                          const isCompleted = log?.status === 'completed';
                          const isPartial = log?.status === 'partial';
                          return (
                            <li key={habit.id} className="flex items-center gap-3 text-sm">
                              {isCompleted ? (
                                <span className="text-text-main font-bold">●</span>
                              ) : isPartial ? (
                                <span className="text-text-main font-bold">◐</span>
                              ) : (
                                <span className="text-text-muted">○</span>
                              )}
                              <span className={isCompleted || isPartial ? 'text-text-main font-medium' : 'text-text-muted'}>
                                {habit.name}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-text-muted italic">No habits tracked.</p>
                    )}
                  </div>

                  {/* Hours Tracked */}
                  {selectedHourLogs.length > 0 && (
                    <div className="pt-4 border-t border-border-subtle">
                      <h3 className="text-xs font-semibold tracking-widest uppercase text-text-muted mb-3">Hours Tracked</h3>
                      <div className="flex gap-6">
                        {['WebDev', 'Study', 'DSA'].map(activity => {
                          const hours = selectedHourLogs
                            .filter(l => l.activity === activity)
                            .reduce((sum, l) => sum + l.hours, 0);
                          
                          if (hours === 0) return null;

                          const colorClass = 
                            activity === 'WebDev' ? 'text-[#ef4444]' :
                            activity === 'Study' ? 'text-[#3b82f6]' :
                            'text-[#10b981]';

                          return (
                            <div key={activity} className="flex flex-col">
                              <span className={clsx("text-xl font-medium", colorClass)}>{hours}h</span>
                              <span className="text-xs text-text-muted uppercase tracking-wider">{activity}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Other reflections if they exist */}
                  {(selectedEntry.wentWell || selectedEntry.problems || selectedEntry.learned) && (
                    <div className="pt-4 border-t border-border-subtle space-y-4">
                      {selectedEntry.wentWell && (
                        <div>
                          <span className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1">Went well</span>
                          <p className="text-sm text-text-main">{selectedEntry.wentWell}</p>
                        </div>
                      )}
                      {selectedEntry.problems && (
                        <div>
                          <span className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1">Didn't go well</span>
                          <p className="text-sm text-text-main">{selectedEntry.problems}</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-20 text-text-muted">
                  <p className="font-serif italic text-lg mb-2">No journal entry found.</p>
                  <p className="text-sm">You didn't log anything on this day.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-bg-base border border-dashed border-border-strong rounded-2xl flex flex-col items-center justify-center h-full text-center py-32 text-text-muted sticky top-24">
              <p className="font-serif italic text-lg">Select a date from the calendar</p>
              <p className="text-sm mt-2">to view its complete log.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
