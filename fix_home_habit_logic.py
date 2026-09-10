import re

with open("src/pages/Home.tsx", "r", encoding="utf-8") as f:
    content = f.read()

home_logic_old = """    const activeHabits = allHabits.filter(h => !h.archived);
    
    let habitScore = 0;
    todaysHabitLogs.forEach(log => {
      if (log.status === 'completed') habitScore += 1.0;
      else if (log.status === 'partial') habitScore += 0.5;
    });
    
    const targetHabitPercent = parseFloat(localStorage.getItem('targetHabitPercent') || '0.75');
    const targetHours = parseFloat(localStorage.getItem('targetHours') || '6.0');
    
    const habitConditionMet = activeHabits.length > 0 ? (habitScore / activeHabits.length >= targetHabitPercent) : true;"""

home_logic_new = """    const currentDayOfWeek = new Date().getDay();
    const activeHabits = allHabits.filter(h => {
      if (h.archived) return false;
      if (h.frequencyType === 'specific_days' && h.daysOfWeek && h.daysOfWeek.length > 0) {
        if (!h.daysOfWeek.includes(currentDayOfWeek)) return false;
      }
      return true;
    });
    
    let habitScore = 0;
    todaysHabitLogs.forEach(log => {
      if (activeHabits.some(h => h.id === log.habitId)) {
        if (log.status === 'completed') habitScore += 1.0;
        else if (log.status === 'partial') habitScore += 0.5;
      }
    });
    
    const targetHabitPercent = parseFloat(localStorage.getItem('targetHabitPercent') || '0.75');
    const targetHours = parseFloat(localStorage.getItem('targetHours') || '6.0');
    
    const habitConditionMet = activeHabits.length > 0 ? (habitScore / activeHabits.length >= targetHabitPercent) : true;"""

content = content.replace(home_logic_old, home_logic_new)

with open("src/pages/Home.tsx", "w", encoding="utf-8") as f:
    f.write(content)
