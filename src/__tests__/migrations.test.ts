import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../db';
import { runDatabaseMigrations } from '../utils/migrations';

describe('Database Migrations', () => {
  beforeEach(async () => {
    localStorage.clear();
    await db.goals.clear();
    await db.goalMeasurements.clear();
    await db.habits.clear();
  });

  it('migrates all existing goals and their baseline measurements to 2026-11-25', async () => {
    // Simulate pre-v4 state
    localStorage.setItem('dt_schema_migration_version', '3');

    const goalId1 = 'g-1';
    const goalId2 = 'g-2';

    await db.goals.bulkAdd([
      {
        id: goalId1,
        title: 'Run a 5k',
        category: 'end-of-year',
        type: 'numeric',
        startDate: '2026-09-27',
        startingValue: '0',
        targetValue: '5',
        unit: 'km'
      },
      {
        id: goalId2,
        title: 'Weight',
        category: 'health',
        type: 'numeric',
        startDate: '2026-10-15',
        startingValue: '75',
        targetValue: '70',
        unit: 'kg'
      }
    ]);

    await db.goalMeasurements.bulkAdd([
      // Baseline measurements on old start dates
      { id: 'm-1-base', goalId: goalId1, date: '2026-09-27', value: '0' },
      { id: 'm-2-base', goalId: goalId2, date: '2026-10-15', value: '75' },
      // Later measurement that should NOT be modified
      { id: 'm-2-later', goalId: goalId2, date: '2026-11-20', value: '73' }
    ]);

    // Also add a habit to ensure zero regression on non-goal entities
    await db.habits.add({
      id: 'h-1',
      name: 'Drink 2L Water',
      createdAt: '2026-09-27T00:00:00Z',
      archived: false,
      order: 0
    });

    // Run migration
    await runDatabaseMigrations();

    // Verify migration version
    expect(localStorage.getItem('dt_schema_migration_version')).toBe('5');

    // Verify goals have new startDate 2026-11-25
    const updatedGoals = await db.goals.toArray();
    expect(updatedGoals).toHaveLength(2);
    for (const g of updatedGoals) {
      expect(g.startDate).toBe('2026-11-25');
    }

    // Verify baseline measurements shifted to 2026-11-25
    const m1Base = await db.goalMeasurements.get('m-1-base');
    expect(m1Base?.date).toBe('2026-11-25');
    expect(m1Base?.value).toBe('0');

    const m2Base = await db.goalMeasurements.get('m-2-base');
    expect(m2Base?.date).toBe('2026-11-25');
    expect(m2Base?.value).toBe('75');

    // Verify later measurement date and value were NOT modified
    const m2Later = await db.goalMeasurements.get('m-2-later');
    expect(m2Later?.date).toBe('2026-11-20');
    expect(m2Later?.value).toBe('73');

    // Verify habit was untouched
    const habit = await db.habits.get('h-1');
    expect(habit?.name).toBe('Drink 2L Water');
  });
});
