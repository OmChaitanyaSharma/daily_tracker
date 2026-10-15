import { useState } from 'react';
import { type Goal, db } from '../db';
import { X, Trash2 } from 'lucide-react';
import { getSettings } from '../utils/settings';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { deleteGoalFromCloud } from '../services/cloudSync';
import { auth } from '../firebase';

interface Props {
  goal: Goal;
  onClose: () => void;
  onDelete?: (deletedGoalId: string) => void;
}

export function GoalSettingsModal({ goal, onClose, onDelete }: Props) {
  const containerRef = useFocusTrap(true, onClose);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<Goal>>({
    title: goal.title,
    category: goal.category,
    type: goal.type,
    unit: goal.unit || '',
    targetValue: goal.targetValue || '',
    subCategory: goal.subCategory || '',
    startDate: goal.startDate,
    startingValue: goal.startingValue || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (goal?.id) {
        await db.goals.update(goal.id, {
          title: formData.title,
          category: formData.category,
          type: formData.type,
          unit: formData.unit,
          targetValue: formData.targetValue,
          subCategory: formData.subCategory,
          startDate: formData.startDate,
          startingValue: formData.startingValue
        });
      }
      onClose();
    } catch (err) {
      console.error('Failed to update goal settings:', err);
      alert('Failed to save goal settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this goal and all its measurements? This action cannot be undone.'
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const goalId = goal?.id;
      if (goalId) {
        // 1. Atomic local Dexie cascade delete
        await db.transaction('rw', [db.goals, db.goalMeasurements], async () => {
          const measurements = await db.goalMeasurements.where('goalId').equals(goalId).toArray();
          const measurementIds = measurements
            .map(m => m.id)
            .filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
          
          if (measurementIds.length > 0) {
            await db.goalMeasurements.bulkDelete(measurementIds);
          }

          // Delete goal by ID
          await db.goals.delete(goalId);
          if (!isNaN(Number(goalId))) {
            await db.goals.delete(Number(goalId) as any);
          }
        });

        // 2. Cascade delete from cloud if user is authenticated
        if (auth.currentUser) {
          await deleteGoalFromCloud(auth.currentUser.uid, String(goalId));
        }

        // 3. Notify parent listener (e.g. to clear active goal selection)
        if (onDelete) {
          onDelete(String(goalId));
        }
      }
    } catch (err) {
      console.error('Failed to delete goal:', err);
      alert('An error occurred while deleting the goal. Please try again.');
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/60 backdrop-blur-sm animate-fade-in px-4 py-6 overflow-y-auto">
      <div 
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-settings-modal-title"
        className="bg-bg-surface border border-border-strong rounded-2xl p-6 sm:p-8 shadow-xl max-w-md w-full relative my-auto"
      >
        <button
          type="button"
          onClick={onClose}
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-surface-hover transition-colors absolute top-3 right-3 tap-press"
          aria-label="Close goal settings modal"
        >
          <X size={20} />
        </button>
        <div className="flex items-center justify-between mb-6">
          <h3 id="goal-settings-modal-title" className="text-xl font-serif italic text-text-main">Edit Goal Settings</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="goal-title-input" className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1.5">Title</label>
            <input 
              id="goal-title-input"
              type="text" 
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full min-h-[44px] bg-bg-base border border-border-strong rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:border-text-muted outline-none"
              required
            />
          </div>

          <div>
            <span id="goal-category-label" className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1.5">Category</span>
            <div className="grid grid-cols-2 gap-2 bg-bg-base p-1.5 rounded-xl border border-border-strong" role="tablist" aria-labelledby="goal-category-label">
              <button
                type="button"
                role="tab"
                aria-selected={formData.category === 'end-of-year'}
                onClick={() => setFormData({ ...formData, category: 'end-of-year' })}
                className={`min-h-[44px] py-2 px-3 text-sm font-medium rounded-lg transition-colors tap-press ${formData.category === 'end-of-year' ? 'bg-bg-surface text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
              >
                {getSettings().seasonName}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={formData.category === 'health'}
                onClick={() => setFormData({ ...formData, category: 'health' })}
                className={`min-h-[44px] py-2 px-3 text-sm font-medium rounded-lg transition-colors tap-press ${formData.category === 'health' ? 'bg-bg-surface text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
              >
                Health & Fitness
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="goal-subcategory-input" className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1.5">Sub-Category / Group (Optional)</label>
            <input 
              id="goal-subcategory-input"
              type="text" 
              value={formData.subCategory || ''}
              onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
              placeholder="e.g. Fitness, Mindset, Project X"
              className="w-full min-h-[44px] bg-bg-base border border-border-strong rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-text-main focus:border-text-muted outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="goal-type-select" className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1.5">Type</label>
              <select 
                id="goal-type-select"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full min-h-[44px] bg-bg-base border border-border-strong rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:border-text-muted outline-none"
              >
                <option value="numeric">Numeric</option>
                <option value="count">Count</option>
                <option value="duration">Duration</option>
                <option value="distance">Distance</option>
                <option value="percentage">Percentage</option>
                <option value="qualitative">Qualitative</option>
              </select>
            </div>
            <div>
              <label htmlFor="goal-unit-input" className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1.5">Unit</label>
              <input 
                id="goal-unit-input"
                type="text" 
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g. kg, mins"
                className="w-full min-h-[44px] bg-bg-base border border-border-strong rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:border-text-muted outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="goal-start-date-input" className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1.5">Starting Date</label>
              <input 
                id="goal-start-date-input"
                type="date" 
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full min-h-[44px] bg-bg-base border border-border-strong rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:border-text-muted outline-none"
                required
              />
            </div>
            <div>
              <label htmlFor="goal-target-val-input" className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1.5">Target Value</label>
              <input 
                id="goal-target-val-input"
                type="text" 
                value={formData.targetValue}
                onChange={e => setFormData({ ...formData, targetValue: e.target.value })}
                className="w-full min-h-[44px] bg-bg-base border border-border-strong rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:border-text-muted outline-none"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="goal-baseline-val-input" className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1.5">Starting Baseline Value</label>
            <input 
              id="goal-baseline-val-input"
              type="text" 
              value={formData.startingValue}
              onChange={e => setFormData({ ...formData, startingValue: e.target.value })}
              placeholder="e.g. 68"
              className="w-full min-h-[44px] bg-bg-base border border-border-strong rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:border-text-muted outline-none"
            />
            <p className="text-xs text-text-muted mt-1.5">Fallback baseline if no actual measurement is recorded on the starting date.</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-6 border-t border-border-strong mt-6">
            <button 
              type="button" 
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="min-h-[44px] flex items-center justify-center gap-2 text-accent-red hover:bg-accent-red-bg px-4 py-2.5 rounded-xl transition-colors text-sm font-medium tap-press disabled:opacity-50 cursor-pointer"
            >
              <Trash2 size={16} />
              {isDeleting ? 'Deleting...' : 'Delete Goal'}
            </button>
            
            <button
              type="submit"
              disabled={isDeleting || isSaving}
              className="min-h-[44px] bg-text-main text-bg-base px-6 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity tap-press flex items-center justify-center disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
