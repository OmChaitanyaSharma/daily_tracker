import re

with open("src/hooks/useStreak.ts", "r", encoding="utf-8") as f:
    content = f.read()

streak_old = """    const activeHabitsOnDate = allHabits.filter(h => (!h.startDate || h.startDate <= dateStr) && !h.archived);
    const numActive = activeHabitsOnDate.length;

    const dateHabitLogs = logsByDate.get(dateStr) || [];
    let habitScore = 0;
    dateHabitLogs.forEach(log => {
      if (log.status === 'completed') habitScore += 1.0;
      else if (log.status === 'partial') habitScore += 0.5;
    });

    const targetHabitPercent = parseFloat(localStorage.getItem('targetHabitPercent') || '0.75');
    const targetHours = parseFloat(localStorage.getItem('targetHours') || '6.0');

    const habitConditionMet = numActive > 0 ? (habitScore / numActive >= targetHabitPercent) : true;"""

streak_new = """    const currentDayOfWeek = current.getDay(); // 0 = Sun, 1 = Mon, etc.
    const activeHabitsOnDate = allHabits.filter(h => {
      if (h.archived) return false;
      if (h.startDate && h.startDate > dateStr) return false;
      if (h.frequencyType === 'specific_days' && h.daysOfWeek && h.daysOfWeek.length > 0) {
        if (!h.daysOfWeek.includes(currentDayOfWeek)) return false;
      }
      return true;
    });
    const numActive = activeHabitsOnDate.length;

    const dateHabitLogs = logsByDate.get(dateStr) || [];
    let habitScore = 0;
    dateHabitLogs.forEach(log => {
      // Only count score if the habit is actually scheduled for today
      if (activeHabitsOnDate.some(h => h.id === log.habitId)) {
        if (log.status === 'completed') habitScore += 1.0;
        else if (log.status === 'partial') habitScore += 0.5;
      }
    });

    const targetHabitPercent = parseFloat(localStorage.getItem('targetHabitPercent') || '0.75');
    const targetHours = parseFloat(localStorage.getItem('targetHours') || '6.0');

    const habitConditionMet = numActive > 0 ? (habitScore / numActive >= targetHabitPercent) : true;"""

content = content.replace(streak_old, streak_new)

with open("src/hooks/useStreak.ts", "w", encoding="utf-8") as f:
    f.write(content)
