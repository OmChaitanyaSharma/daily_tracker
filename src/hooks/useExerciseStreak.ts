import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { format, subDays, parseISO } from 'date-fns';
import { getTodayStr } from '../utils/dateUtils';
import { useMemo } from 'react';

const TRACKING_START_DATE = new Date('2026-08-27T00:00:00');

export function useExerciseStreak() {
  const allExercises = useLiveQuery(() => db.exercises.toArray()) || [];
  const allExerciseLogs = useLiveQuery(() => db.exerciseLogs.toArray()) || [];

  const streak = useMemo(() => {
    if (!allExercises.length || !allExerciseLogs.length) return 0;
    
    // We only evaluate streaks starting from Aug 27, 2026
    const todayStr = getTodayStr();
    const today = parseISO(todayStr);
    
    let currentStreak = 0;
    let checkDate = today;

    // Fast-forward checkDate to start date if somehow they are in the past? 
    // They are in 2026, so today is > Aug 27.

    while (true) {
      // If we go backwards past the start date, the streak evaluation ends
      if (checkDate < TRACKING_START_DATE) {
        break;
      }

      const dateStr = format(checkDate, 'yyyy-MM-dd');
      
      // Determine what exercises were active on this day.
      // An exercise is required if it was created on or before this day and is not archived.
      // (For simplicity, if it's archived, we just ignore it from the streak forever. 
      // If they unarchive it later, it becomes required again).
      const requiredExercises = allExercises.filter(ex => {
        return ex.createdAt.substring(0, 10) <= dateStr && !ex.archived;
      });

      if (requiredExercises.length === 0) {
        // If there were no active exercises to do, this day doesn't count against them,
        // but it doesn't break the streak either. 
        // Wait, if no exercises are required, should they get a free pass? Yes, skip.
        checkDate = subDays(checkDate, 1);
        continue;
      }

      // Check if they did at least 1 rep for ALL required exercises
      const logsForDay = allExerciseLogs.filter(l => l.date === dateStr);
      
      const allCompleted = requiredExercises.every(ex => {
        const log = logsForDay.find(l => l.exerciseId === ex.id);
        return log && log.reps > 0;
      });

      if (allCompleted) {
        currentStreak++;
      } else {
        // Did they miss it?
        // If it's today and they missed it, we don't break the streak immediately (they still have time).
        if (dateStr === todayStr) {
          // Do nothing, just proceed to check yesterday
        } else {
          // It's a past day and they missed it -> Streak broken!
          break;
        }
      }

      checkDate = subDays(checkDate, 1);
    }

    return currentStreak;
  }, [allExercises, allExerciseLogs]);

  return streak;
}
