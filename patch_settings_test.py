import re

with open("src/__tests__/settings.test.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("expect(s.streakTargetHabitPercent).toBe(75);", "expect(s.streakTargetHabitPercent).toBe(75);\n    expect(s.seasonName).toBe('Winter Arc');")

with open("src/__tests__/settings.test.ts", "w", encoding="utf-8") as f:
    f.write(content)
