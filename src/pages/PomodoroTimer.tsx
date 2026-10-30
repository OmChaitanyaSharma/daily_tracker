import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getTodayStr } from '../utils/dateUtils';
import { playTimerCompletionChime } from '../utils/pomodoroAudio';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Coffee, 
  Brain, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ArrowLeft,
  Sliders,
  Check,
  RotateCcw as ResetIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

import { type PomodoroMode, type PomodoroDurations, DEFAULT_DURATIONS } from '../utils/pomodoroConstants';

interface SessionState {
  mode: PomodoroMode;
  timeLeft: number;
  totalDuration: number;
  isRunning: boolean;
  targetEndTime: number | null;
  selectedCategory: string;
}

const STORAGE_KEY = 'daily_tracker_pomodoro_state';
const DURATIONS_STORAGE_KEY = 'daily_tracker_pomodoro_durations';
const EMPTY_CATEGORIES: any[] = [];

export function PomodoroTimer() {
  const categories = useLiveQuery(() => db.hourCategories.toArray()) ?? EMPTY_CATEGORIES;
  const todayStr = getTodayStr();

  // Custom durations state (with 25, 50, 5, 15 as accessible presets/defaults)
  const [durations, setDurations] = useState<PomodoroDurations>(() => {
    const saved = localStorage.getItem(DURATIONS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          focus: Number(parsed.focus) > 0 ? Number(parsed.focus) : DEFAULT_DURATIONS.focus,
          shortBreak: Number(parsed.shortBreak) > 0 ? Number(parsed.shortBreak) : DEFAULT_DURATIONS.shortBreak,
          longBreak: Number(parsed.longBreak) > 0 ? Number(parsed.longBreak) : DEFAULT_DURATIONS.longBreak
        };
      } catch {
        // Fallback to defaults
      }
    }
    return { ...DEFAULT_DURATIONS };
  });

  // Sound preference
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('pomodoro_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Auto-log to hourLogs toggle
  const [autoLogEnabled, setAutoLogEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('pomodoro_auto_log');
    return saved !== null ? saved === 'true' : true;
  });

  // Completed sessions count today
  const [completedToday, setCompletedToday] = useState<number>(() => {
    const saved = localStorage.getItem(`pomodoro_completed_${todayStr}`);
    return saved ? parseInt(saved, 10) : 0;
  });

  // Status message / toast
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Inline time edit mode
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [inlineMinutesInput, setInlineMinutesInput] = useState('');

  // Show settings / customization drawer
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Initialize session state from localStorage or defaults
  const [session, setSession] = useState<SessionState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isRunning && parsed.targetEndTime) {
          const remaining = Math.max(0, Math.round((parsed.targetEndTime - Date.now()) / 1000));
          return {
            ...parsed,
            timeLeft: remaining,
            isRunning: remaining > 0
          };
        }
        return parsed;
      } catch {
        // Fallback
      }
    }
    return {
      mode: 'focus',
      timeLeft: DEFAULT_DURATIONS.focus * 60,
      totalDuration: DEFAULT_DURATIONS.focus * 60,
      isRunning: false,
      targetEndTime: null,
      selectedCategory: 'Web Dev'
    };
  });

  // Active category derived cleanly without cascading renders
  const activeCategory = useMemo(() => {
    if (categories.length === 0) return session.selectedCategory || 'Web Dev';
    if (categories.some(c => c.name === session.selectedCategory)) {
      return session.selectedCategory;
    }
    return categories[0].name;
  }, [categories, session.selectedCategory]);

  // Persist session changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  // Persist custom durations
  useEffect(() => {
    localStorage.setItem(DURATIONS_STORAGE_KEY, JSON.stringify(durations));
  }, [durations]);

  // Save sound preference
  useEffect(() => {
    localStorage.setItem('pomodoro_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  // Save auto-log preference
  useEffect(() => {
    localStorage.setItem('pomodoro_auto_log', String(autoLogEnabled));
  }, [autoLogEnabled]);

  // Save completed count
  useEffect(() => {
    localStorage.setItem(`pomodoro_completed_${todayStr}`, String(completedToday));
  }, [completedToday, todayStr]);

  const notifyCompletion = useCallback(async (mode: PomodoroMode, categoryName: string, durationSec: number) => {
    if (soundEnabled) {
      playTimerCompletionChime();
    }

    if (mode === 'focus') {
      setCompletedToday(prev => prev + 1);

      if (autoLogEnabled) {
        const hoursLogged = +(durationSec / 3600).toFixed(2);
        if (isNaN(hoursLogged) || hoursLogged <= 0 || !isFinite(hoursLogged)) {
          return;
        }
        const cleanCategory = typeof categoryName === 'string' && categoryName.trim() 
          ? categoryName.trim().slice(0, 50) 
          : 'Study';

        try {
          await db.hourLogs.add({
            id: crypto.randomUUID(),
            date: todayStr,
            activity: cleanCategory,
            hours: hoursLogged
          });
          setStatusMessage(`Logged ${hoursLogged}h to ${cleanCategory} for today.`);
          setTimeout(() => setStatusMessage(null), 5000);
        } catch (err) {
          console.error('Failed to auto-log focus hours:', err);
        }
      } else {
        setStatusMessage('Focus session completed. Great work!');
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } else {
      setStatusMessage('Break completed. Ready to focus again?');
      setTimeout(() => setStatusMessage(null), 4000);
    }
  }, [soundEnabled, autoLogEnabled, todayStr]);

  // Timer interval with background drift protection
  const sessionRef = useRef(session);
  const durationsRef = useRef(durations);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    durationsRef.current = durations;
  }, [durations]);

  useEffect(() => {
    if (!session.isRunning) return;

    const interval = setInterval(() => {
      const cur = sessionRef.current;
      if (!cur.isRunning || !cur.targetEndTime) return;

      const remaining = Math.max(0, Math.round((cur.targetEndTime - Date.now()) / 1000));
      if (remaining <= 0) {
        // Complete current session
        const finishedMode = cur.mode;
        const finishedCategory = cur.selectedCategory;
        const finishedDuration = cur.totalDuration;

        // Transition to next mode
        const nextMode: PomodoroMode = finishedMode === 'focus' ? 'shortBreak' : 'focus';
        const nextDurationSec = (durationsRef.current[nextMode] || DEFAULT_DURATIONS[nextMode]) * 60;

        setSession({
          mode: nextMode,
          timeLeft: nextDurationSec,
          totalDuration: nextDurationSec,
          isRunning: false,
          targetEndTime: null,
          selectedCategory: cur.selectedCategory
        });

        notifyCompletion(finishedMode, finishedCategory, finishedDuration);
      } else {
        setSession(prev => ({ ...prev, timeLeft: remaining }));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [session.isRunning, notifyCompletion]);

  // Window title update
  useEffect(() => {
    const minutes = Math.floor(session.timeLeft / 60);
    const seconds = session.timeLeft % 60;
    const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const modeLabel = session.mode === 'focus' ? 'Focus' : session.mode === 'shortBreak' ? 'Short Break' : 'Long Break';

    if (session.isRunning) {
      document.title = `(${timeFormatted}) ${modeLabel} - Progress.`;
    } else {
      document.title = 'Pomodoro Timer - Progress.';
    }

    return () => {
      document.title = 'Daily Tracker';
    };
  }, [session.timeLeft, session.mode, session.isRunning]);

  // Mode switcher
  const switchMode = (newMode: PomodoroMode, overrideMinutes?: number) => {
    const mins = overrideMinutes ?? (durations[newMode] || DEFAULT_DURATIONS[newMode]);
    const durSec = mins * 60;
    setIsEditingInline(false);
    setSession(prev => ({
      ...prev,
      mode: newMode,
      timeLeft: durSec,
      totalDuration: durSec,
      isRunning: false,
      targetEndTime: null
    }));
  };

  const updateDuration = (mode: PomodoroMode, newMinutes: number) => {
    const num = Number(newMinutes);
    if (isNaN(num) || !isFinite(num)) return;
    const clamped = Math.max(1, Math.min(720, Math.round(num)));
    setDurations(prev => ({
      ...prev,
      [mode]: clamped
    }));

    // If currently on this mode and paused, update clock immediately
    if (session.mode === mode && !session.isRunning) {
      const durSec = clamped * 60;
      setSession(prev => ({
        ...prev,
        timeLeft: durSec,
        totalDuration: durSec,
        targetEndTime: null
      }));
    }
  };

  // Quick incremental adjust (+1m, -1m, +5m, -5m) while paused
  const adjustCurrentMinutes = (deltaMinutes: number) => {
    if (session.isRunning) return;
    const currentMins = Math.max(1, Math.round(session.timeLeft / 60) + deltaMinutes);
    updateDuration(session.mode, currentMins);
  };

  // Submit inline manual minutes input
  const handleApplyInlineMinutes = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(inlineMinutesInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      updateDuration(session.mode, parsed);
    }
    setIsEditingInline(false);
  };

  const handleStartPause = () => {
    setIsEditingInline(false);
    if (session.isRunning) {
      // Pause
      setSession(prev => ({
        ...prev,
        isRunning: false,
        targetEndTime: null
      }));
    } else {
      // Start
      const targetEndTime = Date.now() + session.timeLeft * 1000;
      setSession(prev => ({
        ...prev,
        isRunning: true,
        targetEndTime
      }));
    }
  };

  const handleReset = () => {
    setIsEditingInline(false);
    const mins = durations[session.mode] || DEFAULT_DURATIONS[session.mode];
    const durSec = mins * 60;
    setSession(prev => ({
      ...prev,
      timeLeft: durSec,
      totalDuration: durSec,
      isRunning: false,
      targetEndTime: null
    }));
  };

  const handleSkip = () => {
    setIsEditingInline(false);
    const nextMode: PomodoroMode = session.mode === 'focus' ? 'shortBreak' : 'focus';
    switchMode(nextMode);
  };

  const resetAllDurationsToDefault = () => {
    setDurations({ ...DEFAULT_DURATIONS });
    if (!session.isRunning) {
      const defSec = DEFAULT_DURATIONS[session.mode] * 60;
      setSession(prev => ({
        ...prev,
        timeLeft: defSec,
        totalDuration: defSec,
        targetEndTime: null
      }));
    }
    setStatusMessage('Restored default intervals (25m Focus, 5m Short Break, 15m Long Break).');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Keyboard shortcut: Space to toggle start/pause, R to reset, S to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (['input', 'textarea', 'select'].includes(activeTag)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleStartPause();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Formatting
  const minutes = Math.floor(session.timeLeft / 60);
  const seconds = session.timeLeft % 60;
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressFraction = session.totalDuration > 0 ? (session.totalDuration - session.timeLeft) / session.totalDuration : 0;
  const strokeDashoffset = 565.48 * (1 - progressFraction);

  // Mode accent colors
  const modeColor = useMemo(() => {
    switch (session.mode) {
      case 'focus':
        return 'text-accent-yellow stroke-accent-yellow';
      case 'shortBreak':
        return 'text-accent-green stroke-accent-green';
      case 'longBreak':
        return 'text-accent-purple stroke-accent-purple';
    }
  }, [session.mode]);

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-subtle pb-6 gap-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            to="/"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-surface border border-transparent hover:border-border-subtle transition-all tap-press cursor-pointer"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-serif italic text-text-main font-semibold">Pomodoro Clock</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider bg-bg-surface border border-border-strong text-text-muted">
                {completedToday} {completedToday === 1 ? 'Session' : 'Sessions'} Today
              </span>
            </div>
            <p className="text-xs sm:text-sm text-text-muted mt-1">
              Time-boxed deep work with editable durations and direct hour logging
            </p>
          </div>
        </div>

        {/* Action icons: Configure Durations, Sound Mute */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className={clsx(
              "px-3.5 py-2 min-h-[44px] flex items-center gap-2 rounded-xl border text-xs font-medium transition-all tap-press cursor-pointer",
              showSettingsDrawer
                ? "bg-text-main text-bg-base border-text-main font-semibold"
                : "bg-bg-surface border-border-strong text-text-muted hover:text-text-main hover:border-text-muted"
            )}
            title="Edit interval durations"
            aria-label="Edit interval durations"
          >
            <Sliders size={16} />
            <span>Customize Time</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-bg-surface border border-border-strong text-text-muted hover:text-text-main hover:border-text-muted transition-all tap-press cursor-pointer"
            title={soundEnabled ? 'Mute sound chime' : 'Enable sound chime'}
            aria-label={soundEnabled ? 'Mute timer chime' : 'Enable timer chime'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </header>

      {/* Status banner */}
      {statusMessage && (
        <div className="p-4 rounded-2xl bg-bg-surface border border-accent-green/30 text-accent-green flex items-center gap-3 animate-scale-in text-sm font-medium">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Clock Card */}
      <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 sm:p-12 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
        
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-bg-base rounded-2xl border border-border-strong mb-6 max-w-md w-full">
          <button
            type="button"
            onClick={() => switchMode('focus')}
            className={clsx(
              "flex-1 min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all tap-press cursor-pointer",
              session.mode === 'focus' 
                ? "bg-bg-surface text-text-main shadow-sm font-semibold" 
                : "text-text-muted hover:text-text-main"
            )}
          >
            <Brain size={15} />
            <span>Focus ({durations.focus}m)</span>
          </button>
          
          <button
            type="button"
            onClick={() => switchMode('shortBreak')}
            className={clsx(
              "flex-1 min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all tap-press cursor-pointer",
              session.mode === 'shortBreak' 
                ? "bg-bg-surface text-text-main shadow-sm font-semibold" 
                : "text-text-muted hover:text-text-main"
            )}
          >
            <Coffee size={15} />
            <span>Break ({durations.shortBreak}m)</span>
          </button>

          <button
            type="button"
            onClick={() => switchMode('longBreak')}
            className={clsx(
              "flex-1 min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all tap-press cursor-pointer",
              session.mode === 'longBreak' 
                ? "bg-bg-surface text-text-main shadow-sm font-semibold" 
                : "text-text-muted hover:text-text-main"
            )}
          >
            <Sparkles size={15} />
            <span>Long ({durations.longBreak}m)</span>
          </button>
        </div>

        {/* Circular Progress & Timer Display */}
        <div className="relative w-64 h-64 sm:w-76 sm:h-76 flex items-center justify-center my-3">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            {/* Background track circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              className="stroke-border-subtle"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Animated progress circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              className={clsx("transition-all duration-500 ease-linear", modeColor)}
              strokeWidth="6"
              strokeDasharray={565.48}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center text container */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
            {isEditingInline ? (
              <form onSubmit={handleApplyInlineMinutes} className="flex flex-col items-center gap-2 animate-scale-in">
                <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted">Edit Minutes</span>
                <div className="flex items-center gap-2">
                  <input
                    id="inline-timer-input"
                    aria-label="Timer duration in minutes"
                    type="number"
                    min="1"
                    max="720"
                    autoFocus
                    value={inlineMinutesInput}
                    onChange={e => setInlineMinutesInput(e.target.value)}
                    placeholder={String(Math.round(session.timeLeft / 60))}
                    className="w-24 text-center font-mono text-4xl sm:text-5xl font-bold bg-bg-base border border-text-main text-text-main rounded-2xl py-1 outline-none shadow-sm"
                  />
                  <button
                    type="submit"
                    aria-label="Apply custom minutes"
                    className="w-10 h-10 rounded-xl bg-text-main text-bg-base flex items-center justify-center tap-press cursor-pointer hover:opacity-90"
                    title="Apply custom minutes"
                  >
                    <Check size={18} />
                  </button>
                </div>
                <span className="text-[11px] text-text-muted mt-0.5">Press Enter to save</span>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!session.isRunning) {
                    setInlineMinutesInput(String(Math.round(session.timeLeft / 60)));
                    setIsEditingInline(true);
                  }
                }}
                className={clsx(
                  "group flex flex-col items-center justify-center transition-transform",
                  !session.isRunning ? "cursor-pointer hover:scale-105" : "cursor-default"
                )}
                title={!session.isRunning ? "Click time to edit duration directly" : undefined}
                aria-label={!session.isRunning ? "Edit timer duration" : "Timer running"}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-5xl sm:text-6xl font-bold tracking-tight text-text-main select-none">
                    {timeDisplay}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-xs uppercase tracking-widest text-text-muted font-medium">
                    {session.isRunning ? 'Active' : 'Paused'} • {session.mode === 'focus' ? activeCategory : 'Break'}
                  </span>
                  {!session.isRunning && (
                    <span className="text-[10px] text-text-muted border border-border-strong rounded-full px-2 py-0.5 opacity-80 group-hover:opacity-100 group-hover:border-text-muted transition-all">
                      Click to edit
                    </span>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Quick Increment/Decrement Adjusters (Visible When Paused) */}
        {!session.isRunning && (
          <div className="flex items-center gap-2 mt-2 mb-3">
            <button
              type="button"
              onClick={() => adjustCurrentMinutes(-5)}
              disabled={session.timeLeft <= 5 * 60}
              aria-label="Subtract 5 minutes"
              className="px-2.5 py-1 rounded-lg bg-bg-base border border-border-strong text-text-muted hover:text-text-main text-xs font-mono font-medium tap-press disabled:opacity-40 cursor-pointer"
              title="Subtract 5 minutes"
            >
              -5m
            </button>
            <button
              type="button"
              onClick={() => adjustCurrentMinutes(-1)}
              disabled={session.timeLeft <= 60}
              aria-label="Subtract 1 minute"
              className="px-2.5 py-1 rounded-lg bg-bg-base border border-border-strong text-text-muted hover:text-text-main text-xs font-mono font-medium tap-press disabled:opacity-40 cursor-pointer"
              title="Subtract 1 minute"
            >
              -1m
            </button>
            <span className="text-xs text-text-muted font-medium px-1">Quick Adjust</span>
            <button
              type="button"
              onClick={() => adjustCurrentMinutes(1)}
              aria-label="Add 1 minute"
              className="px-2.5 py-1 rounded-lg bg-bg-base border border-border-strong text-text-muted hover:text-text-main text-xs font-mono font-medium tap-press cursor-pointer"
              title="Add 1 minute"
            >
              +1m
            </button>
            <button
              type="button"
              onClick={() => adjustCurrentMinutes(5)}
              aria-label="Add 5 minutes"
              className="px-2.5 py-1 rounded-lg bg-bg-base border border-border-strong text-text-muted hover:text-text-main text-xs font-mono font-medium tap-press cursor-pointer"
              title="Add 5 minutes"
            >
              +5m
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={handleReset}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-bg-base border border-border-strong text-text-muted hover:text-text-main hover:border-text-muted flex items-center justify-center transition-all tap-press cursor-pointer"
            title="Reset timer (R)"
            aria-label="Reset timer"
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={handleStartPause}
            className="px-8 min-h-[48px] rounded-2xl bg-text-main text-bg-base hover:opacity-90 font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all tap-press cursor-pointer"
            aria-label={session.isRunning ? 'Pause timer' : 'Start timer'}
          >
            {session.isRunning ? (
              <>
                <Pause size={18} />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={18} className="fill-current" />
                <span>Start</span>
              </>
            )}
          </button>

          <button
            onClick={handleSkip}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-bg-base border border-border-strong text-text-muted hover:text-text-main hover:border-text-muted flex items-center justify-center transition-all tap-press cursor-pointer"
            title="Skip to next phase (S)"
            aria-label="Skip to next phase"
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* Keyboard shortcut hint */}
        <p className="text-[11px] text-text-muted mt-5">
          Press <kbd className="px-1.5 py-0.5 rounded bg-bg-base border border-border-strong text-text-main font-mono text-[10px]">Space</kbd> to toggle, <kbd className="px-1.5 py-0.5 rounded bg-bg-base border border-border-strong text-text-main font-mono text-[10px]">R</kbd> to reset, <kbd className="px-1.5 py-0.5 rounded bg-bg-base border border-border-strong text-text-main font-mono text-[10px]">S</kbd> to skip
        </p>
      </div>

      {/* Editable Durations Settings Panel (Toggleable or Visible) */}
      <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-subtle gap-3">
          <div>
            <div className="flex items-center gap-2 text-base font-semibold text-text-main">
              <Sliders size={18} className="text-accent-yellow" />
              <h3>Interval Durations & Presets</h3>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Set any custom minute duration for each timer mode, or click a standard preset.
            </p>
          </div>

          <button
            type="button"
            onClick={resetAllDurationsToDefault}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-base border border-border-strong text-text-muted hover:text-text-main text-xs font-medium tap-press cursor-pointer"
          >
            <ResetIcon size={14} />
            <span>Reset Defaults</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Focus Duration Config */}
          <div className="space-y-3 bg-bg-base p-4 rounded-2xl border border-border-strong">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-main flex items-center gap-1.5">
                <Brain size={14} className="text-accent-yellow" /> Focus Mode
              </span>
              <span className="font-mono text-sm font-bold text-accent-yellow">{durations.focus}m</span>
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-2">
              <input
                id="focus-duration-input"
                aria-label="Focus mode duration in minutes"
                type="number"
                min="1"
                max="720"
                value={durations.focus}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) updateDuration('focus', val);
                }}
                className="w-full min-h-[40px] bg-bg-surface border border-border-strong rounded-xl px-3 py-1.5 text-sm font-mono text-text-main focus:border-text-muted outline-none"
                placeholder="25"
              />
              <span className="text-xs font-mono text-text-muted">mins</span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[15, 25, 45, 50, 60, 90].map(mins => (
                <button
                  key={mins}
                  type="button"
                  aria-label={`Set focus duration to ${mins} minutes`}
                  onClick={() => updateDuration('focus', mins)}
                  className={clsx(
                    "px-2.5 py-1 rounded-lg text-xs font-mono transition-all tap-press cursor-pointer",
                    durations.focus === mins
                      ? "bg-text-main text-bg-base font-bold shadow-sm"
                      : "bg-bg-surface border border-border-strong text-text-muted hover:text-text-main"
                  )}
                >
                  {mins}m {mins === 25 ? '★' : mins === 50 ? '★' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Short Break Duration Config */}
          <div className="space-y-3 bg-bg-base p-4 rounded-2xl border border-border-strong">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-main flex items-center gap-1.5">
                <Coffee size={14} className="text-accent-green" /> Short Break
              </span>
              <span className="font-mono text-sm font-bold text-accent-green">{durations.shortBreak}m</span>
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-2">
              <input
                id="short-break-duration-input"
                aria-label="Short break duration in minutes"
                type="number"
                min="1"
                max="120"
                value={durations.shortBreak}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) updateDuration('shortBreak', val);
                }}
                className="w-full min-h-[40px] bg-bg-surface border border-border-strong rounded-xl px-3 py-1.5 text-sm font-mono text-text-main focus:border-text-muted outline-none"
                placeholder="5"
              />
              <span className="text-xs font-mono text-text-muted">mins</span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[3, 5, 10, 15].map(mins => (
                <button
                  key={mins}
                  type="button"
                  aria-label={`Set short break duration to ${mins} minutes`}
                  onClick={() => updateDuration('shortBreak', mins)}
                  className={clsx(
                    "px-2.5 py-1 rounded-lg text-xs font-mono transition-all tap-press cursor-pointer",
                    durations.shortBreak === mins
                      ? "bg-text-main text-bg-base font-bold shadow-sm"
                      : "bg-bg-surface border border-border-strong text-text-muted hover:text-text-main"
                  )}
                >
                  {mins}m {mins === 5 ? '★' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Long Break Duration Config */}
          <div className="space-y-3 bg-bg-base p-4 rounded-2xl border border-border-strong">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-main flex items-center gap-1.5">
                <Sparkles size={14} className="text-accent-purple" /> Long Break
              </span>
              <span className="font-mono text-sm font-bold text-accent-purple">{durations.longBreak}m</span>
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-2">
              <input
                id="long-break-duration-input"
                aria-label="Long break duration in minutes"
                type="number"
                min="1"
                max="180"
                value={durations.longBreak}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) updateDuration('longBreak', val);
                }}
                className="w-full min-h-[40px] bg-bg-surface border border-border-strong rounded-xl px-3 py-1.5 text-sm font-mono text-text-main focus:border-text-muted outline-none"
                placeholder="15"
              />
              <span className="text-xs font-mono text-text-muted">mins</span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[10, 15, 20, 30].map(mins => (
                <button
                  key={mins}
                  type="button"
                  aria-label={`Set long break duration to ${mins} minutes`}
                  onClick={() => updateDuration('longBreak', mins)}
                  className={clsx(
                    "px-2.5 py-1 rounded-lg text-xs font-mono transition-all tap-press cursor-pointer",
                    durations.longBreak === mins
                      ? "bg-text-main text-bg-base font-bold shadow-sm"
                      : "bg-bg-surface border border-border-strong text-text-muted hover:text-text-main"
                  )}
                >
                  {mins}m {mins === 15 ? '★' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Attribution & Auto-Logging Card */}
      <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-main">
          <Clock size={16} className="text-accent-blue" />
          <h3>Activity Attribution & Daily Hour Logging</h3>
        </div>
        <p className="text-xs text-text-muted">
          Attribute your completed focus intervals directly into your Daily Tracker charts and streaks.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label htmlFor="pomodoro-category-select" className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-1.5">
              Category
            </label>
            <select
              id="pomodoro-category-select"
              value={activeCategory}
              onChange={e => setSession(prev => ({ ...prev, selectedCategory: e.target.value }))}
              className="w-full min-h-[44px] bg-bg-base border border-border-strong rounded-xl px-3.5 py-2 text-sm text-text-main focus:border-text-muted outline-none cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-3 p-3.5 bg-bg-base rounded-xl border border-border-strong cursor-pointer tap-press">
            <input
              type="checkbox"
              checked={autoLogEnabled}
              onChange={e => setAutoLogEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-border-strong text-text-main focus:ring-0 mt-0.5 cursor-pointer"
            />
            <div>
              <span className="text-xs font-medium text-text-main block">Auto-log completed focus time</span>
              <span className="text-[11px] text-text-muted block mt-0.5">
                Automatically calculates decimal hours (e.g. {durations.focus}m = {+(durations.focus / 60).toFixed(2)}h) and saves to today's hour log upon timer completion.
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
