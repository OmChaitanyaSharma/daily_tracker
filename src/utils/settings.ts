export interface AppSettings {
  streakTargetHours: number;
  streakTargetHabitPercent: number;
  streakFitnessRequirementType: 'all' | 'count' | 'reps' | 'xp';
  streakFitnessRequirementValue: number;
  seasonName: string;
  winterArcRules: string[];
  devRanksNames: string[];
  fitRanksNames: string[];
}

const DEFAULT_WINTER_ARC = [
  "Wake up at 6 am daily / sleep by 10 pm",
  "Train consistently",
  "Skin care + hair care",
  "Work for over 8 hours daily (coding + skills + study)",
  "Discipline >> Motivation",
  "Less social media, more books",
  "Count every calorie you eat"
];

const DEFAULT_DEV = [
  "Logic Initiate", "Code Apprentice", "Algorithm Adept", "Systems Craftsman",
  "Lead Architect", "Kernel Hacker", "Machine Whisperer", "Silicon Oracle",
  "Turing Grandmaster", "Cybernetic Titan", "Digital God"
];

const DEFAULT_FIT = [
  "Couch Potato", "Walker", "Jogger", "Athlete",
  "Warrior", "Spartan", "Olympian", "Demigod",
  "Hercules", "Atlas", "Aesthetic God"
];

export interface SeasonPreset {
  id: string;
  name: string;
  description: string;
  rules: string[];
}

export const SEASON_PRESETS: SeasonPreset[] = [
  {
    id: 'winter_arc',
    name: 'Winter Arc',
    description: 'The classic 90-day cold-season discipline protocol.',
    rules: [
      "Wake up at 6 am daily / sleep by 10 pm",
      "Train consistently (strength + cardio)",
      "Skin care + hair care",
      "Work over 8 hours daily (coding + skills + study)",
      "Discipline >> Motivation",
      "Less social media, more books",
      "Count every calorie you eat"
    ]
  },
  {
    id: 'monk_mode',
    name: 'Monk Mode',
    description: 'Eliminate cheap dopamine and focus 100% on high-value output.',
    rules: [
      "Zero doom-scrolling or cheap dopamine",
      "Minimum 6 hours of deep, uninterrupted work",
      "Read 30 minutes of educational books",
      "Daily 45-minute intense workout",
      "Drink 3-4 liters of water",
      "Evening review and daily reflection"
    ]
  },
  {
    id: 'fitness_shred',
    name: 'Fitness & Shred',
    description: 'Hyper-focused on body recomposition, strength, and health.',
    rules: [
      "Hit daily protein and calorie macros",
      "Complete all scheduled workout sets & reps",
      "10,000 steps or 30 min cardio daily",
      "Drink 3+ liters of clean water",
      "8 hours of quality sleep",
      "Stretch & mobility work before bed"
    ]
  },
  {
    id: 'study_sprint',
    name: 'Study Sprint',
    description: 'Academic excellence, DSA mastery, and tech interview readiness.',
    rules: [
      "Solve at least 2 DSA / LeetCode problems",
      "4+ hours focused theory & project building",
      "Zero phone usage during study blocks",
      "Review active recall notes before sleep",
      "Exercise daily to keep mental sharpness"
    ]
  },
  {
    id: 'clean_slate',
    name: 'Custom Clean Slate',
    description: 'Start fresh with your own custom rules.',
    rules: [
      "My Primary Priority",
      "My Daily Standard"
    ]
  }
];

export interface HabitPreset {
  id: string;
  name: string;
  description: string;
  habits: string[];
}

