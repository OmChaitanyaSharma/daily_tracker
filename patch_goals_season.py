import re

# 1. Patch Goals.tsx
with open("src/pages/Goals.tsx", "r", encoding="utf-8") as f:
    content = f.read()
if "import { getSettings }" not in content:
    content = content.replace("import { Link } from 'react-router-dom';", "import { Link } from 'react-router-dom';\nimport { getSettings } from '../utils/settings';")
content = content.replace("End of Winter Arc", "End of {getSettings().seasonName}")
content = content.replace("end of the winter arc (March 1st)", "end of the {getSettings().seasonName.toLowerCase()} (March 1st)")
with open("src/pages/Goals.tsx", "w", encoding="utf-8") as f:
    f.write(content)

# 2. Patch EndOfYearGoals.tsx
with open("src/pages/EndOfYearGoals.tsx", "r", encoding="utf-8") as f:
    content = f.read()
if "import { getSettings }" not in content:
    content = content.replace("import { useLiveQuery } from 'dexie-react-hooks';", "import { useLiveQuery } from 'dexie-react-hooks';\nimport { getSettings } from '../utils/settings';")
content = content.replace("Goals Till End of Winter Arc", "Goals Till End of {getSettings().seasonName}")
with open("src/pages/EndOfYearGoals.tsx", "w", encoding="utf-8") as f:
    f.write(content)

# 3. Patch GoalSettingsModal.tsx
with open("src/components/GoalSettingsModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()
if "import { getSettings }" not in content:
    content = content.replace("import { X } from 'lucide-react';", "import { X } from 'lucide-react';\nimport { getSettings } from '../utils/settings';")
content = content.replace("Winter Arc", "{getSettings().seasonName}")
with open("src/components/GoalSettingsModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
