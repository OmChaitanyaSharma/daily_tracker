import { db } from '../db';
import { syncExercisesScores, seedWorkoutRoutine, ensureWorkoutSequenceExact } from './exerciseSync';
import { seedDefaultSchedule } from './scheduleDefaults';

const CURRENT_MIGRATION_VERSION = 7;
const MIGRATION_KEY = 'dt_schema_migration_version';

/**
 * Executes ordered, versioned database schema migrations.
 * Replaces ad-hoc, temporal localStorage flags with a deterministic engine.
 */
export async function runDatabaseMigrations(): Promise<void> {
  const currentVersionStr = localStorage.getItem(MIGRATION_KEY);
  
  // Backward compatibility: If old temporal flags exist, resolve starting version
  let startVersion = 0;
  if (currentVersionStr !== null) {
    startVersion = parseInt(currentVersionStr, 10) || 0;
  } else if (localStorage.getItem('exercises_oct2026_sync_v1')) {
    startVersion = 3; // Already ran legacy patches up to v3
  } else if (localStorage.getItem('sept_2026_goal_date_fix_27th')) {
    startVersion = 2;
  } else if (localStorage.getItem('sept_2026_reset_final')) {
    startVersion = 1;
  }

  if (startVersion >= CURRENT_MIGRATION_VERSION) {
    localStorage.setItem(MIGRATION_KEY, CURRENT_MIGRATION_VERSION.toString());
    return;
  }

  // Migration 1: Clean startup initialization (no auto-seeding - start completely blank)
  if (startVersion < 1) {
    startVersion = 1;
    localStorage.setItem(MIGRATION_KEY, '1');
  }

  // Migration 2: Harmonize goal start dates
  if (startVersion < 2) {
    const goalsToUpdate = await db.goals.toArray();
    if (goalsToUpdate.length > 0) {
      await Promise.all(
        goalsToUpdate
          .filter(g => !g.startDate)
          .map(g => db.goals.update(g.id, { startDate: '2026-09-27' }))
      );
    }
    startVersion = 2;
    localStorage.setItem(MIGRATION_KEY, '2');
  }

  // Migration 3: Synchronize default exercise library and scoring weights
  if (startVersion < 3) {
    await syncExercisesScores();
    startVersion = 3;
    localStorage.setItem(MIGRATION_KEY, '3');
  }

  // Migration 4: Harmonize all current goals start date to 2026-11-25 without altering any other user data
  if (startVersion < 4) {
    const goalsToUpdate = await db.goals.toArray();
    if (goalsToUpdate.length > 0) {
      for (const goal of goalsToUpdate) {
        const oldStartDate = goal.startDate;
        await db.goals.update(goal.id, { startDate: '2026-11-25' });
        // Re-align initial baseline measurement recorded on old start date to 2026-11-25
        if (oldStartDate && oldStartDate !== '2026-11-25') {
          const baselineMeasurements = await db.goalMeasurements
            .where('goalId')
            .equals(goal.id)
            .filter(m => m.date === oldStartDate)
            .toArray();
          for (const m of baselineMeasurements) {
            await db.goalMeasurements.update(m.id, { date: '2026-11-25' });
          }
        }
      }
    }
    startVersion = 4;
    localStorage.setItem(MIGRATION_KEY, '4');
  }

  // Migration 5: Seed user's daily planner and focus blocks if empty
  if (startVersion < 5) {
    await seedDefaultSchedule();
    startVersion = 5;
    localStorage.setItem(MIGRATION_KEY, '5');
  }

  // Migration 6: Seed Phase 1 Master Schedule (Schedule A: Mon/Wed/Fri/Sat/Sun + Tue/Thu Rest Days)
  // and replace all previous exercises with the 10 "Train Like You're 16" workout exercises
  if (startVersion < 6) {
    await seedDefaultSchedule(true);
    await seedWorkoutRoutine(true);
    localStorage.setItem('exercise_rest_days', JSON.stringify({ default: [2, 4], weeks: {} }));
    startVersion = 6;
    localStorage.setItem(MIGRATION_KEY, '6');
  }

  // Migration 7: Guarantee obsolete exercises are purged and 10 drills are set in exact order with perSetDesc
  if (startVersion < 7) {
    await ensureWorkoutSequenceExact();
    localStorage.setItem('exercise_rest_days', JSON.stringify({ default: [2, 4], weeks: {} }));
    startVersion = 7;
    localStorage.setItem(MIGRATION_KEY, '7');
  }

  localStorage.setItem(MIGRATION_KEY, CURRENT_MIGRATION_VERSION.toString());
}
