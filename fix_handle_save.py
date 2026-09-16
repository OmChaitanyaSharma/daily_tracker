import re

with open("src/pages/Settings.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_save = """  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    alert('Settings saved successfully!');
  };"""

new_save = """  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSettings = {
      ...settings,
      winterArcRules: settings.winterArcRules.filter(r => r.trim() !== '')
    };
    setSettings(cleanSettings);
    saveSettings(cleanSettings);
    alert('Settings saved successfully!');
  };"""

content = content.replace(old_save, new_save)

with open("src/pages/Settings.tsx", "w", encoding="utf-8") as f:
    f.write(content)
