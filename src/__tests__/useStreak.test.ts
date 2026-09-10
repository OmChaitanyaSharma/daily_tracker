import { describe, it, expect, beforeEach } from 'vitest';
import { calculateStreak } from '../hooks/useStreak';
import { getTodayStr } from '../utils/dateUtils';
import { subDays, format } from 'date-fns';

describe('calculateStreak', () => {
  const today = getTodayStr();
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const twoDaysAgo = format(subDays(new Date(), 2), 'yyyy-MM-dd');

  beforeEach(() => {
    localStorage.setItem('targetHabitPercent', '0.75');
    localStorage.setItem('targetHours', '3.0'); // In the original tests, hour logs were 3.0 and 4.0
  });

  it('should return 0 when there are no logs', () => {
    const habits = [{ id: 'h1', startDate: twoDaysAgo, archived: false }];
    const exercises = [{ id: 'e1', archived: false }];
    expect(calculateStreak(habits, [], [], exercises, []).streak).toBe(0);
  });

  it('should return 1 when all conditions are met today', () => {
    const habits = [{ id: 'h1', startDate: today, archived: false }];
    const habitLogs = [{ habitId: 'h1', date: today, status: 'completed' }];
    const hourLogs = [{ id: 'hl1', date: today, hours: 3.0 }];
    const exercises = [{ id: 'e1', archived: false }];
    const exerciseLogs = [{ exerciseId: 'e1', date: today, reps: 10 }];

    expect(calculateStreak(habits, habitLogs, hourLogs, exercises, exerciseLogs).streak).toBe(1);
  });

  it('should handle partial habits correctly (75% threshold)', () => {
    const habits = [
      { id: 'h1', startDate: today, archived: false },
      { id: 'h2', startDate: today, archived: false }
    ];
    const habitLogs = [
      { habitId: 'h1', date: today, status: 'completed' }, // 1.0
      { habitId: 'h2', date: today, status: 'partial' } // 0.5 => 1.5/2 = 75%
    ];
    const hourLogs = [{ id: 'hl1', date: today, hours: 3.0 }];
    expect(calculateStreak(habits, habitLogs, hourLogs, [], []).streak).toBe(1);
  });

  it('should fail if habit score < 75%', () => {
    const habits = [
      { id: 'h1', startDate: today, archived: false },
      { id: 'h2', startDate: today, archived: false }
    ];
    const habitLogs = [
      { habitId: 'h1', date: today, status: 'partial' },
      { habitId: 'h2', date: today, status: 'none' }
    ];
    const hourLogs = [{ id: 'hl1', date: today, hours: 3.0 }];
    expect(calculateStreak(habits, habitLogs, hourLogs, [], []).streak).toBe(0);
  });

  it('should fail if hours are < 3.0', () => {
    const habits = [{ id: 'h1', startDate: today, archived: false }];
    const habitLogs = [{ habitId: 'h1', date: today, status: 'completed' }];
    const hourLogs = [{ id: 'hl1', date: today, hours: 2.5 }];
    expect(calculateStreak(habits, habitLogs, hourLogs, [], []).streak).toBe(0);
  });

  it('should pass with multiple days streak', () => {
    const habits = [{ id: 'h1', startDate: twoDaysAgo, archived: false }];
    const habitLogs = [
      { habitId: 'h1', date: today, status: 'completed' },
      { habitId: 'h1', date: yesterday, status: 'completed' },
      { habitId: 'h1', date: twoDaysAgo, status: 'completed' }
    ];
    const hourLogs = [
      { id: 'hl1', date: today, hours: 3.0 },
      { id: 'hl2', date: yesterday, hours: 5.0 },
      { id: 'hl3', date: twoDaysAgo, hours: 4.0 }
    ];
    expect(calculateStreak(habits, habitLogs, hourLogs, [], []).streak).toBe(3);
  });

  it('should correctly ignore archived habits and exercises', () => {
    const habits = [
      { id: 'h1', startDate: today, archived: true }, // should be ignored
      { id: 'h2', startDate: today, archived: false } // active
    ];
    const habitLogs = [{ habitId: 'h2', date: today, status: 'completed' }];
    const exercises = [
      { id: 'e1', archived: true }, // ignored
      { id: 'e2', archived: false } // active
    ];
    const exerciseLogs = [{ exerciseId: 'e2', date: today, reps: 5 }];
    const hourLogs = [{ id: 'hl1', date: today, hours: 3.0 }];
    expect(calculateStreak(habits, habitLogs, hourLogs, exercises, exerciseLogs).streak).toBe(1);
  });

  it('should fail if any active exercise has 0 reps', () => {
    const habits = [{ id: 'h1', startDate: today, archived: false }];
    const habitLogs = [{ habitId: 'h1', date: today, status: 'completed' }];
    const hourLogs = [{ id: 'hl1', date: today, hours: 3.0 }];
    const exercises = [
      { id: 'e1', archived: false },
      { id: 'e2', archived: false }
    ];
    const exerciseLogs = [{ exerciseId: 'e1', date: today, reps: 10 }]; // e2 missing

    expect(calculateStreak(habits, habitLogs, hourLogs, exercises, exerciseLogs).streak).toBe(0);
  });
});
