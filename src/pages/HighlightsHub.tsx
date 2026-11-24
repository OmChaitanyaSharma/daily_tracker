import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PenTool, Calendar, ArrowLeft, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getTodayStr } from '../utils/dateUtils';
import { isCurrentSlot, formatTime12h } from '../utils/scheduleDefaults';

export function HighlightsHub() {
  const todayStr = getTodayStr();

  // Query today's day entry for highlight status
  const todayEntry = useLiveQuery(() => db.dayEntries.get(todayStr), [todayStr]);

  // Query schedule slots for planner status
  const allSlots = useLiveQuery(() => db.scheduleSlots.toArray()) || [];

  const currentDayOfWeek = useMemo(() => new Date().getDay(), []);

  const todaySlots = useMemo(() => {
    const daySpecific = allSlots.filter(s => s.dayOfWeek === currentDayOfWeek);
    const slots = daySpecific.length > 0 
      ? daySpecific 
      : allSlots.filter(s => s.dayOfWeek === -1 || s.dayOfWeek === undefined);
    return [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [allSlots, currentDayOfWeek]);

  const completedSlotsCount = useMemo(() => {
    return todaySlots.filter(s => s.completedDates?.includes(todayStr)).length;
  }, [todaySlots, todayStr]);

  const activeSlot = useMemo(() => {
    return todaySlots.find(s => isCurrentSlot(s.startTime, s.endTime)) || null;
  }, [todaySlots]);

  const hasLoggedHighlight = Boolean(todayEntry?.highlight && todayEntry.highlight.trim().length > 0);

  return (
    <div className="max-w-4xl mx-auto pb-24 animate-fade-in space-y-8 sm:space-y-12">
      <header className="flex items-center gap-4 sm:gap-6 border-b border-border-subtle pb-6">
        <Link 
          to="/" 
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main transition-colors rounded-full hover:bg-bg-surface tap-press cursor-pointer" 
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif italic text-text-main font-semibold">Highlights & Daily Routine</h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1 sm:mt-2">Daily reflection journal and structured time-block schedule</p>
        </div>
      </header>

      {/* Two Hub Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Tile 1: Highlight of the Day */}
        <Link to="/highlight/journal" className="block group">
          <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 sm:p-10 hover-lift tap-press transition-all h-full flex flex-col items-center justify-between text-center gap-6 shadow-sm hover:border-border-strong relative overflow-hidden">
            <div className="flex flex-col items-center gap-5 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent-red-bg rounded-full text-accent-red flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
                <PenTool size={28} className="sm:hidden" strokeWidth={1.5} />
                <PenTool size={32} className="hidden sm:block" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-serif text-text-main mb-2 sm:mb-3 font-medium">Highlight of the Day</h2>
                <p className="text-text-muted text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                  Reflect on your day, capture what made today worth remembering, and log your overall mood.
                </p>
              </div>
            </div>

            {/* Status indicator badge */}
            <div className="w-full pt-4 border-t border-border-subtle/60 flex items-center justify-center gap-2 text-xs">
              {hasLoggedHighlight ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-green/15 text-accent-green font-medium">
                  <CheckCircle2 size={14} />
                  <span>Today's Win Logged</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-base border border-border-strong text-text-muted">
                  <Sparkles size={13} className="text-accent-yellow" />
                  <span>Not logged yet today</span>
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Tile 2: Daily Planner & Schedule */}
        <Link to="/highlight/planner" className="block group">
          <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 sm:p-10 hover-lift tap-press transition-all h-full flex flex-col items-center justify-between text-center gap-6 shadow-sm hover:border-border-strong relative overflow-hidden">
            <div className="flex flex-col items-center gap-5 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent-blue-bg rounded-full text-accent-blue flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
                <Calendar size={28} className="sm:hidden" strokeWidth={1.5} />
                <Calendar size={32} className="hidden sm:block" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-serif text-text-main mb-2 sm:mb-3 font-medium">Daily Planner & Schedule</h2>
                <p className="text-text-muted text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                  Time-blocked routine, focus blocks, and concrete deliverables across all 7 days or per day.
                </p>
              </div>
            </div>

            {/* Status indicator badge */}
            <div className="w-full pt-4 border-t border-border-subtle/60 flex items-center justify-center gap-2 text-xs">
              {activeSlot ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-blue/15 text-accent-blue font-medium animate-pulse">
                  <Clock size={13} />
                  <span>Active: {activeSlot.title} ({formatTime12h(activeSlot.startTime)})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-base border border-border-strong text-text-muted font-mono">
                  <span>{completedSlotsCount}/{todaySlots.length} Slots Done Today</span>
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
