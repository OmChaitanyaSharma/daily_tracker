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
    expect(s.streakTargetHours).toBe(3.0);
    expect(s.streakTargetHabitPercent).toBe(75);
    expect(s.seasonName).toBe('Season 1');
    expect(s.winterArcRules.length).toBe(0);
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
    expect(s.seasonName).toBe('Season 1');
    expect(s.winterArcRules.length).toBe(0);
  });
});

import { validateBackupPayload, sanitizeBackupRecords } from '../utils/backupValidation';

describe('backup validation and sanitization security', () => {
  it('rejects invalid top-level payloads', () => {
    expect(validateBackupPayload(null).valid).toBe(false);
    expect(validateBackupPayload('string').valid).toBe(false);
    expect(validateBackupPayload([]).valid).toBe(false);
    expect(validateBackupPayload({}).valid).toBe(false);
    expect(validateBackupPayload({ randomKey: 'val' }).valid).toBe(false);
  });

  it('accepts valid flat payload', () => {
    const result = validateBackupPayload({ habits: [] });
    expect(result.valid).toBe(true);
    expect(result.payload.habits).toEqual([]);
  });

  it('accepts valid envelope payload', () => {
    const result = validateBackupPayload({
      _app: 'daily-tracker',
      _schemaVersion: 1,
      data: {
        habits: [{ id: 'h1', name: 'Exercise' }],
        dayEntries: []
      }
    });
    expect(result.valid).toBe(true);
    expect(result.payload.habits.length).toBe(1);
  });

  it('sanitizeBackupRecords removes prototype pollution and preserves valid keys', () => {
    const dirty: any[] = [
      { id: 'h1', name: 'Habit 1', __proto__: { admin: true }, constructor: 'bad' },
      { id: ' ', name: 'Empty ID' }, // invalid ID
      { name: 'Missing ID' }, // missing ID
      null,
      undefined,
      'string',
      { id: 'h2', name: 'Habit 2', specificDays: [1, 2, 3] }
    ];

    const clean = sanitizeBackupRecords(dirty, 'id');
    expect(clean.length).toBe(2);
    expect(clean[0].id).toBe('h1');
    expect(clean[0].name).toBe('Habit 1');
    expect((clean[0] as any).admin).toBeUndefined();
    expect(clean[1].id).toBe('h2');
    expect(clean[1].specificDays).toEqual([1, 2, 3]);
  });

  it('sanitizeBackupRecords validates date primary key for dayEntries', () => {
    const dirty = [
      { date: '2026-10-15', highlight: 'Shipped security patch' },
      { date: null, highlight: 'Bad' },
      { date: '', highlight: 'Bad' }
    ];

    const clean = sanitizeBackupRecords(dirty, 'date');
    expect(clean.length).toBe(1);
    expect(clean[0].date).toBe('2026-10-15');
    expect(clean[0].highlight).toBe('Shipped security patch');
  });
});
