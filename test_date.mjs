import { format, parseISO, addDays, isAfter, isSameDay } from 'date-fns';

function getMeasurementDates(startDateStr) {
  if (!startDateStr) return [];
  const dates = [];
  try {
    let current = parseISO(`${startDateStr}T12:00:00`);
    let endYear = current.getFullYear();
    // If the date is March or later, the end is March 1st of the next year
    if (current.getMonth() >= 2) {
       endYear += 1;
    }
    const end = parseISO(`${endYear}-03-01T12:00:00`);
    
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

console.log(getMeasurementDates("2026-09-16"));
