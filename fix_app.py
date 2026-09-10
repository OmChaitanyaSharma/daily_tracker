import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_old = "import { Logs } from './pages/Logs';"
import_new = "import { Logs } from './pages/Logs';\nimport { Calendar } from './pages/Calendar';"
content = content.replace(import_old, import_new)

route_old = "<Route path=\"logs\" element={<Logs />} />"
route_new = "<Route path=\"logs\" element={<Logs />} />\n          <Route path=\"calendar\" element={<Calendar />} />"
content = content.replace(route_old, route_new)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)
