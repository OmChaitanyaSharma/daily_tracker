import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export function useEconomy() {
  const profile = useLiveQuery(() => db.userProfile.get('default'));
  const allHabitLogs = useLiveQuery(() => db.habitLogs.toArray());
  const allHourLogs = useLiveQuery(() => db.hourLogs.toArray());
  const allExerciseLogs = useLiveQuery(() => db.exerciseLogs.toArray());

  if (!profile || !allHabitLogs || !allHourLogs || !allExerciseLogs) {
    return { coins: 0, isLoading: true };
  }

  const completedHabits = allHabitLogs.filter(l => l.status === 'completed').length;
  const totalHours = allHourLogs.reduce((sum, l) => sum + l.hours, 0);
  const totalExercises = allExerciseLogs.length;

  const totalEarnedCoins = (completedHabits * 10) + (totalHours * 10) + (totalExercises * 20);
  const currentCoins = totalEarnedCoins - (profile.coinsSpent || 0);

  return { coins: Math.max(0, currentCoins), isLoading: false };
}
