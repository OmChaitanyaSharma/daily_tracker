import { db, type ScheduleSlot } from '../db';

export interface DefaultSlotTemplate {
  startTime: string; // 24-hour "HH:mm"
  endTime: string;   // 24-hour "HH:mm"
  title: string;
  deliverable: string;
}

export const DEFAULT_MASTER_SCHEDULE: DefaultSlotTemplate[] = [
  {
    startTime: '09:00',
    endTime: '10:00',
    title: 'Zero-Phone Morning Launch',
    deliverable: 'NO PHONE FOR FULL HOUR. 45m Impact + Posture + @MovementbyDavid stretch + Dead Hangs; Brushing + tongue scrape + 10m Vocal Articulation in shower; Morning skin & hair care.'
  },
  {
    startTime: '10:00',
    endTime: '12:30',
    title: 'CS50 Python (Block 1)',
    deliverable: 'Watch lectures at 1.5x (fast through early weeks) + write code alongside in terminal.'
  },
  {
    startTime: '12:30',
    endTime: '13:15',
    title: 'Sales & Local Demo Site',
    deliverable: 'Days 1–4: Build/polish 1 local business demo (Tap-to-WhatsApp). Days 5–12: 5–10 cold calls/pitches.'
  },
  {
    startTime: '13:15',
    endTime: '14:15',
    title: 'Meal 1 + Sutta #1 + Reset',
    deliverable: 'High-protein, high-fiber home meal (zero outside food) + Sutta #1 (max) + 1L water + screen-free rest.'
  },
  {
    startTime: '14:15',
    endTime: '16:15',
    title: 'CS50 Python (Block 2) + Site',
    deliverable: 'Complete CS50P problem sets, push GitHub commit, and update personal website/profile.'
  },
  {
    startTime: '16:15',
    endTime: '17:25',
    title: 'Content & Speaking Lab (70m)',
    deliverable: '30m Video editing/videography practice • 30m YT/IG Storytelling & Sales playlist • 10m Paritosh camera drill (audio-only + video-only review). No posting yet.'
  },
  {
    startTime: '17:25',
    endTime: '18:30',
    title: '10k Steps Walk + Dead Hangs',
    deliverable: 'Track manual Walking workout on Galaxy Fit 3 to complete 10,000 daily steps + 2 relaxed dead hangs.'
  },
  {
    startTime: '18:30',
    endTime: '20:00',
    title: 'Deep Coding / Buffer',
    deliverable: 'Extra CS50P problem sets or Saturday YouTube/Winter Arc project implementation.'
  },
  {
    startTime: '20:00',
    endTime: '20:45',
    title: 'Meal 2 + Sutta #2 (3h Pre-Sleep)',
    deliverable: 'Second clean high-protein/fiber meal (finish ≥2.5–3h before bed for deep-sleep GH pulse) + Sutta #2 (final).'
  },
  {
    startTime: '20:45',
    endTime: '21:30',
    title: 'Social Cap + Night Care',
    deliverable: '20m Cap: 1 gang video call + 2–3 reels to Adi Boi (reply to friends only). Night skin/teeth + Minoxidil + log tracker.'
  }
];

