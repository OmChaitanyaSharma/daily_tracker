import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Goal } from '../db';
import { getTodayStr } from '../utils/dateUtils';
import { ArrowLeft, Plus, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoalSettingsModal } from '../components/GoalSettingsModal';
import { GoalRow, GoalDetail } from '../components/GoalTracker';

const EMPTY_GOALS: Goal[] = [];
const EMPTY_MEASUREMENTS: any[] = [];

export function LifetimeGoals() {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const goals = useLiveQuery(() => db.goals.where('category').equals('lifetime').toArray()) ?? EMPTY_GOALS;
  const measurements = useLiveQuery(() => db.goalMeasurements.toArray()) ?? EMPTY_MEASUREMENTS;

  const [draggedGoalId, setDraggedGoalId] = useState<string | null>(null);

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.startDate.localeCompare(b.startDate);
    });
  }, [goals]);

  const groupedGoals = useMemo(() => {
    const groups: Record<string, Goal[]> = {};
    sortedGoals.forEach(g => {
      const cat = g.subCategory?.trim() || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(g);
    });
    return groups;
  }, [sortedGoals]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedGoalId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedGoalId || draggedGoalId === targetId) return;

    const oldIndex = sortedGoals.findIndex(g => g.id === draggedGoalId);
    const newIndex = sortedGoals.findIndex(g => g.id === targetId);

    if (oldIndex === -1 || newIndex === -1) return;

    const newGoals = [...sortedGoals];
    const [draggedGoal] = newGoals.splice(oldIndex, 1);
    newGoals.splice(newIndex, 0, draggedGoal);

    const updates = newGoals.map((goal, index) => ({
      ...goal,
      order: index
    }));

    await db.goals.bulkPut(updates);
    setDraggedGoalId(null);
  };

  const handleCreateGoal = async () => {
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title: 'New Lifetime Goal',
      category: 'lifetime',
      type: 'qualitative',
      unit: '',
      startDate: getTodayStr(),
      startingValue: '',
      order: goals.length
    };
    await db.goals.add(newGoal);
    setEditingGoal(newGoal);
  };

  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  return (
    <div className="max-w-4xl mx-auto pb-24 animate-fade-in relative">
      {/* Settings Modal */}
      {editingGoal && (
        <GoalSettingsModal 
          goal={editingGoal} 
          onClose={() => setEditingGoal(null)}
          onDelete={(deletedId) => {
            if (selectedGoalId === deletedId) {
              setSelectedGoalId(null);
            }
            setEditingGoal(null);
          }}
        />
      )}

      {!selectedGoalId ? (
        <>
          <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-subtle pb-6 mb-8 gap-4">
            <div className="flex items-center gap-4 sm:gap-6">
              <Link
                to="/goals"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-surface border border-transparent hover:border-border-subtle transition-all tap-press cursor-pointer"
                aria-label="Back to goals"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl sm:text-3xl font-serif italic text-text-main">Lifetime Goals</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider bg-bg-surface border border-border-strong text-text-muted">
                    {goals.length} {goals.length === 1 ? 'Goal' : 'Goals'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-text-muted mt-1">
                  The ultimate North Star goals and lifelong aspirations you dedicate your life to achieving
                </p>
              </div>
            </div>
            
            <button 
              onClick={handleCreateGoal}
              className="flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-all tap-press bg-bg-surface border border-border-strong text-text-main hover:bg-bg-surface-hover hover:border-text-muted cursor-pointer"
            >
              <Plus size={18} />
              New Lifetime Goal
            </button>
          </header>

          {/* Ambitions Banner */}
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-bg-surface border border-border-strong flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-purple/15 text-accent-purple flex items-center justify-center shrink-0">
                <Compass size={20} />
              </div>
              <div>
                <h2 className="text-sm font-medium text-text-main">
                  Lifetime Aspirations & North Stars
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Overarching achievements, milestones, and legacy targets you work towards.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className="text-center py-16 px-6 bg-bg-surface border border-border-strong rounded-3xl flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-accent-purple/15 text-accent-purple flex items-center justify-center mb-4">
                  <Compass size={32} strokeWidth={1.5} />
                </div>
                <h2 className="text-lg font-serif text-text-main font-medium mb-2">No Lifetime Goals Set Yet</h2>
                <p className="text-text-muted text-xs sm:text-sm max-w-md mx-auto leading-relaxed mb-6 font-serif italic">
                  Lifetime goals represent your highest personal aspirations. Add as many lifetime goals as you wish.
                </p>
                <button 
                  onClick={handleCreateGoal}
                  className="flex items-center gap-2 px-6 py-2.5 min-h-[44px] bg-text-main text-bg-base rounded-full text-sm font-semibold tap-press cursor-pointer hover:opacity-90"
                >
                  <Plus size={18} /> Set Your First Lifetime Goal
                </button>
              </div>
            ) : (
              Object.entries(groupedGoals).sort((a, b) => {
                if (a[0] === 'Uncategorized') return 1;
                if (b[0] === 'Uncategorized') return -1;
                return a[0].localeCompare(b[0]);
              }).map(([groupName, groupGoals]) => (
                <div key={groupName} className="mb-8 last:mb-0">
                  <h3 className="text-sm font-semibold tracking-widest uppercase text-text-muted mb-4 pl-2">{groupName}</h3>
                  <div className="space-y-4">
                    {groupGoals.map((goal) => {
                      const globalIndex = sortedGoals.findIndex(g => g.id === goal.id);
                      return (
                        <div 
                          key={goal.id}
                          className={`relative flex items-stretch gap-3 ${draggedGoalId === goal.id ? 'opacity-40' : ''}`}
                        >
                          <div className="hidden sm:flex items-center justify-center w-8 shrink-0 text-xs font-mono font-bold text-text-muted opacity-40 select-none">
                            #{globalIndex + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <GoalRow 
                              goal={goal} 
                              measurements={measurements.filter(m => m.goalId === goal.id)}
                              onClick={() => setSelectedGoalId(goal.id)}
                              onEdit={() => setEditingGoal(goal)}
                              draggable
                              onDragStart={(e) => handleDragStart(e, goal.id)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, goal.id)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        selectedGoal && (
          <GoalDetail 
            goal={selectedGoal} 
            measurements={measurements.filter(m => m.goalId === selectedGoal.id)}
            onBack={() => setSelectedGoalId(null)}
            onEdit={() => setEditingGoal(selectedGoal)}
          />
        )
      )}
    </div>
  );
}
