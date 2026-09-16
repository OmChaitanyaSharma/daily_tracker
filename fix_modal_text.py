import re

with open("src/components/GoalSettingsModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("End of Year", "Winter Arc")

with open("src/components/GoalSettingsModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
