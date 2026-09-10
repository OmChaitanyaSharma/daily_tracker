import re

with open("src/pages/Home.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('className="bg-bg-base border border-border-subtle px-2 py-1 rounded text-text-main mx-1">Cmd</kbd>', 'className="bg-bg-base border border-border-subtle px-2 py-1 rounded text-text-main mx-1">Ctrl</kbd>')

with open("src/pages/Home.tsx", "w", encoding="utf-8") as f:
    f.write(content)
