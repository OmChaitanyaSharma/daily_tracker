import re

with open("src/components/Layout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('<Link to="/logs" className="hover:text-text-main transition-colors">Logs</Link>', '<Link to="/logs" className="hover:text-text-main transition-colors">Logs</Link>\n            <Link to="/settings" className="hover:text-text-main transition-colors">Settings</Link>')

with open("src/components/Layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
