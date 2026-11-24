import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type ScheduleSlot } from '../db';
import { 
  formatTime12h, 
  calculateDuration, 
  isCurrentSlot, 
  DEFAULT_MASTER_SCHEDULE,
  seedDefaultSchedule 
} from '../utils/scheduleDefaults';
import { getTodayStr } from '../utils/dateUtils';
import { 
  Clock, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3, 
  Copy, 
  RotateCcw, 
  Sparkles,
  X,
  Calendar,
  Layers
} from 'lucide-react';
import clsx from 'clsx';

const DAYS_OF_WEEK = [
  { id: -1, label: 'Every Day (Master)', short: 'All' },
  { id: 1, label: 'Monday', short: 'Mon' },
  { id: 2, label: 'Tuesday', short: 'Tue' },
  { id: 3, label: 'Wednesday', short: 'Wed' },
  { id: 4, label: 'Thursday', short: 'Thu' },
  { id: 5, label: 'Friday', short: 'Fri' },
  { id: 6, label: 'Saturday', short: 'Sat' },
  { id: 0, label: 'Sunday', short: 'Sun' }
];

interface DailyPlannerProps {
  currentDate?: string; // YYYY-MM-DD
  embedded?: boolean;   // If used inside Highlight page
}

export function DailyPlanner({ currentDate = getTodayStr(), embedded = false }: DailyPlannerProps) {
  // Current active date's day of week (0=Sun, 1=Mon, ..., 6=Sat)
  const currentDayOfWeek = useMemo(() => {
    try {
      const parts = currentDate.split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, parts[2]).getDay();
    } catch {
      return new Date().getDay();
    }
  }, [currentDate]);

  // Selected tab: -1 = All 7 Days Master Plan, 0..6 = specific day of week
  const [selectedDayTab, setSelectedDayTab] = useState<number>(embedded ? currentDayOfWeek : -1);

  // Live query for all schedule slots
  const allSlots = useLiveQuery(() => db.scheduleSlots.toArray()) ?? [];

  // Auto-seed if completely empty
  useEffect(() => {
    if (allSlots.length === 0) {
      seedDefaultSchedule().catch(console.error);
    }
  }, [allSlots.length]);

  // Filter slots for the active view
  const displaySlots = useMemo(() => {
    let filtered: ScheduleSlot[] = [];
    if (selectedDayTab === -1) {
      // Master schedule (slots marked for all days)
      filtered = allSlots.filter(s => s.dayOfWeek === -1 || s.dayOfWeek === undefined);
    } else {
      // Check if there are slots specifically configured for this day
      const daySpecific = allSlots.filter(s => s.dayOfWeek === selectedDayTab);
      if (daySpecific.length > 0) {
        filtered = daySpecific;
      } else {
        // Fall back to master schedule
        filtered = allSlots.filter(s => s.dayOfWeek === -1 || s.dayOfWeek === undefined);
      }
    }

    // Sort by startTime
    return [...filtered].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [allSlots, selectedDayTab]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    startTime: '09:00',
    endTime: '10:00',
    deliverable: '',
    targetScope: 'all' as 'all' | 'day'
  });

  // Action status message
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Open add modal
  const handleOpenAdd = () => {
    setEditingSlot(null);
    setFormData({
      title: '',
      startTime: '09:00',
      endTime: '10:00',
      deliverable: '',
      targetScope: selectedDayTab === -1 ? 'all' : 'day'
    });
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (slot: ScheduleSlot) => {
    setEditingSlot(slot);
    setFormData({
      title: slot.title,
      startTime: slot.startTime,
      endTime: slot.endTime,
      deliverable: slot.deliverable || '',
      targetScope: slot.dayOfWeek === -1 || slot.dayOfWeek === undefined ? 'all' : 'day'
    });
    setIsModalOpen(true);
  };

  // Save slot
  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.startTime || !formData.endTime) return;

    const dayOfWeekVal = formData.targetScope === 'all' 
      ? -1 
      : (selectedDayTab === -1 ? currentDayOfWeek : selectedDayTab);

    if (editingSlot) {
      await db.scheduleSlots.update(editingSlot.id, {
        title: formData.title.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        deliverable: formData.deliverable.trim(),
        dayOfWeek: dayOfWeekVal
      });
      showToast('Schedule slot updated');
    } else {
      const newSlot: ScheduleSlot = {
        id: crypto.randomUUID(),
        title: formData.title.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        deliverable: formData.deliverable.trim(),
        dayOfWeek: dayOfWeekVal,
        order: displaySlots.length,
        completedDates: []
      };
      await db.scheduleSlots.add(newSlot);
      showToast('New focus block added');
    }

    setIsModalOpen(false);
  };

  // Delete slot
  const handleDeleteSlot = async (id: string) => {
    await db.scheduleSlots.delete(id);
    showToast('Block removed');
  };

  // Toggle completion for current date
  const handleToggleComplete = async (slot: ScheduleSlot) => {
    const dates = slot.completedDates || [];
    const isCompleted = dates.includes(currentDate);
    const updatedDates = isCompleted 
      ? dates.filter(d => d !== currentDate)
      : [...dates, currentDate];

    await db.scheduleSlots.update(slot.id, {
      completedDates: updatedDates
    });
  };

  // Apply current view's schedule to all 7 days
  const handleApplyToAll7Days = async () => {
    if (displaySlots.length === 0) return;
    
    // Clear all existing schedule slots and re-add them with dayOfWeek = -1 (All 7 Days)
    await db.scheduleSlots.clear();
    const newMasterSlots: ScheduleSlot[] = displaySlots.map((s, idx) => ({
      id: crypto.randomUUID(),
      title: s.title,
      startTime: s.startTime,
      endTime: s.endTime,
      deliverable: s.deliverable,
      dayOfWeek: -1,
      order: idx,
      completedDates: s.completedDates || []
    }));

    await db.scheduleSlots.bulkAdd(newMasterSlots);
    setSelectedDayTab(-1);
    showToast('Schedule applied to all 7 days of the week');
  };

  // Reload master preset schedule
  const handleReloadDefaultPreset = async () => {
    await db.scheduleSlots.clear();
    const slotsToSeed: ScheduleSlot[] = DEFAULT_MASTER_SCHEDULE.map((slot, index) => ({
      id: crypto.randomUUID(),
      startTime: slot.startTime,
      endTime: slot.endTime,
      title: slot.title,
      deliverable: slot.deliverable,
      dayOfWeek: -1,
      order: index,
      completedDates: []
    }));
    await db.scheduleSlots.bulkAdd(slotsToSeed);
    setSelectedDayTab(-1);
    showToast('Reset to master schedule preset');
  };

  // Completion count
  const completedCount = useMemo(() => {
    return displaySlots.filter(s => s.completedDates?.includes(currentDate)).length;
  }, [displaySlots, currentDate]);

  return (
    <div className={clsx("animate-fade-in", embedded ? "space-y-6" : "space-y-8")}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-blue animate-pulse"></span>
            <h2 className="text-base sm:text-lg font-serif font-semibold text-text-main">
              Daily Schedule & Focus Blocks
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-bg-surface border border-border-strong text-[11px] font-mono text-text-muted">
              {completedCount}/{displaySlots.length} Done
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Structured time slots, focus blocks, and concrete deliverables for the day.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleApplyToAll7Days}
            title="Duplicate current slots to run on all 7 days of the week"
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-bg-surface border border-border-strong text-xs font-medium text-text-muted hover:text-text-main hover:border-accent-blue transition-colors flex items-center gap-1.5 tap-press cursor-pointer"
          >
            <Copy size={13} className="text-accent-blue" />
            <span>Apply to 7 Days</span>
          </button>

          <button
            onClick={handleReloadDefaultPreset}
            title="Restore the master schedule preset"
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-bg-surface border border-border-strong text-xs font-medium text-text-muted hover:text-text-main hover:border-accent-yellow transition-colors flex items-center gap-1.5 tap-press cursor-pointer"
          >
            <RotateCcw size={13} className="text-accent-yellow" />
            <span className="hidden sm:inline">Load Preset</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-text-main text-bg-base text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 tap-press cursor-pointer shadow-sm"
          >
            <Plus size={15} />
            <span>Add Slot</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-2.5 px-4 rounded-xl bg-accent-blue/15 border border-accent-blue/40 text-accent-blue text-xs font-medium flex items-center gap-2 animate-fade-in">
          <Sparkles size={14} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 7-Day & Day-Specific Selector Pill Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {DAYS_OF_WEEK.map(day => {
          const isActive = selectedDayTab === day.id;
          const isToday = day.id === currentDayOfWeek;
          return (
            <button
              key={day.id}
              onClick={() => setSelectedDayTab(day.id)}
              className={clsx(
                "min-h-[36px] px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border tap-press",
                isActive 
                  ? "bg-text-main text-bg-base border-text-main font-semibold shadow-sm" 
                  : "bg-bg-surface border-border-subtle text-text-muted hover:text-text-main hover:border-border-strong"
              )}
            >
              <span>{day.short}</span>
              {isToday && (
                <span className={clsx("w-1.5 h-1.5 rounded-full", isActive ? "bg-bg-base" : "bg-accent-blue")} />
              )}
            </button>
          );
        })}
      </div>

      {/* Time Slots Timeline / List */}
      {displaySlots.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-bg-surface border border-border-subtle space-y-3">
          <Clock size={32} className="mx-auto text-text-muted opacity-40" />
          <h3 className="text-sm font-medium text-text-main">No schedule slots configured for this day</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Add individual time blocks or load your master schedule preset to start tracking.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-text-main text-bg-base text-xs font-semibold hover:opacity-90 cursor-pointer"
            >
              Add First Slot
            </button>
            <button
              onClick={handleReloadDefaultPreset}
              className="px-4 py-2 rounded-xl bg-bg-surface border border-border-strong text-text-muted text-xs font-medium hover:text-text-main cursor-pointer"
            >
              Load Master Preset
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {displaySlots.map((slot) => {
            const isDone = slot.completedDates?.includes(currentDate);
            const isNow = isCurrentSlot(slot.startTime, slot.endTime);
            const duration = calculateDuration(slot.startTime, slot.endTime);

            return (
              <div
                key={slot.id}
                className={clsx(
                  "rounded-2xl border transition-all p-4 sm:p-5 relative group bg-bg-surface hover:border-border-strong",
                  isNow && "ring-2 ring-accent-blue/50 border-accent-blue bg-accent-blue/5 shadow-md",
                  isDone && "opacity-75 bg-bg-surface/60",
                  !isNow && !isDone && "border-border-subtle"
                )}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Completion check button */}
                  <button
                    onClick={() => handleToggleComplete(slot)}
                    className="mt-0.5 text-text-muted hover:text-accent-green transition-colors cursor-pointer shrink-0 tap-press"
                    aria-label={isDone ? "Mark slot incomplete" : "Mark slot completed"}
                    title={isDone ? "Completed today" : "Click to mark complete"}
                  >
                    {isDone ? (
                      <CheckCircle2 size={20} className="text-accent-green fill-accent-green/20" />
                    ) : (
                      <Circle size={20} className="opacity-50 group-hover:opacity-100" />
                    )}
                  </button>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {/* Time Badge */}
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-bg-base border border-border-strong text-text-main">
                        {formatTime12h(slot.startTime)} – {formatTime12h(slot.endTime)}
                      </span>

                      {/* Duration */}
                      {duration && (
                        <span className="text-[11px] font-mono text-text-muted">
                          ({duration})
                        </span>
                      )}

                      {/* Active Indicator */}
                      {isNow && (
                        <span className="px-2 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue font-mono text-[10px] font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-blue"></span>
                          Active Block
                        </span>
                      )}

                      {/* Day Scope Tag if not master */}
                      {slot.dayOfWeek !== undefined && slot.dayOfWeek !== -1 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-surface-hover text-text-muted font-medium border border-border-subtle">
                          {DAYS_OF_WEEK.find(d => d.id === slot.dayOfWeek)?.short} only
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className={clsx(
                      "text-sm sm:text-base font-serif font-medium leading-snug transition-all",
                      isDone ? "line-through text-text-muted" : "text-text-main"
                    )}>
                      {slot.title}
                    </h3>

                    {/* Deliverable / Action Items */}
                    {slot.deliverable && (
                      <div className="mt-2.5 pt-2.5 border-t border-border-subtle/60 text-xs text-text-muted leading-relaxed whitespace-pre-line font-sans">
                        {slot.deliverable}
                      </div>
                    )}
                  </div>

                  {/* Quick Edit / Delete Controls */}
                  <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => handleOpenEdit(slot)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-surface-hover cursor-pointer transition-colors"
                      title="Edit slot"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-accent-red hover:bg-accent-red/10 cursor-pointer transition-colors"
                      title="Delete slot"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-border-strong rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-border-subtle">
              <h3 className="text-lg font-serif font-semibold text-text-main">
                {editingSlot ? 'Edit Schedule Slot' : 'Add Schedule Slot'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-surface-hover cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4">
              {/* Focus Block Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                  Focus Block Title <span className="text-accent-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS50 Python (Block 1) or Morning Routine"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-bg-base border border-border-strong text-text-main text-sm focus:border-accent-blue outline-none"
                />
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                    Start Time <span className="text-accent-red">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-bg-base border border-border-strong text-text-main text-sm font-mono focus:border-accent-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                    End Time <span className="text-accent-red">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-bg-base border border-border-strong text-text-main text-sm font-mono focus:border-accent-blue outline-none"
                  />
                </div>
              </div>

              {/* Scope */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                  Scope
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetScope: 'all' })}
                    className={clsx(
                      "min-h-[40px] px-3 py-2 rounded-xl border font-medium flex items-center justify-center gap-1.5 cursor-pointer tap-press",
                      formData.targetScope === 'all'
                        ? "bg-text-main text-bg-base border-text-main font-semibold"
                        : "bg-bg-base border-border-strong text-text-muted hover:text-text-main"
                    )}
                  >
                    <Layers size={14} />
                    <span>All 7 Days (Every Day)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetScope: 'day' })}
                    className={clsx(
                      "min-h-[40px] px-3 py-2 rounded-xl border font-medium flex items-center justify-center gap-1.5 cursor-pointer tap-press",
                      formData.targetScope === 'day'
                        ? "bg-text-main text-bg-base border-text-main font-semibold"
                        : "bg-bg-base border-border-strong text-text-muted hover:text-text-main"
                    )}
                  >
                    <Calendar size={14} />
                    <span>
                      {selectedDayTab === -1 
                        ? `${DAYS_OF_WEEK.find(d => d.id === currentDayOfWeek)?.short} Only` 
                        : `${DAYS_OF_WEEK.find(d => d.id === selectedDayTab)?.short} Only`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Concrete Action & Deliverables */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                  Concrete Action & Deliverable
                </label>
                <textarea
                  rows={4}
                  placeholder="Specify exact tasks, rules, or deliverables for this time block..."
                  value={formData.deliverable}
                  onChange={e => setFormData({ ...formData, deliverable: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-bg-base border border-border-strong text-text-main text-sm focus:border-accent-blue outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-text-muted hover:text-text-main hover:bg-bg-surface-hover cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-text-main text-bg-base text-xs font-semibold hover:opacity-90 cursor-pointer shadow-sm"
                >
                  {editingSlot ? 'Save Changes' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
