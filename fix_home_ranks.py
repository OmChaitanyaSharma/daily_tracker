import re

with open("src/pages/Home.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "(levelModal === 'dev' ? DEV_RANKS : FIT_RANKS).map((rank, idx, arr) => {",
    "(levelModal === 'dev' ? DEFAULT_DEV_RANKS : DEFAULT_FIT_RANKS).map((rank, idx, arr) => {\nconst settings = getSettings();\nconst dynamicTitle = levelModal === 'dev' ? settings.devRanksNames[idx] : settings.fitRanksNames[idx];"
)

content = content.replace(
    "{rank.title}",
    "{dynamicTitle || rank.title}"
)

with open("src/pages/Home.tsx", "w", encoding="utf-8") as f:
    f.write(content)
