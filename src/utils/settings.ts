export interface MoodLabels {
  excellent: string;
  good: string;
  okay: string;
  'not-great': string;
  bad: string;
}

export const DEFAULT_MOOD_LABELS: MoodLabels = {
  excellent: 'Excellent',
  good: 'Good',
  okay: 'Okay',
  'not-great': 'Not great',
  bad: 'Bad'
};

export interface AppSettings {
  streakTargetHours: number;
  streakTargetHabitPercent: number;
  streakFitnessRequirementType: 'all' | 'count' | 'reps' | 'xp';
  streakFitnessRequirementValue: number;
  seasonName: string;
  winterArcRules: string[];
  devRanksNames: string[];
  fitRanksNames: string[];
  moodLabels: MoodLabels;
  trackingStartDate?: string;
}

export const DEFAULT_WINTER_ARC: string[] = [];

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
      streakTargetHours: 3.0,
      streakTargetHabitPercent: 75,
      streakFitnessRequirementType: 'all',
      streakFitnessRequirementValue: 0,
      seasonName: 'Season 1',
      winterArcRules: [],
      devRanksNames: DEFAULT_DEV,
      fitRanksNames: DEFAULT_FIT,
      moodLabels: { ...DEFAULT_MOOD_LABELS }
    };
  }

  const rawTrackingStart = raw.trackingStartDate;
  const trackingStartDate = (typeof rawTrackingStart === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawTrackingStart.trim()))
    ? rawTrackingStart.trim()
    : undefined;

  const validFitnessTypes: Array<'all' | 'count' | 'reps' | 'xp'> = ['all', 'count', 'reps', 'xp'];
  const fitnessType = validFitnessTypes.includes(raw.streakFitnessRequirementType)
    ? raw.streakFitnessRequirementType
    : 'all';

  const streakTargetHours = typeof raw.streakTargetHours === 'number' && !isNaN(raw.streakTargetHours)
    ? Math.max(0, Math.min(24, raw.streakTargetHours))
    : 3.0;

  const streakTargetHabitPercent = typeof raw.streakTargetHabitPercent === 'number' && !isNaN(raw.streakTargetHabitPercent)
    ? Math.max(0, Math.min(100, raw.streakTargetHabitPercent))
    : 75;

  const streakFitnessRequirementValue = typeof raw.streakFitnessRequirementValue === 'number' && !isNaN(raw.streakFitnessRequirementValue)
    ? Math.max(0, raw.streakFitnessRequirementValue)
    : 0;

  const seasonName = typeof raw.seasonName === 'string' && raw.seasonName.trim().length > 0
    ? raw.seasonName.slice(0, 100)
    : 'Season 1';

  const winterArcRules = Array.isArray(raw.winterArcRules)
    ? raw.winterArcRules.filter((r: unknown) => typeof r === 'string' && r.trim() !== '').map((r: string) => r.slice(0, 200))
    : [];

  const devRanksNames = Array.isArray(raw.devRanksNames) && raw.devRanksNames.length > 0
    ? raw.devRanksNames.filter((r: unknown) => typeof r === 'string').map((r: string) => r.slice(0, 100))
    : DEFAULT_DEV;

  const fitRanksNames = Array.isArray(raw.fitRanksNames) && raw.fitRanksNames.length > 0
    ? raw.fitRanksNames.filter((r: unknown) => typeof r === 'string').map((r: string) => r.slice(0, 100))
    : DEFAULT_FIT;

  const rawMood = raw.moodLabels;
  const moodLabels: MoodLabels = (rawMood && typeof rawMood === 'object' && !Array.isArray(rawMood))
    ? {
        excellent: typeof rawMood.excellent === 'string' && rawMood.excellent.trim() ? rawMood.excellent.trim().slice(0, 30) : DEFAULT_MOOD_LABELS.excellent,
        good: typeof rawMood.good === 'string' && rawMood.good.trim() ? rawMood.good.trim().slice(0, 30) : DEFAULT_MOOD_LABELS.good,
        okay: typeof rawMood.okay === 'string' && rawMood.okay.trim() ? rawMood.okay.trim().slice(0, 30) : DEFAULT_MOOD_LABELS.okay,
        'not-great': typeof rawMood['not-great'] === 'string' && rawMood['not-great'].trim() ? rawMood['not-great'].trim().slice(0, 30) : DEFAULT_MOOD_LABELS['not-great'],
        bad: typeof rawMood.bad === 'string' && rawMood.bad.trim() ? rawMood.bad.trim().slice(0, 30) : DEFAULT_MOOD_LABELS.bad
      }
    : { ...DEFAULT_MOOD_LABELS };

  return {
    streakTargetHours,
    streakTargetHabitPercent,
    streakFitnessRequirementType: fitnessType,
    streakFitnessRequirementValue,
    seasonName,
    winterArcRules,
    devRanksNames: devRanksNames.length > 0 ? devRanksNames : DEFAULT_DEV,
    fitRanksNames: fitRanksNames.length > 0 ? fitRanksNames : DEFAULT_FIT,
    moodLabels,
    ...(trackingStartDate ? { trackingStartDate } : {})
  };
}

export function getSettings(): AppSettings {
  const saved = localStorage.getItem('app_settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return sanitizeSettings(parsed);
    } catch {}
  }
  return sanitizeSettings(null);
}

export function saveSettings(settings: AppSettings) {
  const cleaned = sanitizeSettings(settings);
  localStorage.setItem('app_settings', JSON.stringify(cleaned));
}
