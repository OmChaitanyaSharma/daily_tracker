import re

with open("src/db.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("coins: number;", "coinsSpent: number;")
content = content.replace("coins: 100, // starting bonus", "coinsSpent: 0,")

with open("src/db.ts", "w", encoding="utf-8") as f:
    f.write(content)
