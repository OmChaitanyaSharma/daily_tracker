import re

with open("src/db.ts", "r", encoding="utf-8") as f:
    content = f.read()

v8_block = """    // Version 8 schema definition (Calendar Events & Habit Frequencies)
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
    });"""

v9_block = v8_block + """

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
          coinsSpent: 0,
          freezes: 1, // 1 free freeze
          strExp: 0,
          intExp: 0,
          chaExp: 0
        });
      }
    });"""

content = content.replace(v8_block, v9_block)

with open("src/db.ts", "w", encoding="utf-8") as f:
    f.write(content)
