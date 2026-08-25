import { Link } from 'react-router-dom';
import { PenTool, CheckSquare, Target, LineChart } from 'lucide-react';
import { format } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getTodayStr } from '../utils/dateUtils';
import { useMemo } from 'react';

export function Home() {
  const allEntries = useLiveQuery(() => db.dayEntries.toArray()) || [];
  
  const streak = useMemo(() => {
    if (allEntries.length === 0) return 0;
    const sortedDates = allEntries.map(e => e.date).sort().reverse();
    let currentStreak = 0;
    const todayStr = getTodayStr();
    
    let checkDate = new Date();
    if (!sortedDates.includes(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    let checkDateStr = format(checkDate, 'yyyy-MM-dd');
    while (sortedDates.includes(checkDateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
      checkDateStr = format(checkDate, 'yyyy-MM-dd');
    }
    
    return currentStreak;
  }, [allEntries]);

  return (
    <div className="flex flex-col gap-12 md:gap-20 animate-fade-in max-w-4xl mx-auto pt-8">
      
      <header className="text-center space-y-4">
        <h1 className="text-3xl md:text-5xl font-serif italic text-text-main">
          {format(new Date(), 'EEEE, MMMM do')}
        </h1>
        <p className="text-text-muted uppercase tracking-widest text-sm font-medium">
          Welcome to your daily journal
        </p>
        {streak > 2 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-gold-bg text-accent-gold text-xs font-bold tracking-widest uppercase mt-4">
            <span>🔥</span> {streak} Day Streak
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <Link to="/highlight" className="group p-8 rounded-2xl border border-border-strong bg-bg-surface hover:bg-bg-surface-hover transition-all duration-300 flex flex-col items-center text-center gap-4 hover:shadow-lg">
          <div className="w-16 h-16 rounded-full bg-accent-red-bg text-accent-red flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <PenTool size={28} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-main mb-2">Highlight of the Day</h2>
            <p className="text-text-muted text-sm leading-relaxed">
              Reflect on your day, capture what went well, and log your overall mood.
            </p>
          </div>
        </Link>

        <Link to="/habits" className="group p-8 rounded-2xl border border-border-strong bg-bg-surface hover:bg-bg-surface-hover transition-all duration-300 flex flex-col items-center text-center gap-4 hover:shadow-lg">
          <div className="w-16 h-16 rounded-full bg-accent-green-bg text-accent-green flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <CheckSquare size={28} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-main mb-2">Habits</h2>
            <p className="text-sm text-text-muted leading-relaxed">
              Track your daily consistency and view your monthly heatmap.
            </p>
          </div>
        </Link>

        <Link to="/goals" className="group p-8 rounded-2xl border border-border-strong bg-bg-surface hover:bg-bg-surface-hover transition-all duration-300 flex flex-col items-center text-center gap-4 hover:shadow-lg">
          <div className="w-16 h-16 rounded-full bg-accent-gold-bg text-accent-gold flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Target size={28} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-main mb-2">Goals</h2>
            <p className="text-sm text-text-muted leading-relaxed">
              Set long-term objectives and break them down into actionable steps.
            </p>
          </div>
        </Link>

        <Link to="/logs" className="group p-8 rounded-2xl border border-border-strong bg-bg-surface hover:bg-bg-surface-hover transition-all duration-300 flex flex-col items-center text-center gap-4 hover:shadow-lg">
          <div className="w-16 h-16 rounded-full bg-accent-navy-bg text-accent-navy flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <LineChart size={28} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-main mb-2">Logs</h2>
            <p className="text-text-muted text-sm leading-relaxed">
              Look back at your history, review your journal, and analyze long-term progress.
            </p>
          </div>
        </Link>

      </div>

      <div className="text-center pt-8 pb-4">
        <p className="text-[10px] text-text-muted uppercase tracking-widest font-medium opacity-60">
          Tip: Press 1-4 to navigate, Esc to return home
        </p>
      </div>
    </div>
  );
}
