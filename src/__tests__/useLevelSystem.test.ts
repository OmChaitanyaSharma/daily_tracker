import { describe, it, expect, beforeEach } from 'vitest';
import { calculateDevLevel, calculateFitLevel, calculateStats, getDevTitle, getFitTitle } from '../hooks/useLevelSystem';
import { saveSettings, getSettings } from '../utils/settings';

describe('useLevelSystem logic', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('calculateLevel', () => {
    it('calculates dev level 0 for 0 XP', () => {
      const result = calculateDevLevel(0);
      expect(result.level).toBe(0);
      expect(result.progress).toBe(0);
    });

    it('calculates fit level properly', () => {
      const result = calculateFitLevel(400); // 400/100 = 4, sqrt(4) = 2, mathLevel = 3, displayLevel = 2
      expect(result.level).toBe(2);
    });
  });

  describe('dynamic titles', () => {
    it('returns default titles if no settings', () => {
      expect(getDevTitle(1)).toBe("Logic Initiate");
      expect(getFitTitle(1)).toBe("Couch Potato");
    });

    it('returns custom titles if settings exist', () => {
      const s = getSettings();
      s.devRanksNames[0] = "Noob Coder";
      s.fitRanksNames[0] = "Fatty";
      saveSettings(s);

      expect(getDevTitle(1)).toBe("Noob Coder");
      expect(getFitTitle(1)).toBe("Fatty");
    });
  });

  describe('calculateStats', () => {
    it('calculates dev stats correctly based on hours', () => {
      const hourLogs = [{ hours: 1.5 }, { hours: 2.0 }];
      const stats = calculateStats(hourLogs, [], []);
      expect(stats.totalHours).toBe(3.5);
      expect(stats.dev.level).toBe(2);
      expect(stats.dev.xp).toBe(350);
    });
  });
});
