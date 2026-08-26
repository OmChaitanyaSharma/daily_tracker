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
    <div className="flex flex-col gap-16 md:gap-24 animate-fade-in max-w-4xl mx-auto pt-4">
      
      <header className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-serif text-text-main tracking-tight">
          <span className="marker-highlight font-medium">{format(new Date(), 'EEEE')}</span>, <br className="md:hidden"/> {format(new Date(), 'MMMM do')}
        </h1>
        <p className="text-text-muted uppercase tracking-[0.2em] text-sm font-medium">
          Welcome to your daily journal
        </p>
        {streak > 2 && (
          <div className="inline-flex items-center justify-center animate-slide-up mt-8">
            <div className="px-4 py-2 rounded-full border border-accent-yellow bg-accent-yellow-bg text-accent-yellow text-sm font-semibold tracking-widest uppercase shadow-sm">
              ✨ {streak} Day Streak
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <Link to="/highlight" className="group hover-lift p-10 rounded-3xl bg-bg-surface border border-border-subtle flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-accent-red-bg text-accent-red flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
            <PenTool size={32} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-medium text-text-main mb-3">Highlight of the Day</h2>
            <p className="text-text-muted text-sm leading-relaxed max-w-[250px] mx-auto">
              Reflect on your day, capture what went well, and log your overall mood.
            </p>
          </div>
        </Link>

        <Link to="/habits" className="group hover-lift p-10 rounded-3xl bg-bg-surface border border-border-subtle flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-accent-green-bg text-accent-green flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
            <CheckSquare size={32} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-medium text-text-main mb-3">Habits</h2>
            <p className="text-sm text-text-muted leading-relaxed max-w-[250px] mx-auto">
              Track your daily consistency and view your monthly heatmap.
            </p>
          </div>
        </Link>

        <Link to="/goals" className="group hover-lift p-10 rounded-3xl bg-bg-surface border border-border-subtle flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-accent-yellow-bg text-accent-yellow flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
            <Target size={32} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-medium text-text-main mb-3">Goals</h2>
            <p className="text-sm text-text-muted leading-relaxed max-w-[250px] mx-auto">
              Set long-term objectives and break them down into actionable steps.
            </p>
          </div>
        </Link>

        <Link to="/logs" className="group hover-lift p-10 rounded-3xl bg-bg-surface border border-border-subtle flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-accent-blue-bg text-accent-blue flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
            <LineChart size={32} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-medium text-text-main mb-3">Logs</h2>
            <p className="text-text-muted text-sm leading-relaxed max-w-[250px] mx-auto">
              Look back at your history, review your journal, and analyze long-term progress.
            </p>
          </div>
        </Link>

      </div>

      <div className="text-center pt-12 pb-4">
        <p className="text-[11px] text-text-muted uppercase tracking-[0.2em] font-medium opacity-50">
          Tip: Press 1-4 to navigate, Esc to return home
        </p>
      </div>
    </div>
  );
}
