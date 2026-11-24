import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db, type ExerciseLog } from '../db';
import { seedWorkoutRoutine, ensureWorkoutSequenceExact, DIFFICULTY_POINTS } from '../utils/exerciseSync';
import { isRestDayOfWeek } from '../utils/scheduleDefaults';

describe('Workout & Exercise Protocol Engine', () => {
  beforeEach(async () => {
    await db.exercises.clear();
    await db.exerciseLogs.clear();
  });

  it('correctly identifies Tuesday and Thursday as designated Rest Days', () => {
    expect(isRestDayOfWeek(2)).toBe(true);  // Tuesday
    expect(isRestDayOfWeek(4)).toBe(true);  // Thursday
    expect(isRestDayOfWeek(1)).toBe(false); // Monday
    expect(isRestDayOfWeek(3)).toBe(false); // Wednesday
    expect(isRestDayOfWeek(5)).toBe(false); // Friday
    expect(isRestDayOfWeek(6)).toBe(false); // Saturday
    expect(isRestDayOfWeek(0)).toBe(false); // Sunday
  });

  it('seeds all 10 "Train Like You\'re 16" exercises with targets and difficulty marks', async () => {
    await seedWorkoutRoutine(true);

    const exercises = await db.exercises.toArray();
    expect(exercises).toHaveLength(10);

    const tuckJumps = exercises.find(e => e.name === 'Max Tuck Jumps');
    expect(tuckJumps).toBeDefined();
    expect(tuckJumps?.category).toContain('Part A');
    expect(tuckJumps?.difficulty).toBe('hard');
    expect(tuckJumps?.targetSets).toBe(4);
    expect(tuckJumps?.targetRepsNumeric).toBe(8);
    expect(DIFFICULTY_POINTS[tuckJumps!.difficulty!]).toBe(15);

    const wallAngels = exercises.find(e => e.name === 'Wall Angels');
    expect(wallAngels).toBeDefined();
    expect(wallAngels?.category).toContain('Part B');
    expect(wallAngels?.difficulty).toBe('very_easy');
    expect(wallAngels?.targetSets).toBe(2);
    expect(DIFFICULTY_POINTS[wallAngels!.difficulty!]).toBe(2);

    const davidVideo = exercises.find(e => e.name === '@MovementbyDavid Video');
    expect(davidVideo).toBeDefined();
    expect(davidVideo?.category).toContain('Part C');
    expect(davidVideo?.difficulty).toBe('easy');
    expect(DIFFICULTY_POINTS[davidVideo!.difficulty!]).toBe(5);
  });

  it('allows logging sets and reps for exercises', async () => {
    await seedWorkoutRoutine(true);
    const exercises = await db.exercises.toArray();
    const tuckJumps = exercises.find(e => e.name === 'Max Tuck Jumps')!;

    const log: ExerciseLog = {
      id: 'log-1',
      date: '2026-11-25',
      exerciseId: tuckJumps.id,
      sets: 4,
      reps: 32 // 4 sets x 8 reps
    };

    await db.exerciseLogs.add(log);

    const saved = await db.exerciseLogs.get('log-1');
    expect(saved?.sets).toBe(4);
    expect(saved?.reps).toBe(32);
    expect(saved?.exerciseId).toBe(tuckJumps.id);
  });

  it('guarantees exact 1-to-10 order and explicit perSetDesc volume on all drills', async () => {
    // Add obsolete legacy exercise to test purging
    await db.exercises.add({
      id: 'old-pullups',
      name: 'Pullups',
      createdAt: new Date().toISOString(),
      archived: false
    });

    await ensureWorkoutSequenceExact();

    const exercises = (await db.exercises.toArray())
      .filter(e => !e.archived)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    expect(exercises).toHaveLength(10);
    expect(exercises.some(e => e.name === 'Pullups')).toBe(false);

    const expectedDrills = [
      { order: 1, name: 'Max Tuck Jumps', perSetDesc: '8 reps' },
      { order: 2, name: 'High-Knee Sprints', perSetDesc: '30 secs' },
      { order: 3, name: 'Speed Skipping', perSetDesc: '60 secs' },
      { order: 4, name: 'Single-Leg Hops', perSetDesc: '15 / leg' },
      { order: 5, name: 'Pull-up Negatives + Active Hangs', perSetDesc: '3–5s lower + max hang' },
      { order: 6, name: 'Glute Bridges (3s Hold)', perSetDesc: '15 reps (3s hold)' },
      { order: 7, name: 'Wall Angels', perSetDesc: '15 slow reps' },
      { order: 8, name: 'Hanging Knee Raises', perSetDesc: '8–10 reps' },
      { order: 9, name: '@MovementbyDavid Video', perSetDesc: 'Full routine' },
      { order: 10, name: 'Final Dead Hang', perSetDesc: '45–60 secs' },
    ];

    expectedDrills.forEach((expected, i) => {
      expect(exercises[i].order).toBe(expected.order);
      expect(exercises[i].name).toBe(expected.name);
      expect(exercises[i].perSetDesc).toBe(expected.perSetDesc);
    });
  });
});
