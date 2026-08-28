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

export const DEV_RANKS = [
  { max: 10, title: "Logic Initiate" },
  { max: 20, title: "Code Apprentice" },
  { max: 30, title: "Algorithm Adept" },
  { max: 40, title: "Systems Craftsman" },
  { max: 50, title: "Lead Architect" },
  { max: 60, title: "Kernel Hacker" },
  { max: 70, title: "Machine Whisperer" },
  { max: 80, title: "Silicon Oracle" },
  { max: 90, title: "Turing Grandmaster" },
  { max: 99, title: "Cybernetic Titan" },
  { max: Infinity, title: "Digital God" }
];

export const FIT_RANKS = [
  { max: 10, title: "Iron Novice" },
  { max: 20, title: "Bronze Athlete" },
  { max: 30, title: "Steel Warrior" },
  { max: 40, title: "Titanium Spartan" },
  { max: 50, title: "Elite Gladiator" },
  { max: 60, title: "Apex Predator" },
  { max: 70, title: "Iron Juggernaut" },
  { max: 80, title: "Unstoppable Colossus" },
  { max: 90, title: "Herculean Champion" },
  { max: 99, title: "Olympian Titan" },
  { max: Infinity, title: "God of Iron" }
];

export function getDevTitle(level: number): string {
  return DEV_RANKS.find(r => level <= r.max)?.title || "Digital God";
}

export function getFitTitle(level: number): string {
  return FIT_RANKS.find(r => level <= r.max)?.title || "God of Iron";
}

export function calculateDevLevel(xp: number) {
  const level = Math.floor(Math.pow(xp / 100, 1 / 1.75)) + 1;
  const currentLevelBaseXp = 100 * Math.pow(level - 1, 1.75);
  const nextLevelBaseXp = 100 * Math.pow(level, 1.75);
  const progress = (xp - currentLevelBaseXp) / (nextLevelBaseXp - currentLevelBaseXp);
  
  return { 
    level, 
    xp, 
    currentLevelBaseXp, 
    nextLevelBaseXp, 
    progress: progress * 100,
    title: getDevTitle(level)
  };
}

export function calculateFitLevel(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const currentLevelBaseXp = 100 * Math.pow(level - 1, 2);
  const nextLevelBaseXp = 100 * Math.pow(level, 2);
  const progress = (xp - currentLevelBaseXp) / (nextLevelBaseXp - currentLevelBaseXp);
  
  return { 
    level, 
    xp, 
    currentLevelBaseXp, 
    nextLevelBaseXp, 
    progress: progress * 100,
    title: getFitTitle(level)
  };
}

export const calculateLevel = calculateFitLevel; // For tests that use the old name

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
    dev: calculateDevLevel(devXp),
    fitness: calculateFitLevel(fitnessXp),
    totalHours,
    totalReps
  };
}

const EMPTY_ARRAY: any[] = [];

export function useLevelSystem() {
  const allHourLogs = useLiveQuery(() => db.hourLogs.toArray());
  const allExerciseLogs = useLiveQuery(() => db.exerciseLogs.toArray());
  const allExercises = useLiveQuery(() => db.exercises.toArray());

  const isLoading = allHourLogs === undefined || allExerciseLogs === undefined || allExercises === undefined;

  const stats = useMemo(() => calculateStats(
    allHourLogs ?? EMPTY_ARRAY, 
    allExerciseLogs ?? EMPTY_ARRAY, 
    allExercises ?? EMPTY_ARRAY
  ), [allHourLogs, allExerciseLogs, allExercises]);

  return { ...stats, isLoading };
}
