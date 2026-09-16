import re

with open("src/pages/Home.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Patch the Streak logic
# Replace 6.0 and 0.75 with settings
streak_logic_old = """  const habitConditionMet = activeHabits.length > 0 ? (habitScore / activeHabits.length >= 0.75) : true;
  
  const todaysTotalHours = todaysHourLogs.reduce((acc, log) => acc + log.hours, 0);
  const hoursConditionMet = todaysTotalHours >= 6.0;"""

streak_logic_new = """  const settings = getSettings();
  const targetPercent = settings.streakTargetHabitPercent / 100;
  const habitConditionMet = activeHabits.length > 0 ? (habitScore / activeHabits.length >= targetPercent) : true;
  
  const todaysTotalHours = todaysHourLogs.reduce((acc, log) => acc + log.hours, 0);
  const hoursConditionMet = todaysTotalHours >= settings.streakTargetHours;"""

content = content.replace(streak_logic_old, streak_logic_new)

# 2. Patch the Streak UI texts
ui_text_1_old = """Log at least 6.0 Hours (Current: {todaysTotalHours.toFixed(1)}h)"""
ui_text_1_new = """Log at least {settings.streakTargetHours.toFixed(1)} Hours (Current: {todaysTotalHours.toFixed(1)}h)"""
content = content.replace(ui_text_1_old, ui_text_1_new)

ui_text_2_old = """Complete 75% of Daily Habits"""
ui_text_2_new = """Complete {settings.streakTargetHabitPercent}% of Daily Habits"""
content = content.replace(ui_text_2_old, ui_text_2_new)

# 3. Patch Winter Arc UI to map settings.winterArcRules
winter_arc_old = """            <ul className="space-y-4 text-sm font-medium">
              <li className="flex gap-4 items-center bg-bg-base border border-border-subtle p-3 rounded-xl">
                <span className="text-accent-blue font-bold opacity-80 w-4 text-center">1</span>
                <span className="text-text-main">Wake up at 6 am daily / sleep by 10 pm</span>
              </li>
              <li className="flex gap-4 items-center bg-bg-base border border-border-subtle p-3 rounded-xl">
                <span className="text-accent-blue font-bold opacity-80 w-4 text-center">2</span>
                <span className="text-text-main">Train consistently</span>
              </li>
              <li className="flex gap-4 items-center bg-bg-base border border-border-subtle p-3 rounded-xl">
                <span className="text-accent-blue font-bold opacity-80 w-4 text-center">3</span>
                <span className="text-text-main">Skin care + hair care</span>
              </li>
              <li className="flex gap-4 items-center bg-bg-base border border-border-subtle p-3 rounded-xl">
                <span className="text-accent-blue font-bold opacity-80 w-4 text-center">4</span>
                <span className="text-text-main">Work for over 8 hours daily (coding + skills + study)</span>
              </li>
              <li className="flex gap-4 items-center bg-bg-base border border-border-subtle p-3 rounded-xl">
                <span className="text-accent-blue font-bold opacity-80 w-4 text-center">5</span>
                <span className="text-text-main">Discipline {">>"} Motivation</span>
              </li>
              <li className="flex gap-4 items-center bg-bg-base border border-border-subtle p-3 rounded-xl">
                <span className="text-accent-blue font-bold opacity-80 w-4 text-center">6</span>
                <span className="text-text-main">Less social media, more books</span>
              </li>
              <li className="flex gap-4 items-center bg-bg-base border border-border-subtle p-3 rounded-xl">
                <span className="text-accent-blue font-bold opacity-80 w-4 text-center">7</span>
                <span className="text-text-main">Count every calorie you eat</span>
              </li>
            </ul>"""

winter_arc_new = """            <ul className="space-y-4 text-sm font-medium">
              {settings.winterArcRules.map((rule, idx) => (
                <li key={idx} className="flex gap-4 items-center bg-bg-base border border-border-subtle p-3 rounded-xl">
                  <span className="text-accent-blue font-bold opacity-80 w-4 text-center">{idx + 1}</span>
                  <span className="text-text-main">{rule}</span>
                </li>
              ))}
            </ul>"""
content = content.replace(winter_arc_old, winter_arc_new)

with open("src/pages/Home.tsx", "w", encoding="utf-8") as f:
    f.write(content)
