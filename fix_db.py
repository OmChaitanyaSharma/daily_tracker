import re

with open("src/db.ts", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Habit interface
habit_old = '''export interface Habit {
  id: string;
  name: string;
  createdAt: string; // ISO string
  startDate?: string; // YYYY-MM-DD
  archived: boolean;
  order?: number;
}'''

habit_new = '''export interface Habit {
  id: string;
  name: string;
  createdAt: string; // ISO string
  startDate?: string; // YYYY-MM-DD
  archived: boolean;
  order?: number;
  frequencyType?: 'daily' | 'specific_days';
  daysOfWeek?: number[]; // 0=Sun, 1=Mon, etc.
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'event' | 'deadline';
  title: string;
  description?: string;
}'''

content = content.replace(habit_old, habit_new)

# 2. Add events table to DailyTrackerDB properties
props_old = '''  goals!: Table<Goal, string>;
  goalMeasurements!: Table<GoalMeasurement, string>;
  exercises!: Table<Exercise, string>;
  exerciseLogs!: Table<ExerciseLog, string>;'''

props_new = '''  goals!: Table<Goal, string>;
  goalMeasurements!: Table<GoalMeasurement, string>;
  exercises!: Table<Exercise, string>;
  exerciseLogs!: Table<ExerciseLog, string>;
  events!: Table<CalendarEvent, string>;'''

content = content.replace(props_old, props_new)

# 3. Add Version 8 definition
v7_old = '''    // Version 7 schema definition (Exercise Tracking)
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
    });'''

v7_new = '''    // Version 7 schema definition (Exercise Tracking)
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

    // Version 8 schema definition (Calendar Events & Habit Frequencies)
    this.version(8).stores({
      dayEntries: 'date',
      tasks: 'id, date, completed',
      habits: 'id, archived',
      habitLogs: 'id, date, habitId, status',
      hourLogs: 'id, date, activity',
      hourCategories: 'id, name',
      goals: 'id, category',
      goalMeasurements: 'id, goalId, date',
      exercises: 'id, name, archived',
      exerciseLogs: 'id, date, exerciseId',
      events: 'id, date, type'
    }).upgrade(async tx => {
      // Initialize existing habits as 'daily'
      const habits = await tx.table('habits').toArray();
      for (const habit of habits) {
        if (!habit.frequencyType) {
          habit.frequencyType = 'daily';
          await tx.table('habits').put(habit);
        }
      }
    });'''

content = content.replace(v7_old, v7_new)

with open("src/db.ts", "w", encoding="utf-8") as f:
    f.write(content)
