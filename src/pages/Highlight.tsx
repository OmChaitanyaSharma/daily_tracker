import { useState, useEffect, useCallback } from 'react';
import { db, type DayEntry } from '../db';
import { getTodayDateString } from '../utils/dateUtils';
import { Save, ArrowLeft, CheckCircle2, Edit2, Sparkles, Smile, Meh, Frown, CloudRain, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TodoList } from '../components/TodoList';
import { addDays, parseISO, format } from 'date-fns';
import clsx from 'clsx';
import { useSound } from '../hooks/useSound';
import { getSettings, saveSettings, DEFAULT_MOOD_LABELS, type MoodLabels } from '../utils/settings';

export const MOOD_DEFINITIONS = [
  { value: 'excellent' as const, defaultLabel: 'Excellent', Icon: Sparkles, color: 'text-accent-yellow' },
  { value: 'good' as const, defaultLabel: 'Good', Icon: Smile, color: 'text-accent-green' },
  { value: 'okay' as const, defaultLabel: 'Okay', Icon: Meh, color: 'text-text-muted' },
  { value: 'not-great' as const, defaultLabel: 'Not great', Icon: Frown, color: 'text-accent-purple' },
  { value: 'bad' as const, defaultLabel: 'Bad', Icon: CloudRain, color: 'text-accent-red' },
];

