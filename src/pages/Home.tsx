import { useEffect } from 'react';
import { LevelUpCelebration } from '../components/LevelUpCelebration';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PenTool, CheckSquare, Target, LineChart, Flame, Code, Snowflake, Dumbbell, X, Check, Clock, Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import { TodoList } from '../components/TodoList';
import { format } from 'date-fns';
import { useStreak } from '../hooks/useStreak';
import { calculateFitnessXPForLogs } from '../hooks/useLevelSystem';
import { useLevelSystem, DEFAULT_DEV_RANKS, DEFAULT_FIT_RANKS } from '../hooks/useLevelSystem';
import { getSettings } from '../utils/settings';
import clsx from 'clsx';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getTodayStr } from '../utils/dateUtils';

import { useSound } from '../hooks/useSound';

export function Home() {
  const { playSuccess } = useSound();
  const { streak, freezesOwned, freezeUsedToday, isLoading: streakLoading } = useStreak();
  const { dev, fitness, totalHours, totalReps, isLoading: levelsLoading } = useLevelSystem();
  
  const todayStr = getTodayStr();
  const [levelModal, setLevelModal] = useState<'dev' | 'fit' | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showWinterArcRules, setShowWinterArcRules] = useState(false);
  const [showTodosModal, setShowTodosModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{type: 'dev' | 'fit' | 'streak', level: number, title: string} | null>(null);
  
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
      setLevelUpData({ type: 'dev', level: dev.level, title: dev.title });
      localStorage.setItem('v3_ack_dev_level', dev.level.toString());
    }
  }, [dev.level, dev.title, levelsLoading]);

  useEffect(() => {
    if (levelsLoading) return;
    
    const stored = parseInt(localStorage.getItem('v3_ack_fit_level') || '0', 10);
    if (stored === 0) {
      localStorage.setItem('v3_ack_fit_level', fitness.level.toString());
    } else if (fitness.level > stored) {
      setLevelUpData({ type: 'fit', level: fitness.level, title: fitness.title });
      localStorage.setItem('v3_ack_fit_level', fitness.level.toString());
    }
  }, [fitness.level, fitness.title, levelsLoading]);

  useEffect(() => {
    if (streakLoading) return;
    
    const stored = parseInt(localStorage.getItem('v3_ack_streak') || '0', 10);
    if (stored === 0) {
      localStorage.setItem('v3_ack_streak', streak.toString());
    } else if (streak > stored && streak > 0 && streak % 7 === 0) {
      setLevelUpData({ type: 'streak', level: streak, title: 'Streak Milestone' });
      localStorage.setItem('v3_ack_streak', streak.toString());
    } else if (streak > stored) {
      localStorage.setItem('v3_ack_streak', streak.toString());
    }
  }, [streak, streakLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (document.activeElement?.tagName || '').toUpperCase();
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag) || (document.activeElement as HTMLElement)?.isContentEditable;
      if (e.key.toLowerCase() === 'escape' || (e.key.toLowerCase() === 'backspace' && !isInput)) {
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
  const hourCategories = useLiveQuery(() => db.hourCategories.toArray()) || [];

  const [quickHours, setQuickHours] = useState('1');
  const [quickCat, setQuickCat] = useState('');
  const [quickLogSuccess, setQuickLogSuccess] = useState(false);

  const handleQuickLog = async (hoursToAdd?: number) => {
    const val = hoursToAdd !== undefined ? hoursToAdd : parseFloat(quickHours);
    if (isNaN(val) || val <= 0) return;
    const activeCats = hourCategories.filter(c => !c.archived);
    const catName = quickCat || (activeCats[0]?.name || 'Deep Work');
    await db.hourLogs.add({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      date: todayStr,
      activity: catName,
      hours: val
    });
    playSuccess();
    setQuickLogSuccess(true);
    setTimeout(() => setQuickLogSuccess(false), 2200);
  };

  const handleSeedStarterHabits = async () => {
    const now = new Date().toISOString();
    await db.habits.bulkAdd([
      { id: crypto.randomUUID ? crypto.randomUUID() : 'sw_h1', name: 'Deep Work (2h)', frequencyType: 'daily', priority: 1, startDate: todayStr, archived: false, createdAt: now },
      { id: crypto.randomUUID ? crypto.randomUUID() : 'sw_h2', name: 'Read 20 Pages', frequencyType: 'daily', priority: 2, startDate: todayStr, archived: false, createdAt: now },
      { id: crypto.randomUUID ? crypto.randomUUID() : 'sw_h3', name: 'Daily Workout', frequencyType: 'daily', priority: 1, startDate: todayStr, archived: false, createdAt: now },
      { id: crypto.randomUUID ? crypto.randomUUID() : 'sw_h4', name: 'Hydration (3L)', frequencyType: 'daily', priority: 2, startDate: todayStr, archived: false, createdAt: now }
    ]);
  };
  
  let habitScore = 0;
  todaysHabitLogs.forEach(log => {
    if (log.status === 'completed') habitScore += 1.0;
    else if (log.status === 'partial') habitScore += 0.5;
  });
  const settings = getSettings();
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
            onClick={() => setShowWinterArcRules(true)}
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
        <h1 className="text-4xl md:text-6xl font-serif text-text-main tracking-tight mt-0">
          <span className="marker-highlight font-medium">{format(new Date(), 'EEEE')}</span>, <br className="md:hidden"/> {format(new Date(), 'MMMM do')}
        </h1>
        <p className="text-text-muted uppercase tracking-[0.2em] text-sm font-medium">
          Daily execution & progress
        </p>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 animate-slide-up">
          <button 
            onClick={() => setShowStreakModal(true)}
            className={clsx(
              "flex items-center gap-2 px-4 sm:px-5 py-2.5 min-h-[44px] rounded-full border text-sm font-semibold tracking-widest uppercase shadow-sm transition-all duration-300 cursor-pointer hover:border-accent-yellow relative tap-press",
              streak > 0 && "animate-streak-pulse",
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

          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-4 w-full sm:w-auto">
            <button onClick={() => setLevelModal('dev')} className="flex-1 sm:flex-none min-h-[44px] flex items-center gap-3 px-4 sm:px-5 py-2.5 rounded-full border border-border-strong bg-bg-surface shadow-sm hover:border-accent-blue transition-colors cursor-pointer text-left tap-press">
              <Code size={18} className="text-accent-blue shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-text-muted leading-none">Dev Lvl {dev.level}</span>
                <div className="w-16 sm:w-20 h-1.5 bg-border-strong rounded-full mt-1 overflow-hidden shimmer-sweep">
                  <div className="h-full bg-accent-blue transition-all duration-1000" style={{ width: `${dev.progress}%` }} />
                </div>
              </div>
            </button>

            <button onClick={() => setLevelModal('fit')} className="flex-1 sm:flex-none min-h-[44px] flex items-center gap-3 px-4 sm:px-5 py-2.5 rounded-full border border-border-strong bg-bg-surface shadow-sm hover:border-accent-green transition-colors cursor-pointer text-left tap-press">
              <Dumbbell size={18} className="text-accent-green shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-text-muted leading-none">Fit Lvl {fitness.level}</span>
                <div className="w-16 sm:w-20 h-1.5 bg-border-strong rounded-full mt-1 overflow-hidden shimmer-sweep">
                  <div className="h-full bg-accent-green transition-all duration-1000" style={{ width: `${fitness.progress}%` }} />
                </div>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Cold Start Starter Habits Prompt */}
      {activeHabits.length === 0 && (
        <div className="my-8 p-6 bg-gradient-to-r from-accent-blue/10 via-bg-surface to-accent-purple/10 border border-border-strong rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent-blue/20 text-accent-blue flex items-center justify-center shrink-0">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-lg font-serif font-semibold text-text-main">Welcome to Daily Tracker OS</h3>
              <p className="text-sm text-text-muted mt-0.5">Initialize your dashboard with core habits or create custom routines.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleSeedStarterHabits}
              className="min-h-[44px] px-4 py-2 bg-text-main text-bg-base font-semibold text-xs rounded-xl hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2 tap-press"
            >
              <Plus size={14} />
              <span>Load Starter Habits</span>
            </button>
            <Link
              to="/habits/productivity"
              className="min-h-[44px] px-4 py-2 bg-bg-surface border border-border-strong text-text-main font-semibold text-xs rounded-xl hover:bg-bg-surface/80 transition-colors inline-flex items-center tap-press"
            >
              Custom
            </Link>
          </div>
        </div>
      )}

      {/* 2-Click Quick Work Logger Widget */}
      <div className="my-8 p-4 sm:p-5 bg-bg-surface border border-border-subtle rounded-3xl shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent-blue/15 text-accent-blue flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">Quick Work Log</span>
              {quickLogSuccess && (
                <span className="text-[11px] text-accent-green font-medium flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 size={12} /> Logged!
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-text-main mt-0.5">
              Today: <span className="font-mono font-semibold text-accent-blue">{todaysTotalHours}h</span>
              <span className="text-text-muted font-normal text-xs ml-1">/ {settings.streakTargetHours}h target</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hourCategories.filter(c => !c.archived).length > 0 && (
            <select
              value={quickCat}
              onChange={e => setQuickCat(e.target.value)}
              id="quick-log-category"
              aria-label="Select study category for quick log"
              className="bg-bg-base border border-border-strong rounded-xl px-3 py-2 min-h-[44px] text-base sm:text-xs text-text-main outline-none focus:border-text-muted cursor-pointer"
            >
              {hourCategories.filter(c => !c.archived).map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickLog(0.5)}
              aria-label="Quick log 0.5 hours"
              className="min-h-[44px] px-3 py-2 bg-bg-base border border-border-subtle hover:border-text-muted rounded-xl text-xs font-mono font-semibold text-text-main transition-colors cursor-pointer tap-press"
            >
              +0.5h
            </button>
            <button
              type="button"
              onClick={() => handleQuickLog(1)}
              aria-label="Quick log 1.0 hour"
              className="min-h-[44px] px-3 py-2 bg-bg-base border border-border-subtle hover:border-text-muted rounded-xl text-xs font-mono font-semibold text-text-main transition-colors cursor-pointer tap-press"
            >
              +1.0h
            </button>
            <button
              type="button"
              onClick={() => handleQuickLog(2)}
              aria-label="Quick log 2.0 hours"
              className="min-h-[44px] px-3 py-2 bg-bg-base border border-border-subtle hover:border-text-muted rounded-xl text-xs font-mono font-semibold text-text-main transition-colors cursor-pointer tap-press"
            >
              +2.0h
            </button>
          </div>

          <div className="flex items-center gap-1.5 pl-1 border-l border-border-subtle">
            <input
              type="number"
              step="0.5"
              min="0.25"
              max="24"
              value={quickHours}
              onChange={e => setQuickHours(e.target.value)}
              placeholder="Hrs"
              id="quick-log-hours"
              aria-label="Custom hours for quick log"
              className="w-16 min-h-[44px] bg-bg-base border border-border-strong rounded-xl px-2 py-2 text-base sm:text-xs text-text-main font-mono text-center outline-none focus:border-text-muted"
            />
            <button
              type="button"
              onClick={() => handleQuickLog()}
              aria-label="Log custom hours"
              className="min-h-[44px] px-4 py-2 bg-text-main text-bg-base rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shrink-0 tap-press"
            >
              Log
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        
        <Link to="/highlight" className="group hover-lift tap-press p-6 sm:p-10 rounded-3xl bg-bg-surface border border-border-subtle flex flex-col items-center text-center gap-5 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent-red-bg text-accent-red flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
            <PenTool size={28} className="sm:hidden" strokeWidth={1.5} />
            <PenTool size={32} className="hidden sm:block" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-medium text-text-main mb-2 sm:mb-3">Highlight of the Day</h2>
            <p className="text-text-muted text-xs sm:text-sm leading-relaxed max-w-[250px] mx-auto">
              Capture the day's key wins, lessons, and mood.
            </p>
          </div>
        </Link>

        <Link to="/habits" className="group hover-lift tap-press p-6 sm:p-10 rounded-3xl bg-bg-surface border border-border-subtle flex flex-col items-center text-center gap-5 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent-green-bg text-accent-green flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
            <CheckSquare size={28} className="sm:hidden" strokeWidth={1.5} />
            <CheckSquare size={32} className="hidden sm:block" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-medium text-text-main mb-2 sm:mb-3">Habits</h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed max-w-[250px] mx-auto">
              Daily consistency matrix, exercise counts, and monthly heatmaps.
            </p>
          </div>
        </Link>

        <Link to="/goals" className="group hover-lift tap-press p-6 sm:p-10 rounded-3xl bg-bg-surface border border-border-subtle flex flex-col items-center text-center gap-5 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent-yellow-bg text-accent-yellow flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
            <Target size={28} className="sm:hidden" strokeWidth={1.5} />
            <Target size={32} className="hidden sm:block" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-medium text-text-main mb-2 sm:mb-3">Goals</h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed max-w-[250px] mx-auto">
              Target milestones, body metrics, and season objectives.
            </p>
          </div>
        </Link>

        <Link to="/logs" className="group hover-lift tap-press p-6 sm:p-10 rounded-3xl bg-bg-surface border border-border-subtle flex flex-col items-center text-center gap-5 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent-blue-bg text-accent-blue flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
            <LineChart size={28} className="sm:hidden" strokeWidth={1.5} />
            <LineChart size={32} className="hidden sm:block" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-medium text-text-main mb-2 sm:mb-3">Logs</h2>
            <p className="text-text-muted text-xs sm:text-sm leading-relaxed max-w-[250px] mx-auto">
              Historical review, monthly calendars, and weekly digests.
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
          <div className="bg-bg-surface border border-border-strong rounded-3xl p-8 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="level-modal-title">
            <button onClick={() => setLevelModal(null)} className="absolute top-4 sm:top-6 right-4 sm:right-6 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main rounded-full hover:bg-bg-base/60 transition-colors cursor-pointer tap-press" aria-label="Close modal">
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className={clsx("w-14 h-14 rounded-full flex items-center justify-center", levelModal === 'dev' ? "bg-accent-blue-bg text-accent-blue" : "bg-accent-green-bg text-accent-green")}>
                {levelModal === 'dev' ? <Code size={24} /> : <Dumbbell size={24} />}
              </div>
              <div>
                <h2 id="level-modal-title" className="text-2xl font-serif text-text-main">
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
          <div className="bg-bg-surface border border-border-strong rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative max-h-[88vh] flex flex-col" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="streak-requirements-title">
            <button onClick={() => setShowStreakModal(false)} className="absolute top-4 sm:top-5 right-4 sm:right-5 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main rounded-full hover:bg-bg-base/60 transition-colors cursor-pointer tap-press" aria-label="Close modal">
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-4 mb-5 shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-accent-yellow-bg text-accent-yellow shrink-0">
                <Flame size={24} />
              </div>
              <div>
                <h2 id="streak-requirements-title" className="text-xl sm:text-2xl font-serif text-text-main">
                  Daily Requirements
                </h2>
                <p className="text-text-muted text-xs sm:text-sm">
                  Requirements to secure your daily streak
                </p>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-5 overflow-y-auto pr-1">
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
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Fitness Tasks</h3>
                    {activeExercises.length > 0 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-bg-surface border border-border-subtle text-text-muted">
                        {activeExercises.length - pendingExercises.length}/{activeExercises.length}
                      </span>
                    )}
                  </div>
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
                  <div className="max-h-48 overflow-y-auto pr-2 space-y-2.5">
                    {activeExercises.map(ex => {
                      const isPending = pendingExercises.some(p => p.id === ex.id);
                      return (
                        <div key={ex.id} className="flex items-center gap-2.5 py-0.5">
                          {!isPending ? (
                            <div className="w-5 h-5 rounded-full bg-accent-green-bg text-accent-green flex items-center justify-center shrink-0">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-border-strong shrink-0"></div>
                          )}
                          <span className={clsx("text-xs sm:text-sm truncate", !isPending ? "text-text-muted line-through" : "text-text-main font-medium")}>
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
        <div className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowWinterArcRules(false)}>
          <div className="bg-bg-surface border border-border-strong rounded-3xl p-8 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="winter-arc-rules-title">
            <button onClick={() => setShowWinterArcRules(false)} className="absolute top-4 sm:top-6 right-4 sm:right-6 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main rounded-full hover:bg-bg-base/60 transition-colors cursor-pointer tap-press" aria-label="Close modal">
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                <Snowflake size={24} />
              </div>
              <div>
                <h2 id="winter-arc-rules-title" className="text-2xl font-serif text-text-main">
                  {settings.seasonName} Rules
                </h2>
                <p className="text-text-muted text-sm">
                  Core operating rules for the season
                </p>
              </div>
            </div>

            <ul className="space-y-4 text-sm font-medium">
              {settings.winterArcRules.map((rule, idx) => (
                <li key={idx} className="flex gap-4 items-center bg-bg-base border border-border-subtle p-3 rounded-xl">
                  <span className="text-accent-blue font-bold opacity-80 w-4 text-center">{idx + 1}</span>
                  <span className="text-text-main">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {showTodosModal && (
        <div className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowTodosModal(false)}>
          <div className="bg-bg-base border border-border-strong rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="todos-modal-title">
            <div className="p-4 sm:p-6 border-b border-border-subtle flex justify-between items-center bg-bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-accent-green/10 text-accent-green border border-accent-green/20">
                  <CheckSquare size={18} />
                </div>
                <h2 id="todos-modal-title" className="text-xl font-serif text-text-main">
                  Daily Objectives
                </h2>
              </div>
              <button onClick={() => setShowTodosModal(false)} className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main rounded-full hover:bg-bg-base/60 transition-colors cursor-pointer tap-press" aria-label="Close modal">
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
