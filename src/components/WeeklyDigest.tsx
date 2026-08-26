import { useMemo } from 'react';
import { type DayEntry } from '../db';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';

export function WeeklyDigest({ entries }: { entries: DayEntry[] }) {
  const digestData = useMemo(() => {
    // Group entries by week
    const weeksMap = new Map<string, { start: Date; end: Date; highlights: string[]; learned: string[] }>();
    
    entries.forEach(entry => {
      const date = parseISO(entry.date);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      
      if (!weeksMap.has(weekKey)) {
        weeksMap.set(weekKey, { start: weekStart, end: weekEnd, highlights: [], learned: [] });
      }
      
      const weekData = weeksMap.get(weekKey)!;
      if (entry.highlight?.trim()) {
        weekData.highlights.push(`${format(date, 'EEE')}: ${entry.highlight.trim()}`);
      }
      if (entry.reflection?.trim()) { // Using reflection as "learned"
        weekData.learned.push(`${format(date, 'EEE')}: ${entry.reflection.trim()}`);
      }
    });

    // Convert to array and sort descending by date
    return Array.from(weeksMap.values())
      .filter(w => w.highlights.length > 0 || w.learned.length > 0)
      .sort((a, b) => b.start.getTime() - a.start.getTime());
  }, [entries]);

  if (digestData.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p>No highlights or reflections logged yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {digestData.map((week, idx) => (
        <section key={idx} className="bg-bg-surface border border-border-strong rounded-2xl p-6 shadow-sm">
          <header className="mb-6 border-b border-border-subtle pb-4">
            <h3 className="text-xl font-serif text-text-main italic">
              Week of {format(week.start, 'MMM do')} - {format(week.end, 'MMM do, yyyy')}
            </h3>
          </header>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-accent-blue mb-4">Highlights</h4>
              <ul className="space-y-3">
                {week.highlights.map((h, i) => (
                  <li key={i} className="text-sm text-text-muted flex gap-2">
                    <span className="text-accent-blue opacity-50">•</span>
                    <span>{h}</span>
                  </li>
                ))}
                {week.highlights.length === 0 && <span className="text-xs text-text-muted italic">None</span>}
              </ul>
            </div>
            
            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-accent-purple mb-4">Reflections & Lessons</h4>
              <ul className="space-y-3">
                {week.learned.map((l, i) => (
                  <li key={i} className="text-sm text-text-muted flex gap-2">
                    <span className="text-accent-purple opacity-50">•</span>
                    <span>{l}</span>
                  </li>
                ))}
                {week.learned.length === 0 && <span className="text-xs text-text-muted italic">None</span>}
              </ul>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