export function Highlight() {
  const { playSuccess } = useSound();
  const [originalDate, setOriginalDate] = useState(getTodayDateString());
  const [settings, setSettings] = useState(() => getSettings());
  const [isEditingMoods, setIsEditingMoods] = useState(false);
  const [editMoodLabels, setEditMoodLabels] = useState<MoodLabels>(() => ({ ...settings.moodLabels }));
  
  const [entry, setEntry] = useState<Partial<DayEntry>>({
    date: getTodayDateString(),
    mood: '',
    highlight: '',
    oneLineSummary: '',
    wentWell: '',
    problems: '',
    reflection: '',
    notes: '',
    subjectiveScore: 0,
    objectiveScore: 0
  });
  
  const [isCompletedView, setIsCompletedView] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Navigating to a specific date loads its data
  useEffect(() => {
    async function loadData() {
      const existingEntry = await db.dayEntries.get(originalDate);
      if (existingEntry) {
        setEntry(existingEntry);
        setIsCompletedView(true);
      } else {
        setEntry({
          date: originalDate,
          mood: '',
          highlight: '',
          oneLineSummary: '',
          wentWell: '',
          problems: '',
          reflection: '',
          notes: '',
          subjectiveScore: 0,
          objectiveScore: 0
        });
        setIsCompletedView(false);
      }
      setIsLoading(false);
    }
    loadData();
  }, [originalDate]);

  const attemptSave = async () => {
    if (!entry.mood || !entry.highlight || entry.highlight.trim() === '') {
      setErrorMsg('Mood and Daily Highlight are required to save.');
      setTimeout(() => setErrorMsg(''), 5000);
      return;
    }

    // 1. Check for future date
    const today = getTodayDateString();
    if (entry.date && entry.date > today) {
      const confirmFuture = window.confirm(`You are saving an entry for a future date (${entry.date}). Are you sure?`);
      if (!confirmFuture) return;
    }

    // 2. Check for date conflict if the date was changed
    if (entry.date && entry.date !== originalDate) {
      const existingAtNewDate = await db.dayEntries.get(entry.date);
      if (existingAtNewDate) {
        setShowConflictModal(true);
        return;
      }
    }

    await performSave();
  };

  const performSave = async () => {
    setIsSaving(true);
    if (entry.date !== originalDate) {
      await db.dayEntries.delete(originalDate); // delete old
    }
    await db.dayEntries.put(entry as DayEntry);
    setOriginalDate(entry.date!);
    setIsSaving(false);
    setShowConflictModal(false);
    
    setShowSuccessModal(true);
    playSuccess();
    setTimeout(() => {
      setShowSuccessModal(false);
      setIsCompletedView(true);
    }, 2000);
  };

  const cancelConflict = useCallback(() => {
    setShowConflictModal(false);
    // revert date change
    setEntry(prev => ({ ...prev, date: originalDate }));
  }, [originalDate]);

  const handleSaveMoodLabels = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...settings,
      moodLabels: {
        excellent: editMoodLabels.excellent.trim() || DEFAULT_MOOD_LABELS.excellent,
        good: editMoodLabels.good.trim() || DEFAULT_MOOD_LABELS.good,
        okay: editMoodLabels.okay.trim() || DEFAULT_MOOD_LABELS.okay,
        'not-great': editMoodLabels['not-great'].trim() || DEFAULT_MOOD_LABELS['not-great'],
        bad: editMoodLabels.bad.trim() || DEFAULT_MOOD_LABELS.bad,
      }
    };
    saveSettings(updated);
    setSettings(updated);
    setEditMoodLabels({ ...updated.moodLabels });
    setIsEditingMoods(false);
    playSuccess();
  };

  const handleResetMoodLabels = () => {
    setEditMoodLabels({ ...DEFAULT_MOOD_LABELS });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConflictModal) cancelConflict();
        if (showSuccessModal) setShowSuccessModal(false);
        if (isEditingMoods) setIsEditingMoods(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showConflictModal, showSuccessModal, isEditingMoods, cancelConflict]);

  if (isLoading) return null;

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in relative">
      
      {/* Conflict Modal */}
      {showConflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="conflict-dialog-title">
          <div className="bg-bg-surface border border-border-strong rounded-2xl p-8 shadow-xl max-w-sm w-full text-center flex flex-col gap-6 animate-scale-in">
            <div>
              <h3 id="conflict-dialog-title" className="text-xl font-semibold text-text-main">Entry Already Exists</h3>
              <p className="text-text-muted mt-2 text-sm leading-relaxed">
                An entry already exists for {entry.date}. What would you like to do?
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={performSave} 
                className="w-full py-2.5 bg-accent-red text-bg-base font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Replace Existing Entry
              </button>
              <button 
                onClick={cancelConflict} 
                className="w-full py-2.5 bg-bg-base border border-border-strong text-text-main font-medium rounded-lg hover:bg-bg-surface-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="success-dialog-title">
          <div className="bg-bg-surface border border-border-strong rounded-2xl p-8 shadow-xl max-w-sm w-full text-center flex flex-col items-center gap-4 animate-scale-in">
            <div className="w-16 h-16 bg-accent-red-bg text-accent-red rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 id="success-dialog-title" className="text-xl font-semibold text-text-main">Entry Done</h3>
              <p className="text-text-muted mt-2">The entry has been saved successfully.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12 border-b border-border-subtle pb-6 gap-4 sm:gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/" className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main transition-colors rounded-full hover:bg-bg-surface tap-press cursor-pointer shrink-0" aria-label="Go back to home">
            <ArrowLeft size={24} />
          </Link>
          
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl sm:text-3xl font-serif italic text-text-main font-semibold">
              Daily Highlight & Reflection
            </h1>
            {isCompletedView ? (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-text-muted font-medium">Viewing Date:</span>
                <input 
                  type="date"
                  value={originalDate}
                  id="view-entry-date"
                  aria-label="Select entry date"
                  onChange={e => {
                    if (e.target.value) setOriginalDate(e.target.value);
                  }}
                  className="bg-transparent text-sm sm:text-base font-serif italic text-text-main focus:outline-none focus:border-b focus:border-text-muted transition-all cursor-pointer min-h-[36px]"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <label htmlFor="record-date" className="text-xs uppercase tracking-widest text-text-muted font-medium">Record Date:</label>
                <input 
                  id="record-date"
                  type="date"
                  value={entry.date}
                  onChange={e => setEntry({ ...entry, date: e.target.value })}
                  className="bg-bg-surface border border-border-strong rounded-xl px-3 py-1.5 min-h-[36px] text-sm font-serif italic text-text-main focus:outline-none focus:border-text-muted transition-all w-40"
                />
              </div>
            )}
          </div>
        </div>
        
        {!isCompletedView && (
          <div className="flex items-center gap-4">
            {errorMsg && (
              <span className="text-accent-red text-sm font-medium animate-fade-in">{errorMsg}</span>
            )}
            <button 
              onClick={attemptSave}
              disabled={isSaving}
              aria-label={isSaving ? 'Saving journal entry...' : 'Save journal entry'}
              className="flex items-center justify-center gap-2 bg-text-main text-bg-base px-5 py-2.5 min-h-[44px] rounded-full font-semibold text-sm hover:opacity-90 transition-all active:scale-95 shrink-0 tap-press cursor-pointer"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        )}
      </header>

      {isCompletedView ? (
        <CompletedView 
          entry={entry} 
          onEdit={() => setIsCompletedView(false)} 
          moodLabels={settings.moodLabels}
          onOpenEditMoods={() => setIsEditingMoods(true)}
        />
      ) : (
        <EditableForm 
          entry={entry} 
          setEntry={setEntry} 
          moodLabels={settings.moodLabels}
          onOpenEditMoods={() => setIsEditingMoods(true)}
        />
      )}

      {/* Mood Customization Modal */}
      {isEditingMoods && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/70 backdrop-blur-sm animate-fade-in p-4" 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="edit-moods-title"
          onClick={() => setIsEditingMoods(false)}
        >
          <div 
            className="bg-bg-surface border border-border-strong rounded-3xl p-6 sm:p-8 shadow-2xl max-w-md w-full animate-scale-in relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent-blue/15 text-accent-blue flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 id="edit-moods-title" className="text-lg font-serif italic text-text-main font-semibold">
                    Customize Mood Names
                  </h3>
                  <p className="text-xs text-text-muted">
                    Rename each mood to match your personal vibe
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditingMoods(false)}
                className="w-10 h-10 min-w-[40px] flex items-center justify-center text-text-muted hover:text-text-main rounded-full hover:bg-bg-base transition-colors cursor-pointer tap-press"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMoodLabels} className="space-y-3.5">
              {MOOD_DEFINITIONS.map(m => (
                <div key={m.value} className="flex items-center gap-3 bg-bg-base/60 border border-border-subtle p-2.5 rounded-2xl">
                  <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center bg-bg-surface border border-border-strong shrink-0", m.color)}>
                    <m.Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <label htmlFor={`mood-label-${m.value}`} className="text-[10px] uppercase font-bold tracking-wider text-text-muted block leading-none mb-1">
                      Default: {m.defaultLabel}
                    </label>
                    <input 
                      id={`mood-label-${m.value}`}
                      type="text"
                      maxLength={30}
                      value={editMoodLabels[m.value as keyof MoodLabels] || ''}
                      onChange={e => setEditMoodLabels(prev => ({
                        ...prev,
                        [m.value]: e.target.value
                      }))}
                      placeholder={m.defaultLabel}
                      className="w-full bg-transparent border-none text-sm font-medium text-text-main focus:outline-none placeholder:text-text-muted/40"
                    />
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-4 border-t border-border-subtle mt-6 gap-2">
                <button
                  type="button"
                  onClick={handleResetMoodLabels}
                  className="min-h-[40px] px-3 py-2 text-xs text-text-muted hover:text-text-main transition-colors cursor-pointer tap-press"
                >
                  Reset Defaults
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingMoods(false)}
                    className="min-h-[40px] px-4 py-2 rounded-xl border border-border-strong text-text-muted hover:text-text-main text-xs font-semibold cursor-pointer tap-press"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-text-main text-bg-base text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer tap-press flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>Save Names</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CompletedView({ 
  entry, 
  onEdit, 
  moodLabels, 
  onOpenEditMoods 
}: { 
  entry: Partial<DayEntry>, 
  onEdit: () => void, 
  moodLabels: MoodLabels,
  onOpenEditMoods: () => void
}) {
  const moodObj = MOOD_DEFINITIONS.find(m => m.value === entry.mood);
  const moodLabel = moodObj ? (moodLabels[moodObj.value] || moodObj.defaultLabel) : entry.mood;

  return (
    <div className="animate-fade-in space-y-8 sm:space-y-12">
      <div className="bg-bg-surface border border-border-strong rounded-3xl p-6 sm:p-8 md:p-12 shadow-sm relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-red-bg rounded-bl-full -z-10 opacity-50" />

        <div className="flex justify-between items-start mb-8 border-b border-border-subtle pb-6 gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-accent-red shrink-0" size={24} />
            <h2 className="text-lg sm:text-xl font-semibold text-text-main tracking-tight">Today's entry is complete</h2>
          </div>
          <button 
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-bg-base border border-border-strong rounded-full text-text-main hover:bg-bg-surface-hover transition-colors text-sm font-medium tap-press cursor-pointer shrink-0"
          >
            <Edit2 size={14} />
            Edit Entry
          </button>
        </div>

        <div className="space-y-10">
          {moodObj && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold tracking-widest uppercase text-text-muted">How was your day?</h3>
                <button
                  type="button"
                  onClick={onOpenEditMoods}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border-subtle bg-bg-base hover:border-accent-blue/50 text-[11px] font-medium text-text-muted hover:text-text-main transition-all cursor-pointer tap-press"
                  aria-label="Edit mood names"
                >
                  <Edit2 size={11} className="text-accent-blue" />
                  <span>Edit Mood Names</span>
                </button>
              </div>
              <p className="text-xl text-text-main flex items-center gap-2">
                <span className={moodObj.color}><moodObj.Icon size={24} /></span> {moodLabel}
              </p>
            </div>
          )}

          {entry.highlight && (
            <div>
              <h3 className="text-xs font-semibold tracking-widest uppercase text-text-muted mb-2">Highlight</h3>
              <p className="text-lg text-text-main whitespace-pre-wrap leading-relaxed font-serif">
                {entry.highlight}
              </p>
            </div>
          )}
          
          <div className="pt-6 border-t border-border-subtle grid grid-cols-1 md:grid-cols-2 gap-8">
            {entry.wentWell && (
              <div>
                <span className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1">Went well</span>
                <p className="text-text-main">{entry.wentWell}</p>
              </div>
            )}
            {entry.problems && (
              <div>
                <span className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1">Didn't go well</span>
                <p className="text-text-main">{entry.problems}</p>
              </div>
            )}
            {entry.learned && (
              <div>
                <span className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1">Learned</span>
                <p className="text-text-main">{entry.learned}</p>
              </div>
            )}
            {entry.tomorrowPriorities && (
              <div>
                <span className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1">Tomorrow's Priorities</span>
                <p className="text-text-main">{entry.tomorrowPriorities}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditableForm({ 
  entry, 
  setEntry, 
  moodLabels, 
  onOpenEditMoods 
}: { 
  entry: Partial<DayEntry>, 
  setEntry: (e: Partial<DayEntry>) => void,
  moodLabels: MoodLabels,
  onOpenEditMoods: () => void
}) {
  return (
    <div className="space-y-12 animate-fade-in max-w-3xl mx-auto pt-6">
      
      {/* Mood Selector */}
      <section className="bg-bg-surface border border-border-strong rounded-3xl p-5 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-text-muted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-blue"></span>
            Mood <span className="text-accent-red ml-1">*</span>
          </h2>
          <button
            type="button"
            onClick={onOpenEditMoods}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-subtle bg-bg-surface hover:border-accent-blue/50 hover:bg-accent-blue/10 text-xs font-medium text-text-muted hover:text-text-main transition-all cursor-pointer tap-press"
            aria-label="Edit mood names"
          >
            <Edit2 size={12} className="text-accent-blue" />
            <span>Edit Names</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3">
          {MOOD_DEFINITIONS.map(m => {
            const label = moodLabels[m.value] || m.defaultLabel;
            return (
              <button
                key={m.value}
                onClick={() => setEntry({ ...entry, mood: m.value as any })}
                className={clsx(
                  "flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 min-h-[56px] rounded-2xl border transition-all duration-300 tap-press cursor-pointer",
                  entry.mood === m.value 
                    ? "border-accent-blue bg-accent-blue-bg text-text-main shadow-md scale-105" 
                    : "border-border-subtle bg-transparent text-text-muted hover:border-border-strong hover:bg-bg-surface-hover hover:scale-[1.02]"
                )}
              >
                <m.Icon size={28} className={clsx("transition-colors", entry.mood === m.value ? m.color : "text-text-muted")} />
                <span className="text-xs font-medium text-center truncate max-w-full px-1">{label}</span>
              </button>
            );
          })}

          {/* 6th Slot: Customize Mood Names button (fills 6th cell in 2-column mobile grid!) */}
          <button
            type="button"
            onClick={onOpenEditMoods}
            className="flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 min-h-[56px] rounded-2xl border border-dashed border-border-strong bg-transparent text-text-muted hover:border-accent-blue hover:text-text-main hover:bg-bg-surface-hover transition-all duration-300 tap-press cursor-pointer group"
            aria-label="Customize mood names"
          >
            <Edit2 size={24} className="text-text-muted group-hover:text-accent-blue transition-colors" />
            <span className="text-xs font-medium">Edit Names</span>
          </button>
        </div>
      </section>

      {/* Highlight of the day */}
      <section className="bg-bg-surface border border-border-strong rounded-3xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-5 sm:p-8 pb-3 sm:pb-4 border-b border-border-subtle bg-bg-surface-hover/50">
           <h2 className="text-xs font-semibold tracking-widest uppercase text-text-muted flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-accent-yellow"></span>
             Daily Highlight <span className="text-accent-red ml-1">*</span>
           </h2>
           <p className="text-xs sm:text-sm font-medium text-text-main mt-1 sm:mt-2">What made today worth remembering?</p>
        </div>
        <textarea
          id="daily-highlight"
          aria-label="Daily Highlight: What made today worth remembering?"
          value={entry.highlight || ''}
          onChange={e => setEntry({ ...entry, highlight: e.target.value })}
          placeholder="Write the core win, event, or breakthrough from today..."
          className="w-full min-h-[180px] sm:min-h-[220px] p-5 sm:p-8 bg-transparent border-none resize-none focus:outline-none text-base sm:text-xl text-text-main font-serif leading-relaxed placeholder:text-text-muted/40"
        />
      </section>

      {/* To-Do List */}
      <section>
        <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-text-muted mb-4 sm:mb-6 flex items-center gap-2 px-2">
           <span className="w-2 h-2 rounded-full bg-accent-green"></span>
           To-Do (Tomorrow)
        </h2>
        <div className="group">
          <TodoList date={format(addDays(parseISO(entry.date!), 1), 'yyyy-MM-dd')} title="" />
        </div>
      </section>

      {/* Lightweight Reflections */}
      <section>
        <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-text-muted mb-4 sm:mb-6 flex items-center gap-2 px-2">
           <span className="w-2 h-2 rounded-full bg-accent-purple"></span>
           Daily Reflection
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <ReflectionField 
            label="What went well?" 
            value={entry.wentWell} 
            onChange={val => setEntry({ ...entry, wentWell: val })} 
          />
          <ReflectionField 
            label="What didn't go well?" 
            value={entry.problems} 
            onChange={val => setEntry({ ...entry, problems: val })} 
          />
          <ReflectionField 
            label="What did I learn?" 
            value={entry.learned} 
            onChange={val => setEntry({ ...entry, learned: val })} 
          />
          <ReflectionField 
            label="What do I want to remember?" 
            value={entry.whatIWantToRemember} 
            onChange={val => setEntry({ ...entry, whatIWantToRemember: val })} 
          />
        </div>


      </section>
      
    </div>
  );
}

function ReflectionField({ label, value, onChange }: { label: string, value: string | undefined, onChange: (val: string) => void }) {
  const fieldId = `reflection-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  return (
    <div className="bg-bg-surface border border-border-strong rounded-2xl p-4 sm:p-6 transition-all focus-within:border-accent-blue focus-within:ring-2 focus-within:ring-accent-blue-bg group shadow-sm hover:border-text-muted">
      <label htmlFor={fieldId} className="block text-[10px] font-bold tracking-widest uppercase text-text-muted mb-2 sm:mb-3 group-focus-within:text-accent-blue transition-colors">{label}</label>
      <textarea
        id={fieldId}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        rows={3}
        placeholder="Add note..."
        className="w-full bg-transparent border-none resize-none focus:outline-none text-text-main text-base placeholder:text-text-muted/30"
      />
    </div>
  );
}
