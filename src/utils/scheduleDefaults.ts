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
    title: 'Zero-Phone Morning Launch (1 Hour)',
    deliverable: 'Strict Zero Phone Usage for the full hour.\n• Easy morning walk (3,000–4,000 steps) + gentle floor stretching & relaxed dead hangs.\n• Brush teeth + tongue scrape + 10 mins Vocal Articulation & Depth exercises in the shower.\n• Morning skincare & hair care (cleanser, moisturizer, sunscreen).'
  },
  {
    startTime: '10:00',
    endTime: '12:30',
    title: 'CS50 Python (Block 1)',
    deliverable: 'Restart CS50P from Week 0. Watch early familiar lectures at 1.5x speed, code alongside in terminal, and lock in for later modules (File I/O, Regex, OOP).'
  },
  {
    startTime: '12:30',
    endTime: '13:15',
    title: 'Sales & Local Website Demo',
    deliverable: '• Days 1–4 (Nov 25–28): Build & polish 1 responsive local business demo (clinic/gym) with working Tap-to-WhatsApp booking.\n• Days 5–12 (Nov 29–Dec 6): Make 5–10 cold calls / WhatsApp pitches daily to close ₹5,000 deals.'
  },
  {
    startTime: '13:15',
    endTime: '14:15',
    title: 'Rest & Hydration Reset',
    deliverable: 'Step away from all screens, hydrate (with doctor-approved electrolytes), and rest eyes.'
  },
  {
    startTime: '14:15',
    endTime: '16:15',
    title: 'CS50 Python (Block 2) & Personal Site',
    deliverable: 'Solve CS50P problem sets, push commits to GitHub, and maintain/update your personal website and profile. (Branch into Web Dev & NeetCode Python DSA immediately upon finishing CS50P).'
  },
  {
    startTime: '16:15',
    endTime: '17:25',
    title: 'Content & Speaking Practice Lab (70 Mins)',
    deliverable: 'Practice only — no video publishing until Phase 3.\n• 30 mins: Hands-on video editing & videography timeline practice (photography parked).\n• 30 mins: Watch only saved YouTube Storytelling/Creation & Instagram Winter Arc playlists to study speaking & selling.\n• 10 mins: Paritosh Anand camera drill (2–3m speaking → audio-only review + video-only review).'
  },
  {
    startTime: '17:25',
    endTime: '18:30',
    title: 'Evening Walk & Dead Hangs',
    deliverable: 'Complete remaining steps toward 10,000 daily steps at a steady, low-heart-rate pace + final relaxed dead hang sets.'
  },
  {
    startTime: '18:30',
    endTime: '20:30',
    title: 'Flexible Study / Fasting Rest Buffer',
    deliverable: 'Additional CS50P coding if energy is solid, or complete screen-free rest if fasting fatigue occurs.'
  },
  {
    startTime: '20:30',
    endTime: '21:00',
    title: 'Social & Digital Hygiene (20–30m Cap)',
    deliverable: '1 group video call with the gang + send 2–3 reels to Adi Boi (light support during his pre-mids; deeper 1-on-1 once his exams finish). Social Rule: Only watch and reply to reels/messages sent by friends; zero new feed browsing.'
  },
  {
    startTime: '21:00',
    endTime: '21:30',
    title: 'Night Grooming & Tracker Sign-Off',
    deliverable: 'Night skincare (cleanser + moisturizer), teeth brushing, nightly Minoxidil on dry scalp, verify Zero Sutta, and log all completions on your daily tracker.'
  }
];

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
 * Pre-populates the database with the user's master schedule if none exist
 */
export async function seedDefaultSchedule(): Promise<void> {
  const existingCount = await db.scheduleSlots.count();
  if (existingCount > 0) return;

  const slotsToSeed: ScheduleSlot[] = DEFAULT_MASTER_SCHEDULE.map((slot, index) => ({
    id: crypto.randomUUID(),
    startTime: slot.startTime,
    endTime: slot.endTime,
    title: slot.title,
    deliverable: slot.deliverable,
    dayOfWeek: -1, // -1 means all 7 days (master daily schedule)
    order: index,
    completedDates: []
  }));

  await db.scheduleSlots.bulkAdd(slotsToSeed);
}
