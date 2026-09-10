import re

with open("src/components/Layout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add imports for particles
imports_old = "import { Snowfall } from './Snowfall';"
imports_new = "import { Snowfall } from './Snowfall';\nimport { SakuraFall } from './SakuraFall';\nimport { AutumnLeaves } from './AutumnLeaves';"
content = content.replace(imports_old, imports_new)

# Replace isDark state with arcTheme state
theme_state_old = """  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });"""
theme_state_new = """  const [arcTheme, setArcTheme] = useState(() => {
    const saved = localStorage.getItem('arcTheme');
    if (saved) return saved;
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  });"""
content = content.replace(theme_state_old, theme_state_new)

theme_effect_old = """  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);"""
theme_effect_new = """  useEffect(() => {
    document.documentElement.className = '';
    document.documentElement.classList.add(`theme-${arcTheme}`);
  }, [arcTheme]);"""
content = content.replace(theme_effect_old, theme_effect_new)

# Replace toggleTheme function
toggle_old = """  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };"""
toggle_new = """  const toggleTheme = () => {
    const themes = ['winter', 'spring', 'summer', 'autumn'];
    const nextTheme = themes[(themes.indexOf(arcTheme) + 1) % themes.length];
    setArcTheme(nextTheme);
    localStorage.setItem('arcTheme', nextTheme);
  };"""
content = content.replace(toggle_old, toggle_new)

# Replace Snowfall render
snow_old = "{!zenMode && <Snowfall />}"
snow_new = "{!zenMode && arcTheme === 'winter' && <Snowfall />}\n      {!zenMode && arcTheme === 'spring' && <SakuraFall />}\n      {!zenMode && arcTheme === 'autumn' && <AutumnLeaves />}"
content = content.replace(snow_old, snow_new)

# Replace theme toggle button icon
icon_old = "{isDark ? <Sun size={20} /> : <Moon size={20} />}"
icon_new = "{arcTheme === 'winter' ? '??' : arcTheme === 'spring' ? '??' : arcTheme === 'summer' ? '??' : '??'}"
content = content.replace(icon_old, icon_new)

with open("src/components/Layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
