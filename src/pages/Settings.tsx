import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings as SettingsIcon, Save, Plus, Trash2, AlertTriangle, Download, Upload, Database, ChevronDown, Volume2, VolumeX, ArrowLeft, Palette, Check } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { getSettings, saveSettings, type AppSettings } from '../utils/settings';
import { DEFAULT_DEV_RANKS, DEFAULT_FIT_RANKS } from '../hooks/useLevelSystem';
import { db } from '../db';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../hooks/useSound';
import { uploadLocalToCloud } from '../services/cloudSync';
import { validateBackupPayload, sanitizeBackupRecords } from '../utils/backupValidation';
import { COLOR_THEMES, getSavedTheme, applyTheme } from '../utils/theme';

export function Settings() {
  const { user } = useAuth();
  const { soundEnabled, toggleSound } = useSound();
  const [currentTheme, setCurrentTheme] = useState(() => getSavedTheme());
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [clearedMessage, setClearedMessage] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [lastBackupTime, setLastBackupTime] = useState<number | null>(() => {
    const val = localStorage.getItem('dt_last_backup_downloaded_at');
    return val ? parseInt(val, 10) : null;
  });

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  if (!settings) return null;

  const isBackupStale = !lastBackupTime || (Date.now() - lastBackupTime > 14 * 24 * 60 * 60 * 1000);

  const handleExportData = async () => {
    try {
      const backupData = {
        _app: 'daily-tracker',
        _schemaVersion: 1,
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

      const now = Date.now();
      localStorage.setItem('dt_last_backup_downloaded_at', now.toString());
      setLastBackupTime(now);
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

      // Pre-flight schema validation before touching Dexie storage
      const validation = validateBackupPayload(data);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const payload = validation.payload;

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
        if (Array.isArray(payload.dayEntries)) {
          const valid = sanitizeBackupRecords(payload.dayEntries, 'date');
          await db.dayEntries.clear();
          if (valid.length > 0) await db.dayEntries.bulkAdd(valid as any);
        }
        if (Array.isArray(payload.tasks)) {
          const valid = sanitizeBackupRecords(payload.tasks, 'id');
          await db.tasks.clear();
          if (valid.length > 0) await db.tasks.bulkAdd(valid as any);
        }
        if (Array.isArray(payload.habits)) {
          const valid = sanitizeBackupRecords(payload.habits, 'id');
          await db.habits.clear();
          if (valid.length > 0) await db.habits.bulkAdd(valid as any);
        }
        if (Array.isArray(payload.habitLogs)) {
          const valid = sanitizeBackupRecords(payload.habitLogs, 'id');
          await db.habitLogs.clear();
          if (valid.length > 0) await db.habitLogs.bulkAdd(valid as any);
        }
        if (Array.isArray(payload.hourLogs)) {
          const valid = sanitizeBackupRecords(payload.hourLogs, 'id');
          await db.hourLogs.clear();
          if (valid.length > 0) await db.hourLogs.bulkAdd(valid as any);
        }
        if (Array.isArray(payload.hourCategories)) {
          const valid = sanitizeBackupRecords(payload.hourCategories, 'id');
          await db.hourCategories.clear();
          if (valid.length > 0) await db.hourCategories.bulkAdd(valid as any);
        }
        if (Array.isArray(payload.goals)) {
          const valid = sanitizeBackupRecords(payload.goals, 'id');
          await db.goals.clear();
          if (valid.length > 0) await db.goals.bulkAdd(valid as any);
        }
        if (Array.isArray(payload.goalMeasurements)) {
          const valid = sanitizeBackupRecords(payload.goalMeasurements, 'id');
          await db.goalMeasurements.clear();
          if (valid.length > 0) await db.goalMeasurements.bulkAdd(valid as any);
        }
        if (Array.isArray(payload.exercises)) {
          const valid = sanitizeBackupRecords(payload.exercises, 'id');
          await db.exercises.clear();
          if (valid.length > 0) await db.exercises.bulkAdd(valid as any);
        }
        if (Array.isArray(payload.exerciseLogs)) {
          const valid = sanitizeBackupRecords(payload.exerciseLogs, 'id');
          await db.exerciseLogs.clear();
          if (valid.length > 0) await db.exerciseLogs.bulkAdd(valid as any);
        }
      });

      if (payload.settings && typeof payload.settings === 'object') {
        saveSettings(payload.settings);
      }
      if (payload.restDaysConfig) {
        const configStr = typeof payload.restDaysConfig === 'string'
          ? payload.restDaysConfig
          : JSON.stringify(payload.restDaysConfig);
        localStorage.setItem('rest_days_config_v1', configStr);
      }

      if (user) {
        setImportStatus({ type: 'success', message: 'Restoring backup and syncing to your cloud account...' });
        await uploadLocalToCloud(user.uid);
        sessionStorage.setItem(`synced_${user.uid}`, 'true');
      }

      setImportStatus({ type: 'success', message: 'Backup verified and restored safely! Reloading...' });
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
        db.dayEntries.clear(),
        db.tasks.clear(),
        db.habitLogs.clear(),
        db.hourLogs.clear(),
        db.exerciseLogs.clear(),
        db.goalMeasurements.clear()
      ]);

      localStorage.removeItem('v3_ack_dev_level');
      localStorage.removeItem('v3_ack_fit_level');
      localStorage.removeItem('v3_ack_streak');

      if (user) {
        await uploadLocalToCloud(user.uid);
      }

      setClearedMessage('All entries cleared.');
      setTimeout(() => {
        setClearedMessage('');
      }, 3000);
    } catch (err) {
      console.error('Failed to clear entries:', err);
      alert('Failed to clear entries.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    alert('Settings saved successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 animate-fade-in">
      <div className="flex items-center gap-3 sm:gap-4 mb-8">
        <Link
          to="/"
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-surface border border-transparent hover:border-border-subtle transition-all tap-press shrink-0"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-text-main text-bg-base flex items-center justify-center shrink-0">
          <SettingsIcon size={20} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-text-main">System Settings</h1>
          <p className="text-xs text-text-muted mt-0.5">Configure your tracking rules, backups, and progression.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10">
        
        {/* Streak Requirements */}
        <section>
          <h2 className="text-base sm:text-lg font-serif text-text-main mb-4 border-b border-border-subtle pb-2">Streak Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 sm:p-5">
              <label htmlFor="streak-target-hours" className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Target Deep Work Hours / Day</label>
              <input 
                id="streak-target-hours"
                type="number" step="0.5" min="0" max="24"
                value={settings.streakTargetHours}
                onChange={e => setSettings({...settings, streakTargetHours: Number(e.target.value)})}
                className="w-full min-h-[44px] bg-bg-base border border-border-strong rounded-xl px-4 py-2.5 text-base sm:text-sm text-text-main focus:outline-none"
              />
            </div>

            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 sm:p-5">
              <label htmlFor="streak-target-habit-percent" className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Required Habit Completion (%)</label>
              <input 
                id="streak-target-habit-percent"
                type="number" step="5" min="0" max="100"
                value={settings.streakTargetHabitPercent}
                onChange={e => setSettings({...settings, streakTargetHabitPercent: Number(e.target.value)})}
                className="w-full min-h-[44px] bg-bg-base border border-border-strong rounded-xl px-4 py-2.5 text-base sm:text-sm text-text-main focus:outline-none"
              />
            </div>

            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 sm:p-5 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="streak-fitness-type" className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">Fitness Requirement Type</label>
                <select 
                  id="streak-fitness-type"
                  value={settings.streakFitnessRequirementType}
                  onChange={e => setSettings({...settings, streakFitnessRequirementType: e.target.value as 'all' | 'count' | 'reps' | 'xp'})}
                  className="w-full min-h-[44px] bg-bg-base border border-border-strong rounded-xl px-4 py-2.5 text-base sm:text-sm text-text-main focus:outline-none cursor-pointer"
                >
                  <option value="all">All Active Exercises</option>
                  <option value="count">Specific Number of Exercises</option>
                  <option value="reps">Total Reps/Mins Across Exercises</option>
                  <option value="xp">Total Fitness XP Gained</option>
                </select>
              </div>
              
              {settings.streakFitnessRequirementType !== 'all' && (
                <div>
                  <label htmlFor="streak-fitness-val" className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-2">
                    {settings.streakFitnessRequirementType === 'count' ? 'Exercises Needed' : settings.streakFitnessRequirementType === 'reps' ? 'Total Reps/Mins Needed' : 'Total XP Needed'}
                  </label>
                  <input 
                    id="streak-fitness-val"
                    type="number" min="1" step="1"
                    value={settings.streakFitnessRequirementValue}
                    onChange={e => setSettings({...settings, streakFitnessRequirementValue: Number(e.target.value)})}
                    className="w-full min-h-[44px] bg-bg-base border border-border-strong rounded-xl px-4 py-2.5 text-base sm:text-sm text-text-main focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Backup & Restore */}
        <section>
          <div className="flex items-center justify-between mb-4 border-b border-border-subtle pb-2">
            <h2 className="text-base sm:text-lg font-serif text-text-main flex items-center gap-2">
              <Database size={18} className="text-accent-blue" />
              Backup & Data Safety
            </h2>
          </div>

          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-5 sm:p-6">
            {isBackupStale && (
              <div className="mb-5 p-3.5 bg-accent-yellow/10 border border-accent-yellow/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-accent-yellow animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-yellow animate-pulse shrink-0"></span>
                  <span>
                    {lastBackupTime 
                      ? `Last local export was over 14 days ago (${format(new Date(lastBackupTime), 'MMM d, yyyy')}).` 
                      : 'No recent backup export detected.'} Back up your data to avoid device storage loss.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="min-h-[44px] sm:min-h-0 py-2 sm:py-0 font-semibold underline hover:opacity-80 shrink-0 text-left cursor-pointer tap-press flex items-center"
                >
                  Export Now
                </button>
              </div>
            )}

            <h3 className="text-sm font-semibold text-text-main mb-1.5">Export / Import Database (JSON)</h3>
            <p className="text-xs text-text-muted mb-5 leading-relaxed">
              Export your complete history (habits, logs, goals, exercises, settings) to a portable JSON file, or restore a verified backup.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportData}
                className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 bg-bg-base border border-border-strong hover:border-text-muted text-text-main rounded-xl font-medium text-xs sm:text-sm transition-colors cursor-pointer tap-press"
              >
                <Download size={16} />
                Export Backup (JSON)
              </button>

              <label className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue rounded-xl font-medium text-xs sm:text-sm transition-colors cursor-pointer border border-accent-blue/20 tap-press">
                <Upload size={16} />
                Restore from Backup
                <input
                  type="file"
                  id="restore-backup-file"
                  aria-label="Upload backup JSON file"
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div className={`mt-3 text-xs font-medium ${importStatus.type === 'success' ? 'text-accent-green' : 'text-accent-red'} animate-fade-in`}>
                {importStatus.message}
              </div>
            )}
          </div>
        </section>

        {/* Collapsible Advanced Progression & Season Customization */}
        <section>
          <details className="group border border-border-strong rounded-2xl p-4 sm:p-5 bg-bg-surface/50 transition-all">
            <summary className="flex items-center justify-between cursor-pointer text-sm font-serif font-medium text-text-muted hover:text-text-main select-none min-h-[44px]">
              <div className="flex items-center gap-2">
                <span>Advanced Progression & Season Rules</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-bg-base border border-border-subtle text-text-muted">Optional</span>
              </div>
              <ChevronDown size={18} className="text-text-muted group-open:rotate-180 transition-transform" />
            </summary>

            <div className="pt-6 space-y-8 animate-fade-in">
              {/* Season Protocol */}
              <div>
                <label htmlFor="season-name-input" className="text-xs font-semibold tracking-widest uppercase text-text-muted block mb-3">Season Name</label>
                <input 
                  id="season-name-input"
                  type="text"
                  value={settings.seasonName}
                  onChange={e => setSettings({...settings, seasonName: e.target.value})}
                  className="w-full max-w-sm min-h-[44px] bg-bg-base border border-border-strong rounded-xl px-4 py-2.5 text-base sm:text-sm text-text-main focus:outline-none"
                />
                
                <h3 className="text-xs font-semibold tracking-widest uppercase text-text-muted mt-5 mb-2">Protocol Rules</h3>
                <p className="text-xs text-text-muted mb-4">Define your core tenets. Empty rules are discarded automatically.</p>
                <div className="space-y-2 max-w-lg">
                  {settings.winterArcRules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent-blue/10 text-accent-blue font-bold text-xs flex items-center justify-center shrink-0 border border-accent-blue/20">
                        {i + 1}
                      </div>
                      <input 
                        type="text"
                        value={rule}
                        aria-label={`Season rule ${i + 1}`}
                        onChange={e => {
                          const newRules = [...settings.winterArcRules];
                          newRules[i] = e.target.value;
                          setSettings({...settings, winterArcRules: newRules});
                        }}
                        className="flex-1 min-h-[40px] bg-bg-base border border-border-strong rounded-xl px-3 py-2 text-base sm:text-xs text-text-main focus:outline-none focus:border-accent-blue"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const newRules = settings.winterArcRules.filter((_, idx) => idx !== i);
                          setSettings({...settings, winterArcRules: newRules});
                        }}
                        className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-text-muted hover:text-accent-red transition-colors tap-press"
                        aria-label={`Delete season rule ${i + 1}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  type="button"
                  onClick={() => setSettings({...settings, winterArcRules: [...settings.winterArcRules, '']})}
                  className="mt-3 min-h-[40px] flex items-center gap-1.5 text-xs font-semibold text-accent-blue hover:text-accent-blue/80 transition-colors px-3 py-2 rounded-xl hover:bg-accent-blue/10 tap-press"
                >
                  <Plus size={16} /> Add Rule
                </button>
              </div>

              {/* Level Names Customization */}
              <div className="pt-4 border-t border-border-subtle">
                <h3 className="text-xs font-semibold tracking-widest uppercase text-text-muted mb-4">Custom Rank Titles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-semibold text-accent-purple mb-3">Developer Levels</h4>
                    <div className="space-y-2">
                      {DEFAULT_DEV_RANKS.map((rank, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-5 text-[11px] text-text-muted font-mono">{i+1}</span>
                          <input 
                            type="text"
                            value={settings.devRanksNames[i] || rank.title}
                            aria-label={`Developer level ${i + 1} title`}
                            onChange={e => {
                              const newArr = [...settings.devRanksNames];
                              newArr[i] = e.target.value;
                              setSettings({...settings, devRanksNames: newArr});
                            }}
                            className="flex-1 min-h-[40px] bg-bg-base border border-border-strong rounded-xl px-3 py-1.5 text-base sm:text-xs text-text-main"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-accent-green mb-3">Fitness Levels</h4>
                    <div className="space-y-2">
                      {DEFAULT_FIT_RANKS.map((rank, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-5 text-[11px] text-text-muted font-mono">{i+1}</span>
                          <input 
                            type="text"
                            value={settings.fitRanksNames[i] || rank.title}
                            aria-label={`Fitness level ${i + 1} title`}
                            onChange={e => {
                              const newArr = [...settings.fitRanksNames];
                              newArr[i] = e.target.value;
                              setSettings({...settings, fitRanksNames: newArr});
                            }}
                            className="flex-1 min-h-[40px] bg-bg-base border border-border-strong rounded-xl px-3 py-1.5 text-base sm:text-xs text-text-main"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </section>

        {/* Color Theme (Monkeytype Aesthetic) */}
        <section>
          <div className="flex items-center justify-between mb-4 border-b border-border-subtle pb-2">
            <h2 className="text-base sm:text-lg font-serif text-text-main flex items-center gap-2">
              <Palette size={18} className="text-accent-blue" />
              Theme & Aesthetic
            </h2>
            <span className="text-[11px] font-mono text-text-muted uppercase">
              Dark Mode
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {COLOR_THEMES.map(theme => {
              const isActive = currentTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => {
                    setCurrentTheme(theme.id);
                    applyTheme(theme.id);
                  }}
                  className={clsx(
                    "rounded-2xl p-4 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between tap-press",
                    isActive
                      ? "border-accent-blue shadow-lg ring-1 ring-accent-blue bg-bg-surface"
                      : "border-border-subtle hover:border-border-strong bg-bg-surface/60"
                  )}
                >
                  <div>
                    {/* Theme mini preview banner */}
                    <div 
                      className="w-full h-12 rounded-xl border border-white/10 mb-3 p-2 flex items-center justify-between"
                      style={{ backgroundColor: theme.preview.bg }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: theme.preview.surface }} />
                        <div className="text-xs font-mono font-bold" style={{ color: theme.preview.main }}>Aa</div>
                      </div>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.preview.accent }} />
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-text-main">{theme.name}</h3>
                      {isActive && <Check size={16} className="text-accent-blue" />}
                    </div>
                    <span className="text-[10px] font-mono text-text-muted block mb-1 uppercase tracking-wider">{theme.category}</span>
                    <p className="text-xs text-text-muted leading-relaxed">{theme.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Audio & Feedback */}
        <section>
          <div className="flex items-center justify-between mb-4 border-b border-border-subtle pb-2">
            <h2 className="text-base sm:text-lg font-serif text-text-main flex items-center gap-2">
              <Volume2 size={18} className="text-accent-yellow" />
              Sound & Audio Feedback
            </h2>
          </div>
          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-text-main">Audio Feedback</div>
              <p className="text-xs text-text-muted mt-0.5">
                Sound cues for button taps, habit toggles, and milestone celebrations.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundEnabled ? "Audio feedback enabled, click to mute" : "Audio feedback muted, click to enable"}
              className={clsx(
                "min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 tap-press",
                soundEnabled
                  ? "bg-accent-yellow/20 text-accent-yellow border border-accent-yellow/40 hover:bg-accent-yellow/30"
                  : "bg-bg-base text-text-muted border border-border-strong hover:text-text-main"
              )}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>{soundEnabled ? "Enabled" : "Muted"}</span>
            </button>
          </div>
        </section>

        {/* Data Management (Danger Zone) */}
        <section>
          <h2 className="text-base sm:text-lg font-serif text-accent-red mb-4 border-b border-border-subtle pb-2 flex items-center gap-2">
            <AlertTriangle size={18} />
            Data Management
          </h2>
          <div className="bg-bg-surface border border-accent-red/20 rounded-2xl p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-text-main mb-1.5">Clear Tracking Logs</h3>
            <p className="text-xs text-text-muted mb-4 leading-relaxed">
              Permanently clears daily habit completions, hours, and workouts while preserving your created habits and exercises.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleClearData}
                disabled={isClearing}
                aria-label={isClearing ? 'Clearing tracking entries...' : 'Clear all tracking entries'}
                className="min-h-[44px] px-5 py-2.5 bg-accent-red/10 text-accent-red hover:bg-accent-red/20 rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer tap-press"
              >
                {isClearing ? 'Clearing...' : 'Clear All Entries'}
              </button>
              {clearedMessage && (
                <span className="text-accent-green text-xs font-medium animate-fade-in">{clearedMessage}</span>
              )}
            </div>
          </div>
        </section>

        <div className="sticky bottom-6 flex justify-end">
          <button
            type="submit"
            className="min-h-[44px] flex items-center justify-center gap-2 bg-text-main text-bg-base px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:opacity-90 transition-transform cursor-pointer tap-press"
          >
            <Save size={16} />
            Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
}
