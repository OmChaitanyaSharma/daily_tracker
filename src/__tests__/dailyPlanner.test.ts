import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db, type ScheduleSlot } from '../db';
import { 
  formatTime12h, 
  calculateDuration, 
  seedDefaultSchedule 
} from '../utils/scheduleDefaults';

describe('Daily Planner & Schedule Engine', () => {
  beforeEach(async () => {
    await db.scheduleSlots.clear();
  });

  it('formats 24-hour time strings into 12-hour AM/PM format', () => {
    expect(formatTime12h('09:00')).toBe('09:00 AM');
    expect(formatTime12h('12:00')).toBe('12:00 PM');
    expect(formatTime12h('13:15')).toBe('01:15 PM');
    expect(formatTime12h('21:30')).toBe('09:30 PM');
    expect(formatTime12h('00:15')).toBe('12:15 AM');
  });

  it('computes accurate durations between slot start and end times', () => {
    expect(calculateDuration('09:00', '10:00')).toBe('1h');
    expect(calculateDuration('10:00', '12:30')).toBe('2h 30m');
    expect(calculateDuration('12:30', '13:15')).toBe('45m');
    expect(calculateDuration('08:30', '09:00')).toBe('30m');
  });

  it('seeds all 10 default focus blocks if database schedule is empty', async () => {
    expect(await db.scheduleSlots.count()).toBe(0);

    await seedDefaultSchedule();

    const count = await db.scheduleSlots.count();
    expect(count).toBe(10);

    const first = await db.scheduleSlots.orderBy('startTime').first();
    expect(first?.title).toBe('Zero-Phone Morning Launch (1 Hour)');
    expect(first?.startTime).toBe('09:00');
    expect(first?.endTime).toBe('10:00');
    expect(first?.dayOfWeek).toBe(-1); // All 7 days master

    const cs50 = await db.scheduleSlots.where('startTime').equals('10:00').first();
    expect(cs50?.title).toBe('CS50 Python (Block 1)');
  });

  it('allows adding, editing, and toggling completions on daily slots', async () => {
    const slotId = 'test-slot-1';
    const slot: ScheduleSlot = {
      id: slotId,
      startTime: '10:00',
      endTime: '11:00',
      title: 'Deep Work Block',
      deliverable: 'Ship feature',
      dayOfWeek: -1,
      completedDates: []
    };

    await db.scheduleSlots.add(slot);

    // Toggle completion for today
    const today = '2026-11-25';
    await db.scheduleSlots.update(slotId, {
      completedDates: [today]
    });

    const updated = await db.scheduleSlots.get(slotId);
    expect(updated?.completedDates).toContain(today);

    // Toggle off
    await db.scheduleSlots.update(slotId, {
      completedDates: []
    });
    const toggledOff = await db.scheduleSlots.get(slotId);
    expect(toggledOff?.completedDates).not.toContain(today);
  });
});
