import re

with open("src/__tests__/settings.test.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "import { getSettings, saveSettings, AppSettings } from '../utils/settings';",
    "import { getSettings, saveSettings } from '../utils/settings';"
)

with open("src/__tests__/settings.test.ts", "w", encoding="utf-8") as f:
    f.write(content)
