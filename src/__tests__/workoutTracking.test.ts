import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db, type ExerciseLog } from '../db';
import { seedWorkoutRoutine, DIFFICULTY_POINTS } from '../utils/exerciseSync';
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
});
