import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type ExerciseDifficulty } from '../db';

// 1 Hour = 100 XP
const XP_PER_HOUR = 100;

// Fitness XP map
const XP_MAP: Record<ExerciseDifficulty, number> = {
  very_easy: 2,
  easy: 5,
  medium: 10,
  hard: 15,
  very_hard: 20
};
const CARDIO_XP_PER_MIN = 10;

export function calculateLevel(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const currentLevelBaseXp = 100 * Math.pow(level - 1, 2);
  const nextLevelBaseXp = 100 * Math.pow(level, 2);
  const progress = (xp - currentLevelBaseXp) / (nextLevelBaseXp - currentLevelBaseXp);
  
  return { level, xp, currentLevelBaseXp, nextLevelBaseXp, progress: progress * 100 };
}

export function calculateStats(allHourLogs: any[], allExerciseLogs: any[], allExercises: any[]) {
  const totalHours = allHourLogs.reduce((sum, log) => sum + log.hours, 0);
  const devXp = Math.floor(totalHours * XP_PER_HOUR);

  const exMap = new Map(allExercises.map(ex => [ex.id, ex]));

  let totalReps = 0;
  let fitnessXp = 0;

  allExerciseLogs.forEach(log => {
    totalReps += log.reps;
    const ex = exMap.get(log.exerciseId);
    const diff = (ex?.difficulty || 'easy') as ExerciseDifficulty;
    const type = ex?.trackingType || 'reps';

    if (type === 'time') {
      fitnessXp += log.reps * CARDIO_XP_PER_MIN;
    } else {
      fitnessXp += log.reps * XP_MAP[diff];
    }
  });

  return {
    dev: calculateLevel(devXp),
    fitness: calculateLevel(fitnessXp),
    totalHours,
    totalReps
  };
}

const EMPTY_ARRAY: any[] = [];

export function useLevelSystem() {
  const allHourLogs = useLiveQuery(() => db.hourLogs.toArray()) ?? EMPTY_ARRAY;
  const allExerciseLogs = useLiveQuery(() => db.exerciseLogs.toArray()) ?? EMPTY_ARRAY;
  const allExercises = useLiveQuery(() => db.exercises.toArray()) ?? EMPTY_ARRAY;

  return useMemo(() => calculateStats(allHourLogs, allExerciseLogs, allExercises), [allHourLogs, allExerciseLogs, allExercises]);
}
