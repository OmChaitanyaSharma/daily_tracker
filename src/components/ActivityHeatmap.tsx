const EMPTY_ARRAY: any[] = [];
import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { eachDayOfInterval, subDays, format, parseISO, getDay } from 'date-fns';
import { getTodayStr } from '../utils/dateUtils';
import clsx from 'clsx';

export function ActivityHeatmap() {
  const todayStr = getTodayStr();
  const allHabitLogs = useLiveQuery(() => db.habitLogs.toArray()) ?? EMPTY_ARRAY;
  const allExerciseLogs = useLiveQuery(() => db.exerciseLogs.toArray()) ?? EMPTY_ARRAY;
  const allHourLogs = useLiveQuery(() => db.hourLogs.toArray()) ?? EMPTY_ARRAY;
  const allGoalMeasurements = useLiveQuery(() => db.goalMeasurements.toArray()) ?? EMPTY_ARRAY;
  const allDayEntries = useLiveQuery(() => db.dayEntries.toArray()) ?? EMPTY_ARRAY;
  
  const heatmapData = useMemo(() => {
    const end = parseISO(todayStr);
    const start = subDays(end, 364);
    const days = eachDayOfInterval({ start, end });

    // Group logs by date
    const habitCountsByDate = allHabitLogs.reduce((acc, log) => {
      if (log.status !== 'none') {
        acc[log.date] = (acc[log.date] || 0) + (log.status === 'completed' ? 2 : 1);
      }
      return acc;
    }, {} as Record<string, number>);

    const exerciseCountsByDate = allExerciseLogs.reduce((acc, log) => {
      if (log.reps > 0) {
        acc[log.date] = (acc[log.date] || 0) + log.reps;
      }
      return acc;
    }, {} as Record<string, number>);

    const hourCountsByDate = allHourLogs.reduce((acc, log) => {
      if (log.hours > 0) {
        acc[log.date] = (acc[log.date] || 0) + log.hours;
      }
      return acc;
    }, {} as Record<string, number>);

    const goalCountsByDate = allGoalMeasurements.reduce((acc, log) => {
      if (log.value !== undefined && log.value !== null && String(log.value).trim() !== '') {
        acc[log.date] = (acc[log.date] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const dayEntryDates = new Set(allDayEntries.filter(e => e.highlight?.trim() || e.mood).map(e => e.date));

    return days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const hCount = habitCountsByDate[dateStr] || 0;
      const eCount = exerciseCountsByDate[dateStr] || 0;
      const hrCount = hourCountsByDate[dateStr] || 0;
      const gCount = goalCountsByDate[dateStr] || 0;
      const hasJournal = dayEntryDates.has(dateStr);
      
      const hasAny = hCount > 0 || eCount > 0 || hrCount > 0 || gCount > 0 || hasJournal;
      const activityScore = hCount + (eCount > 0 ? Math.min(eCount / 10, 3) : 0) + hrCount + (gCount > 0 ? 1 : 0) + (hasJournal ? 1 : 0);

      // Calculate a rough "intensity" score (0 to 4)
      let intensity = 0;
      if (hasAny) intensity = 1;
      if (activityScore >= 2) intensity = 2;
      if (activityScore >= 4) intensity = 3;
      if (activityScore >= 6) intensity = 4;

      return {
        date,
        dateStr,
        intensity,
        hCount,
        eCount,
        hrCount,
        gCount
      };
    });
  }, [todayStr, allHabitLogs, allExerciseLogs, allHourLogs, allGoalMeasurements, allDayEntries]);

  // We want to render a 7x52 grid. The standard is columns of weeks, top to bottom Sun-Sat.
  // Pad the beginning so the first day aligns with the correct day of the week.
  const paddedData = useMemo(() => {
    if (heatmapData.length === 0) return [];
    
    const firstDay = heatmapData[0];
    const firstDayOfWeek = getDay(firstDay.date); // 0 = Sunday
    
    const padding = Array(firstDayOfWeek).fill(null);
    return [...padding, ...heatmapData];
  }, [heatmapData]);

  // Group into columns
  const columns = useMemo(() => {
    const cols = [];
    let currentCol = [];
    for (let i = 0; i < paddedData.length; i++) {
      currentCol.push(paddedData[i]);
      if (currentCol.length === 7 || i === paddedData.length - 1) {
        cols.push(currentCol);
        currentCol = [];
      }
    }
    return cols;
  }, [paddedData]);

  return (
    <div className="bg-bg-surface border border-border-strong rounded-3xl p-8 mb-8 overflow-x-auto shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-serif text-text-main italic">Activity Heatmap</h2>
          <p className="text-sm text-text-muted mt-1 tracking-wider uppercase">Last 365 Days</p>
        </div>
      </div>
      
      <div className="flex gap-1">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-1">
            {col.map((day, rowIdx) => {
              if (!day) {
                return <div key={`empty-${rowIdx}`} className="w-3 h-3 rounded-sm bg-transparent" />;
              }
              return (
                <div 
                  key={day.dateStr}
                  title={`${format(day.date, 'MMM d, yyyy')}: Habits: ${day.hCount}, Reps: ${day.eCount}, Hours: ${day.hrCount}h${day.gCount > 0 ? `, Goals: ${day.gCount}` : ''}`}
                  className={clsx(
                    "w-3 h-3 rounded-sm transition-colors",
                    day.intensity === 0 && "bg-border-subtle",
                    day.intensity === 1 && "bg-accent-green/30",
                    day.intensity === 2 && "bg-accent-green/60",
                    day.intensity === 3 && "bg-accent-green/80",
                    day.intensity === 4 && "bg-accent-green"
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-text-muted">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-border-subtle"></div>
        <div className="w-3 h-3 rounded-sm bg-accent-green/30"></div>
        <div className="w-3 h-3 rounded-sm bg-accent-green/60"></div>
        <div className="w-3 h-3 rounded-sm bg-accent-green/80"></div>
        <div className="w-3 h-3 rounded-sm bg-accent-green"></div>
        <span>More</span>
      </div>
    </div>
  );
}
