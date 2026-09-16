import re

with open("src/index.css", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("*:focus-visible {", "*:focus {")
content = content.replace("*:focus-visible[data-edit-mode='true']", "*:focus[data-edit-mode='true']")

with open("src/index.css", "w", encoding="utf-8") as f:
    f.write(content)
