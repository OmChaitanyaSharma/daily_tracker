import re

with open("src/components/Layout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("case 'Escape':", "case 'escape':")
content = content.replace("case 'Backspace':", "case 'backspace':")

with open("src/components/Layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
