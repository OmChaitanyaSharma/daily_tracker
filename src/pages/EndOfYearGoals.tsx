import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings } from '../utils/settings';
import { db, type Goal } from '../db';
import { getTodayStr } from '../utils/dateUtils';
import { ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoalSettingsModal } from '../components/GoalSettingsModal';
import { GoalRow, GoalDetail } from '../components/GoalTracker';

export function EndOfYearGoals() {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const goals = useLiveQuery(() => db.goals.where('category').equals('end-of-year').toArray()) || [];
  const measurements = useLiveQuery(() => db.goalMeasurements.toArray()) || [];

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
      title: 'New Goal',
      category: 'end-of-year',
      type: 'qualitative',
      unit: '',
      startDate: getTodayStr(),
      startingValue: ''
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
        />
      )}

      {!selectedGoalId ? (
        <>
          <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-subtle pb-6 mb-8 gap-4">
            <div className="flex items-center gap-4 sm:gap-6">
              <Link
                to="/goals"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-surface border border-transparent hover:border-border-subtle transition-all tap-press"
                aria-label="Back to goals"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl sm:text-3xl font-serif italic text-text-main">Goals Till End of {getSettings().seasonName} (March 1st)</h1>
              </div>
            </div>
            
            <button 
              onClick={handleCreateGoal}
              className="flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-bg-surface border border-border-strong rounded-xl text-sm font-medium hover:bg-bg-surface-hover hover:text-text-main transition-all tap-press"
            >
              <Plus size={18} /> New Goal
            </button>
          </header>

          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className="text-center py-16 bg-bg-surface border border-border-strong rounded-3xl">
                <p className="text-text-muted italic font-serif">No goals defined yet.</p>
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
                    {groupGoals.map(goal => (
                      <div 
                        key={goal.id}
                        className={draggedGoalId === goal.id ? "opacity-40" : ""}
                      >
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
                    ))}
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
          />
        )
      )}
    </div>
  );
}
