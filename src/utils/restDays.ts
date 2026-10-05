import { startOfWeek, format, getDay } from 'date-fns';

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

// Get the Monday for a given date
export function getWeekStartStr(date: Date): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

// Find what the schedule should be for a specific week string.
// If it's not set explicitly, it cascades from the most recent previous week, or default.
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

export function isRestDay(dateStr: string): boolean {
  const date = new Date(dateStr + "T00:00:00");
  const weekStartStr = getWeekStartStr(date);
  const config = getRestDaysConfig();
  const schedule = getScheduleForWeek(weekStartStr, config);
  return schedule.includes(getDay(date));
}
