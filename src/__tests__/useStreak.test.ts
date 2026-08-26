import { describe, it, expect } from 'vitest';
import { calculateStreak } from '../hooks/useStreak';
import { getTodayStr } from '../utils/dateUtils';
import { subDays, format } from 'date-fns';

describe('calculateStreak', () => {
  const today = getTodayStr();
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const twoDaysAgo = format(subDays(new Date(), 2), 'yyyy-MM-dd');

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
      { habitId: 'h1', date: today, status: 'completed' },
      { habitId: 'h2', date: today, status: 'partial' }
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
      { habitId: 'h1', date: today, status: 'partial' }
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
      { id: 'hl2', date: yesterday, hours: 3.5 },
      { id: 'hl3', date: twoDaysAgo, hours: 4.0 }
    ];
    expect(calculateStreak(habits, habitLogs, hourLogs, [], []).streak).toBe(3);
  });

  it('should correctly ignore archived habits and exercises', () => {
    const habits = [
      { id: 'h1', startDate: today, archived: true },
      { id: 'h2', startDate: today, archived: false }
    ];
    const habitLogs = [{ habitId: 'h2', date: today, status: 'completed' }];
    const exercises = [
      { id: 'e1', archived: true },
      { id: 'e2', archived: false }
    ];
    const exerciseLogs = [{ exerciseId: 'e2', date: today, reps: 5 }];
    const hourLogs = [{ id: 'hl1', date: today, hours: 3.0 }];
    expect(calculateStreak(habits, habitLogs, hourLogs, exercises, exerciseLogs).streak).toBe(1);
  });

  it('should fail if any active exercise has 0 reps', () => {
    const hourLogs = [{ id: 'hl1', date: today, hours: 3.0 }];
    const exercises = [
      { id: 'e1', archived: false },
      { id: 'e2', archived: false }
    ];
    const exerciseLogs = [{ exerciseId: 'e1', date: today, reps: 10 }];
    expect(calculateStreak([], [], hourLogs, exercises, exerciseLogs).streak).toBe(0);
  });
});