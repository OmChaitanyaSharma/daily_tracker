const EMPTY_ARRAY: any[] = [];
import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Exercise, type ExerciseDifficulty, type TrackingType } from '../db';
import { format, subDays, addDays, isFuture, parseISO, isBefore, getDay } from 'date-fns';
import { getTodayStr, getMinDateStr } from '../utils/dateUtils';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Dumbbell, 
  Trash2, 
  Edit2, 
  Flame, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  RotateCcw,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useExerciseStreak } from '../hooks/useExerciseStreak';
import clsx from 'clsx';
import { RestDayPlanner } from '../components/RestDayPlanner';
import { useSound } from '../hooks/useSound';
import { auth } from '../firebase';
import { deleteDocumentFromCloud } from '../services/cloudSync';
import { seedWorkoutRoutine, ensureWorkoutSequenceExact, DIFFICULTY_POINTS, DIFFICULTY_LABELS } from '../utils/exerciseSync';
import { isRestDayOfWeek } from '../utils/scheduleDefaults';

export function ExerciseTracking() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const todayStr = getTodayStr();

  // Auto-sync sequence: ensure obsolete exercises are removed and 10 drills are loaded in exact order
  useEffect(() => {
    ensureWorkoutSequenceExact().catch(console.error);
  }, []);

  const currentDayOfWeek = useMemo(() => getDay(currentDate), [currentDate]);
  const isRestDay = useMemo(() => isRestDayOfWeek(currentDayOfWeek), [currentDayOfWeek]);

  const [newExerciseName, setNewExerciseName] = useState('');
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExerciseDiff, setNewExerciseDiff] = useState<ExerciseDifficulty>('medium');
  const [newExerciseType, setNewExerciseType] = useState<TrackingType>('reps');
  const [newExerciseSets, setNewExerciseSets] = useState<number>(3);
  const [newExerciseReps, setNewExerciseReps] = useState<string>('10 reps');
  
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editName, setEditName] = useState('');
  const [editDiff, setEditDiff] = useState<ExerciseDifficulty>('medium');
  const [editType, setEditType] = useState<TrackingType>('reps');
  const [editSets, setEditSets] = useState<number>(3);
  const [editReps, setEditReps] = useState<string>('10 reps');

  const { playClick, playFanfare, playThump } = useSound();

  const exercises = useLiveQuery(() => db.exercises.toArray()) ?? EMPTY_ARRAY;
  const exerciseLogs = useLiveQuery(() => db.exerciseLogs.where('date').equals(dateStr).toArray()) ?? EMPTY_ARRAY;
  const allExerciseLogs = useLiveQuery(() => db.exerciseLogs.toArray()) ?? EMPTY_ARRAY;
  
  // Calculate PRs (max reps in a single day for each exercise)
  const personalRecords = useMemo(() => {
    const prs: Record<string, number> = {};
    allExerciseLogs.forEach(log => {
      if (log.date !== dateStr) {
        if (!prs[log.exerciseId] || log.reps > prs[log.exerciseId]) {
          prs[log.exerciseId] = log.reps;
        }
      }
    });
    return prs;
  }, [allExerciseLogs, dateStr]);

  const activeExercises = useMemo(() => {
    const list = exercises.filter(ex => !ex.archived);
    return list.sort((a, b) => (a.order || 999) - (b.order || 999));
  }, [exercises]);

  const streak = useExerciseStreak();

  const handlePrevDay = () => {
    setCurrentDate(prev => {
      const prevDay = subDays(prev, 1);
      const minDate = parseISO(getMinDateStr() + "T00:00:00");
      if (isBefore(prevDay, minDate)) return prev;
      return prevDay;
    });
  };
  const handleNextDay = () => {
    if (!isFuture(addDays(currentDate, 1))) {
      setCurrentDate(prev => addDays(prev, 1));
    }
  };
  const handleToday = () => setCurrentDate(new Date());

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExerciseName.trim()) return;
    await db.exercises.add({
      id: crypto.randomUUID(),
      name: newExerciseName.trim(),
      createdAt: new Date().toISOString(),
      archived: false,
      difficulty: newExerciseDiff,
      trackingType: newExerciseType,
      targetSets: newExerciseSets,
      targetReps: newExerciseReps,
      targetRepsNumeric: parseInt(newExerciseReps) || 10,
      order: activeExercises.length + 1
    });
    setNewExerciseName('');
    setNewExerciseDiff('medium');
    setNewExerciseType('reps');
    setNewExerciseSets(3);
    setNewExerciseReps('10 reps');
    setIsAddingExercise(false);
    playClick();
  };

  const handleEditExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExercise || !editName.trim()) return;
    await db.exercises.update(editingExercise.id, { 
      name: editName.trim(),
      difficulty: editDiff,
      trackingType: editType,
      targetSets: editSets,
      targetReps: editReps,
      targetRepsNumeric: parseInt(editReps) || 10
    });
    setEditingExercise(null);
    setEditName('');
    playClick();
  };

  const handleArchiveExercise = async (ex: Exercise) => {
    if (confirm(`Archive ${ex.name}? It won't break your past streaks, but will be removed from your daily list.`)) {
      await db.exercises.update(ex.id, { archived: true });
      playThump();
    }
  };

  const handleResetToDefaultRoutine = async () => {
    if (confirm("Reset exercise library to the official 10 'Train Like You're 16' routine?")) {
      await seedWorkoutRoutine(true);
      playFanfare();
    }
  };

  // Toggle specific set completion
  const handleToggleSet = async (ex: Exercise, setNum: number) => {
    const existingLog = exerciseLogs.find(l => l.exerciseId === ex.id);
    const targetSets = ex.targetSets || 3;
    const repsPerSet = ex.targetRepsNumeric || 10;

    let currentSets = existingLog?.sets || 0;
    let currentReps = existingLog?.reps || 0;

    let newSets: number;
    let newReps: number;

    if (setNum <= currentSets) {
      // Uncheck down to setNum - 1
      newSets = Math.max(0, setNum - 1);
      newReps = Math.max(0, currentReps - repsPerSet);
      playThump();
    } else {
      // Mark up to setNum
      newSets = setNum;
      const setsAdded = newSets - currentSets;
      newReps = currentReps + (setsAdded * repsPerSet);
      if (newSets >= targetSets) {
        playFanfare();
      } else {
        playClick();
      }
    }

    if (existingLog) {
      if (newSets === 0 && newReps === 0) {
        await db.exerciseLogs.delete(existingLog.id);
        if (auth.currentUser) {
          deleteDocumentFromCloud(auth.currentUser.uid, 'exerciseLogs', existingLog.id).catch(() => {});
        }
      } else {
        await db.exerciseLogs.update(existingLog.id, { sets: newSets, reps: newReps });
      }
    } else if (newSets > 0 || newReps > 0) {
      await db.exerciseLogs.add({
        id: crypto.randomUUID(),
        date: dateStr,
        exerciseId: ex.id,
        sets: newSets,
        reps: newReps
      });
    }
  };

  // Incremental set adjuster (+1 or -1 set)
  const handleAdjustSets = async (ex: Exercise, delta: number) => {
    const existingLog = exerciseLogs.find(l => l.exerciseId === ex.id);
    const targetSets = ex.targetSets || 3;
    const repsPerSet = ex.targetRepsNumeric || 10;

    const currentSets = existingLog?.sets || 0;
    const currentReps = existingLog?.reps || 0;

    const newSets = Math.max(0, currentSets + delta);
    const newReps = Math.max(0, currentReps + (delta * repsPerSet));

    if (existingLog) {
      if (newSets === 0 && newReps === 0) {
        await db.exerciseLogs.delete(existingLog.id);
        if (auth.currentUser) {
          deleteDocumentFromCloud(auth.currentUser.uid, 'exerciseLogs', existingLog.id).catch(() => {});
        }
      } else {
        await db.exerciseLogs.update(existingLog.id, { sets: newSets, reps: newReps });
      }
    } else if (newSets > 0 || newReps > 0) {
      await db.exerciseLogs.add({
        id: crypto.randomUUID(),
        date: dateStr,
        exerciseId: ex.id,
        sets: newSets,
        reps: newReps
      });
    }

    if (delta > 0) {
      if (newSets >= targetSets) playFanfare();
      else playClick();
    } else {
      playThump();
    }
  };

  // Delta adjustment for reps
  const updateReps = async (exerciseId: string, delta: number) => {
    let newReps = delta;
    const existingLog = exerciseLogs.find(l => l.exerciseId === exerciseId);
    
    if (existingLog) {
      newReps = Math.max(0, existingLog.reps + delta);
      if (newReps === 0 && (!existingLog.sets || existingLog.sets === 0)) {
        await db.exerciseLogs.delete(existingLog.id);
        if (auth.currentUser) {
          deleteDocumentFromCloud(auth.currentUser.uid, 'exerciseLogs', existingLog.id).catch(() => {});
        }
      } else {
        await db.exerciseLogs.update(existingLog.id, { reps: newReps });
      }
    } else if (delta > 0) {
      await db.exerciseLogs.add({
        id: crypto.randomUUID(),
        date: dateStr,
        exerciseId,
        reps: delta,
        sets: 0
      });
    }

    if (delta > 0) {
      const pr = personalRecords[exerciseId] || 0;
      if (pr > 0 && newReps > pr) {
        playFanfare();
      } else {
        playClick();
      }
    } else {
      playThump();
    }
  };

  const setExactReps = async (exerciseId: string, reps: number) => {
    const existingLog = exerciseLogs.find(l => l.exerciseId === exerciseId);
    if (existingLog) {
      if (reps <= 0 && (!existingLog.sets || existingLog.sets === 0)) {
        await db.exerciseLogs.delete(existingLog.id);
        if (auth.currentUser) {
          deleteDocumentFromCloud(auth.currentUser.uid, 'exerciseLogs', existingLog.id).catch(() => {});
        }
      } else {
        await db.exerciseLogs.update(existingLog.id, { reps });
      }
    } else if (reps > 0) {
      await db.exerciseLogs.add({
        id: crypto.randomUUID(),
        date: dateStr,
        exerciseId,
        reps,
        sets: 0
      });
    }
    playClick();
  };

  // Total daily score accumulated from exercises
  const totalDailyScore = useMemo(() => {
    return activeExercises.reduce((sum, ex) => {
      const log = exerciseLogs.find(l => l.exerciseId === ex.id);
      if (!log || log.reps === 0) return sum;
      const diff = (ex.difficulty || 'medium') as ExerciseDifficulty;
      const pts = DIFFICULTY_POINTS[diff] || 10;
      if (ex.trackingType === 'time') {
        // Minutes of cardio: score scaled by minutes
        return sum + Math.round((log.reps / 60) * pts);
      }
      // Reps: score granted based on sets completed or volume
      const targetReps = ex.targetRepsNumeric || 10;
      const setsDone = log.sets || Math.floor(log.reps / targetReps);
      return sum + (setsDone * pts);
    }, 0);
  }, [activeExercises, exerciseLogs]);

  // Group exercises by category
  const groupedExercises = useMemo(() => {
    const groups: { category: string; items: Exercise[] }[] = [];
    activeExercises.forEach(ex => {
      const cat = ex.category || 'General Routine';
      let group = groups.find(g => g.category === cat);
      if (!group) {
        group = { category: cat, items: [] };
        groups.push(group);
      }
      group.items.push(ex);
    });
    return groups;
  }, [activeExercises]);

  const difficultyBadgeColors: Record<ExerciseDifficulty, string> = {
    very_easy: 'bg-border-strong text-text-muted',
    easy: 'bg-accent-green-bg text-accent-green border-accent-green/20',
    medium: 'bg-accent-yellow-bg text-accent-yellow border-accent-yellow/20',
    hard: 'bg-accent-red-bg text-accent-red border-accent-red/20',
    very_hard: 'bg-text-main text-bg-base'
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 animate-fade-in relative space-y-6 sm:space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-subtle pb-6 mb-6 gap-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link 
            to="/habits" 
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main transition-colors rounded-full hover:bg-bg-surface tap-press cursor-pointer" 
            aria-label="Go back to habits"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-serif italic text-text-main font-semibold">
                Workout & Exercise Tracker
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-text-muted mt-1">
              "Train Like You're 16" daily impact, posture, and decompression protocol
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {totalDailyScore > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-blue/15 border border-accent-blue/30 text-accent-blue text-xs font-mono font-bold">
              <Sparkles size={13} />
              <span>+{totalDailyScore} Workout Marks</span>
            </div>
          )}

          {streak > 0 && (
            <div className="flex items-center gap-2 bg-accent-orange/10 border border-accent-orange/20 text-accent-orange px-4 py-2 min-h-[44px] rounded-full animate-fade-in">
              <Flame size={18} className="animate-pulse" />
              <span className="text-sm font-bold">{streak} Day Streak!</span>
            </div>
          )}
        </div>
      </header>

      {/* Rest Day Indicator Banner (Tuesday & Thursday) */}
      {isRestDay && (
        <div className="p-4 sm:p-5 rounded-3xl bg-accent-blue/10 border border-accent-blue/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 animate-fade-in shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-accent-blue/20 text-accent-blue shrink-0 mt-0.5 sm:mt-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-serif font-semibold text-text-main">
                  Rest & Active Recovery Day ({format(currentDate, 'EEEE')})
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue font-mono text-[9px] uppercase font-bold tracking-wider">
                  Rest Day
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Tuesday and Thursday are designated rest days. No heavy impact or workout exercises required today. Keep moving with your 10,000 steps walk and gentle spinal decompression. Rest days preserve your streak!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Rest Schedule Hub */}
      <RestDayPlanner />

      {/* Date Navigator */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-1 sm:gap-4 bg-bg-surface border border-border-strong rounded-full p-1 shadow-sm">
          <button 
            onClick={handlePrevDay}
            disabled={isBefore(subDays(currentDate, 1), parseISO(getMinDateStr() + "T00:00:00"))}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-surface-hover rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed tap-press cursor-pointer"
            aria-label="Previous day"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button 
            onClick={handleToday}
            aria-label={dateStr === todayStr ? "Current date: Today" : "Jump to today's date"}
            className={clsx(
              "min-h-[44px] px-4 py-2 rounded-full text-sm font-medium transition-colors tap-press cursor-pointer",
              dateStr === todayStr 
                ? "bg-text-main text-bg-base font-semibold shadow-sm" 
                : "text-text-main hover:bg-bg-surface-hover"
            )}
          >
            {dateStr === todayStr ? 'Today' : format(currentDate, 'EEE, MMM d, yyyy')}
          </button>

          <button 
            onClick={handleNextDay}
            disabled={isFuture(addDays(currentDate, 1))}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-surface-hover rounded-full transition-colors disabled:opacity-50 tap-press cursor-pointer"
            aria-label="Next day"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Quick Reset to Default Protocol */}
        <button
          onClick={handleResetToDefaultRoutine}
          className="text-xs font-mono text-text-muted hover:text-text-main flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-bg-surface border border-transparent hover:border-border-subtle transition-all tap-press cursor-pointer"
          title="Reset to 10 'Train Like You're 16' exercises"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Reset Routine</span>
        </button>
      </div>

      {/* Grouped Exercise List */}
      <div className="space-y-8">
        {activeExercises.length === 0 ? (
          <div className="bg-bg-surface border border-border-subtle rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center">
            <Dumbbell size={48} className="text-border-strong mb-4" />
            <p className="text-text-muted">No exercises configured yet.</p>
            <button 
              onClick={handleResetToDefaultRoutine}
              className="mt-6 bg-text-main text-bg-base min-h-[44px] px-6 py-2.5 rounded-full text-sm font-semibold tap-press cursor-pointer shadow-sm hover:opacity-90"
            >
              Load 10 "Train Like You're 16" Exercises
            </button>
          </div>
        ) : (
          groupedExercises.map(group => (
            <div key={group.category} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-text-muted">
                  {group.category}
                </h2>
                <span className="text-[11px] font-mono text-text-muted opacity-70">
                  {group.items.length} drills
                </span>
              </div>

              <div className="space-y-4">
                {group.items.map(ex => {
                  const log = exerciseLogs.find(l => l.exerciseId === ex.id);
                  const reps = log?.reps || 0;
                  const completedSets = log?.sets || 0;
                  const isTime = ex.trackingType === 'time';
                  const targetSets = ex.targetSets || 3;
                  const targetRepsDesc = ex.targetReps || `${targetSets} sets`;
                  const restTimeDesc = ex.restTime || '—';

                  const diffKey = (ex.difficulty || 'medium') as ExerciseDifficulty;
                  const diffPoints = DIFFICULTY_POINTS[diffKey] || 10;
                  const diffLabel = DIFFICULTY_LABELS[diffKey] || 'Medium';
                  const diffClass = difficultyBadgeColors[diffKey] || 'bg-border-strong text-text-muted';

                  const isComplete = completedSets >= targetSets && targetSets > 0;

                  return (
                    <div 
                      key={ex.id} 
                      className={clsx(
                        "bg-bg-surface border rounded-3xl p-5 sm:p-7 transition-all space-y-4 shadow-sm",
                        isComplete 
                          ? "border-accent-green/40 bg-accent-green/5" 
                          : "border-border-subtle hover:border-border-strong"
                      )}
                    >
                      {/* Top Info Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-text-muted opacity-60">
                              #{ex.order || '•'}
                            </span>
                            <h3 className="text-lg sm:text-xl font-serif text-text-main font-semibold">
                              {ex.name}
                            </h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${diffClass}`}>
                              {diffLabel} • {diffPoints} pts / {isTime ? 'min' : 'set'}
                            </span>
                            {isTime && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-accent-blue/15 text-accent-blue">
                                Time Based
                              </span>
                            )}
                            {personalRecords[ex.id] > 0 && reps > personalRecords[ex.id] && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-red/20 text-accent-red animate-pulse">
                                🔥 New PR
                              </span>
                            )}
                          </div>

                          {/* Target Sets & Rest */}
                          <div className="flex items-center gap-3 text-xs text-text-muted font-medium">
                            <span className="font-mono text-text-main">Target: {targetRepsDesc}</span>
                            <span className="opacity-40">•</span>
                            <span className="font-mono">Rest: {restTimeDesc}</span>
                          </div>
                        </div>

                        {/* Sets Completion Badge */}
                        <div className="self-start sm:self-center">
                          {isComplete ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-green/20 text-accent-green font-semibold text-xs animate-fade-in">
                              <CheckCircle2 size={14} />
                              <span>{completedSets}/{targetSets} Sets Done</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-base border border-border-strong text-text-muted text-xs font-mono">
                              <span>{completedSets}/{targetSets} Sets</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Execution & Form Guidance */}
                      {ex.execution && (
                        <div className="p-3.5 rounded-2xl bg-bg-base/70 border border-border-subtle/80 text-xs text-text-muted leading-relaxed">
                          <strong className="text-text-main font-semibold block mb-0.5">Execution & Biomechanical Focus:</strong>
                          {ex.execution}
                        </div>
                      )}

                      {/* Interactive Set Tracker Buttons */}
                      <div className="pt-2 border-t border-border-subtle/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Interactive Clickable Set Pills */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted mr-1">
                            Sets:
                          </span>
                          {Array.from({ length: targetSets }).map((_, idx) => {
                            const setNumber = idx + 1;
                            const isSetDone = setNumber <= completedSets;
                            const setVol = ex.perSetDesc || (isTime ? `${ex.targetRepsNumeric || 30} secs` : `${ex.targetRepsNumeric || 10} reps`);
                            const buttonLabel = targetSets === 1 ? `Full Routine (${setVol})` : `Set ${setNumber} (${setVol})`;
                            return (
                              <button
                                key={setNumber}
                                type="button"
                                onClick={() => handleToggleSet(ex, setNumber)}
                                className={clsx(
                                  "min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all tap-press cursor-pointer border",
                                  isSetDone
                                    ? "bg-accent-green text-bg-base border-accent-green shadow-sm"
                                    : "bg-bg-base border-border-strong text-text-muted hover:text-text-main hover:border-text-muted"
                                )}
                              >
                                {isSetDone ? (
                                  <Check size={13} strokeWidth={3} />
                                ) : (
                                  <Circle size={12} className="opacity-40" />
                                )}
                                <span>{buttonLabel}</span>
                              </button>
                            );
                          })}

                          {/* Granular +/- set button */}
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              type="button"
                              onClick={() => handleAdjustSets(ex, +1)}
                              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-bg-base border border-border-strong text-text-main hover:border-text-muted flex items-center justify-center text-xs font-bold tap-press cursor-pointer"
                              title="Add set"
                            >
                              +S
                            </button>
                            {completedSets > 0 && (
                              <button
                                type="button"
                                onClick={() => handleAdjustSets(ex, -1)}
                                className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-bg-base border border-border-strong text-text-muted hover:text-accent-red hover:border-accent-red flex items-center justify-center text-xs font-bold tap-press cursor-pointer"
                                title="Remove set"
                              >
                                -S
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Volume Adjusters & Exact Input */}
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <div className="flex items-center gap-1">
                            <button 
                              type="button"
                              onClick={() => updateReps(ex.id, -1)} 
                              disabled={reps === 0} 
                              aria-label={`Decrease ${ex.name} by 1`} 
                              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl border border-border-strong flex items-center justify-center text-text-muted hover:text-text-main hover:border-text-muted disabled:opacity-30 tap-press cursor-pointer text-xs font-bold"
                            >
                              -1
                            </button>
                            <button 
                              type="button"
                              onClick={() => updateReps(ex.id, +1)} 
                              aria-label={`Increase ${ex.name} by 1`} 
                              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-bg-base border border-border-strong flex items-center justify-center text-text-main hover:border-text-muted tap-press cursor-pointer text-xs font-bold"
                            >
                              +1
                            </button>
                            <button 
                              type="button"
                              onClick={() => updateReps(ex.id, +5)} 
                              aria-label={`Increase ${ex.name} by 5`} 
                              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-bg-base border border-border-strong flex items-center justify-center text-text-main hover:border-text-muted tap-press cursor-pointer text-xs font-bold"
                            >
                              +5
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <input 
                              type="number"
                              min="0"
                              id={`reps-${ex.id}`}
                              aria-label={`${ex.name} total volume`}
                              value={reps || ''}
                              onChange={e => setExactReps(ex.id, parseInt(e.target.value) || 0)}
                              placeholder={isTime ? "Secs" : "Reps"}
                              className="w-20 min-h-[38px] bg-bg-base border border-border-strong rounded-xl px-2 py-1.5 text-center text-xs sm:text-sm text-text-main font-mono focus:outline-none focus:border-text-muted"
                            />
                            <span className="text-[11px] font-mono text-text-muted">
                              {isTime ? 'secs' : 'reps'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manage Custom Exercises Section */}
      <div className="mt-16 pt-8 border-t border-border-subtle">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold tracking-widest uppercase text-text-muted">
            Customize Routine
          </h3>
          <button
            onClick={handleResetToDefaultRoutine}
            className="text-xs text-text-muted hover:text-text-main flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-subtle hover:bg-bg-surface tap-press cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset to Official 10 Drills</span>
          </button>
        </div>
        
        {isAddingExercise ? (
          <form onSubmit={handleAddExercise} className="flex flex-col gap-4 mb-8 bg-bg-surface p-6 rounded-3xl border border-border-strong shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="sm:col-span-2">
                <label htmlFor="new-exercise-name" className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Exercise Name</label>
                <input 
                  id="new-exercise-name"
                  type="text" 
                  value={newExerciseName}
                  onChange={e => setNewExerciseName(e.target.value)}
                  placeholder="e.g. Max Tuck Jumps"
                  className="w-full bg-bg-base border border-border-strong rounded-xl px-4 py-2.5 min-h-[44px] text-base sm:text-sm text-text-main focus:outline-none focus:border-text-muted"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="new-exercise-diff" className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Difficulty / Marks</label>
                <select 
                  id="new-exercise-diff"
                  value={newExerciseDiff} 
                  onChange={e => setNewExerciseDiff(e.target.value as ExerciseDifficulty)}
                  className="w-full bg-bg-base border border-border-strong rounded-xl px-3 py-2.5 min-h-[44px] text-base sm:text-sm text-text-main focus:outline-none focus:border-text-muted"
                >
                  <option value="very_easy">Very Easy (2 pts)</option>
                  <option value="easy">Easy (5 pts)</option>
                  <option value="medium">Medium (10 pts)</option>
                  <option value="hard">Hard (15 pts)</option>
                  <option value="very_hard">Very Hard (20 pts)</option>
                </select>
              </div>
              <div>
                <label htmlFor="new-exercise-type" className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Type</label>
                <select 
                  id="new-exercise-type"
                  value={newExerciseType} 
                  onChange={e => setNewExerciseType(e.target.value as TrackingType)}
                  className="w-full bg-bg-base border border-border-strong rounded-xl px-3 py-2.5 min-h-[44px] text-base sm:text-sm text-text-main focus:outline-none focus:border-text-muted"
                >
                  <option value="reps">Reps (Strength/Impact)</option>
                  <option value="time">Seconds (Cardio/Hang)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="bg-text-main text-bg-base px-6 py-2.5 min-h-[44px] rounded-xl font-medium text-sm tap-press cursor-pointer">Save Exercise</button>
              <button type="button" onClick={() => setIsAddingExercise(false)} className="text-text-muted px-4 py-2.5 min-h-[44px] hover:text-text-main font-medium text-sm tap-press cursor-pointer">Cancel</button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setIsAddingExercise(true)}
            className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors mb-8 text-sm font-medium min-h-[44px] px-4 py-2 rounded-2xl bg-bg-surface border border-border-subtle hover:border-border-strong tap-press cursor-pointer"
          >
            <Plus size={18} />
            <span>Add Custom Exercise</span>
          </button>
        )}

        <div className="space-y-2">
          {activeExercises.map(ex => (
            <div key={ex.id} className="flex items-center justify-between p-3.5 sm:p-4 bg-bg-base border border-border-subtle rounded-2xl min-h-[52px]">
              {editingExercise?.id === ex.id ? (
                <form onSubmit={handleEditExercise} className="flex-1 flex flex-wrap items-center gap-2 sm:gap-4">
                  <input 
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    aria-label={`Edit name for ${ex.name}`}
                    className="flex-1 min-w-[150px] bg-bg-surface border border-border-strong rounded-xl px-3 py-2 min-h-[44px] text-base sm:text-sm outline-none"
                    autoFocus
                  />
                  <select 
                    value={editDiff} 
                    onChange={e => setEditDiff(e.target.value as ExerciseDifficulty)}
                    aria-label={`Edit difficulty for ${ex.name}`}
                    className="bg-bg-surface border border-border-strong rounded-xl px-3 py-2 min-h-[44px] text-base sm:text-sm outline-none cursor-pointer"
                  >
                    <option value="very_easy">Very Easy (2 pts)</option>
                    <option value="easy">Easy (5 pts)</option>
                    <option value="medium">Medium (10 pts)</option>
                    <option value="hard">Hard (15 pts)</option>
                    <option value="very_hard">Very Hard (20 pts)</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" className="min-h-[44px] px-4 py-2 bg-text-main text-bg-base rounded-xl text-xs font-semibold tap-press cursor-pointer">Save</button>
                    <button type="button" onClick={() => setEditingExercise(null)} className="min-h-[44px] px-4 py-2 border border-border-strong rounded-xl text-xs text-text-muted hover:text-text-main tap-press cursor-pointer">Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="font-mono text-xs text-text-muted">#{ex.order || '•'}</span>
                    <span className="font-medium text-text-main text-sm sm:text-base">{ex.name}</span>
                    <span className="text-xs text-text-muted opacity-60">({ex.targetReps || `${ex.targetSets} sets`})</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button 
                      onClick={() => {
                        setEditingExercise(ex);
                        setEditName(ex.name);
                        setEditDiff(ex.difficulty || 'medium');
                        setEditType(ex.trackingType || 'reps');
                        setEditSets(ex.targetSets || 3);
                        setEditReps(ex.targetReps || '10 reps');
                      }}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main rounded-xl hover:bg-bg-surface tap-press cursor-pointer"
                      aria-label={`Edit ${ex.name}`}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleArchiveExercise(ex)}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-accent-red rounded-xl hover:bg-bg-surface tap-press cursor-pointer"
                      title="Archive Exercise"
                      aria-label={`Archive ${ex.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
