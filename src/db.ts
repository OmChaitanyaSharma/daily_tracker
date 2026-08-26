import Dexie, { type Table } from 'dexie';

export interface DayEntry {
  date: string; // YYYY-MM-DD (Primary Key)
  mood: 'excellent' | 'good' | 'okay' | 'not-great' | 'bad' | '';
  oneLineSummary: string;
  highlight: string;
  wentWell: string;
  problems: string;
  learned?: string;
  whatIWantToRemember?: string;
  tomorrowPriorities?: string;
  reflection?: string;
  notes?: string;
  subjectiveScore: number;
  objectiveScore: number;
  // Deprecated: webDevHours, studyHours, dsaHours (Moved to HourLog in V3)
  webDevHours?: number;
  studyHours?: number;
  dsaHours?: number;
}

export interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface Habit {
  id: string;
  name: string;
  createdAt: string; // ISO string
  startDate?: string; // YYYY-MM-DD
  archived: boolean;
}

export interface HabitLog {
  id: string; // UUID
  habitId: string;
  date: string; // YYYY-MM-DD
  status: 'completed' | 'partial' | 'none'; 
}

export interface HourLog {
  id: string; // UUID
  date: string; // YYYY-MM-DD
  activity: string; // Category name matching HourCategory
  hours: number;
}

export interface Goal {
  id: string;
  title: string;
  category: 'end-of-year' | 'health';
  type: 'numeric' | 'count' | 'duration' | 'distance' | 'percentage' | 'qualitative';
  unit?: string;
  targetValue?: string | number;
  startDate: string; // YYYY-MM-DD
  startingValue?: string | number; // Added in V3
}

export interface GoalMeasurement {
  id: string; // UUID
  goalId: string;
  date: string; // YYYY-MM-DD
  value: string | number;
  unit?: string; // Stored natively to prevent unit mismatch if Goal unit changes
  notes?: string;
}

export interface HourCategory {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export type ExerciseDifficulty = 'very_easy' | 'easy' | 'medium' | 'hard' | 'very_hard';
export type TrackingType = 'reps' | 'time';

export interface Exercise {
  id: string;
  name: string;
  createdAt: string; // ISO string
  archived: boolean;
  difficulty?: ExerciseDifficulty;
  trackingType?: TrackingType;
}

export interface ExerciseLog {
  id: string;
  date: string; // YYYY-MM-DD
  exerciseId: string;
  reps: number;
}

export class DailyTrackerDB extends Dexie {
  dayEntries!: Table<DayEntry, string>;
  tasks!: Table<Task, string>;
  habits!: Table<Habit, string>;
  habitLogs!: Table<HabitLog, string>;
  hourLogs!: Table<HourLog, string>;
  hourCategories!: Table<HourCategory, string>;
  goals!: Table<Goal, string>;
  goalMeasurements!: Table<GoalMeasurement, string>;
  exercises!: Table<Exercise, string>;
  exerciseLogs!: Table<ExerciseLog, string>;

