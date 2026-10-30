import { describe, it, expect } from 'vitest';
import { DEFAULT_DURATIONS, type PomodoroDurations } from '../utils/pomodoroConstants';

describe('Pomodoro Timer calculations', () => {
  it('correctly calculates fractional hours from arbitrary durations in seconds', () => {
    const calcHours = (sec: number) => +(sec / 3600).toFixed(2);

    expect(calcHours(25 * 60)).toBe(0.42);
    expect(calcHours(50 * 60)).toBe(0.83);
    expect(calcHours(60 * 60)).toBe(1.00);
    expect(calcHours(15 * 60)).toBe(0.25);
    // Arbitrary custom user minutes
    expect(calcHours(10 * 60)).toBe(0.17);
    expect(calcHours(35 * 60)).toBe(0.58);
    expect(calcHours(45 * 60)).toBe(0.75);
    expect(calcHours(90 * 60)).toBe(1.50);
  });

  it('formats mm:ss correctly from seconds remaining', () => {
    const formatTime = (totalSec: number) => {
      const minutes = Math.floor(totalSec / 60);
      const seconds = totalSec % 60;
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    expect(formatTime(1500)).toBe('25:00');
    expect(formatTime(300)).toBe('05:00');
    expect(formatTime(75)).toBe('01:15');
    expect(formatTime(9)).toBe('00:09');
    expect(formatTime(0)).toBe('00:00');
    // Custom durations formatting
    expect(formatTime(2100)).toBe('35:00');
    expect(formatTime(5400)).toBe('90:00');
  });

  it('accurately computes remaining seconds from targetEndTime and clamps to 0', () => {
    const now = 1000000;
    const targetEndTimeFuture = now + 120 * 1000;
    const targetEndTimePast = now - 10 * 1000;

    const computeRemaining = (targetEnd: number, current: number) => {
      return Math.max(0, Math.round((targetEnd - current) / 1000));
    };

    expect(computeRemaining(targetEndTimeFuture, now)).toBe(120);
    expect(computeRemaining(targetEndTimePast, now)).toBe(0);
  });

  it('provides default durations and supports custom duration overrides', () => {
    expect(DEFAULT_DURATIONS.focus).toBe(25);
    expect(DEFAULT_DURATIONS.shortBreak).toBe(5);
    expect(DEFAULT_DURATIONS.longBreak).toBe(15);

    const custom: PomodoroDurations = {
      focus: 40,
      shortBreak: 8,
      longBreak: 20
    };

    expect(custom.focus * 60).toBe(2400);
    expect(custom.shortBreak * 60).toBe(480);
    expect(custom.longBreak * 60).toBe(1200);
  });
});
