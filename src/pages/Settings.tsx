import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Plus, Trash2, AlertTriangle, Download, Upload, Database } from 'lucide-react';
import { format } from 'date-fns';
import { getSettings, saveSettings, type AppSettings } from '../utils/settings';
import { DEFAULT_DEV_RANKS, DEFAULT_FIT_RANKS } from '../hooks/useLevelSystem';
import { db } from '../db';

export function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [clearedMessage, setClearedMessage] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  if (!settings) return null;

  const handleExportData = async () => {
    try {
      const backupData = {
        version: 1,
        exportDate: new Date().toISOString(),
        settings: getSettings(),
        restDaysConfig: localStorage.getItem('rest_days_config_v1'),
        dayEntries: await db.dayEntries.toArray(),
        tasks: await db.tasks.toArray(),
        habits: await db.habits.toArray(),
        habitLogs: await db.habitLogs.toArray(),
        hourLogs: await db.hourLogs.toArray(),
        hourCategories: await db.hourCategories.toArray(),
        goals: await db.goals.toArray(),
        goalMeasurements: await db.goalMeasurements.toArray(),
        exercises: await db.exercises.toArray(),
        exerciseLogs: await db.exerciseLogs.toArray()
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-tracker-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data.');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security: Limit file size to 10MB to prevent memory exhaustion / DoS
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setImportStatus({ type: 'error', message: 'File is too large (maximum size is 10 MB).' });
      e.target.value = '';
      return;
    }

    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json' && file.type !== '') {
      setImportStatus({ type: 'error', message: 'Please select a valid .json backup file.' });
      e.target.value = '';
      return;
    }

    const confirmed = window.confirm(
      'Restoring from backup will replace your current habits, logs, and settings with the file data. Are you sure you want to proceed?'
    );
    if (!confirmed) {
      e.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Selected file is not valid JSON.');
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid backup file structure.');
      }

      await db.transaction('rw', [
        db.dayEntries,
        db.tasks,
        db.habits,
        db.habitLogs,
        db.hourLogs,
        db.hourCategories,
        db.goals,
        db.goalMeasurements,
        db.exercises,
        db.exerciseLogs
      ], async () => {
        if (Array.isArray(data.dayEntries)) {
          await db.dayEntries.clear();
          await db.dayEntries.bulkAdd(data.dayEntries);
        }
        if (Array.isArray(data.tasks)) {
          await db.tasks.clear();
          await db.tasks.bulkAdd(data.tasks);
        }
        if (Array.isArray(data.habits)) {
          await db.habits.clear();
          await db.habits.bulkAdd(data.habits);
        }
        if (Array.isArray(data.habitLogs)) {
          await db.habitLogs.clear();
          await db.habitLogs.bulkAdd(data.habitLogs);
        }
        if (Array.isArray(data.hourLogs)) {
          await db.hourLogs.clear();
          await db.hourLogs.bulkAdd(data.hourLogs);
        }
        if (Array.isArray(data.hourCategories)) {
          await db.hourCategories.clear();
          await db.hourCategories.bulkAdd(data.hourCategories);
        }
        if (Array.isArray(data.goals)) {
          await db.goals.clear();
          await db.goals.bulkAdd(data.goals);
        }
        if (Array.isArray(data.goalMeasurements)) {
          await db.goalMeasurements.clear();
          await db.goalMeasurements.bulkAdd(data.goalMeasurements);
        }
        if (Array.isArray(data.exercises)) {
          await db.exercises.clear();
          await db.exercises.bulkAdd(data.exercises);
        }
        if (Array.isArray(data.exerciseLogs)) {
          await db.exerciseLogs.clear();
          await db.exerciseLogs.bulkAdd(data.exerciseLogs);
        }
      });

      if (data.settings && typeof data.settings === 'object') {
        saveSettings(data.settings);
      }
      if (data.restDaysConfig) {
        const configStr = typeof data.restDaysConfig === 'string'
          ? data.restDaysConfig
          : JSON.stringify(data.restDaysConfig);
        localStorage.setItem('rest_days_config_v1', configStr);
      }

      setImportStatus({ type: 'success', message: 'Backup restored successfully! Reloading...' });
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      console.error('Import failed:', err);
      setImportStatus({ type: 'error', message: err.message || 'Failed to restore backup file.' });
    } finally {
      e.target.value = '';
    }
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

        {/* Winter Arc Rules */}
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


        {/* Backup & Restore */}
        <section className="pt-8">
          <h2 className="text-xl font-serif text-text-main mb-6 border-b border-border-subtle pb-2 flex items-center gap-2">
            <Database size={20} className="text-accent-blue" />
            Backup & Restore
          </h2>
          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 mb-8">
            <h3 className="text-sm font-semibold text-text-main mb-2">Export / Import Database</h3>
            <p className="text-sm text-text-muted mb-6">
              Download a complete JSON backup of your streaks, habits, exercises, goals, and history, or restore an existing backup into this browser.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleExportData}
                className="flex items-center gap-2 px-5 py-2.5 bg-bg-base border border-border-strong hover:border-text-muted text-text-main rounded-xl font-medium text-sm transition-colors"
              >
                <Download size={16} />
                Export Backup (JSON)
              </button>

              <label className="flex items-center gap-2 px-5 py-2.5 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue rounded-xl font-medium text-sm transition-colors cursor-pointer border border-accent-blue/20">
                <Upload size={16} />
                Restore from Backup
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div className={`mt-4 text-sm font-medium ${importStatus.type === 'success' ? 'text-accent-green' : 'text-accent-red'} animate-fade-in`}>
                {importStatus.message}
              </div>
            )}
          </div>
        </section>

        {/* Data Management */}
        <section className="pt-2">
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
