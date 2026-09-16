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

  it('getMeasurementDates should target March 1st of next year if starting late in year', () => {
    const dates = getMeasurementDates('2026-12-10');
    // Start: 2026-12-10
    // +15: 2026-12-25
    // +15: 2027-01-09
    // +15: 2027-01-24
    // +15: 2027-02-08
    // +15: 2027-02-23
    // End is 2027-03-01
    expect(dates[0]).toEqual('2026-12-10');
    expect(dates[1]).toEqual('2026-12-25');
    expect(dates[dates.length - 1]).toEqual('2027-03-01');
  });

  it('getMeasurementDates should target March 1st of current year if starting in Jan/Feb', () => {
    const dates = getMeasurementDates('2027-01-15');
    expect(dates[0]).toEqual('2027-01-15');
    expect(dates[dates.length - 1]).toEqual('2027-03-01');
  });
});
