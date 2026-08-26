import { describe, it, expect } from 'vitest';
import { formatDisplayDate, getDateRange, getMeasurementDates } from '../utils/dateUtils';

describe('dateUtils', () => {
  it('formatDisplayDate should format properly and avoid timezone issues', () => {
    // Standard parse without timezone shifts
    expect(formatDisplayDate('2026-08-26', 'MMM d, yyyy')).toBe('Aug 26, 2026');
    expect(formatDisplayDate('2026-01-01', 'MMM d')).toBe('Jan 1');
  });

  it('getDateRange should return inclusive list of dates', () => {
    const range = getDateRange('2026-08-20', '2026-08-22');
    expect(range).toEqual(['2026-08-20', '2026-08-21', '2026-08-22']);
  });

  it('getMeasurementDates should return 15-day intervals up to end of year', () => {
    const dates = getMeasurementDates('2026-12-10');
    // Start: 2026-12-10
    // Next: 2026-12-25
    // End: 2026-12-31
    expect(dates).toEqual(['2026-12-10', '2026-12-25', '2026-12-31']);
  });
});