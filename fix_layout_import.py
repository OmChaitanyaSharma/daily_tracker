import re

with open("src/components/Layout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_old = "import { AutumnLeaves } from './AutumnLeaves';"
import_new = "import { AutumnLeaves } from './AutumnLeaves';\nimport { PomodoroClock } from './PomodoroClock';"

if "import { PomodoroClock }" not in content:
    content = content.replace(import_old, import_new)

with open("src/components/Layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
