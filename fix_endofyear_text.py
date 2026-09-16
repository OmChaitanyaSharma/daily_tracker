import re

with open("src/pages/EndOfYearGoals.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("Goals Till End of Year", "Goals Till End of Winter Arc (March 1st)")

with open("src/pages/EndOfYearGoals.tsx", "w", encoding="utf-8") as f:
    f.write(content)
