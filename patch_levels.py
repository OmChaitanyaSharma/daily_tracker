import re

with open("src/hooks/useLevelSystem.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Add getSettings import
content = content.replace("import { db, type ExerciseDifficulty } from '../db';", "import { db, type ExerciseDifficulty } from '../db';\nimport { getSettings } from '../utils/settings';")

# Patch DEV_RANKS and FIT_RANKS
content = re.sub(
    r'export const DEV_RANKS = \[.*?\];',
    r'''export const DEFAULT_DEV_RANKS = [
  { max: 10, title: "Logic Initiate" },
  { max: 20, title: "Code Apprentice" },
  { max: 30, title: "Algorithm Adept" },
  { max: 40, title: "Systems Craftsman" },
  { max: 50, title: "Lead Architect" },
  { max: 60, title: "Kernel Hacker" },
  { max: 70, title: "Machine Whisperer" },
  { max: 80, title: "Silicon Oracle" },
  { max: 90, title: "Turing Grandmaster" },
  { max: 99, title: "Cybernetic Titan" },
  { max: Infinity, title: "Digital God" }
];
''', content, flags=re.DOTALL
)

content = re.sub(
    r'export const FIT_RANKS = \[.*?\];',
    r'''export const DEFAULT_FIT_RANKS = [
  { max: 10, title: "Couch Potato" },
  { max: 20, title: "Walker" },
  { max: 30, title: "Jogger" },
  { max: 40, title: "Athlete" },
  { max: 50, title: "Warrior" },
  { max: 60, title: "Spartan" },
  { max: 70, title: "Olympian" },
  { max: 80, title: "Demigod" },
  { max: 90, title: "Hercules" },
  { max: 99, title: "Atlas" },
  { max: Infinity, title: "Aesthetic God" }
];
''', content, flags=re.DOTALL
)

# And inside `useLevelSystem` and `calculateLevel`, inject dynamic ranks
content = content.replace("export function calculateLevel(xp: number, type: 'dev' | 'fit') {", "export function calculateLevel(xp: number, type: 'dev' | 'fit') {\n  const settings = getSettings();\n  const DEV_RANKS = DEFAULT_DEV_RANKS.map((r, i) => ({ ...r, title: settings.devRanksNames[i] || r.title }));\n  const FIT_RANKS = DEFAULT_FIT_RANKS.map((r, i) => ({ ...r, title: settings.fitRanksNames[i] || r.title }));")

content = content.replace("export const DEV_RANKS", "export const DEFAULT_DEV_RANKS")
content = content.replace("export const FIT_RANKS", "export const DEFAULT_FIT_RANKS")

with open("src/hooks/useLevelSystem.ts", "w", encoding="utf-8") as f:
    f.write(content)
