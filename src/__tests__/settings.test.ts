import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSettings, saveSettings } from '../utils/settings';

describe('settings logic', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  
  afterEach(() => {
    localStorage.clear();
  });

  it('getSettings returns defaults when empty', () => {
    const s = getSettings();
    expect(s.streakTargetHours).toBe(6.0);
    expect(s.streakTargetHabitPercent).toBe(75);
    expect(s.seasonName).toBe('Winter Arc');
    expect(s.winterArcRules.length).toBe(7);
    expect(s.devRanksNames.length).toBe(11);
    expect(s.fitRanksNames.length).toBe(11);
  });

  it('saveSettings stores in localStorage', () => {
    const s = getSettings();
    s.streakTargetHours = 8.5;
    saveSettings(s);
    
    const s2 = getSettings();
    expect(s2.streakTargetHours).toBe(8.5);
    expect(s2.streakTargetHabitPercent).toBe(75);
  });

  it('getSettings merges partial localStorage safely', () => {
    localStorage.setItem('app_settings', JSON.stringify({ streakTargetHours: 2.0 }));
    const s = getSettings();
    expect(s.streakTargetHours).toBe(2.0);
    expect(s.streakTargetHabitPercent).toBe(75);
    expect(s.seasonName).toBe('Winter Arc');
    expect(s.winterArcRules.length).toBe(7);
  });
});
