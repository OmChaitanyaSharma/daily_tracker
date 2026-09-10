import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_old = "import { Calendar } from './pages/Calendar';"
import_new = "import { Calendar } from './pages/Calendar';\nimport { Shop } from './pages/Shop';"
content = content.replace(import_old, import_new)

route_old = '<Route path="calendar" element={<Calendar />} />'
route_new = '<Route path="calendar" element={<Calendar />} />\n          <Route path="shop" element={<Shop />} />'
content = content.replace(route_old, route_new)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)
