export interface AppSettings {
  streakTargetHours: number;
  streakTargetHabitPercent: number;
  streakFitnessRequirementType: 'all' | 'count' | 'reps';
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

export function getSettings(): AppSettings {
  const saved = localStorage.getItem('app_settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        streakTargetHours: parsed.streakTargetHours ?? 6.0,
        streakTargetHabitPercent: parsed.streakTargetHabitPercent ?? 75,
        streakFitnessRequirementType: parsed.streakFitnessRequirementType || 'all',
        streakFitnessRequirementValue: parsed.streakFitnessRequirementValue ?? 0,
        seasonName: parsed.seasonName || 'Winter Arc',
        winterArcRules: parsed.winterArcRules || DEFAULT_WINTER_ARC,
        devRanksNames: parsed.devRanksNames || DEFAULT_DEV,
        fitRanksNames: parsed.fitRanksNames || DEFAULT_FIT
      };
    } catch (e) {}
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
