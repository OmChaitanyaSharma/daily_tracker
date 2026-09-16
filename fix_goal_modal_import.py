import re

with open("src/components/GoalSettingsModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "import { X, Trash2 } from 'lucide-react';",
    "import { X, Trash2 } from 'lucide-react';\nimport { getSettings } from '../utils/settings';"
)

with open("src/components/GoalSettingsModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
