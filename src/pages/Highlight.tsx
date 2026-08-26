import { useState, useEffect } from 'react';
import { db, type DayEntry } from '../db';
import { getTodayDateString } from '../utils/dateUtils';
import { Save, ArrowLeft, CheckCircle2, Edit2, Sparkles, Smile, Meh, Frown, CloudRain } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

const MOODS = [
  { value: 'excellent', label: 'Excellent', Icon: Sparkles, color: 'text-accent-yellow' },
  { value: 'good', label: 'Good', Icon: Smile, color: 'text-accent-green' },
  { value: 'okay', label: 'Okay', Icon: Meh, color: 'text-text-muted' },
  { value: 'not-great', label: 'Not great', Icon: Frown, color: 'text-accent-purple' },
  { value: 'bad', label: 'Bad', Icon: CloudRain, color: 'text-accent-red' },
];

export function Highlight() {
  const [originalDate, setOriginalDate] = useState(getTodayDateString());
  
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
    setTimeout(() => {
      setShowSuccessModal(false);
      setIsCompletedView(true);
    }, 2000);
  };

  const cancelConflict = () => {
    setShowConflictModal(false);
    // revert date change
    setEntry(prev => ({ ...prev, date: originalDate }));
  };

  if (isLoading) return null;

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in relative">
      
      {/* Conflict Modal */}
      {showConflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-border-strong rounded-2xl p-8 shadow-xl max-w-sm w-full text-center flex flex-col gap-6 animate-scale-in">
            <div>
              <h3 className="text-xl font-semibold text-text-main">Entry Already Exists</h3>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-border-strong rounded-2xl p-8 shadow-xl max-w-sm w-full text-center flex flex-col items-center gap-4 animate-scale-in">
            <div className="w-16 h-16 bg-accent-red-bg text-accent-red rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-text-main">Entry Done</h3>
              <p className="text-text-muted mt-2">The entry has been saved successfully.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 border-b border-border-subtle pb-6 gap-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-text-muted hover:text-text-main transition-colors shrink-0">
            <ArrowLeft size={24} />
          </Link>
          
          <div className="flex flex-col gap-1">
            {isCompletedView ? (
              <div className="flex items-center gap-4">
                <input 
                  type="date"
                  value={originalDate}
                  onChange={e => {
                    if (e.target.value) setOriginalDate(e.target.value);
                  }}
                  className="bg-transparent text-2xl font-serif italic text-text-main focus:outline-none focus:border-b focus:border-text-muted transition-all cursor-pointer"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-text-muted font-medium">Record Date</label>
                <input 
                  type="date"
                  value={entry.date}
                  onChange={e => setEntry({ ...entry, date: e.target.value })}
                  className="bg-bg-surface border border-border-strong rounded-lg px-3 py-2 text-lg font-serif italic text-text-main focus:outline-none focus:border-text-muted transition-all w-48"
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
              className="flex items-center justify-center gap-2 bg-text-main text-bg-base px-5 py-2.5 rounded-full font-medium text-sm hover:opacity-90 transition-all active:scale-95 shrink-0"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        )}
      </header>

      {isCompletedView ? (
        <CompletedView entry={entry} onEdit={() => setIsCompletedView(false)} />
      ) : (
        <EditableForm entry={entry} setEntry={setEntry} />
      )}
    </div>
  );
}

function CompletedView({ entry, onEdit }: { entry: Partial<DayEntry>, onEdit: () => void }) {
  const moodObj = MOODS.find(m => m.value === entry.mood);

  return (
    <div className="animate-fade-in space-y-12">
      <div className="bg-bg-surface border border-border-strong rounded-3xl p-8 md:p-12 shadow-sm relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-red-bg rounded-bl-full -z-10 opacity-50" />

        <div className="flex justify-between items-start mb-8 border-b border-border-subtle pb-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-accent-red" size={24} />
            <h2 className="text-xl font-semibold text-text-main tracking-tight">Today's entry is complete</h2>
          </div>
          <button 
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-bg-base border border-border-strong rounded-full text-text-main hover:bg-bg-surface-hover transition-colors text-sm font-medium"
          >
            <Edit2 size={14} />
            Edit Entry
          </button>
        </div>

        <div className="space-y-10">
          {moodObj && (
            <div>
              <h3 className="text-xs font-semibold tracking-widest uppercase text-text-muted mb-2">How was your day?</h3>
              <p className="text-xl text-text-main flex items-center gap-2">
                <span className={moodObj.color}><moodObj.Icon size={24} /></span> {moodObj.label}
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

function EditableForm({ entry, setEntry }: { entry: Partial<DayEntry>, setEntry: (e: Partial<DayEntry>) => void }) {
  return (
    <div className="space-y-12 animate-fade-in max-w-3xl mx-auto pt-6">
      
      {/* Mood Selector */}
      <section className="bg-bg-surface border border-border-strong rounded-3xl p-8 shadow-sm">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-text-muted mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-blue"></span>
          Mood <span className="text-accent-red ml-1">*</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {MOODS.map(m => (
            <button
              key={m.value}
              onClick={() => setEntry({ ...entry, mood: m.value as any })}
              className={clsx(
                "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300",
                entry.mood === m.value 
                  ? "border-accent-blue bg-accent-blue-bg text-text-main shadow-md scale-105" 
                  : "border-border-subtle bg-transparent text-text-muted hover:border-border-strong hover:bg-bg-surface-hover hover:scale-[1.02]"
              )}
            >
              <m.Icon size={32} className={clsx("transition-colors", entry.mood === m.value ? m.color : "text-text-muted")} />
              <span className="text-xs font-medium">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Highlight of the day */}
      <section className="bg-bg-surface border border-border-strong rounded-3xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-8 pb-4 border-b border-border-subtle bg-bg-surface-hover/50">
           <h2 className="text-xs font-semibold tracking-widest uppercase text-text-muted flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-accent-yellow"></span>
             Daily Highlight <span className="text-accent-red ml-1">*</span>
           </h2>
           <p className="text-sm font-medium text-text-main mt-2">What made today worth remembering?</p>
        </div>
        <textarea
          value={entry.highlight || ''}
          onChange={e => setEntry({ ...entry, highlight: e.target.value })}
          placeholder="Start writing freely..."
          className="w-full min-h-[220px] p-8 bg-transparent border-none resize-none focus:outline-none text-xl text-text-main font-serif leading-relaxed placeholder:text-text-muted/40"
        />
      </section>

      {/* Lightweight Reflections */}
      <section>
        <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-text-muted mb-6 flex items-center gap-2 px-2">
           <span className="w-2 h-2 rounded-full bg-accent-purple"></span>
           Daily Reflection
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="mt-4">
           <ReflectionField 
            label="What do I want to do tomorrow?" 
            value={entry.tomorrowPriorities} 
            onChange={val => setEntry({ ...entry, tomorrowPriorities: val })} 
          />
        </div>
      </section>
      
    </div>
  );
}

function ReflectionField({ label, value, onChange }: { label: string, value: string | undefined, onChange: (val: string) => void }) {
  return (
    <div className="bg-bg-surface border border-border-strong rounded-2xl p-6 transition-all focus-within:border-accent-blue focus-within:ring-2 focus-within:ring-accent-blue-bg group shadow-sm hover:border-text-muted">
      <label className="block text-[10px] font-bold tracking-widest uppercase text-text-muted mb-3 group-focus-within:text-accent-blue transition-colors">{label}</label>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        rows={3}
        placeholder="Tap to write..."
        className="w-full bg-transparent border-none resize-none focus:outline-none text-text-main text-base placeholder:text-text-muted/30"
      />
    </div>
  );
}
