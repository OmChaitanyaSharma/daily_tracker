import re

with open("src/utils/settings.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Interface
old_iface = """export interface AppSettings {
  streakTargetHours: number;
  streakTargetHabitPercent: number;
  winterArcRules: string[];
  devRanksNames: string[];
  fitRanksNames: string[];
}"""
new_iface = """export interface AppSettings {
  streakTargetHours: number;
  streakTargetHabitPercent: number;
  streakFitnessRequirementType: 'all' | 'count' | 'reps';
  streakFitnessRequirementValue: number;
  seasonName: string;
  winterArcRules: string[];
  devRanksNames: string[];
  fitRanksNames: string[];
}"""
content = content.replace(old_iface, new_iface)

# Parsed return
old_ret1 = """        streakTargetHabitPercent: parsed.streakTargetHabitPercent ?? 75,
        winterArcRules: parsed.winterArcRules || DEFAULT_WINTER_ARC,"""
new_ret1 = """        streakTargetHabitPercent: parsed.streakTargetHabitPercent ?? 75,
        streakFitnessRequirementType: parsed.streakFitnessRequirementType || 'all',
        streakFitnessRequirementValue: parsed.streakFitnessRequirementValue ?? 0,
        seasonName: parsed.seasonName || 'Winter Arc',
        winterArcRules: parsed.winterArcRules || DEFAULT_WINTER_ARC,"""
content = content.replace(old_ret1, new_ret1)

# Default return
old_ret2 = """    streakTargetHabitPercent: 75,
    winterArcRules: DEFAULT_WINTER_ARC,"""
new_ret2 = """    streakTargetHabitPercent: 75,
    streakFitnessRequirementType: 'all',
    streakFitnessRequirementValue: 0,
    seasonName: 'Winter Arc',
    winterArcRules: DEFAULT_WINTER_ARC,"""
content = content.replace(old_ret2, new_ret2)

with open("src/utils/settings.ts", "w", encoding="utf-8") as f:
    f.write(content)
