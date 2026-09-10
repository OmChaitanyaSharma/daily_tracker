import { useEffect } from 'react';
import { LevelUpCelebration } from '../components/LevelUpCelebration';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, LineChart, Flame, Code, Snowflake, Dumbbell, X, Check, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useStreak } from '../hooks/useStreak';
import { useLevelSystem, DEV_RANKS, FIT_RANKS } from '../hooks/useLevelSystem';
import clsx from 'clsx';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getTodayStr } from '../utils/dateUtils';

export function Home() {
  const { streak, freezesOwned, isLoading: streakLoading } = useStreak();
  const { dev, fitness, totalHours, totalReps, isLoading: levelsLoading } = useLevelSystem();
  
  const [levelModal, setLevelModal] = useState<'dev' | 'fit' | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showWinterArcRules, setShowWinterArcRules] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{type: 'dev' | 'fit' | 'streak', level: number, title: string} | null>(null);

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
      if (e.key === 'Escape' || e.key === 'Backspace') {
        if (levelModal !== null || showStreakModal || levelUpData !== null || showWinterArcRules) {
          e.preventDefault();
          e.stopPropagation();
          setLevelModal(null);
          setShowStreakModal(false);
          setLevelUpData(null);
          setShowWinterArcRules(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [levelModal, showStreakModal, levelUpData]);

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
  const hoursConditionMet = todaysTotalHours >= 6.0;

  const pendingExercises = activeExercises.filter(ex => {
    const reps = todaysExerciseLogs.find(l => l.exerciseId === ex.id)?.reps || 0;
    return reps === 0;
  });
  
  const devTitle = dev.title;
  const fitTitle = fitness.title;

  return (
    <div className="max-w-6xl mx-auto pt-4 md:pt-12 pb-24 px-4 animate-fade-in relative">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* 1. Welcome & Date */}
        <div className="md:col-span-8 bg-bg-surface border border-border-strong rounded-[2rem] p-8 md:p-12 flex flex-col justify-center relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Snowflake size={120} />
          </div>
          <button 
            onClick={() => setShowWinterArcRules(true)}
            className="self-start inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-strong bg-bg-base text-text-muted text-xs font-bold tracking-widest uppercase mb-6 shadow-sm hover:border-accent-blue/50 hover:bg-accent-blue/5 transition-colors cursor-pointer z-10"
          >
            <Snowflake size={12} className="text-accent-blue" />
            <span>Winter Arc Active</span>
          </button>
          <h1 className="text-5xl md:text-7xl font-serif text-text-main tracking-tight mt-0 z-10">
            <span className="font-medium text-text-muted">{format(new Date(), 'EEEE')},</span><br />
            {format(new Date(), 'MMMM do')}
          </h1>
        </div>

        {/* 2. Streak Glass Card */}
        <div 
          onClick={() => setShowStreakModal(true)}
          className="md:col-span-4 bg-gradient-to-br from-bg-surface to-bg-base border border-border-strong rounded-[2rem] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent-blue/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] transition-all group shadow-sm"
        >
          <div className="relative mb-4">
            <Flame size={64} className={clsx("transition-all duration-700", streak > 0 ? "text-accent-blue drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110" : "text-text-muted opacity-30 grayscale")} />
          </div>
          <div className="text-5xl font-bold font-mono tracking-tighter text-text-main mb-2">
            {streak} <span className="text-2xl text-text-muted font-serif italic">Days</span>
          </div>
          <div className="text-xs uppercase tracking-widest font-bold text-text-muted group-hover:text-accent-blue transition-colors">
            Current Streak
          </div>
        </div>

        {/* 3. Command Palette Trigger */}
        <div 
          onClick={() => {
            const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
            window.dispatchEvent(e);
          }}
          className="md:col-span-12 bg-bg-surface border border-border-strong rounded-2xl p-4 md:p-6 flex items-center gap-4 cursor-text hover:border-text-muted transition-colors shadow-sm"
        >
          <div className="bg-bg-base p-2 rounded-lg border border-border-subtle">
            <Search size={20} className="text-text-muted" />
          </div>
          <span className="text-text-muted font-mono text-sm md:text-base flex-1">Press <kbd className="bg-bg-base border border-border-subtle px-2 py-1 rounded text-text-main mx-1">Cmd</kbd> + <kbd className="bg-bg-base border border-border-subtle px-2 py-1 rounded text-text-main mx-1">K</kbd> to launch Command Palette...</span>
        </div>

        {/* 4. RPG Stats: Dev */}
        <div 
          onClick={() => setLevelModal('dev')}
          className="md:col-span-6 bg-bg-surface border border-border-strong rounded-[2rem] p-8 cursor-pointer hover:border-accent-blue/50 transition-all group shadow-sm flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-8">
            <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 text-accent-blue flex items-center justify-center border border-accent-blue/20 group-hover:scale-110 transition-transform">
              <Code size={24} />
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Developer Rank</div>
              <div className="text-xl font-serif font-bold text-accent-blue">{devTitle}</div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-end mb-3">
              <span className="text-sm font-mono text-text-muted">Level {dev.level}</span>
              <span className="text-xs font-mono text-text-muted">{totalHours.toFixed(1)} hrs total</span>
            </div>
            <div className="h-2 bg-bg-base rounded-full overflow-hidden border border-border-subtle">
              <div className="h-full bg-accent-blue transition-all duration-1000" style={{ width: `${(dev.level % 10) * 10}%` }} />
            </div>
          </div>
        </div>

        {/* 5. RPG Stats: Fitness */}
        <div 
          onClick={() => setLevelModal('fit')}
          className="md:col-span-6 bg-bg-surface border border-border-strong rounded-[2rem] p-8 cursor-pointer hover:border-accent-green/50 transition-all group shadow-sm flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-8">
            <div className="w-12 h-12 rounded-2xl bg-accent-green-bg text-accent-green flex items-center justify-center border border-accent-green/30 group-hover:scale-110 transition-transform">
              <Dumbbell size={24} />
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Fitness Rank</div>
              <div className="text-xl font-serif font-bold text-accent-green">{fitTitle}</div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-end mb-3">
              <span className="text-sm font-mono text-text-muted">Level {fitness.level}</span>
              <span className="text-xs font-mono text-text-muted">{totalReps} reps total</span>
            </div>
            <div className="h-2 bg-bg-base rounded-full overflow-hidden border border-border-subtle">
              <div className="h-full bg-accent-green transition-all duration-1000" style={{ width: `${(fitness.level % 10) * 10}%` }} />
            </div>
          </div>
        </div>

        {/* 6. Today's Quests */}
        <div className="md:col-span-12 bg-bg-surface border border-border-strong rounded-[2rem] p-8 shadow-sm">
           <div className="flex items-center justify-between mb-8 border-b border-border-subtle pb-6">
              <h2 className="text-2xl font-serif italic text-text-main">Daily Quests</h2>
              <div className="flex gap-2">
                 <Link to="/habits/productivity" className="px-4 py-2 rounded-full bg-bg-base border border-border-strong text-xs font-bold uppercase tracking-widest text-text-muted hover:text-text-main transition-colors">Habits</Link>
                 <Link to="/habits/health" className="px-4 py-2 rounded-full bg-bg-base border border-border-strong text-xs font-bold uppercase tracking-widest text-text-muted hover:text-text-main transition-colors">Fitness</Link>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quest 1: Habits */}
              <div className={clsx("p-6 rounded-2xl border transition-colors", habitConditionMet ? "bg-accent-green-bg/30 border-accent-green/30" : "bg-bg-base border-border-strong")}>
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">Quest I: Protocol</h3>
                 <div className="flex items-center gap-4 mb-4">
                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2", habitConditionMet ? "bg-accent-green-bg text-accent-green border-accent-green" : "border-border-strong text-text-muted")}>
                       {habitConditionMet ? <Check size={20} strokeWidth={3}/> : <CheckSquare size={20}/>}
                    </div>
                    <div className="flex-1">
                       <div className={clsx("text-sm font-bold mb-1", habitConditionMet ? "text-text-muted line-through" : "text-text-main")}>Complete 75% of Habits</div>
                       <div className="text-xs font-mono text-text-muted">{habitScore} / {activeHabits.length} (Need: {Math.ceil(activeHabits.length * 0.75)})</div>
                    </div>
                 </div>
              </div>

              {/* Quest 2: Focus Hours */}
              <div className={clsx("p-6 rounded-2xl border transition-colors", hoursConditionMet ? "bg-accent-green-bg/30 border-accent-green/30" : "bg-bg-base border-border-strong")}>
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">Quest II: Deep Work</h3>
                 <div className="flex items-center gap-4 mb-4">
                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2", hoursConditionMet ? "bg-accent-green-bg text-accent-green border-accent-green" : "border-border-strong text-text-muted")}>
                       {hoursConditionMet ? <Check size={20} strokeWidth={3}/> : <LineChart size={20}/>}
                    </div>
                    <div className="flex-1">
                       <div className={clsx("text-sm font-bold mb-1", hoursConditionMet ? "text-text-muted line-through" : "text-text-main")}>Log 6.0 Focus Hours</div>
                       <div className="text-xs font-mono text-text-muted">{todaysTotalHours.toFixed(1)} / 6.0 hrs</div>
                    </div>
                 </div>
              </div>

              {/* Quest 3: Exercises */}
              <div className={clsx("p-6 rounded-2xl border transition-colors", pendingExercises.length === 0 ? "bg-accent-green-bg/30 border-accent-green/30" : "bg-bg-base border-border-strong")}>
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">Quest III: Physical</h3>
                 <div className="flex items-center gap-4 mb-4">
                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2", pendingExercises.length === 0 ? "bg-accent-green-bg text-accent-green border-accent-green" : "border-border-strong text-text-muted")}>
                       {pendingExercises.length === 0 ? <Check size={20} strokeWidth={3}/> : <Dumbbell size={20}/>}
                    </div>
                    <div className="flex-1">
                       <div className={clsx("text-sm font-bold mb-1", pendingExercises.length === 0 ? "text-text-muted line-through" : "text-text-main")}>Complete Workout</div>
                       <div className="text-xs font-mono text-text-muted">{activeExercises.length - pendingExercises.length} / {activeExercises.length} Exercises</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

      </div>

      {/* MODALS */}
      {showStreakModal && (
        <div className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowStreakModal(false)}>
          <div className="bg-bg-surface border border-border-strong rounded-3xl p-8 max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowStreakModal(false)} className="absolute top-6 right-6 text-text-muted hover:text-text-main">
              <X size={20} />
            </button>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-accent-blue/10 rounded-full flex items-center justify-center mb-6">
                <Flame size={40} className="text-accent-blue" />
              </div>
              <h2 className="text-3xl font-serif text-text-main mb-2">{streak} Days</h2>
              <p className="text-text-muted text-sm mb-8">Maintain your streak by completing your Winter Arc rules every day.</p>
              
              <div className="w-full bg-bg-base rounded-2xl p-4 border border-border-subtle">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-main">Streak Freezes</span>
                  <div className="flex gap-1">
                    {[1, 2].map(slot => (
                      <div key={slot} className={clsx("w-3 h-3 rounded-full border", slot <= freezesOwned ? "bg-accent-blue border-accent-blue" : "border-border-strong")} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-text-muted text-left">
                  Earn 1 freeze for every 7 days of perfect streak (Max 2).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {levelModal && (
        <div className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setLevelModal(null)}>
          <div className="bg-bg-surface border border-border-strong rounded-3xl p-8 max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLevelModal(null)} className="absolute top-6 right-6 text-text-muted hover:text-text-main">
              <X size={20} />
            </button>
            
            <div className="flex flex-col items-center text-center">
              <div className={clsx("w-20 h-20 rounded-full flex items-center justify-center mb-6", levelModal === 'dev' ? "bg-accent-blue/10 text-accent-blue" : "bg-accent-green-bg text-accent-green")}>
                {levelModal === 'dev' ? <Code size={40} /> : <Dumbbell size={40} />}
              </div>
              <h2 className="text-3xl font-serif text-text-main mb-2">
                Level {levelModal === 'dev' ? dev.level : fitness.level}
              </h2>
              <p className="text-text-muted text-sm mb-6">
                {levelModal === 'dev' ? devTitle : fitTitle}
              </p>
              
              <div className="w-full space-y-2">
                {(levelModal === 'dev' ? DEV_RANKS : FIT_RANKS).map((rank, idx, arr) => {
                  const currentLevel = levelModal === 'dev' ? dev.level : fitness.level;
                  const prevMax = idx === 0 ? 1 : arr[idx - 1].max + 1;
                  const isCurrent = currentLevel >= prevMax && currentLevel <= rank.max;
                  const isFuture = currentLevel < prevMax;
                  
                  return (
                    <div key={rank.title} className={clsx(
                      "flex items-center justify-between p-3 rounded-xl border text-left",
                      isCurrent ? (levelModal === 'dev' ? "bg-accent-blue/10 border-accent-blue/50" : "bg-accent-green-bg border-accent-green/50") 
                      : isFuture ? "bg-bg-base border-border-subtle opacity-50" 
                      : "bg-bg-base border-border-strong"
                    )}>
                      <span className={clsx("text-sm font-bold", isCurrent ? (levelModal === 'dev' ? "text-accent-blue" : "text-accent-green") : "text-text-main")}>
                        {rank.title}
                      </span>
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
          <div className="bg-bg-surface border border-border-strong rounded-3xl p-8 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowWinterArcRules(false)} className="absolute top-6 right-6 text-text-muted hover:text-text-main">
              <X size={20} />
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                <Snowflake size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-serif text-text-main">Winter Arc Rules</h2>
                <p className="text-text-muted text-sm">The protocol for the season</p>
              </div>
            </div>
            <ul className="space-y-4 text-sm font-medium">
              {[
                "Wake up at 6 am daily / sleep by 10 pm",
                "Train consistently",
                "Skin care + hair care",
                "Work for over 8 hours daily (coding + skills + study)",
                "Discipline >> Motivation",
                "Less social media, more books",
                "Count every calorie you eat"
              ].map((rule, idx) => (
                <li key={idx} className="flex gap-4 items-center bg-bg-base border border-border-subtle p-3 rounded-xl">
                  <span className="text-accent-blue font-bold opacity-80 w-4 text-center">{idx + 1}</span>
                  <span className="text-text-main">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
