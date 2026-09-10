import re

# Fix Calendar.tsx
with open("src/pages/Calendar.tsx", "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace("import type { CalendarEvent } from '../db';", "")
with open("src/pages/Calendar.tsx", "w", encoding="utf-8") as f:
    f.write(content)

# Fix useStreak.test.ts
with open("src/hooks/useStreak.test.ts", "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace("const { streak, freezesOwned } = calculateStreak(", "const { streak } = calculateStreak(")
with open("src/hooks/useStreak.test.ts", "w", encoding="utf-8") as f:
    f.write(content)
