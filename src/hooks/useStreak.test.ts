import { describe, it, expect } from 'vitest';
import { calculateStreak } from './useStreak';
import { format, subDays } from 'date-fns';

describe('Streak Calculation', () => {
  it('should calculate streak accurately honoring specific days frequencies', () => {
    
    // Fake the dates to be predictable
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
    
    // We create a habit that is ONLY scheduled for tomorrow, so it shouldn't penalize today
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const allHabits = [
      { 
        id: '1', 
        name: 'Specific Day Habit', 
        archived: false, 
        startDate: yesterdayStr, 
        frequencyType: 'specific_days', 
        daysOfWeek: [tomorrow.getDay()] 
      },
      { 
        id: '2', 
        name: 'Daily Habit', 
        archived: false, 
        startDate: yesterdayStr, 
        frequencyType: 'daily' 
      }
    ];

    const allHabitLogsForStreak = [
      { id: 'l1', habitId: '2', date: yesterdayStr, status: 'completed' },
      { id: 'l2', habitId: '2', date: todayStr, status: 'completed' },
    ];
    
    const allHourLogsForStreak = [
      { id: 'h1', activity: 'Web Dev', date: yesterdayStr, hours: 6 },
      { id: 'h2', activity: 'Web Dev', date: todayStr, hours: 6 }
    ];
    
    const allExercises = [];
    const allExerciseLogs = [];

    // Mock localStorage for the test environment
    if (typeof window !== 'undefined') {
       window.localStorage.setItem('targetHabitPercent', '1.0');
       window.localStorage.setItem('targetHours', '6.0');
    }

    const { streak, freezesOwned } = calculateStreak(
      allHabits,
      allHabitLogsForStreak,
      allHourLogsForStreak,
      allExercises,
      allExerciseLogs
    );

    // It should have a 2-day streak because the daily habit was completed both days,
    // and the specific day habit wasn't scheduled on yesterday or today!
    expect(streak).toBe(2);
  });
});
