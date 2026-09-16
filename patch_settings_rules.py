import re

with open("src/pages/Settings.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add Plus and Trash2 to imports
content = content.replace("import { Settings as SettingsIcon, Save } from 'lucide-react';", "import { Settings as SettingsIcon, Save, Plus, Trash2 } from 'lucide-react';")

# Replace textarea with dynamic inputs
old_textarea = """          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6">
            <p className="text-xs text-text-muted mb-4">Enter each rule on a new line.</p>
            <textarea 
              rows={8}
              value={settings.winterArcRules.join('\n')}
              onChange={e => setSettings({...settings, winterArcRules: e.target.value.split('\n').filter(r => r.trim())})}
              className="w-full bg-bg-base border border-border-strong rounded-lg px-4 py-3 text-text-main focus:outline-none custom-scrollbar"
            />
          </div>"""

new_inputs = """          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6">
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
          </div>"""

content = content.replace(old_textarea, new_inputs)

with open("src/pages/Settings.tsx", "w", encoding="utf-8") as f:
    f.write(content)
