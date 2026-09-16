import re

with open("src/pages/Goals.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("End of Year", "End of Winter Arc")
content = content.replace("end of the year.", "end of the winter arc (March 1st).")

with open("src/pages/Goals.tsx", "w", encoding="utf-8") as f:
    f.write(content)
