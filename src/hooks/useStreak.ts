import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { getTodayStr } from '../utils/dateUtils';

export function useStreak() {
  const allHabits = useLiveQuery(() => db.habits.toArray()) || [];
  const allHabitLogsForStreak = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const allHourLogsForStreak = useLiveQuery(() => db.hourLogs.toArray()) || [];

  const currentStreak = useMemo(() => {
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

    let checkingDate = new Date();
    while (true) {
      const dateStr = format(checkingDate, 'yyyy-MM-dd');
      
      const activeHabitsOnDate = allHabits.filter(h => !h.startDate || h.startDate <= dateStr);
      const numActive = activeHabitsOnDate.length;

      const dateHabitLogs = logsByDate.get(dateStr) || [];
      let habitScore = 0;
      dateHabitLogs.forEach(log => {
        if (log.status === 'completed') habitScore += 1.0;
        else if (log.status === 'partial') habitScore += 0.5;
      });

      const habitConditionMet = numActive > 0 ? (habitScore / numActive >= 0.8) : false;

      const dateHourLogs = hoursByDate.get(dateStr) || [];
      const totalHours = dateHourLogs.reduce((acc, curr) => acc + curr.hours, 0);
      const hoursConditionMet = totalHours >= 3.0;

      if (habitConditionMet && hoursConditionMet) {
        streak++;
      } else {
        if (dateStr !== getTodayStr()) break;
      }

      checkingDate.setDate(checkingDate.getDate() - 1);
      if (streak > 3650) break; // safety fallback
      // Stop checking if date is before the app started (simplification)
      if (numActive === 0 && dateHourLogs.length === 0 && dateStr < getTodayStr()) break;
    }
    
    return streak;
  }, [allHabits, allHabitLogsForStreak, allHourLogsForStreak]);

  return currentStreak;
}
