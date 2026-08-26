const EMPTY_ARRAY: any[] = [];
import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Goal } from '../db';
import { getTodayStr, getMeasurementDates } from '../utils/dateUtils';
import { ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoalSettingsModal } from '../components/GoalSettingsModal';
import { GoalRow, GoalDetail } from '../components/GoalTracker';

export function HealthGoals() {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const goals = useLiveQuery(() => db.goals.where('category').equals('health').toArray()) ?? EMPTY_ARRAY;
  const measurements = useLiveQuery(() => db.goalMeasurements.toArray()) ?? EMPTY_ARRAY;

  const handleCreateGoal = async () => {
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title: 'New Health Goal',
      category: 'health',
      type: 'numeric',
      unit: '',
      startDate: getTodayStr(),
      startingValue: 0
    };
    await db.goals.add(newGoal);
    setEditingGoal(newGoal);
  };

  // Dashboard calculations for weight specifically
  const weightGoal = goals.find(g => g.title.toLowerCase().includes('weight'));
  
  const dashboardStats = useMemo(() => {
    if (!weightGoal) return null;
    const weightMeasurements = measurements.filter(m => m.goalId === weightGoal.id);
    const dates = getMeasurementDates(weightGoal.startDate);
    const validMeasurements = weightMeasurements.filter(m => m.date >= dates[0]);
    validMeasurements.sort((a, b) => b.date.localeCompare(a.date));
    
    const startVal = validMeasurements.length > 0 && validMeasurements[validMeasurements.length - 1].date === dates[0]
      ? Number(validMeasurements[validMeasurements.length - 1].value) 
      : Number(weightGoal.startingValue);
      
    const currentVal = validMeasurements.length > 0 ? Number(validMeasurements[0].value) : startVal;
    
    return {
      start: startVal,
      current: currentVal,
      diff: currentVal - startVal
    };
  }, [weightGoal, measurements]);

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
                <h1 className="text-3xl font-serif italic text-text-main">Health Goals</h1>
              </div>
            </div>
            
            <button 
              onClick={handleCreateGoal}
              className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-border-strong rounded-full text-sm font-medium hover:bg-bg-surface-hover hover:text-text-main transition-all"
            >
              <Plus size={16} /> New Goal
            </button>
          </header>

          {/* Quick Dashboard */}
          {dashboardStats && (
            <div className="mb-12 grid grid-cols-3 gap-6">
              <div className="bg-bg-surface border border-border-strong rounded-2xl p-6 text-center">
                <div className="text-xs font-semibold tracking-widest uppercase text-text-muted mb-2">Starting Weight</div>
                <div className="text-3xl font-serif italic text-text-main">{dashboardStats.start} <span className="text-base text-text-muted">kg</span></div>
              </div>
              <div className="bg-bg-surface border border-border-strong rounded-2xl p-6 text-center shadow-[0_0_15px_rgba(0,0,0,0.05)] border-t-2 border-t-accent-red/20">
                <div className="text-xs font-semibold tracking-widest uppercase text-accent-red mb-2">Current Weight</div>
                <div className="text-3xl font-serif italic text-text-main">{dashboardStats.current} <span className="text-base text-text-muted">kg</span></div>
              </div>
              <div className="bg-bg-surface border border-border-strong rounded-2xl p-6 text-center">
                <div className="text-xs font-semibold tracking-widest uppercase text-text-muted mb-2">Total Change</div>
                <div className="text-3xl font-serif italic text-text-main">
                  {dashboardStats.diff > 0 ? '+' : ''}{dashboardStats.diff.toFixed(1)} <span className="text-base text-text-muted">kg</span>
                </div>
              </div>
            </div>
          )}

          {/* Goals List */}
          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className="text-center py-16 bg-bg-surface border border-border-strong rounded-3xl">
                <p className="text-text-muted italic font-serif">No health goals defined yet.</p>
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
