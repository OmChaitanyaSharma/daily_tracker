/**
 * Deep validation and sanitization utilities for Daily Tracker JSON backup files.
 * Protects against prototype pollution, malformed primary keys, and injection vectors.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  payload?: any;
}

export const KNOWN_COLLECTIONS = [
  'habits',
  'habitLogs',
  'hourLogs',
  'hourCategories',
  'goals',
  'goalMeasurements',
  'exercises',
  'exerciseLogs',
  'tasks',
  'dayEntries'
] as const;

export function validateBackupPayload(data: unknown): ValidationResult {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, error: 'Backup file must contain a valid JSON object.' };
  }

  const raw = data as Record<string, any>;
  const payload = (raw._app === 'daily-tracker' && raw.data && typeof raw.data === 'object')
    ? raw.data
    : raw;

  const hasAnyCollection = KNOWN_COLLECTIONS.some(key => Array.isArray(payload[key]));
  const hasSettings = payload.settings && typeof payload.settings === 'object';

  if (!hasAnyCollection && !hasSettings) {
    return { valid: false, error: 'Unrecognized backup structure. No valid Daily Tracker collections found.' };
  }

  return { valid: true, payload };
}

/**
 * Strips dangerous prototype keys, verifies valid string primary keys, and eliminates malformed entries.
 */
export function sanitizeBackupRecords<T extends Record<string, any>>(
  items: unknown,
  keyField: 'id' | 'date'
): T[] {
  if (!Array.isArray(items)) return [];

  return items
    .map(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const rawKey = (item as any)[keyField];
      if (typeof rawKey !== 'string' || !rawKey.trim()) return null;

      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(item as Record<string, any>)) {
        // Neutralize prototype pollution
        if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;

        // Allow safe primitives and primitive arrays
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null || v === undefined) {
          clean[k] = v;
        } else if (Array.isArray(v)) {
          clean[k] = v.filter(el => typeof el === 'string' || typeof el === 'number');
        }
      }
      return clean as T;
    })
    .filter((item): item is T => item !== null);
}
