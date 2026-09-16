import re

with open("src/hooks/useLevelSystem.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
"""export function getDevTitle(level: number): string {
  return DEV_RANKS.find(r => level <= r.max)?.title || "Digital God";
}

export function getFitTitle(level: number): string {
  return FIT_RANKS.find(r => level <= r.max)?.title || "God of Iron";
}""",
"""export function getDevTitle(level: number): string {
  const settings = getSettings();
  const ranks = DEFAULT_DEV_RANKS.map((r, i) => ({ ...r, title: settings.devRanksNames[i] || r.title }));
  return ranks.find(r => level <= r.max)?.title || "Digital God";
}

export function getFitTitle(level: number): string {
  const settings = getSettings();
  const ranks = DEFAULT_FIT_RANKS.map((r, i) => ({ ...r, title: settings.fitRanksNames[i] || r.title }));
  return ranks.find(r => level <= r.max)?.title || "God of Iron";
}"""
)

with open("src/hooks/useLevelSystem.ts", "w", encoding="utf-8") as f:
    f.write(content)
