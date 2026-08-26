import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { getTodayStr } from '../utils/dateUtils';

export function calculateStreak(
  allHabits: any[],
  allHabitLogsForStreak: any[],
  allHourLogsForStreak: any[],
  allExercises: any[],
  allExerciseLogs: any[]
): number {
  let streak = 0;
  const logsByDate = new Map<string, any[]>();
  allHabitLogsForStreak.forEach(log => {
    if (!logsByDate.has(log.date)) logsByDate.set(log.date, []);
    logsByDate.get(log.date)!.push(log);
  });

  const hoursByDate = new Map<string, any[]>();
  allHourLogsForStreak.forEach(log => {
    if (!hoursByDate.has(log.date)) hoursByDate.set(log.date, []);
    hoursByDate.get(log.date)!.push(log);
  });

  const exercisesByDate = new Map<string, any[]>();
  allExerciseLogs.forEach(log => {
    if (!exercisesByDate.has(log.date)) exercisesByDate.set(log.date, []);
    exercisesByDate.get(log.date)!.push(log);
  });

  let checkingDate = new Date();
  while (true) {
    const dateStr = format(checkingDate, 'yyyy-MM-dd');
    
    const activeHabitsOnDate = allHabits.filter(h => (!h.startDate || h.startDate <= dateStr) && !h.archived);
    const numActive = activeHabitsOnDate.length;

    const dateHabitLogs = logsByDate.get(dateStr) || [];
    let habitScore = 0;
    dateHabitLogs.forEach(log => {
      if (log.status === 'completed') habitScore += 1.0;
      else if (log.status === 'partial') habitScore += 0.5;
    });

    const habitConditionMet = numActive > 0 ? (habitScore / numActive >= 0.75) : true;

    const dateHourLogs = hoursByDate.get(dateStr) || [];
    const totalHours = dateHourLogs.reduce((acc, curr) => acc + curr.hours, 0);
    const hoursConditionMet = totalHours >= 3.0;

    const activeExercisesOnDate = allExercises.filter(ex => !ex.archived);
    const dateExerciseLogs = exercisesByDate.get(dateStr) || [];
    let exerciseConditionMet = true;
    if (activeExercisesOnDate.length > 0) {
      for (const ex of activeExercisesOnDate) {
        const log = dateExerciseLogs.find(l => l.exerciseId === ex.id);
        if (!log || log.reps === 0) {
          exerciseConditionMet = false;
          break;
        }
      }
    }

    if (habitConditionMet && exerciseConditionMet && hoursConditionMet) {
      streak++;
    } else {
      if (dateStr !== getTodayStr()) break;
    }

    checkingDate.setDate(checkingDate.getDate() - 1);
    if (streak > 3650) break; // safety fallback
    // Stop checking if date is before the app started (simplification)
    if (numActive === 0 && activeExercisesOnDate.length === 0 && dateStr < getTodayStr()) break;
  }
  
  return streak;
}

const EMPTY_ARRAY: any[] = [];

export function useStreak() {
  const allHabits = useLiveQuery(() => db.habits.toArray()) ?? EMPTY_ARRAY;
  const allHabitLogsForStreak = useLiveQuery(() => db.habitLogs.toArray()) ?? EMPTY_ARRAY;
  const allHourLogsForStreak = useLiveQuery(() => db.hourLogs.toArray()) ?? EMPTY_ARRAY;
  const allExercises = useLiveQuery(() => db.exercises.toArray()) ?? EMPTY_ARRAY;
  const allExerciseLogs = useLiveQuery(() => db.exerciseLogs.toArray()) ?? EMPTY_ARRAY;

  const currentStreak = useMemo(() => {
    return calculateStreak(
      allHabits,
      allHabitLogsForStreak,
      allHourLogsForStreak,
      allExercises,
      allExerciseLogs
    );
  }, [allHabits, allHabitLogsForStreak, allHourLogsForStreak, allExercises, allExerciseLogs]);

  return currentStreak;
}
