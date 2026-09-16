import re

with open("src/db.ts", "r", encoding="utf-8") as f:
    content = f.read()

habit_old = """export interface Habit {
  id: string;
  name: string;
  createdAt: string; // ISO string
  startDate?: string; // YYYY-MM-DD
  archived: boolean;
  order?: number;
}"""

habit_new = """export interface Habit {
  id: string;
  name: string;
  createdAt: string; // ISO string
  startDate?: string; // YYYY-MM-DD
  archived: boolean;
  order?: number;
  frequencyType?: 'daily' | 'specific_days';
  specificDays?: number[]; // 0=Sun, 1=Mon, etc.
}"""

content = content.replace(habit_old, habit_new)

# Add version 8 upgrade block
v7_block = """    // Version 7 schema definition (Exercise Tracking)
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
    });"""

v8_block = v7_block + """

    // Version 8 schema definition (Habit Frequencies)
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
      exerciseLogs: 'id, date, exerciseId'
    }).upgrade(async tx => {
      // Initialize existing habits as 'daily'
      const habits = await tx.table('habits').toArray();
      for (const habit of habits) {
        if (!habit.frequencyType) {
          habit.frequencyType = 'daily';
          habit.specificDays = [];
          await tx.table('habits').put(habit);
        }
      }
    });"""

content = content.replace(v7_block, v8_block)

with open("src/db.ts", "w", encoding="utf-8") as f:
    f.write(content)
