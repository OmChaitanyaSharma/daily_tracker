import re

with open("src/pages/Logs.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_old = "import { ActivityHeatmap } from '../components/ActivityHeatmap';"
import_new = "import { ActivityHeatmap } from '../components/ActivityHeatmap';\nimport { CityHeatmap3D } from '../components/CityHeatmap3D';"
content = content.replace(import_old, import_new)

heatmap_old = "<ActivityHeatmap />"
heatmap_new = "<ActivityHeatmap />\n\n      <div className=\"mt-8 mb-12\">\n        <CityHeatmap3D logs={allHabitLogs} />\n      </div>"
content = content.replace(heatmap_old, heatmap_new)

with open("src/pages/Logs.tsx", "w", encoding="utf-8") as f:
    f.write(content)