  constructor() {
    super('DailyTrackerDB');
    
    // Version 2 schema definition
    this.version(2).stores({
      dayEntries: 'date',
      tasks: 'id, date, completed',
      habits: 'id, archived',
      habitLogs: 'id, date, habitId, status',
      goals: 'id, category',
      goalMeasurements: 'id, goalId, date'
    });

    // Version 3 schema definition (UUIDs, HourLog, Safe Migration)
    this.version(3).stores({
      dayEntries: 'date',
      tasks: 'id, date, completed',
      habits: 'id, archived',
      habitLogs: 'id, date, habitId, status',
      hourLogs: 'id, date, activity',
      goals: 'id, category',
      goalMeasurements: 'id, goalId, date'
    }).upgrade(async tx => {
      // 1. Migrate HabitLogs to UUIDs
      const oldHabitLogs = await tx.table('habitLogs').toArray();
      await tx.table('habitLogs').clear();
      for (const log of oldHabitLogs) {
        if (log.id.includes('_')) log.id = crypto.randomUUID();
        await tx.table('habitLogs').add(log);
      }

      // 2. Migrate GoalMeasurements to UUIDs
      const oldMeasurements = await tx.table('goalMeasurements').toArray();
      await tx.table('goalMeasurements').clear();
      for (const m of oldMeasurements) {
        if (m.id.includes('_')) m.id = crypto.randomUUID();
        await tx.table('goalMeasurements').add(m);
      }

      // 3. Extract Hours from DayEntry to HourLog
      const dayEntries = await tx.table('dayEntries').toArray();
      for (const entry of dayEntries) {
        if (entry.webDevHours && entry.webDevHours > 0) {
          await tx.table('hourLogs').add({ id: crypto.randomUUID(), date: entry.date, activity: 'WebDev', hours: entry.webDevHours });
          delete entry.webDevHours;
        }
        if (entry.studyHours && entry.studyHours > 0) {
          await tx.table('hourLogs').add({ id: crypto.randomUUID(), date: entry.date, activity: 'Study', hours: entry.studyHours });
          delete entry.studyHours;
        }
        if (entry.dsaHours && entry.dsaHours > 0) {
          await tx.table('hourLogs').add({ id: crypto.randomUUID(), date: entry.date, activity: 'DSA', hours: entry.dsaHours });
          delete entry.dsaHours;
        }
        await tx.table('dayEntries').put(entry);
      }
    });

    // Version 4 schema definition (Add startDate to Habit)
    this.version(4).stores({
      dayEntries: 'date',
      tasks: 'id, date, completed',
      habits: 'id, archived',
      habitLogs: 'id, date, habitId, status',
      hourLogs: 'id, date, activity',
      goals: 'id, category',
      goalMeasurements: 'id, goalId, date'
    }).upgrade(async tx => {
      const habits = await tx.table('habits').toArray();
      for (const habit of habits) {
        if (!habit.startDate) {
          try {
            const d = new Date(habit.createdAt);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            habit.startDate = `${year}-${month}-${day}`;
          } catch(e) {
            const d = new Date();
            habit.startDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
          await tx.table('habits').put(habit);
        }
      }
    });

    // Version 5 schema definition (Fix NaN-NaN-NaN start dates)
    this.version(5).stores({
      dayEntries: 'date',
      tasks: 'id, date, completed',
      habits: 'id, archived',
      habitLogs: 'id, date, habitId, status',
      hourLogs: 'id, date, activity',
      goals: 'id, category',
      goalMeasurements: 'id, goalId, date'
    }).upgrade(async tx => {
      const habits = await tx.table('habits').toArray();
      for (const habit of habits) {
        if (habit.startDate && habit.startDate.includes('NaN')) {
          habit.startDate = '2024-01-01';
          await tx.table('habits').put(habit);
        }
      }
    });

    // Version 6 schema definition (Dynamic Hour Categories)
    this.version(6).stores({
      dayEntries: 'date',
      tasks: 'id, date, completed',
      habits: 'id, archived',
      habitLogs: 'id, date, habitId, status',
      hourLogs: 'id, date, activity',
      hourCategories: 'id, name',
      goals: 'id, category',
      goalMeasurements: 'id, goalId, date'
    }).upgrade(async tx => {
      await tx.table('hourCategories').bulkAdd([
        { id: crypto.randomUUID(), name: 'Web Dev', color: 'var(--accent-blue)', createdAt: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'DSA', color: 'var(--accent-purple)', createdAt: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'Study', color: 'var(--accent-red)', createdAt: new Date().toISOString() }
      ]);
    });

    // Version 7 schema definition (Exercise Tracking)
    this.version(7).stores({
      dayEntries: 'date',
      tasks: 'id, date, completed',
      habits: 'id, archived',
      habitLogs: 'id, date, habitId, status',
      hourLogs: 'id, date, activity',
      hourCategories: 'id, name',
      goals: 'id, category',
      goalMeasurements: 'id, goalId, date',
      exercises: 'id, name, archived',
      exerciseLogs: 'id, date, exerciseId'
    });
  }
}

export const db = new DailyTrackerDB();
