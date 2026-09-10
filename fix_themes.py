import re

with open("src/index.css", "r", encoding="utf-8") as f:
    content = f.read()

# Replace Spring
spring_old = r"""  \.theme-spring \{.*?--shadow-soft:.*?;
  \}"""

spring_new = """  .theme-spring {
    /* SPRING / SAKURA THEME - MORE PINKISH */
    --bg-base: #ffeef2;
    --bg-surface: #ffdde6;
    --bg-surface-hover: #ffcce0;
    --text-main: #5c3a44; 
    --text-muted: #9e6f7d; 
    --border-subtle: #ffc2d4;
    --border-strong: #ff99b9;
    --accent-red: #ff4d85;
    --accent-red-hover: #e6396e;
    --accent-red-bg: rgba(255, 77, 133, 0.15);
    --accent-blue: #7098da; 
    --accent-blue-bg: rgba(112, 152, 218, 0.15);
    --accent-purple: #a67cff;
    --accent-purple-bg: rgba(166, 124, 255, 0.15);
    --accent-yellow: #f2a65a; 
    --accent-yellow-bg: rgba(242, 166, 90, 0.15);
    --accent-green: #6ebf8b; 
    --accent-green-bg: rgba(110, 191, 139, 0.15);
    --shadow-soft: 0 4px 20px rgba(255, 77, 133, 0.1), 0 2px 8px rgba(255, 77, 133, 0.05);
  }"""
content = re.sub(spring_old, spring_new, content, flags=re.DOTALL)

# Replace Summer
summer_old = r"""  \.theme-summer \{.*?--shadow-soft:.*?;
  \}"""

summer_new = """  .theme-summer {
    /* SUMMER / BEACH DAY (BRIGHT LIGHT MODE) */
    --bg-base: #f0f8ff;
    --bg-surface: #ffffff;
    --bg-surface-hover: #e6f3ff;
    --text-main: #1e3a5f; 
    --text-muted: #5e81ac; 
    --border-subtle: #d0e4f7;
    --border-strong: #8fb8ed;
    --accent-red: #ff6b6b;
    --accent-red-hover: #ff5252;
    --accent-red-bg: rgba(255, 107, 107, 0.15);
    --accent-blue: #00a8ff; 
    --accent-blue-bg: rgba(0, 168, 255, 0.15);
    --accent-purple: #9c88ff;
    --accent-purple-bg: rgba(156, 136, 255, 0.15);
    --accent-yellow: #fbc531; 
    --accent-yellow-bg: rgba(251, 197, 49, 0.15);
    --accent-green: #4cd137; 
    --accent-green-bg: rgba(76, 209, 55, 0.15);
    --shadow-soft: 0 8px 30px rgba(0, 168, 255, 0.1), 0 4px 10px rgba(0, 168, 255, 0.05);
  }"""
content = re.sub(summer_old, summer_new, content, flags=re.DOTALL)

# Replace Autumn
autumn_old = r"""  \.theme-autumn \{.*?--shadow-soft:.*?;
  \}"""

autumn_new = """  .theme-autumn {
    /* AUTUMN / COZY COFFEE (LIGHT/CREAM MODE) */
    --bg-base: #f7f3e8;
    --bg-surface: #fffdf5;
    --bg-surface-hover: #f0ebd8;
    --text-main: #4a3728; 
    --text-muted: #8c7361; 
    --border-subtle: #e3d5c1;
    --border-strong: #c2a88e;
    --accent-red: #d15636;
    --accent-red-hover: #b84326;
    --accent-red-bg: rgba(209, 86, 54, 0.15);
    --accent-blue: #447a82; 
    --accent-blue-bg: rgba(68, 122, 130, 0.15);
    --accent-purple: #86556e;
    --accent-purple-bg: rgba(134, 85, 110, 0.15);
    --accent-yellow: #d18d24; 
    --accent-yellow-bg: rgba(209, 141, 36, 0.15);
    --accent-green: #688043; 
    --accent-green-bg: rgba(104, 128, 67, 0.15);
    --shadow-soft: 0 8px 30px rgba(209, 86, 54, 0.08), 0 4px 10px rgba(209, 86, 54, 0.04);
  }"""
content = re.sub(autumn_old, autumn_new, content, flags=re.DOTALL)

with open("src/index.css", "w", encoding="utf-8") as f:
    f.write(content)
