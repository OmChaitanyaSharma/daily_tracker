import { DailyPlanner } from '../components/DailyPlanner';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { getTodayStr } from '../utils/dateUtils';

export function Planner() {
  const today = getTodayStr();

  return (
    <div className="max-w-4xl mx-auto pb-24 animate-fade-in space-y-8">
      <header className="flex items-center gap-4 sm:gap-6 border-b border-border-subtle pb-6">
        <Link
          to="/"
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-surface border border-transparent hover:border-border-subtle transition-all tap-press"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif italic text-text-main flex items-center gap-2.5">
            <Calendar size={24} className="text-accent-blue" />
            <span>Daily Schedule & Planner</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Time-blocked routine, focus blocks, and concrete deliverables across all 7 days or per day.
          </p>
        </div>
      </header>

      <DailyPlanner currentDate={today} embedded={false} />
    </div>
  );
}
