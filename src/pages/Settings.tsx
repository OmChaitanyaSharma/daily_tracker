import { useState } from 'react';
import { Settings as SettingsIcon, Save, Plus, Trash2, AlertTriangle, Sparkles, Palette, Check } from 'lucide-react';
import { getSettings, saveSettings, type AppSettings, SEASON_PRESETS, HABIT_PRESETS, type HabitPreset } from '../utils/settings';
import { DEFAULT_DEV_RANKS, DEFAULT_FIT_RANKS } from '../hooks/useLevelSystem';
import { db } from '../db';
import { getTodayStr } from '../utils/dateUtils';
import { COLOR_THEMES, getSavedTheme, applyTheme } from '../utils/theme';

export function Settings() {
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());
  const [currentTheme, setCurrentTheme] = useState(() => getSavedTheme());
  const [isClearing, setIsClearing] = useState(false);
  const [clearedMessage, setClearedMessage] = useState('');
  const [habitActionType, setHabitActionType] = useState<'replace' | 'append'>('replace');
  const [habitMessage, setHabitMessage] = useState('');

  const handleApplyHabitPreset = async (preset: HabitPreset) => {
    const today = getTodayStr();
    if (habitActionType === 'replace') {
      const confirmReplace = window.confirm(`Replace all current habits with the "${preset.name}" starter pack? Existing habits will be removed, but previous logs remain.`);
      if (!confirmReplace) return;

      const currentHabits = await db.habits.toArray();
      await Promise.all(currentHabits.map(h => db.habits.delete(h.id)));
    }

    const currentHabits = await db.habits.toArray();
    const existingNames = new Set(currentHabits.map(h => h.name.toLowerCase().trim()));

    let order = currentHabits.length;
    for (const habitName of preset.habits) {
      if (!existingNames.has(habitName.toLowerCase().trim())) {
        await db.habits.add({
          id: crypto.randomUUID(),
          name: habitName,
          createdAt: new Date().toISOString(),
          startDate: today,
          archived: false,
          order: order++
        });
      }
    }
    setHabitMessage(`Applied "${preset.name}" starter pack successfully!`);
    setTimeout(() => setHabitMessage(''), 4000);
  };

  const handleClearAllHabits = async () => {
    const confirmed = window.confirm('Are you sure you want to clear all habits? You can start with an empty board or choose a template.');
    if (!confirmed) return;

    const currentHabits = await db.habits.toArray();
    await Promise.all(currentHabits.map(h => db.habits.delete(h.id)));
    setHabitMessage('All habits have been cleared.');
    setTimeout(() => setHabitMessage(''), 4000);
  };

  
  const handleClearData = async () => {
    const confirmed = window.confirm('Are you sure you want to clear all tracking data? This will keep your habits, goals, and exercises, but wipe all logs, entries, and progress. This cannot be undone.');
    if (!confirmed) return;
    
    setIsClearing(true);
    try {
      await Promise.all([
        
        db.tasks.clear(),
        db.habitLogs.clear(),
        db.hourLogs.clear(),
        db.goalMeasurements.clear(),
        db.exerciseLogs.clear()
      ]);
      setClearedMessage('All tracking entries have been cleared.');
      setTimeout(() => setClearedMessage(''), 3000);
    } catch (e) {
      console.error(e);
      setClearedMessage('Error clearing data.');
    }
    setIsClearing(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSettings = {
      ...settings,
      winterArcRules: settings.winterArcRules.filter(r => r.trim() !== '')
    };
    setSettings(cleanSettings);
    saveSettings(cleanSettings);
    alert('Settings saved successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 animate-fade-in">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-bg-surface border border-border-subtle flex items-center justify-center">
          <SettingsIcon size={24} className="text-text-main" />
        </div>
        <h1 className="text-3xl font-serif italic text-text-main">App Settings</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-12">
        
        {/* Color Theme (Monkeytype Aesthetic) */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-border-subtle pb-2">
            <h2 className="text-xl font-serif text-text-main flex items-center gap-2">
              <Palette size={20} className="text-accent-blue" />
              Theme & Aesthetic
            </h2>
            <span className="text-xs font-mono text-text-muted uppercase">
              Dark Mode Only
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {COLOR_THEMES.map(theme => {
              const isActive = currentTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => {
                    setCurrentTheme(theme.id);
                    applyTheme(theme.id);
                  }}
                  className={`rounded-2xl p-4 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isActive
                      ? "border-accent-blue shadow-lg ring-1 ring-accent-blue bg-bg-surface"
                      : "border-border-subtle hover:border-border-strong bg-bg-surface/60"
                  }`}
                >
                  <div>
                    {/* Theme mini preview banner */}
                    <div 
                      className="w-full h-14 rounded-xl border border-white/10 mb-3 p-2 flex items-center justify-between"
                      style={{ backgroundColor: theme.preview.bg }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: theme.preview.surface }} />
                        <div className="text-xs font-mono font-bold" style={{ color: theme.preview.main }}>Aa</div>
                      </div>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.preview.accent }} />
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-text-main">{theme.name}</h4>
                      {isActive && <Check size={16} className="text-accent-blue" />}
                    </div>
                    <span className="text-[10px] font-mono text-text-muted block mb-1.5 uppercase tracking-wider">{theme.category}</span>
                    <p className="text-xs text-text-muted leading-relaxed">{theme.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Streak Settings */}
        <section>
          <h2 className="text-xl font-serif text-text-main mb-6 border-b border-border-subtle pb-2">Streak Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6">
              <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Target Hours (Daily)</label>
              <input 
                type="number" step="0.5" min="0" max="24"
                value={settings.streakTargetHours}
                onChange={e => setSettings({...settings, streakTargetHours: Number(e.target.value)})}
                className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-2 text-text-main focus:outline-none"
              />
            </div>
            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6">
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
                  onChange={e => setSettings({...settings, streakFitnessRequirementType: e.target.value as 'all' | 'count' | 'reps' | 'xp'})}
                  className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-2 text-text-main focus:outline-none"
                >
                  <option value="all">All Active Exercises</option>
                  <option value="count">Specific Number of Exercises</option>
                  <option value="reps">Total Reps/Mins Across Exercises</option>
                  <option value="xp">Total Fitness XP Gained</option>
                </select>
              </div>
              
              {settings.streakFitnessRequirementType !== 'all' && (
                <div>
                  <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">
                    {settings.streakFitnessRequirementType === 'count' ? 'Exercises Needed' : settings.streakFitnessRequirementType === 'reps' ? 'Total Reps/Mins Needed' : 'Total XP Needed'}
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
          </div>
        </section>

        {/* Season Protocol */}
        <section>
          <div className="flex items-center gap-4 mb-6 border-b border-border-subtle pb-2">
            <h2 className="text-xl font-serif text-text-main">Season Protocol</h2>
          </div>
          
          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold tracking-widest uppercase text-text-muted block">Season Name</label>
            </div>
            <input 
              type="text"
              value={settings.seasonName}
              onChange={e => setSettings({...settings, seasonName: e.target.value})}
              className="w-full max-w-md bg-bg-base border border-border-strong rounded-lg px-4 py-2 text-text-main focus:outline-none focus:border-accent-blue transition-colors mb-5"
            />

            <div>
              <span className="text-[11px] font-semibold tracking-widest uppercase text-text-muted flex items-center gap-1.5 mb-2.5">
                <Sparkles size={13} className="text-accent-yellow" />
                Quick-Load a Preset:
              </span>
              <div className="flex flex-wrap gap-2">
                {SEASON_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        seasonName: preset.name,
                        winterArcRules: [...preset.rules]
                      });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      settings.seasonName === preset.name
                        ? "bg-accent-blue/15 border-accent-blue text-accent-blue font-semibold"
                        : "bg-bg-base border-border-subtle text-text-muted hover:text-text-main hover:border-border-strong"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6">
            <p className="text-xs text-text-muted mb-6">Define the protocol. Empty rules will be automatically removed.</p>
            <div className="space-y-3">
              {settings.winterArcRules.map((rule, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-blue/10 text-accent-blue font-bold flex items-center justify-center shrink-0 border border-accent-blue/20">
                    {i + 1}
                  </div>
                  <input 
                    type="text"
                    value={rule}
                    onChange={e => {
                      const newRules = [...settings.winterArcRules];
                      newRules[i] = e.target.value;
                      setSettings({...settings, winterArcRules: newRules});
                    }}
                    className="flex-1 bg-bg-base border border-border-strong rounded-lg px-4 py-2 text-sm text-text-main focus:outline-none focus:border-accent-blue transition-colors"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const newRules = settings.winterArcRules.filter((_, idx) => idx !== i);
                      setSettings({...settings, winterArcRules: newRules});
                    }}
                    className="p-2 text-text-muted hover:text-accent-red transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button 
              type="button"
              onClick={() => setSettings({...settings, winterArcRules: [...settings.winterArcRules, '']})}
              className="mt-4 flex items-center gap-2 text-sm font-semibold text-accent-blue hover:text-accent-blue/80 transition-colors px-2 py-1 rounded-md hover:bg-accent-blue/10"
            >
              <Plus size={16} /> Add Rule
            </button>
          </div>
        </section>

        {/* Habit Starter Packs & Templates */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-border-subtle pb-2">
            <h2 className="text-xl font-serif text-text-main flex items-center gap-2">
              <Sparkles size={20} className="text-accent-yellow" />
              Habit Starter Packs & Presets
            </h2>
            <button
              type="button"
              onClick={handleClearAllHabits}
              className="text-xs font-semibold text-accent-red hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={13} />
              Clear All Habits (Blank Slate)
            </button>
          </div>

          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border-subtle">
              <span className="text-xs text-text-muted font-medium">When applying a pack:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setHabitActionType('replace')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium border transition-colors cursor-pointer ${
                    habitActionType === 'replace'
                      ? 'bg-accent-blue/10 border-accent-blue text-accent-blue font-semibold'
                      : 'border-border-strong text-text-muted hover:text-text-main'
                  }`}
                >
                  Replace All Existing
                </button>
                <button
                  type="button"
                  onClick={() => setHabitActionType('append')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium border transition-colors cursor-pointer ${
                    habitActionType === 'append'
                      ? 'bg-accent-blue/10 border-accent-blue text-accent-blue font-semibold'
                      : 'border-border-strong text-text-muted hover:text-text-main'
                  }`}
                >
                  Append (Keep Existing)
                </button>
              </div>
            </div>

            {habitMessage && (
              <div className="mb-4 p-3 bg-accent-green-bg text-accent-green text-xs rounded-xl font-medium border border-accent-green/20 animate-fade-in">
                {habitMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {HABIT_PRESETS.map(preset => (
                <div key={preset.id} className="bg-bg-base border border-border-subtle rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-text-main">{preset.name}</h4>
                      <span className="text-[11px] text-text-muted font-mono">{preset.habits.length} habits</span>
                    </div>
                    <p className="text-xs text-text-muted mb-3">{preset.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {preset.habits.slice(0, 4).map((h, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-bg-surface border border-border-subtle text-[10px] text-text-muted">
                          {h}
                        </span>
                      ))}
                      {preset.habits.length > 4 && (
                        <span className="px-2 py-0.5 rounded bg-bg-surface border border-border-subtle text-[10px] text-text-muted font-medium">
                          +{preset.habits.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyHabitPreset(preset)}
                    className="w-full py-2 bg-bg-surface hover:bg-accent-blue hover:text-bg-base border border-border-strong hover:border-accent-blue text-xs font-semibold rounded-lg text-text-main transition-colors cursor-pointer"
                  >
                    {habitActionType === 'replace' ? 'Apply & Replace' : 'Add Pack'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Level Names */}
        <section>
          <h2 className="text-xl font-serif text-text-main mb-6 border-b border-border-subtle pb-2">Level Names</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6">
              <h3 className="text-sm font-semibold tracking-widest uppercase text-accent-purple mb-4">Web Levels</h3>
              <div className="space-y-3">
                {DEFAULT_DEV_RANKS.map((rank, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 text-xs text-text-muted font-mono">{i+1}</span>
                    <input 
                      type="text"
                      value={settings.devRanksNames[i] || rank.title}
                      onChange={e => {
                        const newArr = [...settings.devRanksNames];
                        newArr[i] = e.target.value;
                        setSettings({...settings, devRanksNames: newArr});
                      }}
                      className="flex-1 bg-bg-base border border-border-strong rounded-md px-3 py-1.5 text-sm text-text-main"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6">
              <h3 className="text-sm font-semibold tracking-widest uppercase text-accent-green mb-4">Fit Levels</h3>
              <div className="space-y-3">
                {DEFAULT_FIT_RANKS.map((rank, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 text-xs text-text-muted font-mono">{i+1}</span>
                    <input 
                      type="text"
                      value={settings.fitRanksNames[i] || rank.title}
                      onChange={e => {
                        const newArr = [...settings.fitRanksNames];
                        newArr[i] = e.target.value;
                        setSettings({...settings, fitRanksNames: newArr});
                      }}
                      className="flex-1 bg-bg-base border border-border-strong rounded-md px-3 py-1.5 text-sm text-text-main"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* Data Management */}
        <section className="pt-8">
          <h2 className="text-xl font-serif text-accent-red mb-6 border-b border-border-subtle pb-2 flex items-center gap-2">
            <AlertTriangle size={20} />
            Data Management
          </h2>
          <div className="bg-bg-surface border border-accent-red/20 rounded-2xl p-6 mb-12">
            <h3 className="text-sm font-semibold text-text-main mb-2">Clear Tracking Data</h3>
            <p className="text-sm text-text-muted mb-4">
              This will permanently delete all your daily logs, task checks, time tracking, habit completions, and exercise logs. 
              <strong> Your created habits, goals, and exercises will not be deleted.</strong>
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleClearData}
                disabled={isClearing}
                className="px-4 py-2 bg-accent-red/10 text-accent-red hover:bg-accent-red/20 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {isClearing ? 'Clearing...' : 'Clear All Entries'}
              </button>
              {clearedMessage && (
                <span className="text-accent-green text-sm font-medium animate-fade-in">{clearedMessage}</span>
              )}
            </div>
          </div>
        </section>

        <div className="sticky bottom-6 flex justify-end">

          <button type="submit" className="flex items-center gap-2 bg-text-main text-bg-base px-6 py-3 rounded-full font-medium shadow-lg hover:scale-105 transition-transform">
            <Save size={18} />
            Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
}
