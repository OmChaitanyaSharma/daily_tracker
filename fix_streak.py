import re

with open("src/hooks/useStreak.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Replace hardcoded conditions with localStorage settings
old_conditions = '''    const habitConditionMet = numActive > 0 ? (habitScore / numActive >= 0.75) : true;

    const dateHourLogs = hoursByDate.get(dateStr) || [];
    const totalHours = dateHourLogs.reduce((acc, curr) => acc + curr.hours, 0);
    const hoursConditionMet = totalHours >= 3.0;'''

new_conditions = '''    const targetHabitPercent = parseFloat(localStorage.getItem('targetHabitPercent') || '0.75');
    const targetHours = parseFloat(localStorage.getItem('targetHours') || '6.0');

    const habitConditionMet = numActive > 0 ? (habitScore / numActive >= targetHabitPercent) : true;

    const dateHourLogs = hoursByDate.get(dateStr) || [];
    const totalHours = dateHourLogs.reduce((acc, curr) => acc + curr.hours, 0);
    const hoursConditionMet = totalHours >= targetHours;'''

content = content.replace(old_conditions, new_conditions)

with open("src/hooks/useStreak.ts", "w", encoding="utf-8") as f:
    f.write(content)
