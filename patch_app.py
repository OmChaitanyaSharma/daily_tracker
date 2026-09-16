import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("import { Logs } from './pages/Logs';", "import { Logs } from './pages/Logs';\nimport { Settings } from './pages/Settings';")
content = content.replace('<Route path="logs" element={<Logs />} />', '<Route path="logs" element={<Logs />} />\n          <Route path="settings" element={<Settings />} />')

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)
