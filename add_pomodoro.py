import re

with open("src/components/Layout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_old = "import { CommandPalette } from './CommandPalette';"
import_new = "import { CommandPalette } from './CommandPalette';\nimport { PomodoroClock } from './PomodoroClock';"

if "import { PomodoroClock }" not in content:
    content = content.replace(import_old, import_new)

zen_old = """             <h1 className="text-5xl md:text-7xl font-serif text-[#ececf1] mb-16 tracking-tight text-center max-w-2xl leading-tight">
               Time to execute.<br />Do the next thing.
             </h1>
             <button"""

zen_new = """             <h1 className="text-5xl md:text-7xl font-serif text-[#ececf1] mb-4 tracking-tight text-center max-w-2xl leading-tight">
               Time to execute.
             </h1>
             
             <PomodoroClock />
             
             <button"""

content = content.replace(zen_old, zen_new)

with open("src/components/Layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
