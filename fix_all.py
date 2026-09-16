import re

with open("src/pages/ProductivityHabits.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. handleMenuClick
content = re.sub(
    r'setEditName\(habit.name\);\s*setEditStartDate\(habit.startDate \|\| \'\'\);\s*setEditingHabit\(habit\);',
    r"setEditName(habit.name);\nsetEditStartDate(habit.startDate || '');\nsetEditFrequencyType(habit.frequencyType || 'daily');\nsetEditSpecificDays(habit.specificDays || []);\nsetEditingHabit(habit);",
    content
)

# 2. saveEditHabit
content = re.sub(
    r'await db.habits.update\(editingHabit.id, \{\s*name: editName.trim\(\),\s*startDate: editStartDate \|\| undefined\s*\}\);',
    r"await db.habits.update(editingHabit.id, { name: editName.trim(), startDate: editStartDate || undefined, frequencyType: editFrequencyType, specificDays: editSpecificDays });",
    content
)

# 3. isEligible in Grid
content = re.sub(
    r'const isEligible = dateStr >= startDateStr;\s*const isSunday = date.getDay\(\) === 0;',
    r"let isEligible = dateStr >= startDateStr;\nif (isEligible && habit.frequencyType === 'specific_days' && habit.specificDays) { isEligible = habit.specificDays.includes(date.getDay()); }\nconst isSunday = date.getDay() === 0;",
    content
)

# 4. isEligible in Score
content = re.sub(
    r'if \(dateStr >= startDateStr\) \{\s*eligibleDays\+\+;\s*const log = habitLogs.find\(l => l.date === dateStr && l.habitId === habit.id\);',
    r"let isEligible = dateStr >= startDateStr;\nif (isEligible && habit.frequencyType === 'specific_days' && habit.specificDays) { isEligible = habit.specificDays.includes(date.getDay()); }\nif (isEligible) {\neligibleDays++;\nconst log = habitLogs.find(l => l.date === dateStr && l.habitId === habit.id);",
    content
)

with open("src/pages/ProductivityHabits.tsx", "w", encoding="utf-8") as f:
    f.write(content)
