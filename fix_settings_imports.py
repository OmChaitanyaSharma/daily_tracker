import re

with open("src/pages/Settings.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "import { getSettings, saveSettings, AppSettings } from '../utils/settings';",
    "import { getSettings, saveSettings, type AppSettings } from '../utils/settings';"
)
content = content.replace(
    "import { Settings as SettingsIcon, Save, RefreshCw } from 'lucide-react';",
    "import { Settings as SettingsIcon, Save } from 'lucide-react';"
)

with open("src/pages/Settings.tsx", "w", encoding="utf-8") as f:
    f.write(content)
