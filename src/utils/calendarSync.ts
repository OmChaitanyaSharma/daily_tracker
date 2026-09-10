import { db } from '../db';



export async function downloadCalendarICS() {
  const events = await db.events.toArray();
  const tasks = await db.tasks.toArray();
  
  if (events.length === 0 && tasks.length === 0) return;

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DailyTracker//Getaway//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ].join('\r\n') + '\r\n';

  const today = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  events.forEach(evt => {
    icsContent += [
      'BEGIN:VEVENT',
      `UID:${evt.id}@dailytracker`,
      `DTSTAMP:${today}`,
      `DTSTART;VALUE=DATE:${evt.date.replace(/-/g, '')}`,
      `SUMMARY:${evt.title}`,
      `DESCRIPTION:${evt.description || (evt.type === 'deadline' ? 'Deadline' : 'Event')}`,
      'END:VEVENT'
    ].join('\r\n') + '\r\n';
  });

  tasks.filter(t => !t.completed).forEach(task => {
    icsContent += [
      'BEGIN:VEVENT',
      `UID:${task.id}@dailytracker`,
      `DTSTAMP:${today}`,
      `DTSTART;VALUE=DATE:${task.date.replace(/-/g, '')}`,
      `SUMMARY:[Task] ${task.title}`,
      'END:VEVENT'
    ].join('\r\n') + '\r\n';
  });

  icsContent += 'END:VCALENDAR';

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'DailyTracker_Schedule.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
