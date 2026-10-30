import { useEffect } from 'react';
import { LevelUpCelebration } from '../components/LevelUpCelebration';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PenTool, CheckSquare, Target, LineChart, Flame, Code, Snowflake, Dumbbell, X, Check, Edit2, Trash2, Sparkles, Plus } from 'lucide-react';
import { TodoList } from '../components/TodoList';
import { format } from 'date-fns';
import { useStreak } from '../hooks/useStreak';
import { calculateFitnessXPForLogs } from '../hooks/useLevelSystem';
import { useLevelSystem, DEFAULT_DEV_RANKS, DEFAULT_FIT_RANKS } from '../hooks/useLevelSystem';
import { getSettings, saveSettings, SEASON_PRESETS } from '../utils/settings';
import clsx from 'clsx';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getTodayStr } from '../utils/dateUtils';

export function Home() {
  const { streak, freezesOwned, freezeUsedToday, isLoading: streakLoading } = useStreak();
  const { dev, fitness, totalHours, totalReps, isLoading: levelsLoading } = useLevelSystem();
  
  const todayStr = getTodayStr();
  const [levelModal, setLevelModal] = useState<'dev' | 'fit' | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showWinterArcRules, setShowWinterArcRules] = useState(false);
  const [showTodosModal, setShowTodosModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{type: 'dev' | 'fit' | 'streak', level: number, title: string} | null>(null);
  
  const [settings, setSettings] = useState(() => getSettings());
  const [isEditingProtocol, setIsEditingProtocol] = useState(false);
  const [editedSeasonName, setEditedSeasonName] = useState('');
  const [editedRules, setEditedRules] = useState<string[]>([]);

  // Daily checked rules stored per date for active tracking
  const [checkedRules, setCheckedRules] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(`season_rules_completed_${todayStr}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleCheckRule = (idx: number) => {
    const next = checkedRules.includes(idx) 
      ? checkedRules.filter(i => i !== idx) 
      : [...checkedRules, idx];
    setCheckedRules(next);
    localStorage.setItem(`season_rules_completed_${todayStr}`, JSON.stringify(next));
  };
  
  const todaysTodos = useLiveQuery(async () => {
    return await db.tasks.where('date').equals(todayStr).toArray();
  }, [todayStr]) || [];
  
  const completedTodosCount = todaysTodos.filter(t => t.completed).length;


  useEffect(() => {
    if (levelsLoading) return;
    
    const stored = parseInt(localStorage.getItem('v3_ack_dev_level') || '0', 10);
    if (stored === 0) {
      localStorage.setItem('v3_ack_dev_level', dev.level.toString());
    } else if (dev.level > stored) {
      setTimeout(() => setLevelUpData({ type: 'dev', level: dev.level, title: dev.title }), 0);
      localStorage.setItem('v3_ack_dev_level', dev.level.toString());
    }
  }, [dev.level, dev.title, levelsLoading]);

  useEffect(() => {
    if (levelsLoading) return;
    
    const stored = parseInt(localStorage.getItem('v3_ack_fit_level') || '0', 10);
    if (stored === 0) {
      localStorage.setItem('v3_ack_fit_level', fitness.level.toString());
    } else if (fitness.level > stored) {
      setTimeout(() => setLevelUpData({ type: 'fit', level: fitness.level, title: fitness.title }), 0);
      localStorage.setItem('v3_ack_fit_level', fitness.level.toString());
    }
  }, [fitness.level, fitness.title, levelsLoading]);

  useEffect(() => {
    if (streakLoading) return;
    
    const stored = parseInt(localStorage.getItem('v3_ack_streak') || '0', 10);
    if (stored === 0) {
      localStorage.setItem('v3_ack_streak', streak.toString());
    } else if (streak > stored && streak > 0 && streak % 7 === 0) {
      setTimeout(() => setLevelUpData({ type: 'streak', level: streak, title: 'Streak Milestone' }), 0);
      localStorage.setItem('v3_ack_streak', streak.toString());
    } else if (streak > stored) {
      localStorage.setItem('v3_ack_streak', streak.toString());
    }
  }, [streak, streakLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'escape' || e.key.toLowerCase() === 'backspace') {
        if (levelModal !== null || showStreakModal || levelUpData !== null || showWinterArcRules || showTodosModal) {
          e.preventDefault();
          e.stopPropagation();
          setLevelModal(null);
          setShowStreakModal(false);
          setLevelUpData(null);
          setShowWinterArcRules(false);
          setShowTodosModal(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [levelModal, showStreakModal, levelUpData, showWinterArcRules, showTodosModal]);

  
  // Data for Streak Requirement breakdown
  const activeExercises = useLiveQuery(async () => {
    const exs = await db.exercises.toArray();
    return exs.filter(ex => !ex.archived);
  }, []) || [];
  
  const activeHabits = useLiveQuery(async () => {
    const habits = await db.habits.toArray();
    return habits.filter(h => (!h.startDate || h.startDate <= todayStr) && !h.archived);
  }, [todayStr]) || [];
  const todaysExerciseLogs = useLiveQuery(() => db.exerciseLogs.where('date').equals(todayStr).toArray()) || [];
  const todaysHabitLogs = useLiveQuery(() => db.habitLogs.where('date').equals(todayStr).toArray()) || [];
  const todaysHourLogs = useLiveQuery(() => db.hourLogs.where('date').equals(todayStr).toArray()) || [];
  
  let habitScore = 0;
  todaysHabitLogs.forEach(log => {
    if (log.status === 'completed') habitScore += 1.0;
    else if (log.status === 'partial') habitScore += 0.5;
  });
  const targetPercent = settings.streakTargetHabitPercent / 100;
  const habitConditionMet = activeHabits.length > 0 ? (habitScore / activeHabits.length >= targetPercent) : true;
  
  const todaysTotalHours = todaysHourLogs.reduce((acc, log) => acc + log.hours, 0);
  const hoursConditionMet = todaysTotalHours >= settings.streakTargetHours;

  // Evaluate Fitness Streak Condition based on settings
  const totalRepsToday = todaysExerciseLogs.reduce((acc, log) => acc + log.reps, 0);
  const completedExerciseCount = todaysExerciseLogs.filter(log => log.reps > 0).length;
  
  const todaysFitnessXP = calculateFitnessXPForLogs(todaysExerciseLogs, activeExercises);
  let fitnessConditionMet = true;
  if (settings.streakFitnessRequirementType === 'count') {
    fitnessConditionMet = completedExerciseCount >= settings.streakFitnessRequirementValue;
  } else if (settings.streakFitnessRequirementType === 'reps') {
    fitnessConditionMet = totalRepsToday >= settings.streakFitnessRequirementValue;
  } else if (settings.streakFitnessRequirementType === 'xp') {
    fitnessConditionMet = todaysFitnessXP >= settings.streakFitnessRequirementValue;
  } else {
    // 'all'
    fitnessConditionMet = activeExercises.every(ex => {
      const reps = todaysExerciseLogs.find(l => l.exerciseId === ex.id)?.reps || 0;
      return reps > 0;
    });
  }

  // We still calculate pendingExercises to show what hasn't been started for the UI checklist
  const pendingExercises = activeExercises.filter(ex => {
    const reps = todaysExerciseLogs.find(l => l.exerciseId === ex.id)?.reps || 0;
    return reps === 0;
  });
  
  const devTitle = dev.title;
  const fitTitle = fitness.title;

  return (
    <div className="flex flex-col gap-16 md:gap-24 animate-fade-in max-w-4xl mx-auto pt-4 relative">
      
      <header className="text-center space-y-6 relative">
        <div className="flex items-center justify-center gap-3 mb-4">
          <button 
            onClick={() => {
              setEditedSeasonName(settings.seasonName);
              setEditedRules([...settings.winterArcRules]);
              setIsEditingProtocol(false);
              setShowWinterArcRules(true);
            }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-subtle bg-bg-surface text-text-muted text-xs font-medium tracking-widest uppercase shadow-sm hover:border-accent-blue/50 hover:bg-accent-blue/5 transition-colors cursor-pointer"
          >
            <Snowflake size={12} className="text-accent-blue opacity-70" />
            <span>{settings.seasonName}</span>
          </button>
          
          <button 
            onClick={() => setShowTodosModal(true)}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-subtle bg-bg-surface text-text-muted text-xs font-medium tracking-widest uppercase shadow-sm hover:border-accent-green/50 hover:bg-accent-green/5 transition-colors cursor-pointer"
          >
            <CheckSquare size={12} className={todaysTodos.length > 0 && completedTodosCount === todaysTodos.length ? "text-accent-green" : "text-text-muted"} />
            <span>Today's Todos {todaysTodos.length > 0 && `(${completedTodosCount}/${todaysTodos.length})`}</span>
          </button>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif text-text-main tracking-tight mt-0">
          <span className="marker-highlight font-medium">{format(new Date(), 'EEEE')}</span>, <br className="md:hidden"/> {format(new Date(), 'MMMM do')}
        </h1>
        <p className="text-text-muted uppercase tracking-[0.2em] text-xs sm:text-sm font-medium">
          Welcome to your daily journal
        </p>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8 animate-slide-up">
          <button 
            onClick={() => setShowStreakModal(true)}
            className={clsx(
              "flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold tracking-widest uppercase shadow-sm transition-all duration-500 cursor-pointer hover:border-accent-yellow relative",
              freezeUsedToday 
                ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                : streak > 0 
                  ? "border-accent-yellow bg-accent-yellow-bg text-accent-yellow"
                  : "border-border-strong bg-bg-surface text-text-muted opacity-60 hover:text-text-main"
            )}>
            {freezeUsedToday ? (
              <Snowflake size={20} className="text-accent-blue animate-pulse" />
            ) : (
              <Flame 
                size={20} 
                className={clsx(
                  "transition-all duration-500",
                  streak > 0 ? "fill-accent-yellow text-accent-yellow animate-fire" : "text-text-muted"
                )} 
              />
            )}
            
            <span>{streak} Day {freezeUsedToday ? 'Frozen' : 'Streak'}</span>

            {/* Freeze Tokens Indicators */}
            {freezesOwned > 0 && !freezeUsedToday && (
              <div className="flex gap-0.5 ml-1 opacity-80">
                {Array.from({ length: freezesOwned }).map((_, i) => (
                  <Snowflake key={i} size={12} className="text-accent-blue fill-accent-blue/20" />
                ))}
              </div>
            )}
          </button>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <button onClick={() => setLevelModal('dev')} className="flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-border-strong bg-bg-surface shadow-sm hover:border-accent-blue transition-colors cursor-pointer text-left tap-press">
              <Code size={18} className="text-accent-blue shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-text-muted leading-none">Dev Lvl {dev.level}</span>
                <div className="w-16 sm:w-20 h-1.5 bg-border-strong rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-accent-blue transition-all duration-1000" style={{ width: `${dev.progress}%` }} />
                </div>
              </div>
            </button>

            <button onClick={() => setLevelModal('fit')} className="flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-border-strong bg-bg-surface shadow-sm hover:border-accent-green transition-colors cursor-pointer text-left tap-press">
              <Dumbbell size={18} className="text-accent-green shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-text-muted leading-none">Fit Lvl {fitness.level}</span>
                <div className="w-16 sm:w-20 h-1.5 bg-border-strong rounded-full mt-1 overflow-hidden">
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

              <div className="mt-6 border-t border-border-strong pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">Rank Progression</h3>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {(levelModal === 'dev' ? DEFAULT_DEV_RANKS : DEFAULT_FIT_RANKS).map((rank, idx, arr) => {
const settings = getSettings();
const dynamicTitle = levelModal === 'dev' ? settings.devRanksNames[idx] : settings.fitRanksNames[idx];
                    const currentLevel = levelModal === 'dev' ? dev.level : fitness.level;
                    const prevMax = idx === 0 ? 1 : arr[idx - 1].max + 1;
                    const isCurrent = currentLevel >= prevMax && currentLevel <= rank.max;
                    const isFuture = currentLevel < prevMax;
                    
                    return (
                      <div key={dynamicTitle || rank.title} className={clsx(
                        "flex items-center justify-between p-3 rounded-xl border",
                        isCurrent ? (levelModal === 'dev' ? "bg-accent-blue-bg border-accent-blue/50" : "bg-accent-green-bg border-accent-green/50") 
                        : isFuture ? "bg-bg-base border-border-subtle opacity-50" 
                        : "bg-bg-base border-border-strong"
                      )}>
                        <div>
                          <span className={clsx("text-sm font-bold", isCurrent ? (levelModal === 'dev' ? "text-accent-blue" : "text-accent-green") : "text-text-main")}>
                            {dynamicTitle || rank.title}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-text-muted">
                          {idx === arr.length - 1 ? `Lv ${prevMax}+` : `Lv ${prevMax}-${rank.max}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                    Log at least {settings.streakTargetHours.toFixed(1)} Hours (Current: {todaysTotalHours.toFixed(1)}h)
                  </span>
                </div>
              </div>

              <div className="bg-bg-base border border-border-subtle rounded-xl p-4">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Fitness Tasks</h3>
                  <span className="text-[10px] uppercase font-bold text-accent-green">
                    {settings.streakFitnessRequirementType === 'count' 
                      ? `Target: ${settings.streakFitnessRequirementValue} Exs` 
                      : settings.streakFitnessRequirementType === 'reps' 
                      ? `Target: ${settings.streakFitnessRequirementValue} Total Reps`
                      : settings.streakFitnessRequirementType === 'xp'
                      ? `Target: ${settings.streakFitnessRequirementValue} XP`
                      : 'Target: All Active'}
                  </span>
                </div>
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
              
              {(!fitnessConditionMet || !habitConditionMet || !hoursConditionMet) ? (
                <p className="text-xs text-accent-red text-center font-medium bg-accent-red-bg py-2 rounded-lg">
                  You must complete these to secure your streak!
                </p>
              ) : (
                <p className="text-xs text-accent-green text-center font-medium bg-accent-green-bg py-2 rounded-lg">
                  All requirements met! Your streak is secured for today.
                </p>
              )}
              
              {/* Streak Freezes Section */}
              <div className="bg-bg-base border border-border-subtle rounded-xl p-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-accent-blue flex items-center gap-2">
                    <Snowflake size={14} /> 
                    Streak Freezes
                  </h3>
                  <div className="flex gap-1">
                    {[1, 2].map((slot) => (
                      <div key={slot} className={clsx("w-3 h-3 rounded-full border", slot <= freezesOwned ? "bg-accent-blue border-accent-blue shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "border-border-strong bg-transparent")}></div>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Earn 1 freeze for every 7 days of perfect streak (Max 2). Freezes automatically protect your streak from resetting if you miss a day.
                </p>
                {freezeUsedToday && (
                  <p className="text-xs text-accent-blue font-medium mt-3 bg-accent-blue/10 py-1.5 px-3 rounded-md text-center">
                    A freeze was used today to protect your streak!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {levelUpData && (
        <LevelUpCelebration
          type={levelUpData.type}
          level={levelUpData.level}
          title={levelUpData.title}
          onClose={() => setLevelUpData(null)}
        />
      )}

      {showWinterArcRules && (
        <div 
          className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" 
          onClick={() => {
            if (isEditingProtocol) {
              if (window.confirm("Discard unsaved changes to your season protocol?")) {
                setIsEditingProtocol(false);
                setShowWinterArcRules(false);
              }
            } else {
              setShowWinterArcRules(false);
            }
          }}
        >
          <div 
            className="bg-bg-surface border border-border-strong rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] flex flex-col" 
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => {
                setIsEditingProtocol(false);
                setShowWinterArcRules(false);
              }} 
              className="absolute top-6 right-6 text-text-muted hover:text-text-main p-1.5 rounded-full hover:bg-bg-base transition-colors"
            >
              <X size={20} />
            </button>
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 mb-6 pr-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-accent-blue/10 text-accent-blue border border-accent-blue/20 shrink-0">
                  <Snowflake size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif text-text-main">
                    {isEditingProtocol ? 'Edit Season Protocol' : `${settings.seasonName}`}
                  </h2>
                  <p className="text-text-muted text-xs tracking-wider uppercase font-medium mt-0.5">
                    {isEditingProtocol ? 'Customize title & goals directly' : 'The protocol for the season'}
                  </p>
                </div>
              </div>

              {!isEditingProtocol && (
                <button
                  type="button"
                  onClick={() => {
                    setEditedSeasonName(settings.seasonName);
                    setEditedRules([...settings.winterArcRules]);
                    setIsEditingProtocol(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-base border border-border-strong hover:border-accent-blue text-xs font-semibold text-text-muted hover:text-text-main rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
                >
                  <Edit2 size={13} className="text-accent-blue" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 space-y-6">
              {isEditingProtocol ? (
                /* EDIT MODE */
                <div className="space-y-5">
                  {/* Season Name Input */}
                  <div>
                    <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1.5">
                      Season / Protocol Title
                    </label>
                    <input 
                      type="text"
                      value={editedSeasonName}
                      onChange={e => setEditedSeasonName(e.target.value)}
                      placeholder="e.g. Winter Arc, Monk Mode, Q4 Sprint"
                      className="w-full bg-bg-base border border-border-strong rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-accent-blue transition-colors"
                    />
                  </div>

                  {/* Preset Quick Selectors */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold tracking-widest uppercase text-text-muted flex items-center gap-1.5">
                        <Sparkles size={12} className="text-accent-yellow" />
                        Quick-Load a Preset:
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {SEASON_PRESETS.map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setEditedSeasonName(preset.name);
                            setEditedRules([...preset.rules]);
                          }}
                          className={clsx(
                            "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                            editedSeasonName === preset.name
                              ? "bg-accent-blue/15 border-accent-blue text-accent-blue font-semibold"
                              : "bg-bg-base border-border-subtle text-text-muted hover:text-text-main hover:border-border-strong"
                          )}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rules / Goals List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold tracking-widest uppercase text-text-muted">
                        Protocol Rules & Goals ({editedRules.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditedRules([])}
                        className="text-[11px] text-accent-red hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {editedRules.map((rule, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 bg-bg-base border border-border-subtle p-2 rounded-xl focus-within:border-accent-blue transition-colors">
                          <span className="text-xs font-bold text-accent-blue w-6 text-center shrink-0">
                            {idx + 1}
                          </span>
                          <input 
                            type="text"
                            value={rule}
                            onChange={e => {
                              const updated = [...editedRules];
                              updated[idx] = e.target.value;
                              setEditedRules(updated);
                            }}
                            placeholder="Describe rule or goal..."
                            className="flex-1 bg-transparent text-sm text-text-main focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setEditedRules(editedRules.filter((_, i) => i !== idx))}
                            className="p-1.5 text-text-muted hover:text-accent-red transition-colors shrink-0 cursor-pointer"
                            title="Delete rule"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditedRules([...editedRules, ''])}
                      className="mt-3 w-full py-2 border border-dashed border-border-strong rounded-xl text-xs font-medium text-accent-blue hover:bg-accent-blue/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} /> Add Another Rule or Goal
                    </button>
                  </div>
                </div>
              ) : (
                /* VIEW & DAILY TRACKING MODE */
                <div className="space-y-4">
                  {/* Daily completion status pill */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-bg-base border border-border-subtle">
                    <span className="text-xs text-text-muted">
                      Click any rule to mark done today:
                    </span>
                    <span className="text-xs font-bold tracking-wide uppercase px-2.5 py-1 rounded-full bg-accent-blue/10 text-accent-blue">
                      {checkedRules.filter(idx => idx < settings.winterArcRules.length).length} / {settings.winterArcRules.length} Done
                    </span>
                  </div>

                  <ul className="space-y-3">
                    {settings.winterArcRules.map((rule, idx) => {
                      const isDone = checkedRules.includes(idx);
                      return (
                        <li 
                          key={idx} 
                          onClick={() => toggleCheckRule(idx)}
                          className={clsx(
                            "flex gap-3.5 items-center p-3 rounded-2xl border transition-all cursor-pointer select-none",
                            isDone 
                              ? "bg-accent-green/10 border-accent-green/30 text-text-main" 
                              : "bg-bg-base border-border-subtle hover:border-border-strong text-text-main"
                          )}
                        >
                          <div className={clsx(
                            "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                            isDone 
                              ? "bg-accent-green text-bg-base shadow-sm" 
                              : "bg-bg-surface border border-border-strong text-text-muted"
                          )}>
                            {isDone ? <Check size={14} /> : (idx + 1)}
                          </div>
                          <span className={clsx("text-sm font-medium flex-1", isDone && "line-through opacity-70")}>
                            {rule}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {isEditingProtocol && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditingProtocol(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-text-muted hover:text-text-main hover:bg-bg-base transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cleanRules = editedRules.map(r => r.trim()).filter(Boolean);
                    const updated = {
                      ...settings,
                      seasonName: editedSeasonName.trim() || 'Winter Arc',
                      winterArcRules: cleanRules.length > 0 ? cleanRules : ['Discipline >> Motivation']
                    };
                    saveSettings(updated);
                    setSettings(updated);
                    setIsEditingProtocol(false);
                  }}
                  className="px-5 py-2 bg-text-main text-bg-base font-medium rounded-xl text-xs hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                >
                  Save Protocol
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {showTodosModal && (
        <div className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowTodosModal(false)}>
          <div className="bg-bg-base border border-border-strong rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-accent-green/10 text-accent-green border border-accent-green/20">
                  <CheckSquare size={18} />
                </div>
                <h2 className="text-xl font-serif text-text-main">
                  Daily Objectives
                </h2>
              </div>
              <button onClick={() => setShowTodosModal(false)} className="text-text-muted hover:text-text-main p-2">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <TodoList date={todayStr} title="Today's Tasks" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
