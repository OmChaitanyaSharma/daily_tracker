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
    expect(s.moodLabels.excellent).toBe('Excellent');
    expect(s.moodLabels.bad).toBe('Bad');
  });

  it('customizes and persists moodLabels', () => {
    const s = getSettings();
    s.moodLabels.excellent = 'Godly';
    s.moodLabels.bad = 'Rough';
    saveSettings(s);

    const reloaded = getSettings();
    expect(reloaded.moodLabels.excellent).toBe('Godly');
    expect(reloaded.moodLabels.bad).toBe('Rough');
    expect(reloaded.moodLabels.good).toBe('Good');
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

import { COLOR_THEMES, getSavedTheme, applyTheme, previewTheme, cancelThemePreview } from '../utils/theme';

describe('theme system', () => {
  it('contains valid and unique theme definitions', () => {
    const ids = COLOR_THEMES.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
    expect(ids).toContain('taro');
    expect(ids).toContain('aether');
    expect(ids).toContain('anti_hero');
    expect(ids).toContain('solarized_osaka');
    expect(ids).toContain('sewing_tin_light');
    expect(ids).toContain('burgundy_romance');
    expect(ids).toContain('cashmere_espresso');
    expect(ids).toContain('opaline');
    expect(ids).toContain('starry_nocturne');

    for (const theme of COLOR_THEMES) {
      expect(theme.name.trim().length).toBeGreaterThan(0);
      expect(theme.category.trim().length).toBeGreaterThan(0);
      expect(theme.description.trim().length).toBeGreaterThan(0);
      expect(theme.preview.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.preview.surface).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.preview.main).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.preview.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
    }

    // Verify ascending alphabetical sort order by display name
    const names = COLOR_THEMES.map(t => t.name);
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sortedNames);
  });

  it('saves and applies theme', () => {
    applyTheme('taro');
    expect(getSavedTheme()).toBe('taro');
    expect(document.documentElement.getAttribute('data-theme')).toBe('taro');
  });

  it('previews theme without persisting to localStorage and cancels cleanly', () => {
    applyTheme('phantom');
    expect(getSavedTheme()).toBe('phantom');
    expect(document.documentElement.getAttribute('data-theme')).toBe('phantom');

    // Hover preview
    previewTheme('aether');
    expect(document.documentElement.getAttribute('data-theme')).toBe('aether');
    // localStorage should remain phantom
    expect(localStorage.getItem('app_color_theme')).toBe('phantom');
    expect(getSavedTheme()).toBe('phantom');

    // Cancel preview (mouse leave)
    cancelThemePreview();
    expect(document.documentElement.getAttribute('data-theme')).toBe('phantom');
    expect(getSavedTheme()).toBe('phantom');
  });
});

