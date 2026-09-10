import re

with open("src/components/WeeklyBoss.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('className="bg-bg-surface border border-border-strong rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group"', 'className="bg-bg-surface border border-border-strong rounded-[2rem] p-8 shadow-sm flex flex-col justify-between relative overflow-hidden group h-full"')

with open("src/components/WeeklyBoss.tsx", "w", encoding="utf-8") as f:
    f.write(content)