export const REST_DAY_SCHEDULE: DefaultSlotTemplate[] = [
  {
    startTime: '09:00',
    endTime: '10:00',
    title: 'Zero-Phone Morning Launch (Rest Day)',
    deliverable: 'REST DAY: No intense workout. 45m gentle mobility, light walking & floor stretching. Brushing + tongue scrape + 10m Vocal Articulation in shower; Morning skin & hair care.'
  },
  {
    startTime: '10:00',
    endTime: '12:30',
    title: 'CS50 Python (Block 1)',
    deliverable: 'Watch lectures at 1.5x (fast through early weeks) + write code alongside in terminal.'
  },
  {
    startTime: '12:30',
    endTime: '13:15',
    title: 'Sales & Local Demo Site',
    deliverable: 'Days 1–4: Build/polish 1 local business demo (Tap-to-WhatsApp). Days 5–12: 5–10 cold calls/pitches.'
  },
  {
    startTime: '13:15',
    endTime: '14:15',
    title: 'Meal 1 + Sutta #1 + Reset',
    deliverable: 'High-protein, high-fiber home meal (zero outside food) + Sutta #1 (max) + 1L water + screen-free rest.'
  },
  {
    startTime: '14:15',
    endTime: '16:15',
    title: 'CS50 Python (Block 2) + Site',
    deliverable: 'Complete CS50P problem sets, push GitHub commit, and update personal website/profile.'
  },
  {
    startTime: '16:15',
    endTime: '17:25',
    title: 'Content & Speaking Lab (70m)',
    deliverable: '30m Video editing/videography practice • 30m YT/IG Storytelling & Sales playlist • 10m Paritosh camera drill (audio-only + video-only review). No posting yet.'
  },
  {
    startTime: '17:25',
    endTime: '18:30',
    title: '10k Steps Walk (Active Recovery)',
    deliverable: 'Active recovery walk on Galaxy Fit 3 to complete 10,000 daily steps + relaxed dead hang sets.'
  },
  {
    startTime: '18:30',
    endTime: '20:00',
    title: 'Deep Coding / Buffer',
    deliverable: 'Extra CS50P problem sets or Saturday YouTube/Winter Arc project implementation.'
  },
  {
    startTime: '20:00',
    endTime: '20:45',
    title: 'Meal 2 + Sutta #2 (3h Pre-Sleep)',
    deliverable: 'Second clean high-protein/fiber meal (finish ≥2.5–3h before bed for deep-sleep GH pulse) + Sutta #2 (final).'
  },
  {
    startTime: '20:45',
    endTime: '21:30',
    title: 'Social Cap + Night Care',
    deliverable: '20m Cap: 1 gang video call + 2–3 reels to Adi Boi (reply to friends only). Night skin/teeth + Minoxidil + log tracker.'
  }
];

export function isRestDayOfWeek(dayOfWeek: number): boolean {
  return dayOfWeek === 2 || dayOfWeek === 4; // Tuesday = 2, Thursday = 4
}

/**
 * Format a 24h string ("09:00", "13:15") to 12h ("09:00 AM", "01:15 PM")
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const min = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${String(hour).padStart(2, '0')}:${min} ${ampm}`;
}

/**
 * Calculates human duration string from start and end times, e.g. "1h 15m"
 */
export function calculateDuration(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return '';
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return '';
  
  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (endMinutes < startMinutes) endMinutes += 24 * 60; // overnight handling
  
  const diff = endMinutes - startMinutes;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

/**
 * Checks whether current wall-clock time falls inside the slot
 */
export function isCurrentSlot(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return false;
  
  const startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (endMinutes < startMinutes) endMinutes += 24 * 60;
  
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Pre-populates the database with the user's master schedule and rest day schedules
 */
export async function seedDefaultSchedule(forceReset = false): Promise<void> {
  const existingCount = await db.scheduleSlots.count();
  if (existingCount > 0 && !forceReset) return;

  if (forceReset) {
    await db.scheduleSlots.clear();
  }

  const slotsToSeed: ScheduleSlot[] = [
    // Master daily schedule (dayOfWeek: -1)
    ...DEFAULT_MASTER_SCHEDULE.map((slot, index) => ({
      id: crypto.randomUUID(),
      startTime: slot.startTime,
      endTime: slot.endTime,
      title: slot.title,
      deliverable: slot.deliverable,
      dayOfWeek: -1,
      order: index,
      completedDates: []
    })),
    // Tuesday Rest Day schedule override (dayOfWeek: 2)
    ...REST_DAY_SCHEDULE.map((slot, index) => ({
      id: crypto.randomUUID(),
      startTime: slot.startTime,
      endTime: slot.endTime,
      title: slot.title,
      deliverable: slot.deliverable,
      dayOfWeek: 2,
      order: index,
      completedDates: []
    })),
    // Thursday Rest Day schedule override (dayOfWeek: 4)
    ...REST_DAY_SCHEDULE.map((slot, index) => ({
      id: crypto.randomUUID(),
      startTime: slot.startTime,
      endTime: slot.endTime,
      title: slot.title,
      deliverable: slot.deliverable,
      dayOfWeek: 4,
      order: index,
      completedDates: []
    }))
  ];

  await db.scheduleSlots.bulkAdd(slotsToSeed);
}
