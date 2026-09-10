import re

# Fix AutumnLeaves.tsx
with open("src/components/AutumnLeaves.tsx", "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace("import React, { useEffect, useState } from 'react';", "import { useEffect, useState } from 'react';")
with open("src/components/AutumnLeaves.tsx", "w", encoding="utf-8") as f:
    f.write(content)

# Fix SakuraFall.tsx
with open("src/components/SakuraFall.tsx", "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace("import React, { useEffect, useState } from 'react';", "import { useEffect, useState } from 'react';")
with open("src/components/SakuraFall.tsx", "w", encoding="utf-8") as f:
    f.write(content)

# Fix Calendar.tsx
with open("src/pages/Calendar.tsx", "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace("import { db, CalendarEvent } from '../db';", "import { db } from '../db';")
with open("src/pages/Calendar.tsx", "w", encoding="utf-8") as f:
    f.write(content)

# Fix useStreak.test.ts
with open("src/hooks/useStreak.test.ts", "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace("const allExercises = [];", "const allExercises: any[] = [];")
content = content.replace("const allExerciseLogs = [];", "const allExerciseLogs: any[] = [];")
content = content.replace("const { streak, freezesOwned, frozenDays }", "const { streak, frozenDays }")
with open("src/hooks/useStreak.test.ts", "w", encoding="utf-8") as f:
    f.write(content)
