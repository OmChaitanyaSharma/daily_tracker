import { useState, useEffect } from 'react';
import { type Goal, db } from '../db';
import { X, Trash2 } from 'lucide-react';
import { getSettings } from '../utils/settings';

interface Props {
  goal: Goal;
  onClose: () => void;
  onDelete?: (goalId: string) => void;
}

export function GoalSettingsModal({ goal, onClose, onDelete }: Props) {
  const [formData, setFormData] = useState<Partial<Goal>>({
    title: goal.title,
    category: goal.category,
    subCategory: goal.subCategory || '',
    type: goal.type,
    unit: goal.unit || '',
    targetValue: goal.targetValue || '',
    startDate: goal.startDate,
    startingValue: goal.startingValue || ''
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Backspace') {
        const activeTag = document.activeElement?.tagName || '';
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) {
          if (document.activeElement?.hasAttribute('data-edit-mode')) return;
        }
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = formData.title?.trim() || 'Untitled Goal';
    const cleanSubCategory = formData.subCategory?.trim() || '';
    await db.goals.update(goal.id, {
      title: cleanTitle.slice(0, 100),
      category: formData.category || 'lifetime',
      subCategory: cleanSubCategory.slice(0, 50),
      type: formData.type || 'qualitative',
      unit: (formData.unit || '').trim().slice(0, 20),
      targetValue: formData.targetValue || '',
      startDate: formData.startDate || goal.startDate,
      startingValue: formData.startingValue || ''
    });
    onClose();
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this goal and all its measurements? This action cannot be undone.')) {
      await db.goals.delete(goal.id);
      const measurements = await db.goalMeasurements.where('goalId').equals(goal.id).toArray();
      await db.goalMeasurements.bulkDelete(measurements.map(m => m.id));
      if (onDelete) {
        onDelete(goal.id);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/60 backdrop-blur-sm animate-fade-in px-4 py-8 overflow-y-auto">
      <div className="bg-bg-surface border border-border-strong rounded-2xl p-6 sm:p-8 shadow-xl max-w-md w-full relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-text-muted hover:text-text-main p-1.5 rounded-lg transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-serif italic text-text-main">Edit Goal Settings</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1.5">Title</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-bg-base border border-border-strong rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:border-text-muted outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1.5">Category</label>
            <div className="grid grid-cols-3 gap-1.5 bg-bg-base p-1.5 rounded-xl border border-border-strong">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, category: 'end-of-year' })}
                className={`py-2 px-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${formData.category === 'end-of-year' ? 'bg-bg-surface text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
              >
                {getSettings().seasonName}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, category: 'health' })}
                className={`py-2 px-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${formData.category === 'health' ? 'bg-bg-surface text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
              >
                Health
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, category: 'lifetime' })}
                className={`py-2 px-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${formData.category === 'lifetime' ? 'bg-bg-surface text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
              >
                Lifetime
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1.5">Sub-Category / Group (Optional)</label>
            <input 
              type="text" 
              value={formData.subCategory || ''}
              onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
              placeholder="e.g. Fitness, Career, Mindset"
              className="w-full bg-bg-base border border-border-strong rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:border-text-muted outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1.5">Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-bg-base border border-border-strong rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:border-text-muted outline-none"
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
              <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1.5">Unit</label>
              <input 
                type="text" 
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g. kg, mins"
                className="w-full bg-bg-base border border-border-strong rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:border-text-muted outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1.5">Starting Date</label>
              <input 
                type="date" 
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-bg-base border border-border-strong rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:border-text-muted outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1.5">Target Value</label>
              <input 
                type="text" 
                value={formData.targetValue}
                onChange={e => setFormData({ ...formData, targetValue: e.target.value })}
                className="w-full bg-bg-base border border-border-strong rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:border-text-muted outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1.5">Starting Baseline Value</label>
            <input 
              type="text" 
              value={formData.startingValue}
              onChange={e => setFormData({ ...formData, startingValue: e.target.value })}
              placeholder="e.g. 68"
              className="w-full bg-bg-base border border-border-strong rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:border-text-muted outline-none"
            />
            <p className="text-xs text-text-muted mt-1.5">Fallback baseline if no actual measurement is recorded on the starting date.</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-6 border-t border-border-strong mt-6">
            <button 
              type="button" 
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 text-accent-red hover:bg-accent-red-bg px-4 py-2.5 rounded-xl transition-colors text-sm font-medium tap-press cursor-pointer"
            >
              <Trash2 size={16} />
              Delete Goal
            </button>
            
            <button 
              type="submit" 
              className="bg-text-main text-bg-base px-6 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity tap-press cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
