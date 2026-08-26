const EMPTY_ARRAY: any[] = [];
import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Exercise, type ExerciseDifficulty, type TrackingType } from '../db';
import { format, subDays, addDays, isFuture } from 'date-fns';
import { getTodayStr } from '../utils/dateUtils';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Dumbbell, Trash2, Edit2, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useExerciseStreak } from '../hooks/useExerciseStreak';
import clsx from 'clsx';
import { useSound } from '../hooks/useSound';

export function ExerciseTracking() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const todayStr = getTodayStr();

  const [newExerciseName, setNewExerciseName] = useState('');
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExerciseDiff, setNewExerciseDiff] = useState<ExerciseDifficulty>('easy');
  const [newExerciseType, setNewExerciseType] = useState<TrackingType>('reps');
  
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editName, setEditName] = useState('');
  const [editDiff, setEditDiff] = useState<ExerciseDifficulty>('easy');
  const [editType, setEditType] = useState<TrackingType>('reps');

  const { playClick, playSuccess } = useSound();

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

  const activeExercises = useMemo(() => exercises.filter(ex => !ex.archived), [exercises]);
  const streak = useExerciseStreak();

  const handlePrevDay = () => setCurrentDate(prev => subDays(prev, 1));
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
      trackingType: newExerciseType
    });
    setNewExerciseName('');
    setNewExerciseDiff('easy');
    setNewExerciseType('reps');
    setIsAddingExercise(false);
  };

  const handleEditExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExercise || !editName.trim()) return;
    await db.exercises.update(editingExercise.id, { 
      name: editName.trim(),
      difficulty: editDiff,
      trackingType: editType
    });
    setEditingExercise(null);
    setEditName('');
  };

  const handleArchiveExercise = async (ex: Exercise) => {
    if (confirm(`Archive ${ex.name}? It won't break your past streaks, but will be removed from your daily list.`)) {
      await db.exercises.update(ex.id, { archived: true });
    }
  };

  const updateReps = async (exerciseId: string, delta: number) => {
    let newReps = delta;
    const existingLog = exerciseLogs.find(l => l.exerciseId === exerciseId);
    
    if (existingLog) {
      newReps = Math.max(0, existingLog.reps + delta);
      if (newReps === 0) {
        await db.exerciseLogs.delete(existingLog.id);
      } else {
        await db.exerciseLogs.update(existingLog.id, { reps: newReps });
      }
    } else if (delta > 0) {
      await db.exerciseLogs.add({
        id: crypto.randomUUID(),
        date: dateStr,
        exerciseId,
        reps: delta
      });
    }

    if (delta > 0) {
      const pr = personalRecords[exerciseId] || 0;
      if (pr > 0 && newReps > pr) {
        playSuccess(); // PR broken!
      } else {
        playClick();
      }
    }
  };

  const setExactReps = async (exerciseId: string, reps: number) => {
    const existingLog = exerciseLogs.find(l => l.exerciseId === exerciseId);
    if (existingLog) {
      if (reps <= 0) {
        await db.exerciseLogs.delete(existingLog.id);
      } else {
        await db.exerciseLogs.update(existingLog.id, { reps });
      }
    } else if (reps > 0) {
      await db.exerciseLogs.add({
        id: crypto.randomUUID(),
        date: dateStr,
        exerciseId,
        reps
      });
    }
    playClick();
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 animate-fade-in relative">
      <header className="flex items-center justify-between border-b border-border-subtle pb-6 mb-12">
        <div className="flex items-center gap-6">
          <Link to="/habits" className="text-text-muted hover:text-text-main transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-serif italic text-text-main">Exercise Tracking</h1>
          </div>
        </div>

        {streak > 0 && (
          <div className="flex items-center gap-2 bg-accent-orange/10 border border-accent-orange/20 text-accent-orange px-4 py-2 rounded-full animate-fade-in">
            <Flame size={18} className="animate-pulse" />
            <span className="text-sm font-bold">{streak} Day Streak!</span>
          </div>
        )}
      </header>

      {/* Date Navigator */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4 bg-bg-surface border border-border-strong rounded-full p-1">
          <button 
            onClick={handlePrevDay}
            className="p-2 text-text-muted hover:text-text-main hover:bg-bg-surface-hover rounded-full transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button 
            onClick={handleToday}
            className={clsx(
              "px-4 py-1 rounded-full text-sm font-medium transition-colors",
              dateStr === todayStr 
                ? "bg-text-main text-bg-base" 
                : "text-text-main hover:bg-bg-surface-hover"
            )}
          >
            {dateStr === todayStr ? 'Today' : format(currentDate, 'MMM d, yyyy')}
          </button>

          <button 
            onClick={handleNextDay}
            disabled={isFuture(addDays(currentDate, 1))}
            className="p-2 text-text-muted hover:text-text-main hover:bg-bg-surface-hover rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Exercise List */}
      <div className="space-y-6">
        {activeExercises.length === 0 ? (
          <div className="bg-bg-surface border border-border-subtle rounded-3xl p-12 text-center flex flex-col items-center">
            <Dumbbell size={48} className="text-border-strong mb-4" />
            <p className="text-text-muted">No exercises added yet.</p>
            <button 
              onClick={() => setIsAddingExercise(true)}
              className="mt-6 bg-text-main text-bg-base px-6 py-2 rounded-full text-sm font-medium"
            >
              Add Your First Exercise
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeExercises.map(ex => {
              const reps = exerciseLogs.find(l => l.exerciseId === ex.id)?.reps || 0;
              const isTime = ex.trackingType === 'time';
              
              const difficultyColors = {
                very_easy: 'bg-border-strong text-text-muted',
                easy: 'bg-accent-green-bg text-accent-green',
                medium: 'bg-accent-yellow-bg text-accent-yellow',
                hard: 'bg-accent-red-bg text-accent-red',
                very_hard: 'bg-text-main text-bg-base'
              };
              const diffLabels = {
                very_easy: 'Very Easy',
                easy: 'Easy',
                medium: 'Medium',
                hard: 'Hard',
                very_hard: 'Very Hard'
              };
              const diffClass = difficultyColors[(ex.difficulty || 'easy') as ExerciseDifficulty];
              const diffLabel = diffLabels[(ex.difficulty || 'easy') as ExerciseDifficulty];

              return (
                <div key={ex.id} className="bg-bg-base border border-border-strong rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-text-muted transition-colors">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-serif text-text-main">{ex.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${diffClass}`}>
                        {diffLabel}
                      </span>
                      {isTime && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-accent-blue-bg text-accent-blue">
                          Cardio
                        </span>
                      )}
                      {personalRecords[ex.id] > 0 && reps > personalRecords[ex.id] && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-accent-red-bg text-accent-red animate-pulse">
                          🔥 New PR
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-muted mt-2">
                      Total today: <strong className="text-text-main">{reps}</strong> {isTime ? 'mins' : 'reps'}
                      {personalRecords[ex.id] > 0 && (
                        <span className="ml-2 text-xs opacity-50">PR: {personalRecords[ex.id]} {isTime ? 'mins' : ''}</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => updateReps(ex.id, -1)} disabled={reps === 0} className="w-10 h-10 rounded-full border border-border-strong flex items-center justify-center text-text-muted hover:text-text-main hover:border-text-muted disabled:opacity-30">-1</button>
                    <button onClick={() => updateReps(ex.id, +1)} className="w-10 h-10 rounded-full bg-bg-surface border border-border-strong flex items-center justify-center text-text-main hover:border-text-muted">+1</button>
                    <button onClick={() => updateReps(ex.id, +5)} className="w-10 h-10 rounded-full bg-bg-surface border border-border-strong flex items-center justify-center text-text-main hover:border-text-muted">+5</button>
                    <button onClick={() => updateReps(ex.id, +10)} className="w-10 h-10 rounded-full bg-bg-surface border border-border-strong flex items-center justify-center text-text-main hover:border-text-muted">+10</button>
                    
                    <div className="w-px h-8 bg-border-strong mx-2 hidden sm:block"></div>
                    
                    <input 
                      type="number"
                      min="0"
                      value={reps || ''}
                      onChange={e => setExactReps(ex.id, parseInt(e.target.value) || 0)}
                      placeholder={isTime ? "Mins" : "Reps"}
                      className="w-20 bg-bg-surface border border-border-strong rounded-lg px-3 py-2 text-center text-text-main focus:outline-none focus:border-text-muted"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manage Exercises Section */}
      <div className="mt-16 pt-8 border-t border-border-subtle">
        <h3 className="text-sm font-semibold tracking-widest uppercase text-text-muted mb-6">Manage Exercises</h3>
        
        {isAddingExercise ? (
          <form onSubmit={handleAddExercise} className="flex flex-col gap-4 mb-8 bg-bg-surface p-6 rounded-2xl border border-border-strong">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Exercise Name</label>
                <input 
                  type="text" 
                  value={newExerciseName}
                  onChange={e => setNewExerciseName(e.target.value)}
                  placeholder="e.g. Push-ups, Running..."
                  className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-2 text-text-main focus:outline-none focus:border-text-muted"
                  autoFocus
                />
              </div>
              <div className="w-[120px]">
                <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Type</label>
                <select 
                  value={newExerciseType} 
                  onChange={e => setNewExerciseType(e.target.value as TrackingType)}
                  className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-2 text-text-main focus:outline-none focus:border-text-muted"
                >
                  <option value="reps">Reps</option>
                  <option value="time">Minutes</option>
                </select>
              </div>
              <div className="w-[140px]">
                <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Difficulty</label>
                <select 
                  value={newExerciseDiff} 
                  onChange={e => setNewExerciseDiff(e.target.value as ExerciseDifficulty)}
                  className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-2 text-text-main focus:outline-none focus:border-text-muted"
                >
                  <option value="very_easy">Very Easy (2)</option>
                  <option value="easy">Easy (5)</option>
                  <option value="medium">Medium (10)</option>
                  <option value="hard">Hard (15)</option>
                  <option value="very_hard">Very Hard (20)</option>
                </select>
              </div>
              <div className="flex gap-2 pb-0.5">
                <button type="submit" className="bg-text-main text-bg-base px-6 py-2 rounded-lg font-medium text-sm">Save</button>
                <button type="button" onClick={() => setIsAddingExercise(false)} className="text-text-muted px-4 py-2 hover:text-text-main font-medium text-sm">Cancel</button>
              </div>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setIsAddingExercise(true)}
            className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors mb-8 text-sm font-medium"
          >
            <Plus size={18} />
            Add New Exercise
          </button>
        )}

        <div className="space-y-2">
          {activeExercises.map(ex => (
            <div key={ex.id} className="flex items-center justify-between p-4 bg-bg-base border border-border-subtle rounded-xl">
              {editingExercise?.id === ex.id ? (
                <form onSubmit={handleEditExercise} className="flex-1 flex flex-wrap items-center gap-4">
                  <input 
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1 min-w-[150px] bg-bg-surface border border-border-strong rounded px-3 py-1 text-sm outline-none"
                    autoFocus
                  />
                  <select 
                    value={editType} 
                    onChange={e => setEditType(e.target.value as TrackingType)}
                    className="bg-bg-surface border border-border-strong rounded px-3 py-1 text-sm outline-none"
                  >
                    <option value="reps">Reps</option>
                    <option value="time">Mins</option>
                  </select>
                  <select 
                    value={editDiff} 
                    onChange={e => setEditDiff(e.target.value as ExerciseDifficulty)}
                    className="bg-bg-surface border border-border-strong rounded px-3 py-1 text-sm outline-none"
                  >
                    <option value="very_easy">Very Easy</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="very_hard">Very Hard</option>
                  </select>
                  <button type="submit" className="text-xs font-semibold text-text-main">Save</button>
                  <button type="button" onClick={() => setEditingExercise(null)} className="text-xs text-text-muted">Cancel</button>
                </form>
              ) : (
                <>
                  <span className="font-medium text-text-main">{ex.name}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        setEditingExercise(ex);
                        setEditName(ex.name);
                        setEditDiff(ex.difficulty || 'easy');
                        setEditType(ex.trackingType || 'reps');
                      }}
                      className="text-text-muted hover:text-text-main"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleArchiveExercise(ex)}
                      className="text-text-muted hover:text-accent-red"
                      title="Archive Exercise"
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
