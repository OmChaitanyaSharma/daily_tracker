import re

with open("src/pages/Logs.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Emojis were corrupted to "??" or similar. Let's rebuild the nav block safely using pure Python unicode escapes.

regex = re.compile(r"const MOOD_EMOJIS: Record<string, string> = \{.*?};", re.DOTALL)

star = "\U0001F929" # ??
smile = "\U0001F60A" # ??
neutral = "\U0001F610" # ??
confused = "\U0001F615" # ??
sad = "\U0001F622" # ??

new_moods = f"""const MOOD_EMOJIS: Record<string, string> = {{
  'excellent': '{star}',
  'good': '{smile}',
  'okay': '{neutral}',
  'not-great': '{confused}',
  'bad': '{sad}'
}};"""

content = regex.sub(new_moods, content)

with open("src/pages/Logs.tsx", "w", encoding="utf-8") as f:
    f.write(content)