export const HABIT_PRESETS: HabitPreset[] = [
  {
    id: 'core_discipline',
    name: 'Core Discipline',
    description: 'Essential high-impact habits for daily clarity and performance.',
    habits: [
      'Deep Work (4h+)',
      'Daily Workout / Movement',
      'Read 20 Pages',
      'Drink 3L Water',
      'Clean Diet (<2200 kcal)',
      'Sleep Before 11 PM'
    ]
  },
  {
    id: 'developer_student',
    name: 'Developer & Student',
    description: 'Built for software engineers, CS students, and tech builders.',
    habits: [
      'DSA / LeetCode',
      'Web Dev Project Building',
      'Read Tech Docs / Books',
      'Gym / Movement',
      'Github Commit / PR',
      'No Social Media Before Noon'
    ]
  },
  {
    id: 'fitness_health',
    name: 'Fitness & Health',
    description: 'Physical strength, cardiovascular health, and body composition.',
    habits: [
      'Weight Training / Calisthenics',
      'Cardio (30 mins)',
      'Mobility & Stretching',
      'Hit Protein Target',
      '<2000 Kcals Clean Eating',
      '3L Water',
      '8 Hours Sleep'
    ]
  },
  {
    id: 'minimalist_3',
    name: 'Minimalist 3',
    description: 'Simple, unshakeable 3-habit core to build momentum.',
    habits: [
      'Deep Work (4h+)',
      'Daily Physical Workout',
      'Clean Nutrition'
    ]
  },
  {
    id: 'creator_pack',
    name: 'Original Creator Pack',
    description: 'The 18-habit setup from the original creator.',
    habits: [
      'Serum & Conditioner', 'Moisturizer', 'SKOW 1 (Voice)', 'SKOW 2 (Photos)',
      'Cardio', 'Strength', 'Stretching', '<2000 Kcals (diet)', '3 l water',
      'Email', 'Github', 'Linked In', 'Productivity', 'Minoxidil',
      'Cleaning Room', '2x Brush', 'Books / Socials', 'Weight'
    ]
  }
];

export function getSettings(): AppSettings {
  const saved = localStorage.getItem('app_settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return {
          streakTargetHours: typeof parsed.streakTargetHours === 'number' && !isNaN(parsed.streakTargetHours) ? Math.max(0, parsed.streakTargetHours) : 6.0,
          streakTargetHabitPercent: typeof parsed.streakTargetHabitPercent === 'number' && !isNaN(parsed.streakTargetHabitPercent) ? Math.min(100, Math.max(0, parsed.streakTargetHabitPercent)) : 75,
          streakFitnessRequirementType: ['all', 'count', 'reps', 'xp'].includes(parsed.streakFitnessRequirementType) ? parsed.streakFitnessRequirementType : 'all',
          streakFitnessRequirementValue: typeof parsed.streakFitnessRequirementValue === 'number' && !isNaN(parsed.streakFitnessRequirementValue) ? Math.max(0, parsed.streakFitnessRequirementValue) : 0,
          seasonName: typeof parsed.seasonName === 'string' && parsed.seasonName.trim() ? parsed.seasonName.trim().slice(0, 50) : 'Winter Arc',
          winterArcRules: Array.isArray(parsed.winterArcRules) ? parsed.winterArcRules.filter((r: unknown): r is string => typeof r === 'string') : DEFAULT_WINTER_ARC,
          devRanksNames: Array.isArray(parsed.devRanksNames) ? parsed.devRanksNames.filter((r: unknown): r is string => typeof r === 'string') : DEFAULT_DEV,
          fitRanksNames: Array.isArray(parsed.fitRanksNames) ? parsed.fitRanksNames.filter((r: unknown): r is string => typeof r === 'string') : DEFAULT_FIT
        };
      }
    } catch {
      // Fallback to defaults
    }
  }
  return {
    streakTargetHours: 6.0,
    streakTargetHabitPercent: 75,
    streakFitnessRequirementType: 'all',
    streakFitnessRequirementValue: 0,
    seasonName: 'Winter Arc',
    winterArcRules: DEFAULT_WINTER_ARC,
    devRanksNames: DEFAULT_DEV,
    fitRanksNames: DEFAULT_FIT
  };
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem('app_settings', JSON.stringify(settings));
}

