import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
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
          <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-subtle pb-6 mb-8 gap-4">
            <div className="flex items-center gap-6">
              <Link to="/goals" className="text-text-muted hover:text-text-main transition-colors">
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-3xl font-serif italic text-text-main">Goals Till End of Year</h1>
              </div>
            </div>
            
            <button 
              onClick={handleCreateGoal}
              className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-border-strong rounded-full text-sm font-medium hover:bg-bg-surface-hover hover:text-text-main transition-all"
            >
              <Plus size={16} /> New Goal
            </button>
          </header>

          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className="text-center py-16 bg-bg-surface border border-border-strong rounded-3xl">
                <p className="text-text-muted italic font-serif">No goals defined yet.</p>
              </div>
            ) : (
              goals.map(goal => (
                <GoalRow 
                  key={goal.id} 
                  goal={goal} 
                  measurements={measurements.filter(m => m.goalId === goal.id)}
                  onClick={() => setSelectedGoalId(goal.id)}
                  onEdit={() => setEditingGoal(goal)}
                />
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
