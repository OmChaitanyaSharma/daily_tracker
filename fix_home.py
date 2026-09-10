import re

with open("src/pages/Home.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update hardcoded conditions in Home.tsx
hardcoded_old = '''    const habitConditionMet = activeHabits.length > 0 ? (habitScore / activeHabits.length >= 0.75) : true;
    
    const todaysTotalHours = todaysHourLogs.reduce((acc, log) => acc + log.hours, 0);
    const hoursConditionMet = todaysTotalHours >= 6.0;'''

hardcoded_new = '''    const targetHabitPercent = parseFloat(localStorage.getItem('targetHabitPercent') || '0.75');
    const targetHours = parseFloat(localStorage.getItem('targetHours') || '6.0');
    
    const habitConditionMet = activeHabits.length > 0 ? (habitScore / activeHabits.length >= targetHabitPercent) : true;
    
    const todaysTotalHours = todaysHourLogs.reduce((acc, log) => acc + log.hours, 0);
    const hoursConditionMet = todaysTotalHours >= targetHours;'''

content = content.replace(hardcoded_old, hardcoded_new)

# 2. Add state for settings in Home.tsx
state_old = "  const { streak, freezesOwned, isLoading: streakLoading } = useStreak();"
state_new = '''  const { streak, freezesOwned, isLoading: streakLoading } = useStreak();
  const [habitPercentSetting, setHabitPercentSetting] = useState(() => localStorage.getItem('targetHabitPercent') || '0.75');
  const [hoursSetting, setHoursSetting] = useState(() => localStorage.getItem('targetHours') || '6.0');'''
content = content.replace(state_old, state_new)

# 3. Update the UI text for Bounties to use the settings
text_1_old = '''<div className={clsx("text-sm font-bold mb-1", habitConditionMet ? "text-text-muted line-through" : "text-text-main")}>Complete 75% of Habits</div>
                         <div className="text-xs font-mono text-text-muted">{habitScore} / {activeHabits.length} (Need: {Math.ceil(activeHabits.length * 0.75)})</div>'''

text_1_new = '''<div className={clsx("text-sm font-bold mb-1", habitConditionMet ? "text-text-muted line-through" : "text-text-main")}>Complete {Math.round(targetHabitPercent * 100)}% of Habits</div>
                         <div className="text-xs font-mono text-text-muted">{habitScore} / {activeHabits.length} (Need: {Math.ceil(activeHabits.length * targetHabitPercent)})</div>'''

content = content.replace(text_1_old, text_1_new)

text_2_old = '''<div className={clsx("text-sm font-bold mb-1", hoursConditionMet ? "text-text-muted line-through" : "text-text-main")}>6 Hours Logged</div>
                         <div className="text-xs font-mono text-text-muted">{todaysTotalHours} / 6.0 Hours</div>'''

text_2_new = '''<div className={clsx("text-sm font-bold mb-1", hoursConditionMet ? "text-text-muted line-through" : "text-text-main")}>{targetHours} Hours Logged</div>
                         <div className="text-xs font-mono text-text-muted">{todaysTotalHours} / {targetHours} Hours</div>'''

content = content.replace(text_2_old, text_2_new)

# 4. Add settings UI inside the Streak Modal
modal_old = '''<div className="w-full bg-bg-base rounded-2xl p-4 border border-border-subtle">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-main">Streak Freezes</span>
                    <div className="flex gap-1">
                      {[1, 2].map(slot => (
                        <div key={slot} className={clsx("w-3 h-3 rounded-full border", slot <= freezesOwned ? "bg-accent-blue border-accent-blue" : "border-border-strong")} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-text-muted text-left">
                    Earn 1 freeze for every 7 days of perfect streak (Max 2).
                  </p>
                </div>
              </div>
            </div>
          </div>'''

modal_new = '''<div className="w-full bg-bg-base rounded-2xl p-4 border border-border-subtle mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-main">Streak Freezes</span>
                    <div className="flex gap-1">
                      {[1, 2].map(slot => (
                        <div key={slot} className={clsx("w-3 h-3 rounded-full border", slot <= freezesOwned ? "bg-accent-blue border-accent-blue" : "border-border-strong")} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-text-muted text-left">
                    Earn 1 freeze for every 7 days of perfect streak (Max 2).
                  </p>
                </div>
                
                <div className="w-full bg-bg-base rounded-2xl p-4 border border-border-subtle text-left space-y-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Bounty Goals</span>
                  
                  <div className="flex items-center justify-between">
                     <label className="text-sm text-text-main">Habit Target (%)</label>
                     <input 
                        type="number" 
                        step="0.05"
                        min="0" max="1"
                        value={habitPercentSetting}
                        onChange={e => {
                           setHabitPercentSetting(e.target.value);
                           localStorage.setItem('targetHabitPercent', e.target.value);
                           window.dispatchEvent(new Event('storage'));
                        }}
                        className="w-16 bg-bg-surface border border-border-strong rounded px-2 py-1 text-xs text-right outline-none"
                     />
                  </div>
                  <div className="flex items-center justify-between">
                     <label className="text-sm text-text-main">Deep Work (Hours)</label>
                     <input 
                        type="number" 
                        step="0.5"
                        min="0" max="24"
                        value={hoursSetting}
                        onChange={e => {
                           setHoursSetting(e.target.value);
                           localStorage.setItem('targetHours', e.target.value);
                           window.dispatchEvent(new Event('storage'));
                        }}
                        className="w-16 bg-bg-surface border border-border-strong rounded px-2 py-1 text-xs text-right outline-none"
                     />
                  </div>
                  <p className="text-[10px] text-text-muted mt-2 leading-relaxed">Refresh to apply historical recalculations if you change goals.</p>
                </div>
              </div>
            </div>
          </div>'''

content = content.replace(modal_old, modal_new)

with open("src/pages/Home.tsx", "w", encoding="utf-8") as f:
    f.write(content)
