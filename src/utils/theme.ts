export interface ColorTheme {
  id: string;
  name: string;
  category: string;
  description: string;
  preview: {
    bg: string;
    surface: string;
    main: string;
    accent: string;
  };
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'carbon',
    name: 'Carbon',
    category: 'Minimalist Dark',
    description: 'Iconic pitch-black with crisp monochrome clarity.',
    preview: {
      bg: '#121214',
      surface: '#1a1a1e',
      main: '#f4f4f5',
      accent: '#ffffff'
    }
  },
  {
    id: 'phantom',
    name: 'Phantom',
    category: 'Tokyo Space',
    description: 'Deep navy midnight with lavender & ice blue.',
    preview: {
      bg: '#000011',
      surface: '#101224',
      main: '#c0caf5',
      accent: '#7aa2f7'
    }
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    category: 'Maritime & Coral',
    description: 'Abyssal navy blue with glowing coral peach accents.',
    preview: {
      bg: '#071524',
      surface: '#0d2136',
      main: '#f49480',
      accent: '#5eead4'
    }
  },
  {
    id: 'dragon',
    name: 'Red Dragon',
    category: 'Fire & Ember',
    description: 'Charred maroon with golden amber & flame red.',
    preview: {
      bg: '#150a0c',
      surface: '#241115',
      main: '#e89d28',
      accent: '#ef4444'
    }
  },
  {
    id: 'laser',
    name: 'Laser Plum',
    category: 'Cyberpunk Synth',
    description: 'Velvet plum violet with glowing mint & laser orange.',
    preview: {
      bg: '#200829',
      surface: '#2e0e3a',
      main: '#45e8b8',
      accent: '#f97316'
    }
  },
  {
    id: 'matrix',
    name: 'Matrix Terminal',
    category: 'Cyber Green',
    description: 'Classic hacker terminal green on pitch obsidian.',
    preview: {
      bg: '#080c09',
      surface: '#0f1812',
      main: '#22c55e',
      accent: '#4ade80'
    }
  }
];

export const DEFAULT_THEME_ID = 'carbon';

export function getSavedTheme(): string {
  const saved = localStorage.getItem('app_color_theme');
  if (saved && COLOR_THEMES.some(t => t.id === saved)) {
    return saved;
  }
  return DEFAULT_THEME_ID;
}

export function applyTheme(themeId: string) {
  const theme = COLOR_THEMES.find(t => t.id === themeId) || COLOR_THEMES[0];
  document.documentElement.classList.add('dark'); // Light mode is completely eliminated
  document.documentElement.setAttribute('data-theme', theme.id);
  localStorage.setItem('app_color_theme', theme.id);
  localStorage.setItem('theme', 'dark');
}
