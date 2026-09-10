import re

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# Replace Varela Round with Inter, Playfair Display, and JetBrains Mono
old_fonts = '<link href="https://fonts.googleapis.com/css2?family=Varela+Round&display=swap" rel="stylesheet">'
new_fonts = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;700;800&display=swap" rel="stylesheet">'
content = content.replace(old_fonts, new_fonts)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(content)

with open("src/index.css", "r", encoding="utf-8") as f:
    css = f.read()

css = css.replace("font-family: 'Varela Round', system-ui, -apple-system, sans-serif;", "font-family: 'Inter', system-ui, -apple-system, sans-serif;")

theme_block = """@theme {
  --font-sans: "Inter", system-ui, sans-serif;
  --font-serif: "Playfair Display", Georgia, serif;
  --font-mono: "JetBrains Mono", monospace;"""

css = css.replace("@theme {", theme_block)

with open("src/index.css", "w", encoding="utf-8") as f:
    f.write(css)
