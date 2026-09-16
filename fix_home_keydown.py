import re

with open("src/pages/Home.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("if (e.key === 'Escape' || e.key === 'Backspace') {", "if (e.key.toLowerCase() === 'escape' || e.key.toLowerCase() === 'backspace') {")

with open("src/pages/Home.tsx", "w", encoding="utf-8") as f:
    f.write(content)
