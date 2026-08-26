import { describe, it, expect } from 'vitest';
import { calculateLevel, calculateStats } from '../hooks/useLevelSystem';

describe('useLevelSystem logic', () => {
  describe('calculateLevel', () => {
    it('calculates level 1 for 0 XP', () => {
      const result = calculateLevel(0);
      expect(result.level).toBe(1);
      expect(result.xp).toBe(0);
      expect(result.currentLevelBaseXp).toBe(0);
      expect(result.nextLevelBaseXp).toBe(100);
      expect(result.progress).toBe(0);
    });

    it('calculates correct level and progress for 150 XP', () => {
      const result = calculateLevel(150);
      // level = floor(sqrt(1.5)) + 1 = floor(1.22) + 1 = 2
      // base for level 2 = 100 * (1)^2 = 100
      // next for level 2 = 100 * (2)^2 = 400
      expect(result.level).toBe(2);
      expect(result.currentLevelBaseXp).toBe(100);
      expect(result.nextLevelBaseXp).toBe(400);
      // Progress = (150 - 100) / (400 - 100) = 50 / 300 = 16.66%
      expect(result.progress).toBeCloseTo(16.66, 1);
    });
  });

  describe('calculateStats', () => {
    it('calculates dev stats correctly based on hours', () => {
      const hourLogs = [{ hours: 1.5 }, { hours: 2.0 }];
      const stats = calculateStats(hourLogs, [], []);
      expect(stats.totalHours).toBe(3.5);
      // XP = floor(3.5 * 100) = 350
      // 3.5 ^ (1/1.75) = 2.04 => level 3
      expect(stats.dev.level).toBe(3);
      expect(stats.dev.xp).toBe(350);
    });

    it('calculates fitness stats with mixed difficulties and types', () => {
      const exercises = [
        { id: 'e1', difficulty: 'very_easy', trackingType: 'reps' }, // 2 XP per rep
        { id: 'e2', difficulty: 'hard', trackingType: 'reps' },      // 15 XP per rep
        { id: 'e3', difficulty: 'medium', trackingType: 'time' },    // 10 XP per min
      ];
      const exerciseLogs = [
        { exerciseId: 'e1', reps: 10 }, // 20 XP
        { exerciseId: 'e2', reps: 5 },  // 75 XP
        { exerciseId: 'e3', reps: 15 }  // 150 XP (minutes)
      ];
      const stats = calculateStats([], exerciseLogs, exercises);
      expect(stats.totalReps).toBe(30);
      // Total XP = 20 + 75 + 150 = 245
      // sqrt(2.45) = 1.56 => level 2
      expect(stats.fitness.level).toBe(2);
      expect(stats.fitness.xp).toBe(245);
    });
  });
});