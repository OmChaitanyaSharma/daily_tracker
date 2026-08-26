import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useMemo } from 'react';
import { format, parseISO, isAfter, addDays } from 'date-fns';
import { getTodayStr } from '../utils/dateUtils';

export function calculateStreak(
  allHabits: any[],
  allHabitLogsForStreak: any[],
  allHourLogsForStreak: any[],
  allExercises: any[],
  allExerciseLogs: any[]
) {
  let streak = 0;
  let freezesOwned = 0;
  let freezeUsedToday = false;

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

  const todayStr = getTodayStr();
  let firstDateStr = todayStr;
  
  const allDates = [
    ...allHabitLogsForStreak.map(l => l.date),
    ...allHourLogsForStreak.map(l => l.date),
    ...allExerciseLogs.map(l => l.date),
    ...allHabits.filter(h => h.startDate).map(h => h.startDate)
  ];
  
  if (allDates.length > 0) {
    firstDateStr = allDates.reduce((min, d) => d < min ? d : min, firstDateStr);
  }

  let current = parseISO(firstDateStr);
  const end = parseISO(todayStr);

  while (!isAfter(current, end)) {
    const dateStr = format(current, 'yyyy-MM-dd');
    const isToday = dateStr === todayStr;
    freezeUsedToday = false;
    
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
      if (streak > 0 && streak % 7 === 0) {
        freezesOwned = Math.min(2, freezesOwned + 1);
      }
    } else {
      if (!isToday) {
        if (freezesOwned > 0) {
          freezesOwned--;
          freezeUsedToday = true;
        } else {
          streak = 0;
        }
      }
    }

    current = addDays(current, 1);
  }
  
  return { streak, freezesOwned, freezeUsedToday };
}

const EMPTY_ARRAY: any[] = [];

export function useStreak() {
  const allHabits = useLiveQuery(() => db.habits.toArray()) ?? EMPTY_ARRAY;
  const allHabitLogsForStreak = useLiveQuery(() => db.habitLogs.toArray()) ?? EMPTY_ARRAY;
  const allHourLogsForStreak = useLiveQuery(() => db.hourLogs.toArray()) ?? EMPTY_ARRAY;
  const allExercises = useLiveQuery(() => db.exercises.toArray()) ?? EMPTY_ARRAY;
  const allExerciseLogs = useLiveQuery(() => db.exerciseLogs.toArray()) ?? EMPTY_ARRAY;

  const streakData = useMemo(() => {
    return calculateStreak(
      allHabits,
      allHabitLogsForStreak,
      allHourLogsForStreak,
      allExercises,
      allExerciseLogs
    );
  }, [allHabits, allHabitLogsForStreak, allHourLogsForStreak, allExercises, allExerciseLogs]);

  return streakData;
}
