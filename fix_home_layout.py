import re

with open("src/pages/Home.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add WeeklyBoss import
import_line = "import { WeeklyBoss } from '../components/WeeklyBoss';"
if import_line not in content:
    content = content.replace("import { Flame", "import { WeeklyBoss } from '../components/WeeklyBoss';\nimport { Flame")

# Change col-span for Dev and Fit
content = content.replace('className="md:col-span-6 bg-bg-surface border border-border-strong rounded-[2rem] p-8 cursor-pointer hover:border-accent-blue/50 transition-all group shadow-sm flex flex-col justify-between"', 'className="md:col-span-4 bg-bg-surface border border-border-strong rounded-[2rem] p-8 cursor-pointer hover:border-accent-blue/50 transition-all group shadow-sm flex flex-col justify-between"')
content = content.replace('className="md:col-span-6 bg-bg-surface border border-border-strong rounded-[2rem] p-8 cursor-pointer hover:border-accent-green/50 transition-all group shadow-sm flex flex-col justify-between"', 'className="md:col-span-4 bg-bg-surface border border-border-strong rounded-[2rem] p-8 cursor-pointer hover:border-accent-green/50 transition-all group shadow-sm flex flex-col justify-between"')

# Insert WeeklyBoss after Fitness
fit_end = """          </div>
        </div>"""
        
weekly_boss_jsx = """          </div>
        </div>

        {/* Weekly Boss */}
        <div className="md:col-span-4">
           <WeeklyBoss />
        </div>"""

content = content.replace(fit_end, weekly_boss_jsx, 1)

with open("src/pages/Home.tsx", "w", encoding="utf-8") as f:
    f.write(content)
