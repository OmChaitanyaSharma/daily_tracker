import { db } from '../db';
import { resetAndSeedDatabase } from '../seedData';
import { syncExercisesScores } from './exerciseSync';

const CURRENT_MIGRATION_VERSION = 3;
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

  // Migration 1: Initial database seeding
  if (startVersion < 1) {
    const habitCount = await db.habits.count();
    if (habitCount === 0) {
      await resetAndSeedDatabase();
    }
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

  localStorage.setItem(MIGRATION_KEY, CURRENT_MIGRATION_VERSION.toString());
}
