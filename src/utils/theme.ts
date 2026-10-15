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
    description: 'Pitch-black background with crisp monochrome clarity.',
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
    description: 'Deep navy midnight with lavender and ice blue accents.',
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
    description: 'Charred maroon with golden amber and flame red.',
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
    description: 'Velvet plum violet with glowing mint and orange.',
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
    description: 'Terminal green on pitch obsidian black.',
    preview: {
      bg: '#080c09',
      surface: '#0f1812',
      main: '#22c55e',
      accent: '#4ade80'
    }
  },
  {
    id: 'bingsu',
    name: 'Bingsu',
    category: 'Korean Berry & Cream',
    description: 'Deep mulberry purple with warm cream and plum accents.',
    preview: {
      bg: '#190618',
      surface: '#250924',
      main: '#e0caac',
      accent: '#8b3a86'
    }
  },
  {
    id: 'botanical',
    name: 'Botanical',
    category: 'Nature & Bamboo',
    description: 'Dark forest slate with retro bamboo cream and moss green.',
    preview: {
      bg: '#1c1c1c',
      surface: '#242725',
      main: '#dfd7af',
      accent: '#47695b'
    }
  },
  {
    id: 'paper',
    name: 'Paper',
    category: 'Vintage Parchment',
    description: 'Warm kraft paper with deep dark calligraphic ink.',
    preview: {
      bg: '#ceb18d',
      surface: '#c0a27e',
      main: '#14120f',
      accent: '#443a30'
    }
  },
  {
    id: 'shadow',
    name: 'Shadow',
    category: 'Monochrome Stark',
    description: 'Pitch minimalist obsidian black with stark pure white type.',
    preview: {
      bg: '#111111',
      surface: '#1a1a1a',
      main: '#eeeeee',
      accent: '#ffffff'
    }
  },
  {
    id: 'magma',
    name: 'Magma',
    category: 'Volcanic Ember',
    description: 'Charred espresso black with molten amber orange and crimson.',
    preview: {
      bg: '#0f0000',
      surface: '#1c0505',
      main: '#ff9602',
      accent: '#b31313'
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
  document.documentElement.classList.add('dark'); // Light mode is completely removed
  document.documentElement.setAttribute('data-theme', theme.id);
  localStorage.setItem('app_color_theme', theme.id);
  localStorage.setItem('theme', 'dark');
}
