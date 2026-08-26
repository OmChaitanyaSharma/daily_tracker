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

function getDevTitle(level: number): string {
  if (level <= 10) return "Logic Initiate";
  if (level <= 20) return "Code Apprentice";
  if (level <= 30) return "Algorithm Adept";
  if (level <= 40) return "Systems Craftsman";
  if (level <= 50) return "Lead Architect";
  if (level <= 60) return "Kernel Hacker";
  if (level <= 70) return "Machine Whisperer";
  if (level <= 80) return "Silicon Oracle";
  if (level <= 90) return "Turing Grandmaster";
  if (level <= 99) return "Cybernetic Titan";
  return "Digital God";
}

function getFitTitle(level: number): string {
  if (level <= 10) return "Iron Novice";
  if (level <= 20) return "Bronze Athlete";
  if (level <= 30) return "Steel Warrior";
  if (level <= 40) return "Titanium Spartan";
  if (level <= 50) return "Elite Gladiator";
  if (level <= 60) return "Apex Predator";
  if (level <= 70) return "Iron Juggernaut";
  if (level <= 80) return "Unstoppable Colossus";
  if (level <= 90) return "Herculean Champion";
  if (level <= 99) return "Olympian Titan";
  return "God of Iron";
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
  const allHourLogs = useLiveQuery(() => db.hourLogs.toArray()) ?? EMPTY_ARRAY;
  const allExerciseLogs = useLiveQuery(() => db.exerciseLogs.toArray()) ?? EMPTY_ARRAY;
  const allExercises = useLiveQuery(() => db.exercises.toArray()) ?? EMPTY_ARRAY;

  return useMemo(() => calculateStats(allHourLogs, allExerciseLogs, allExercises), [allHourLogs, allExerciseLogs, allExercises]);
}
