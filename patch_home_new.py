import re

with open("src/pages/Home.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace hardcoded "Winter Arc" string references inside Home.tsx
# In button:
content = content.replace(
    '<span>Winter Arc</span>',
    '<span>{settings.seasonName}</span>'
)
# In Modal Title:
content = content.replace(
    '<h2 className="text-2xl font-serif text-text-main">\n                  Winter Arc Rules\n                </h2>',
    '<h2 className="text-2xl font-serif text-text-main">\n                  {settings.seasonName} Rules\n                </h2>'
)
# And maybe in the streak modal? Wait, there are no references there.

# Now update the pendingExercises logic
old_pending = """  const pendingExercises = activeExercises.filter(ex => {
    const reps = todaysExerciseLogs.find(l => l.exerciseId === ex.id)?.reps || 0;
    return reps === 0;
  });"""

new_pending = """  // Evaluate Fitness Streak Condition based on settings
  const totalRepsToday = todaysExerciseLogs.reduce((acc, log) => acc + log.reps, 0);
  const completedExerciseCount = todaysExerciseLogs.filter(log => log.reps > 0).length;
  
  let fitnessConditionMet = true;
  if (settings.streakFitnessRequirementType === 'count') {
    fitnessConditionMet = completedExerciseCount >= settings.streakFitnessRequirementValue;
  } else if (settings.streakFitnessRequirementType === 'reps') {
    fitnessConditionMet = totalRepsToday >= settings.streakFitnessRequirementValue;
  } else {
    // 'all'
    fitnessConditionMet = activeExercises.every(ex => {
      const reps = todaysExerciseLogs.find(l => l.exerciseId === ex.id)?.reps || 0;
      return reps > 0;
    });
  }

  // We still calculate pendingExercises to show what hasn't been started for the UI checklist
  const pendingExercises = activeExercises.filter(ex => {
    const reps = todaysExerciseLogs.find(l => l.exerciseId === ex.id)?.reps || 0;
    return reps === 0;
  });"""

content = content.replace(old_pending, new_pending)

# Now update the UI where `pendingExercises.length > 0` was used to block the streak!
old_streak_block = """{(pendingExercises.length > 0 || !habitConditionMet || !hoursConditionMet) ? ("""
new_streak_block = """{(!fitnessConditionMet || !habitConditionMet || !hoursConditionMet) ? ("""
content = content.replace(old_streak_block, new_streak_block)

# And update the UI header for Fitness Tasks to show the requirement
old_fit_header = """<h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">Fitness Tasks</h3>"""
new_fit_header = """<div className="flex justify-between items-end mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Fitness Tasks</h3>
                  <span className="text-[10px] uppercase font-bold text-accent-green">
                    {settings.streakFitnessRequirementType === 'count' 
                      ? `Target: ${settings.streakFitnessRequirementValue} Exs` 
                      : settings.streakFitnessRequirementType === 'reps' 
                      ? `Target: ${settings.streakFitnessRequirementValue} Total Reps` 
                      : 'Target: All'}
                  </span>
                </div>"""
content = content.replace(old_fit_header, new_fit_header)

with open("src/pages/Home.tsx", "w", encoding="utf-8") as f:
    f.write(content)
