import re

with open("src/pages/Home.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('Daily Quests', 'Active Bounties')
content = content.replace('Quest I:', 'Bounty I:')
content = content.replace('Quest II:', 'Bounty II:')
content = content.replace('Quest III:', 'Bounty III:')

# Add HP Bar to the Streak Card
streak_old = '''            <div className="text-xs uppercase tracking-widest font-bold text-text-muted group-hover:text-accent-blue transition-colors">
              Current Streak
            </div>
          </div>'''

hp_bar_jsx = '''            <div className="text-xs uppercase tracking-widest font-bold text-text-muted group-hover:text-accent-blue transition-colors mb-4">
              Current Streak
            </div>
            {/* HP Bar */}
            <div className="w-full px-4">
               <div className="flex justify-between text-[10px] font-mono font-bold text-text-muted mb-1 uppercase tracking-widest">
                  <span>Shield HP</span>
                  <span className={streak > 0 ? "text-accent-blue" : "text-accent-red"}>{streak > 0 ? (freezesOwned === 2 ? '100 / 100' : (freezesOwned === 1 ? '50 / 100' : '10 / 100')) : '0 / 100'}</span>
               </div>
               <div className="w-full h-2 bg-bg-base rounded-full overflow-hidden border border-border-strong">
                  <div 
                    className={"h-full transition-all duration-1000 " + (streak > 0 ? (freezesOwned === 2 ? 'w-full bg-accent-blue shadow-[0_0_10px_rgba(59,130,246,0.8)]' : (freezesOwned === 1 ? 'w-1/2 bg-accent-yellow' : 'w-[10%] bg-accent-red animate-pulse')) : 'w-0 bg-transparent')}
                  />
               </div>
            </div>
          </div>'''

content = content.replace(streak_old, hp_bar_jsx)

with open("src/pages/Home.tsx", "w", encoding="utf-8") as f:
    f.write(content)
