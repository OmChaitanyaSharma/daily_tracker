import re

with open("src/pages/Settings.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Inject Season Name edit before the rules
old_rules = """        {/* Winter Arc Rules */}
        <section>
          <h2 className="text-xl font-serif text-text-main mb-6 border-b border-border-subtle pb-2">Winter Arc Rules</h2>
          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6">
            <p className="text-xs text-text-muted mb-4">Enter each rule on a new line.</p>"""

new_rules = """        {/* Winter Arc Rules */}
        <section>
          <div className="flex items-center gap-4 mb-6 border-b border-border-subtle pb-2">
            <h2 className="text-xl font-serif text-text-main">Season Protocol</h2>
          </div>
          
          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 mb-6">
            <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Season Name</label>
            <input 
              type="text"
              value={settings.seasonName}
              onChange={e => setSettings({...settings, seasonName: e.target.value})}
              className="w-full max-w-md bg-bg-base border border-border-strong rounded-lg px-4 py-2 text-text-main focus:outline-none"
            />
          </div>

          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6">
            <p className="text-xs text-text-muted mb-4">Enter each rule on a new line.</p>"""

content = content.replace(old_rules, new_rules)

# 2. Inject Fitness Requirement into Streak Requirements
old_streak = """            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6">
              <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Habits Target (%)</label>
              <input 
                type="number" step="1" min="0" max="100"
                value={settings.streakTargetHabitPercent}
                onChange={e => setSettings({...settings, streakTargetHabitPercent: Number(e.target.value)})}
                className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-2 text-text-main focus:outline-none"
              />
            </div>
          </div>"""

new_streak = """            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6">
              <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Habits Target (%)</label>
              <input 
                type="number" step="1" min="0" max="100"
                value={settings.streakTargetHabitPercent}
                onChange={e => setSettings({...settings, streakTargetHabitPercent: Number(e.target.value)})}
                className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-2 text-text-main focus:outline-none"
              />
            </div>

            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Fitness Requirement Type</label>
                <select 
                  value={settings.streakFitnessRequirementType}
                  onChange={e => setSettings({...settings, streakFitnessRequirementType: e.target.value as 'all' | 'count' | 'reps'})}
                  className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-2 text-text-main focus:outline-none"
                >
                  <option value="all">All Active Exercises</option>
                  <option value="count">Specific Number of Exercises</option>
                  <option value="reps">Total Reps/Mins Across Exercises</option>
                </select>
              </div>
              
              {settings.streakFitnessRequirementType !== 'all' && (
                <div>
                  <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">
                    {settings.streakFitnessRequirementType === 'count' ? 'Exercises Needed' : 'Total Reps/Mins Needed'}
                  </label>
                  <input 
                    type="number" min="1" step="1"
                    value={settings.streakFitnessRequirementValue}
                    onChange={e => setSettings({...settings, streakFitnessRequirementValue: Number(e.target.value)})}
                    className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-2 text-text-main focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>"""

content = content.replace(old_streak, new_streak)

with open("src/pages/Settings.tsx", "w", encoding="utf-8") as f:
    f.write(content)
