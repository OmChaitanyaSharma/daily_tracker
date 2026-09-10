import re

# 1. Layout.tsx
with open("src/components/Layout.tsx", "r", encoding="utf-8") as f:
    layout = f.read()
layout = layout.replace("import { Moon, Sun } from 'lucide-react';", "")
with open("src/components/Layout.tsx", "w", encoding="utf-8") as f:
    f.write(layout)

# 2. LevelUpCelebration.tsx
with open("src/components/LevelUpCelebration.tsx", "r", encoding="utf-8") as f:
    lvl = f.read()
lvl = lvl.replace("}, [type]);", "}, [type, isDev, isStreak]);")
with open("src/components/LevelUpCelebration.tsx", "w", encoding="utf-8") as f:
    f.write(lvl)

# 3. Home.tsx
with open("src/pages/Home.tsx", "r", encoding="utf-8") as f:
    home = f.read()
home = home.replace("}, [levelModal, showStreakModal, levelUpData]);", "}, [levelModal, showStreakModal, levelUpData, showWinterArcRules]);")
with open("src/pages/Home.tsx", "w", encoding="utf-8") as f:
    f.write(home)

# 4. dateUtils.ts
with open("src/utils/dateUtils.ts", "r", encoding="utf-8") as f:
    du = f.read()
du = du.replace("catch (e) {", "catch {")
du = du.replace("catch(e) {", "catch {")
with open("src/utils/dateUtils.ts", "w", encoding="utf-8") as f:
    f.write(du)
