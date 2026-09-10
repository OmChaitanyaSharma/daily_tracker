import re

with open("src/utils/calendarSync.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("function formatICSDate", "// function formatICSDate")

with open("src/utils/calendarSync.ts", "w", encoding="utf-8") as f:
    f.write(content)

with open("src/pages/ProductivityHabits.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("import { motion, AnimatePresence } from 'framer-motion';", "import { motion } from 'framer-motion';")

with open("src/pages/ProductivityHabits.tsx", "w", encoding="utf-8") as f:
    f.write(content)
