const EMPTY_ARRAY: any[] = [];
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { format, subDays, parseISO, getDay } from 'date-fns';
import { getTodayStr } from '../utils/dateUtils';
import { useMemo } from 'react';
import { getRestDaysConfig, getWeekStartStr, calculateEffectiveSchedule } from '../utils/restDays';

const TRACKING_START_DATE = new Date('2026-08-27T00:00:00');

export function useExerciseStreak() {
  const allExercises = useLiveQuery(() => db.exercises.toArray()) ?? EMPTY_ARRAY;
  const allExerciseLogs = useLiveQuery(() => db.exerciseLogs.toArray()) ?? EMPTY_ARRAY;

  const streak = useMemo(() => {
    if (!allExercises.length || !allExerciseLogs.length) return 0;
    
    const todayStr = getTodayStr();
    const today = parseISO(todayStr);
    
    let currentStreak = 0;
    let checkDate = today;

    const config = getRestDaysConfig();
    const effectiveScheduleCache: Record<string, number[]> = {};

    while (true) {
      if (checkDate < TRACKING_START_DATE) {
        break;
      }

      const dateStr = format(checkDate, 'yyyy-MM-dd');
      
      const requiredExercises = allExercises.filter(ex => {
        return ex.createdAt.substring(0, 10) <= dateStr && !ex.archived;
      });

      if (requiredExercises.length === 0) {
        checkDate = subDays(checkDate, 1);
        continue;
      }

      const logsForDay = allExerciseLogs.filter(l => l.date === dateStr);
      
      const allCompleted = requiredExercises.every(ex => {
        const log = logsForDay.find(l => l.exerciseId === ex.id);
        return log && log.reps > 0;
      });

      if (allCompleted) {
        currentStreak++;
      } else {
        const weekStartStr = getWeekStartStr(checkDate);
        if (!effectiveScheduleCache[weekStartStr]) {
          effectiveScheduleCache[weekStartStr] = calculateEffectiveSchedule(weekStartStr, config, allExercises, allExerciseLogs);
        }
        
        const effectiveSchedule = effectiveScheduleCache[weekStartStr];
        const isRestDay = effectiveSchedule.includes(getDay(checkDate));
        
        if (isRestDay) {
          currentStreak++;
        }
        else if (dateStr === todayStr) {
          // Do nothing, still have time today
        } else {
          break; // missed
        }
      }

      checkDate = subDays(checkDate, 1);
    }

    return currentStreak;
  }, [allExercises, allExerciseLogs]);

  return streak;
}
