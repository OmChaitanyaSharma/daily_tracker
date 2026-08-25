import { format, parseISO, eachDayOfInterval, subDays, addDays, isAfter, isSameDay } from 'date-fns';

/**
 * Always returns the current date in YYYY-MM-DD format based on local time,
 * completely avoiding time-of-day timezone shifts.
 */
export function getTodayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return getTodayStr(); // alias
}

/**
 * Safely parses a YYYY-MM-DD string into a standard format.
 */
export function formatDisplayDate(dateStr: string, fmt: string = 'MMM d, yyyy'): string {
  if (!dateStr) return '';
  try {
    // Adding T12:00:00 prevents timezone boundary shifts when parsing
    return format(parseISO(`${dateStr}T12:00:00`), fmt);
  } catch (e) {
    return dateStr; // fallback
  }
}

export function formatDateString(dateStr: string, formatStr: string = 'MMM d, yyyy'): string {
  return formatDisplayDate(dateStr, formatStr); // alias
}

export function getDateRange(startStr: string, endStr: string): string[] {
  const start = parseISO(`${startStr}T12:00:00`);
  const end = parseISO(`${endStr}T12:00:00`);
  return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
}

export function getLastNDays(n: number): string[] {
  const end = new Date();
  const start = subDays(end, n - 1);
  return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
}

export function getCurrentMonthGrid(date: Date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
}

export function getMeasurementDates(startDateStr: string): string[] {
  if (!startDateStr) return [];
  const dates: string[] = [];
  try {
    let current = parseISO(`${startDateStr}T12:00:00`);
    const end = parseISO(`${format(current, 'yyyy')}-12-31T12:00:00`);
    
    dates.push(format(current, 'yyyy-MM-dd')); // Initial
    
    while (true) {
      current = addDays(current, 15);
      if (isAfter(current, end) || isSameDay(current, end)) {
        break;
      }
      dates.push(format(current, 'yyyy-MM-dd'));
    }
    
    const endStr = format(end, 'yyyy-MM-dd');
    if (dates[dates.length - 1] !== endStr) {
      dates.push(endStr);
    }
    
    return dates;
  } catch(e) {
    return [];
  }
}
