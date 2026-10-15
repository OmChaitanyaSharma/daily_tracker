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
    id: 'shadow',
    name: 'Shadow (OLED Black)',
    category: 'Monochrome Stark',
    description: 'Deep pitch OLED black with stark, high-contrast pure white type.',
    preview: {
      bg: '#000000',
      surface: '#0a0a0a',
      main: '#ffffff',
      accent: '#ffffff'
    }
  },
  {
    id: 'amethyst',
    name: 'Amethyst & Linen',
    category: 'Muted Lavender & Cream',
    description: 'Dolphin slate purple with soft amethyst lavender and warm linen cream.',
    preview: {
      bg: '#18151f',
      surface: '#231f2d',
      main: '#fdf1e2',
      accent: '#ab92bf'
    }
  },
  {
    id: 'teal',
    name: 'Nordic Teal',
    category: 'Deep Teal & Warm Beige',
    description: 'Abyssal emerald teal with warm sand beige typography and mint accents.',
    preview: {
      bg: '#031c1c',
      surface: '#072a2a',
      main: '#f5f5dc',
      accent: '#008080'
    }
  },
  {
    id: 'cyan',
    name: 'Monkeytype Cyan',
    category: 'Electric Cyan & Charcoal',
    description: 'Dark charcoal obsidian with electric cyan typography and amber highlights.',
    preview: {
      bg: '#151819',
      surface: '#1d2224',
      main: '#4ee3d2',
      accent: '#facc15'
    }
  },
  {
    id: 'linen',
    name: 'Warm Linen',
    category: 'Warm Linen Parchment',
    description: 'Soft warm linen paper with dark dolphin purple ink and amethyst accents.',
    preview: {
      bg: '#fdf1e2',
      surface: '#f3e5d3',
      main: '#2b2238',
      accent: '#655a7c'
    }
  },
  {
    id: 'taro',
    name: 'Taro',
    category: 'Periwinkle & Deep Plum',
    description: 'Pastel lavender periwinkle with deep obsidian plum ink, cyan caret, and sunny yellow highlights.',
    preview: {
      bg: '#b3baff',
      surface: '#a1a8f2',
      main: '#130f1a',
      accent: '#00e9e5'
    }
  },
  {
    id: 'aether',
    name: 'Aether',
    category: 'Slate Charcoal & Dreamy Violet',
    description: 'Dark slate charcoal with glowing dreamy magenta-violet and soft lilac cream text.',
    preview: {
      bg: '#101820',
      surface: '#292136',
      main: '#eedaea',
      accent: '#cf6bdd'
    }
  },
  {
    id: 'anti_hero',
    name: 'Anti Hero',
    category: 'Abyssal Indigo & Neon Crimson',
    description: 'Deep midnight navy with vivid neon pink accents and pastel peach coral typography.',
    preview: {
      bg: '#00002e',
      surface: '#060548',
      main: '#ffadad',
      accent: '#ff3d8b'
    }
  },
  {
    id: 'solarized_osaka',
    name: 'Solarized Osaka',
    category: 'Petrol Teal & Olive Lime',
    description: 'Japanese night petrol teal with solarized olive green and luminous cyan highlights.',
    preview: {
      bg: '#00141a',
      surface: '#00222b',
      main: '#859900',
      accent: '#2aa198'
    }
  },
  {
    id: 'sewing_tin_light',
    name: 'Sewing Tin Light',
    category: 'Porcelain White & Royal Cobalt',
    description: 'Crisp porcelain white with deep royal violet ink and vibrant cobalt blue accents.',
    preview: {
      bg: '#ffffff',
      surface: '#f3f5fa',
      main: '#2d2076',
      accent: '#385eca'
    }
  }
];

export const DEFAULT_THEME_ID = 'phantom';

export function getSavedTheme(): string {
  const saved = localStorage.getItem('app_color_theme');
  if (saved && COLOR_THEMES.some(t => t.id === saved)) {
    return saved;
  }
  return DEFAULT_THEME_ID;
}

export function applyTheme(themeId: string) {
  const theme = COLOR_THEMES.find(t => t.id === themeId) || COLOR_THEMES.find(t => t.id === DEFAULT_THEME_ID) || COLOR_THEMES[0];
  document.documentElement.classList.add('dark'); // Light mode is completely removed
  document.documentElement.setAttribute('data-theme', theme.id);
  localStorage.setItem('app_color_theme', theme.id);
  localStorage.setItem('theme', 'dark');
}
