import re

with open("src/db.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Add UserProfile and WeeklyBoss interfaces
new_interfaces = """export interface UserProfile {
  id: string; // 'default'
  coins: number;
  freezes: number;
  strExp: number;
  intExp: number;
  chaExp: number;
}

export interface WeeklyBoss {
  id: string; // 'week-YYYY-WW'
  name: string;
  maxHp: number;
  hp: number;
  isDefeated: boolean;
  weekStr: string; // e.g. "2026-W37"
}

export interface Habit {"""

content = content.replace("export interface Habit {", new_interfaces)

# Add properties to Habit
habit_old = """  daysOfWeek?: number[]; // 0=Sun, 1=Mon, etc.
}"""
habit_new = """  daysOfWeek?: number[]; // 0=Sun, 1=Mon, etc.
  skillCategory?: 'STR' | 'INT' | 'CHA' | 'DEX' | 'CON';
}"""
content = content.replace(habit_old, habit_new)

# Add tables to class
tables_old = """  events!: Table<CalendarEvent, string>;

  constructor() {"""
tables_new = """  events!: Table<CalendarEvent, string>;
  userProfile!: Table<UserProfile, string>;
  bosses!: Table<WeeklyBoss, string>;

  constructor() {"""
content = content.replace(tables_old, tables_new)

# Add Version 9
v8_end = """      }).upgrade(async tx => {
        // Initialize existing habits as 'daily'
        const habits = await tx.table('habits').toArray();
        for (const habit of habits) {
          if (!habit.frequencyType) {
            habit.frequencyType = 'daily';
            await tx.table('habits').put(habit);
          }
        }
      });
"""
v9 = """      }).upgrade(async tx => {
        // Initialize existing habits as 'daily'
        const habits = await tx.table('habits').toArray();
        for (const habit of habits) {
          if (!habit.frequencyType) {
            habit.frequencyType = 'daily';
            await tx.table('habits').put(habit);
          }
        }
      });

      // Version 9 schema definition (RPG System)
      this.version(9).stores({
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
        events: 'id, date, type',
        userProfile: 'id',
        bosses: 'id, weekStr'
      }).upgrade(async tx => {
        // Initialize user profile
        if (await tx.table('userProfile').count() === 0) {
          await tx.table('userProfile').add({
            id: 'default',
            coins: 100, // starting bonus
            freezes: 1, // 1 free freeze
            strExp: 0,
            intExp: 0,
            chaExp: 0
          });
        }
      });
"""
content = content.replace(v8_end, v9)

with open("src/db.ts", "w", encoding="utf-8") as f:
    f.write(content)
