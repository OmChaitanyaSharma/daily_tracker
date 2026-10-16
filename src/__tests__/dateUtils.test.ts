import { describe, it, expect } from 'vitest';
import { formatDisplayDate, getDateRange, getMeasurementDates, getEffectiveTrackingStartDate, getMinDateStr, MIN_DATE_STR } from '../utils/dateUtils';

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

  it('getEffectiveTrackingStartDate prioritizes configured start, then earliest entry, then today', () => {
    expect(getEffectiveTrackingStartDate('2026-10-17', '2026-09-01')).toBe('2026-10-17');
    expect(getEffectiveTrackingStartDate(null, '2026-09-01')).toBe('2026-09-01');
    expect(getEffectiveTrackingStartDate(undefined, '2026-08-27')).toBe('2026-08-27');
    // When no date provided, defaults to valid YYYY-MM-DD
    const todayFallback = getEffectiveTrackingStartDate();
    expect(todayFallback).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('getMinDateStr reads from localStorage and falls back to MIN_DATE_STR', () => {
    localStorage.clear();
    expect(getMinDateStr()).toBe(MIN_DATE_STR);

    localStorage.setItem('app_settings', JSON.stringify({ trackingStartDate: '2026-10-17' }));
    expect(getMinDateStr()).toBe('2026-10-17');
  });

  it('calculates accurate inclusive day capacity from reset date to period end (Option A)', () => {
    // Factory reset on October 17th, 2026
    const resetDate = '2026-10-17';
    const octEnd = '2026-10-31';
    const yearEnd = '2026-12-31';

    // Monthly capacity for October: 17th through 31st inclusive
    const octDays = getDateRange(resetDate, octEnd);
    expect(octDays.length).toBe(15);
    expect(octDays[0]).toBe('2026-10-17');
    expect(octDays[octDays.length - 1]).toBe('2026-10-31');

    // Q4 / H2 / Yearly capacity: 17th through Dec 31st inclusive
    const q4Days = getDateRange(resetDate, yearEnd);
    expect(q4Days.length).toBe(76);
  });
});
