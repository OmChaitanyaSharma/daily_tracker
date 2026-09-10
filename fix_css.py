import re

with open("src/index.css", "r", encoding="utf-8") as f:
    content = f.read()

themes = """  :root, .theme-winter {
    /* WINTER / MONKEYTYPE PHANTOM THEME (DARK) */
    --bg-base: #000011;
    --bg-surface: #101224;
    --bg-surface-hover: #151729;
    --text-main: #c0caf5; 
    --text-muted: #565f89; 
    --border-subtle: #24283b;
    --border-strong: #414868;
    --accent-red: #f7768e;
    --accent-red-hover: #db6177;
    --accent-red-bg: rgba(247, 118, 142, 0.15);
    --accent-blue: #7aa2f7; 
    --accent-blue-bg: rgba(122, 162, 247, 0.15);
    --accent-purple: #bb9af7;
    --accent-purple-bg: rgba(187, 154, 247, 0.15);
    --accent-yellow: #e0af68; 
    --accent-yellow-bg: rgba(224, 175, 104, 0.15);
    --accent-green: #9ece6a; 
    --accent-green-bg: rgba(158, 206, 106, 0.15);
    --shadow-soft: 0 8px 30px rgba(0, 0, 10, 0.6), 0 4px 10px rgba(0, 0, 10, 0.4);
  }

  .theme-spring {
    /* SPRING / SAKURA THEME */
    --bg-base: #fdf6f7;
    --bg-surface: #f4e8eb;
    --bg-surface-hover: #eddfe2;
    --text-main: #4a3b3f; 
    --text-muted: #a48c92; 
    --border-subtle: #ebd7db;
    --border-strong: #dca3ad;
    --accent-red: #d96c7b;
    --accent-red-hover: #c45b6a;
    --accent-red-bg: rgba(217, 108, 123, 0.15);
    --accent-blue: #84a59d; 
    --accent-blue-bg: rgba(132, 165, 157, 0.15);
    --accent-purple: #b5838d;
    --accent-purple-bg: rgba(181, 131, 141, 0.15);
    --accent-yellow: #f4a261; 
    --accent-yellow-bg: rgba(244, 162, 97, 0.15);
    --accent-green: #7d9882; 
    --accent-green-bg: rgba(125, 152, 130, 0.15);
    --shadow-soft: 0 4px 20px rgba(217, 108, 123, 0.05), 0 2px 8px rgba(217, 108, 123, 0.05);
  }

  .theme-summer {
    /* SUMMER / MIAMI NIGHTS (DARK NEON) */
    --bg-base: #0f0c29;
    --bg-surface: #19163b;
    --bg-surface-hover: #221d4d;
    --text-main: #e0f7fa; 
    --text-muted: #6272a4; 
    --border-subtle: #292455;
    --border-strong: #453c80;
    --accent-red: #ff477e;
    --accent-red-hover: #ff2a6d;
    --accent-red-bg: rgba(255, 71, 126, 0.15);
    --accent-blue: #00f0ff; 
    --accent-blue-bg: rgba(0, 240, 255, 0.15);
    --accent-purple: #b300ff;
    --accent-purple-bg: rgba(179, 0, 255, 0.15);
    --accent-yellow: #ffea00; 
    --accent-yellow-bg: rgba(255, 234, 0, 0.15);
    --accent-green: #39ff14; 
    --accent-green-bg: rgba(57, 255, 20, 0.15);
    --shadow-soft: 0 8px 30px rgba(0, 240, 255, 0.15), 0 4px 10px rgba(255, 71, 126, 0.15);
  }

  .theme-autumn {
    /* AUTUMN / RUST (WARM DARK) */
    --bg-base: #1c1511;
    --bg-surface: #2b2019;
    --bg-surface-hover: #362921;
    --text-main: #f0dac2; 
    --text-muted: #9e8571; 
    --border-subtle: #3f2f25;
    --border-strong: #614838;
    --accent-red: #d1493b;
    --accent-red-hover: #b5382b;
    --accent-red-bg: rgba(209, 73, 59, 0.15);
    --accent-blue: #5b7c8a; 
    --accent-blue-bg: rgba(91, 124, 138, 0.15);
    --accent-purple: #8f5c71;
    --accent-purple-bg: rgba(143, 92, 113, 0.15);
    --accent-yellow: #e89543; 
    --accent-yellow-bg: rgba(232, 149, 67, 0.15);
    --accent-green: #7a8044; 
    --accent-green-bg: rgba(122, 128, 68, 0.15);
    --shadow-soft: 0 8px 30px rgba(232, 149, 67, 0.1), 0 4px 10px rgba(232, 149, 67, 0.05);
  }"""

old_themes = re.search(r'  :root \{.*?\n  \}', content, re.DOTALL).group(0)
old_dark = re.search(r'  \.dark \{.*?\n  \}', content, re.DOTALL).group(0)

content = content.replace(old_themes + "\n\n" + old_dark, themes)

with open("src/index.css", "w", encoding="utf-8") as f:
    f.write(content)
