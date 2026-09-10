import re

with open("src/pages/Home.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove the incorrectly placed WeeklyBoss
incorrect_boss = """        {/* Weekly Boss */}
        <div className="md:col-span-4">
           <WeeklyBoss />
        </div>"""
content = content.replace(incorrect_boss, "")

# Insert it after the Fitness block
fit_end = """              <span className="text-sm font-mono text-text-muted">Level {fit.level}</span>
              <span className="text-xs font-mono text-text-muted">{totalExerciseLogs} total</span>
            </div>
            <div className="h-2 bg-bg-base rounded-full overflow-hidden border border-border-subtle">
              <div className="h-full bg-accent-green transition-all duration-1000" style={{ width: `${(fit.level % 10) * 10}%` }} />
            </div>
          </div>
        </div>"""

correct_boss = """              <span className="text-sm font-mono text-text-muted">Level {fit.level}</span>
              <span className="text-xs font-mono text-text-muted">{totalExerciseLogs} total</span>
            </div>
            <div className="h-2 bg-bg-base rounded-full overflow-hidden border border-border-subtle">
              <div className="h-full bg-accent-green transition-all duration-1000" style={{ width: `${(fit.level % 10) * 10}%` }} />
            </div>
          </div>
        </div>

        {/* Weekly Boss */}
        <div className="md:col-span-4 flex flex-col h-full">
           <WeeklyBoss />
        </div>"""

content = content.replace(fit_end, correct_boss)

with open("src/pages/Home.tsx", "w", encoding="utf-8") as f:
    f.write(content)
