import re

with open("src/pages/Calendar.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("import React, { useState, useMemo } from 'react';", "import React, { useState } from 'react';")
content = content.replace("import { db, CalendarEvent } from '../db';", "import { db } from '../db';\nimport type { CalendarEvent } from '../db';")

with open("src/pages/Calendar.tsx", "w", encoding="utf-8") as f:
    f.write(content)
