import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PenTool, CheckSquare, Target, LineChart, Flame, Code, Dumbbell, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useStreak } from '../hooks/useStreak';
import { useLevelSystem } from '../hooks/useLevelSystem';
import clsx from 'clsx';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getTodayStr } from '../utils/dateUtils';

export function Home() {
  const streak = useStreak();
  const { dev, fitness, totalHours, totalReps } = useLevelSystem();
  
  const [levelModal, setLevelModal] = useState<'dev' | 'fit' | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);

  const todayStr = getTodayStr();
  
  // Data for Streak Requirement breakdown
  const activeExercises = useLiveQuery(() => db.exercises.toArray())?.filter(ex => !ex.archived) || [];
  const activeHabits = useLiveQuery(() => db.habits.toArray())?.filter(h => (!h.startDate || h.startDate <= todayStr) && !h.archived) || [];
  const todaysExerciseLogs = useLiveQuery(() => db.exerciseLogs.where('date').equals(todayStr).toArray()) || [];
  const todaysHabitLogs = useLiveQuery(() => db.habitLogs.where('date').equals(todayStr).toArray()) || [];
  const todaysHourLogs = useLiveQuery(() => db.hourLogs.where('date').equals(todayStr).toArray()) || [];
  
  let habitScore = 0;
  todaysHabitLogs.forEach(log => {
    if (log.status === 'completed') habitScore += 1.0;
    else if (log.status === 'partial') habitScore += 0.5;
  });
  const habitConditionMet = activeHabits.length > 0 ? (habitScore / activeHabits.length >= 0.75) : true;
  
  const todaysTotalHours = todaysHourLogs.reduce((acc, log) => acc + log.hours, 0);
  const hoursConditionMet = todaysTotalHours >= 3.0;

  const pendingExercises = activeExercises.filter(ex => {
    const reps = todaysExerciseLogs.find(l => l.exerciseId === ex.id)?.reps || 0;
    return reps === 0;
  });
  
  const devTitle = dev.title;
  const fitTitle = fitness.title;

  return (
    <div className="flex flex-col gap-16 md:gap-24 animate-fade-in max-w-4xl mx-auto pt-4 relative">
      
      <header className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-serif text-text-main tracking-tight">
          <span className="marker-highlight font-medium">{format(new Date(), 'EEEE')}</span>, <br className="md:hidden"/> {format(new Date(), 'MMMM do')}
        </h1>
        <p className="text-text-muted uppercase tracking-[0.2em] text-sm font-medium">
          Welcome to your daily journal
        </p>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8 animate-slide-up">
          <button 
            onClick={() => setShowStreakModal(true)}
            className={clsx(
              "flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold tracking-widest uppercase shadow-sm transition-all duration-500 cursor-pointer hover:border-accent-yellow",
              streak > 0 
                ? "border-accent-yellow bg-accent-yellow-bg text-accent-yellow"
                : "border-border-strong bg-bg-surface text-text-muted opacity-60 hover:text-text-main"
            )}>
            <Flame 
              size={20} 
              className={clsx(
                "transition-all duration-500",
                streak > 0 ? "fill-accent-yellow text-accent-yellow animate-fire" : "text-text-muted"
              )} 
            />
            <span>{streak} Day Streak</span>
          </button>

          <div className="flex gap-4">
            <button onClick={() => setLevelModal('dev')} className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-border-strong bg-bg-surface shadow-sm hover:border-accent-blue transition-colors cursor-pointer text-left">
              <Code size={18} className="text-accent-blue" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-text-muted leading-none">Dev Lvl {dev.level}</span>
                <div className="w-20 h-1.5 bg-border-strong rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-accent-blue transition-all duration-1000" style={{ width: `${dev.progress}%` }} />
                </div>
              </div>
            </button>

            <button onClick={() => setLevelModal('fit')} className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-border-strong bg-bg-surface shadow-sm hover:border-accent-green transition-colors cursor-pointer text-left">
              <Dumbbell size={18} className="text-accent-green" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-text-muted leading-none">Fit Lvl {fitness.level}</span>
                <div className="w-20 h-1.5 bg-border-strong rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-accent-green transition-all duration-1000" style={{ width: `${fitness.progress}%` }} />
                </div>
              </div>
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <Link to="/highlight" className="group hover-lift p-10 rounded-3xl bg-bg-surface border border-border-subtle flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-accent-red-bg text-accent-red flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
            <PenTool size={32} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-medium text-text-main mb-3">Highlight of the Day</h2>
            <p className="text-text-muted text-sm leading-relaxed max-w-[250px] mx-auto">
              Reflect on your day, capture what went well, and log your overall mood.
            </p>
          </div>
        </Link>

        <Link to="/habits" className="group hover-lift p-10 rounded-3xl bg-bg-surface border border-border-subtle flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-accent-green-bg text-accent-green flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
            <CheckSquare size={32} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-medium text-text-main mb-3">Habits</h2>
            <p className="text-sm text-text-muted leading-relaxed max-w-[250px] mx-auto">
              Track your daily consistency and view your monthly heatmap.
            </p>
          </div>
        </Link>

        <Link to="/goals" className="group hover-lift p-10 rounded-3xl bg-bg-surface border border-border-subtle flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-accent-yellow-bg text-accent-yellow flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
            <Target size={32} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-medium text-text-main mb-3">Goals</h2>
            <p className="text-sm text-text-muted leading-relaxed max-w-[250px] mx-auto">
              Set long-term objectives and break them down into actionable steps.
            </p>
          </div>
        </Link>

        <Link to="/logs" className="group hover-lift p-10 rounded-3xl bg-bg-surface border border-border-subtle flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-accent-blue-bg text-accent-blue flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
            <LineChart size={32} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-medium text-text-main mb-3">Logs</h2>
            <p className="text-text-muted text-sm leading-relaxed max-w-[250px] mx-auto">
              Look back at your history, review your journal, and analyze long-term progress.
            </p>
          </div>
        </Link>

      </div>

      <div className="text-center pt-12 pb-4">
        <p className="text-[11px] text-text-muted uppercase tracking-[0.2em] font-medium opacity-50">
          Tip: Press 1-4 to navigate, Esc to return home
        </p>
      </div>

      {levelModal && (
        <div className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setLevelModal(null)}>
          <div className="bg-bg-surface border border-border-strong rounded-3xl p-8 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLevelModal(null)} className="absolute top-6 right-6 text-text-muted hover:text-text-main">
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className={clsx("w-14 h-14 rounded-full flex items-center justify-center", levelModal === 'dev' ? "bg-accent-blue-bg text-accent-blue" : "bg-accent-green-bg text-accent-green")}>
                {levelModal === 'dev' ? <Code size={24} /> : <Dumbbell size={24} />}
              </div>
              <div>
                <h2 className="text-2xl font-serif text-text-main">
                  {levelModal === 'dev' ? `Dev Level ${dev.level}` : `Fit Level ${fitness.level}`}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={clsx("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded", levelModal === 'dev' ? "bg-accent-blue-bg text-accent-blue" : "bg-accent-green-bg text-accent-green")}>
                    {levelModal === 'dev' ? devTitle : fitTitle}
                  </span>
                  <p className="text-text-muted text-xs">
                    • {levelModal === 'dev' ? `${dev.xp} XP` : `${fitness.xp} XP`}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-bg-base border border-border-subtle rounded-xl p-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Lifetime Stats</h3>
                <p className="text-text-main">
                  You have logged <strong className="text-lg mx-1">{levelModal === 'dev' ? totalHours : totalReps}</strong> 
                  {levelModal === 'dev' ? ' hours of learning & coding.' : ' exercise reps.'}
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-text-muted mb-2">
                  <span>Level {levelModal === 'dev' ? dev.level : fitness.level}</span>
                  <span>Level {levelModal === 'dev' ? dev.level + 1 : fitness.level + 1}</span>
                </div>
                <div className="w-full h-3 bg-bg-base border border-border-strong rounded-full overflow-hidden mb-2">
                  <div 
                    className={clsx("h-full transition-all duration-1000", levelModal === 'dev' ? "bg-accent-blue" : "bg-accent-green")} 
                    style={{ width: `${levelModal === 'dev' ? dev.progress : fitness.progress}%` }} 
                  />
                </div>
                <p className="text-xs text-text-muted text-center">
                  {levelModal === 'dev' 
                    ? `${dev.nextLevelBaseXp - dev.xp} XP to next level`
                    : `${fitness.nextLevelBaseXp - fitness.xp} XP to next level`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStreakModal && (
        <div className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowStreakModal(false)}>
          <div className="bg-bg-surface border border-border-strong rounded-3xl p-8 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowStreakModal(false)} className="absolute top-6 right-6 text-text-muted hover:text-text-main">
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-accent-yellow-bg text-accent-yellow">
                <Flame size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-serif text-text-main">
                  Daily Requirements
                </h2>
                <p className="text-text-muted text-sm">
                  What you need to do today
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-bg-base border border-border-subtle rounded-xl p-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">Productivity</h3>
                <div className="flex items-center gap-3">
                  {habitConditionMet ? (
                    <div className="w-6 h-6 rounded-full bg-accent-green-bg text-accent-green flex items-center justify-center shrink-0">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-border-strong shrink-0"></div>
                  )}
                  <span className={clsx("text-sm", habitConditionMet ? "text-text-muted line-through" : "text-text-main")}>
                    {activeHabits.length > 0 
                      ? `Score 75% (Current: ${habitScore} / ${activeHabits.length} | Need: ${Math.ceil(activeHabits.length * 0.75)})`
                      : "No active habits to track."}
                  </span>
                </div>
              </div>

              <div className="bg-bg-base border border-border-subtle rounded-xl p-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">Focus Hours</h3>
                <div className="flex items-center gap-3">
                  {hoursConditionMet ? (
                    <div className="w-6 h-6 rounded-full bg-accent-green-bg text-accent-green flex items-center justify-center shrink-0">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-border-strong shrink-0"></div>
                  )}
                  <span className={clsx("text-sm", hoursConditionMet ? "text-text-muted line-through" : "text-text-main")}>
                    Log at least 3.0 Hours (Current: {todaysTotalHours.toFixed(1)}h)
                  </span>
                </div>
              </div>

              <div className="bg-bg-base border border-border-subtle rounded-xl p-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">Fitness Tasks</h3>
                {activeExercises.length === 0 ? (
                  <p className="text-sm text-text-muted italic">No active exercises to track.</p>
                ) : (
                  <div className="space-y-3">
                    {activeExercises.map(ex => {
                      const isPending = pendingExercises.some(p => p.id === ex.id);
                      return (
                        <div key={ex.id} className="flex items-center gap-3">
                          {!isPending ? (
                            <div className="w-6 h-6 rounded-full bg-accent-green-bg text-accent-green flex items-center justify-center shrink-0">
                              <Check size={14} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-border-strong shrink-0"></div>
                          )}
                          <span className={clsx("text-sm", !isPending ? "text-text-muted line-through" : "text-text-main font-medium")}>
                            {ex.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {(pendingExercises.length > 0 || !habitConditionMet || !hoursConditionMet) ? (
                <p className="text-xs text-accent-red text-center font-medium bg-accent-red-bg py-2 rounded-lg">
                  You must complete these to secure your streak!
                </p>
              ) : (
                <p className="text-xs text-accent-green text-center font-medium bg-accent-green-bg py-2 rounded-lg">
                  All requirements met! Your streak is secured for today.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
