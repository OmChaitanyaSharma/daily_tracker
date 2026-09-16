import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { getSettings, saveSettings, type AppSettings } from '../utils/settings';
import { DEFAULT_DEV_RANKS, DEFAULT_FIT_RANKS } from '../hooks/useLevelSystem';

export function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  if (!settings) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
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
          </div>
        </section>

        {/* Winter Arc Rules */}
        <section>
          <h2 className="text-xl font-serif text-text-main mb-6 border-b border-border-subtle pb-2">Winter Arc Rules</h2>
          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6">
            <p className="text-xs text-text-muted mb-4">Enter each rule on a new line.</p>
            <textarea 
              rows={8}
              value={settings.winterArcRules.join('\n')}
              onChange={e => setSettings({...settings, winterArcRules: e.target.value.split('\n').filter(r => r.trim())})}
              className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-3 text-text-main focus:outline-none custom-scrollbar"
            />
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
