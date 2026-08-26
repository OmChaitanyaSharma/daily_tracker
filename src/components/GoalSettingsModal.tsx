import { useState, useEffect } from 'react';
import { type Goal, db } from '../db';
import { X, Trash2 } from 'lucide-react';

interface Props {
  goal: Goal;
  onClose: () => void;
}

export function GoalSettingsModal({ goal, onClose }: Props) {
  const [formData, setFormData] = useState<Partial<Goal>>({
    title: goal.title,
    category: goal.category,
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
    await db.goals.update(goal.id, {
      title: formData.title,
      category: formData.category,
      type: formData.type,
      unit: formData.unit,
      targetValue: formData.targetValue,
      startDate: formData.startDate,
      startingValue: formData.startingValue
    });
    onClose();
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this goal and all its measurements? This action cannot be undone.')) {
      await db.goals.delete(goal.id);
      const measurements = await db.goalMeasurements.where('goalId').equals(goal.id).toArray();
      await db.goalMeasurements.bulkDelete(measurements.map(m => m.id));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/60 backdrop-blur-sm animate-fade-in px-4 py-8 overflow-y-auto">
      <div className="bg-bg-surface border border-border-strong rounded-2xl p-8 shadow-xl max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-main">
          <X size={20} />
        </button>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-serif italic text-text-main">Edit Goal Settings</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1">Title</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-bg-base border border-border-strong rounded-lg px-3 py-2 focus:border-text-muted outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1">Category</label>
            <div className="grid grid-cols-2 gap-2 bg-bg-base p-1 rounded-lg border border-border-strong">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, category: 'end-of-year' })}
                className={`py-1.5 text-sm font-medium rounded-md transition-colors ${formData.category === 'end-of-year' ? 'bg-bg-surface text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
              >
                End of Year
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, category: 'health' })}
                className={`py-1.5 text-sm font-medium rounded-md transition-colors ${formData.category === 'health' ? 'bg-bg-surface text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
              >
                Health & Fitness
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1">Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-bg-base border border-border-strong rounded-lg px-3 py-2 focus:border-text-muted outline-none"
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
              <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1">Unit</label>
              <input 
                type="text" 
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g. kg, mins"
                className="w-full bg-bg-base border border-border-strong rounded-lg px-3 py-2 focus:border-text-muted outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1">Starting Date</label>
              <input 
                type="date" 
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-bg-base border border-border-strong rounded-lg px-3 py-2 focus:border-text-muted outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1">Target Value</label>
              <input 
                type="text" 
                value={formData.targetValue}
                onChange={e => setFormData({ ...formData, targetValue: e.target.value })}
                className="w-full bg-bg-base border border-border-strong rounded-lg px-3 py-2 focus:border-text-muted outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1">Starting Baseline Value</label>
            <input 
              type="text" 
              value={formData.startingValue}
              onChange={e => setFormData({ ...formData, startingValue: e.target.value })}
              placeholder="e.g. 68"
              className="w-full bg-bg-base border border-border-strong rounded-lg px-3 py-2 focus:border-text-muted outline-none"
            />
            <p className="text-xs text-text-muted mt-1">Fallback baseline if no actual measurement is recorded on the starting date.</p>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-border-strong mt-6">
            <button 
              type="button" 
              onClick={handleDelete}
              className="flex items-center gap-2 text-accent-red hover:bg-accent-red-bg px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <Trash2 size={16} />
              Delete Goal
            </button>
            
            <button type="submit" className="bg-text-main text-bg-base px-6 py-2 rounded-full font-medium text-sm hover:opacity-90 transition-opacity">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
