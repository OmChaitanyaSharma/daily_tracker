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

export function sanitizeSettings(raw: any): AppSettings {
  if (!raw || typeof raw !== 'object') {
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

  const validFitnessTypes: Array<'all' | 'count' | 'reps' | 'xp'> = ['all', 'count', 'reps', 'xp'];
  const fitnessType = validFitnessTypes.includes(raw.streakFitnessRequirementType)
    ? raw.streakFitnessRequirementType
    : 'all';

  const streakTargetHours = typeof raw.streakTargetHours === 'number' && !isNaN(raw.streakTargetHours)
    ? Math.max(0, Math.min(24, raw.streakTargetHours))
    : 6.0;

  const streakTargetHabitPercent = typeof raw.streakTargetHabitPercent === 'number' && !isNaN(raw.streakTargetHabitPercent)
    ? Math.max(0, Math.min(100, raw.streakTargetHabitPercent))
    : 75;

  const streakFitnessRequirementValue = typeof raw.streakFitnessRequirementValue === 'number' && !isNaN(raw.streakFitnessRequirementValue)
    ? Math.max(0, raw.streakFitnessRequirementValue)
    : 0;

  const seasonName = typeof raw.seasonName === 'string' && raw.seasonName.trim().length > 0
    ? raw.seasonName.slice(0, 100)
    : 'Winter Arc';

  const winterArcRules = Array.isArray(raw.winterArcRules)
    ? raw.winterArcRules.filter((r: unknown) => typeof r === 'string' && r.trim() !== '').map((r: string) => r.slice(0, 200))
    : DEFAULT_WINTER_ARC;

  const devRanksNames = Array.isArray(raw.devRanksNames) && raw.devRanksNames.length > 0
    ? raw.devRanksNames.filter((r: unknown) => typeof r === 'string').map((r: string) => r.slice(0, 100))
    : DEFAULT_DEV;

  const fitRanksNames = Array.isArray(raw.fitRanksNames) && raw.fitRanksNames.length > 0
    ? raw.fitRanksNames.filter((r: unknown) => typeof r === 'string').map((r: string) => r.slice(0, 100))
    : DEFAULT_FIT;

  return {
    streakTargetHours,
    streakTargetHabitPercent,
    streakFitnessRequirementType: fitnessType,
    streakFitnessRequirementValue,
    seasonName,
    winterArcRules: winterArcRules.length > 0 ? winterArcRules : DEFAULT_WINTER_ARC,
    devRanksNames: devRanksNames.length > 0 ? devRanksNames : DEFAULT_DEV,
    fitRanksNames: fitRanksNames.length > 0 ? fitRanksNames : DEFAULT_FIT
  };
}

export function getSettings(): AppSettings {
  const saved = localStorage.getItem('app_settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return sanitizeSettings(parsed);
    } catch (e) {}
  }
  return sanitizeSettings(null);
}

export function saveSettings(settings: AppSettings) {
  const cleaned = sanitizeSettings(settings);
  localStorage.setItem('app_settings', JSON.stringify(cleaned));
}
