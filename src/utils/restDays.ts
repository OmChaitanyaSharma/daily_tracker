import { startOfWeek, format, getDay, addDays, parseISO } from 'date-fns';
import type { Exercise, ExerciseLog } from '../db';

const LS_KEY = 'exercise_rest_days';
const DEFAULT_REST_DAYS = [1, 3, 5, 6]; // 1=Mon, 3=Wed, 5=Fri, 6=Sat

export interface RestDaysConfig {
  default: number[];
  weeks: Record<string, number[]>;
}

export function getRestDaysConfig(): RestDaysConfig {
  const stored = localStorage.getItem(LS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch(e) {}
  }
  return { default: DEFAULT_REST_DAYS, weeks: {} };
}

export function saveRestDaysConfig(config: RestDaysConfig) {
  localStorage.setItem(LS_KEY, JSON.stringify(config));
}

export function getWeekStartStr(date: Date): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function getScheduleForWeek(weekStartStr: string, config: RestDaysConfig): number[] {
  if (config.weeks[weekStartStr]) {
    return config.weeks[weekStartStr];
  }
  const pastWeeks = Object.keys(config.weeks)
    .filter(w => w < weekStartStr)
    .sort();
  if (pastWeeks.length > 0) {
    return config.weeks[pastWeeks[pastWeeks.length - 1]];
  }
  return config.default;
}

export function getNormalizedDay(date: Date | string): number {
  const d = typeof date === 'string' ? parseISO(date + "T00:00:00") : date;
  const day = getDay(d);
  return day === 0 ? 7 : day;
}

export function getEffectiveRestDays(plannedDays: number[], completedNormalizedDays: number[]): number[] {
  let effective = plannedDays.map(d => d === 0 ? 7 : d);
  
  for (let day = 1; day <= 7; day++) {
    if (effective.includes(day)) {
      if (completedNormalizedDays.includes(day)) {
        effective = effective.filter(d => d !== day);
        for (let nextDay = day + 1; nextDay <= 7; nextDay++) {
          if (!effective.includes(nextDay)) {
            effective.push(nextDay);
            break;
          }
        }
      }
    }
  }
  
  return effective.map(d => d === 7 ? 0 : d);
}

export function calculateEffectiveSchedule(
  weekStartStr: string,
  config: RestDaysConfig,
  allExercises: Exercise[],
  allExerciseLogs: ExerciseLog[]
): number[] {
  const planned = getScheduleForWeek(weekStartStr, config);
  if (!allExercises.length) return planned;

  const completedNormalizedDays: number[] = [];
  const weekStartDate = parseISO(weekStartStr + "T00:00:00");
  
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStartDate, i);
    const dStr = format(d, 'yyyy-MM-dd');
    
    const reqEx = allExercises.filter(ex => ex.createdAt.substring(0, 10) <= dStr && !ex.archived);
    if (reqEx.length > 0) {
      const logsForDay = allExerciseLogs.filter(l => l.date === dStr);
      const allCompleted = reqEx.every(ex => {
        const log = logsForDay.find(l => l.exerciseId === ex.id);
        return log && log.reps > 0;
      });
      if (allCompleted) {
        completedNormalizedDays.push(getNormalizedDay(d));
      }
    }
  }
  
  return getEffectiveRestDays(planned, completedNormalizedDays);
}
