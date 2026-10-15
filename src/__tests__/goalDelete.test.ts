import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../db';

describe('Goal Deletion & Cascade Cleanliness', () => {
  beforeEach(async () => {
    await db.goals.clear();
    await db.goalMeasurements.clear();
  });

  it('deletes a goal and cascades all its measurements in Dexie', async () => {
    const goalId = 'test-goal-uuid-1';
    await db.goals.add({
      id: goalId,
      title: 'Run a 5k',
      category: 'end-of-year',
      type: 'numeric',
      startDate: '2026-09-27'
    });

    await db.goalMeasurements.bulkAdd([
      { id: 'm-1', goalId, date: '2026-09-27', value: 0 },
      { id: 'm-2', goalId, date: '2026-10-01', value: 2.5 },
      { id: 'm-3', goalId, date: '2026-10-05', value: 5.0 }
    ]);

    // Add another goal and measurement to verify isolation
    await db.goals.add({
      id: 'other-goal',
      title: 'Read 12 Books',
      category: 'end-of-year',
      type: 'numeric',
      startDate: '2026-09-27'
    });
    await db.goalMeasurements.add({
      id: 'm-other',
      goalId: 'other-goal',
      date: '2026-09-27',
      value: 1
    });

    expect(await db.goals.count()).toBe(2);
    expect(await db.goalMeasurements.count()).toBe(4);

    // Simulate the deletion logic implemented in GoalSettingsModal
    await db.transaction('rw', [db.goals, db.goalMeasurements], async () => {
      const measurements = await db.goalMeasurements.where('goalId').equals(goalId).toArray();
      const measurementIds = measurements
        .map(m => m.id)
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
      
      if (measurementIds.length > 0) {
        await db.goalMeasurements.bulkDelete(measurementIds);
      }

      await db.goals.delete(goalId);
    });

    // Target goal and its measurements must be completely gone
    expect(await db.goals.get(goalId)).toBeUndefined();
    const remainingMeasurements = await db.goalMeasurements.where('goalId').equals(goalId).toArray();
    expect(remainingMeasurements.length).toBe(0);

    // Other goal and measurement must remain intact
    expect(await db.goals.get('other-goal')).toBeDefined();
    expect(await db.goalMeasurements.get('m-other')).toBeDefined();
    expect(await db.goals.count()).toBe(1);
    expect(await db.goalMeasurements.count()).toBe(1);
  });

  it('safely handles goals with no measurements without throwing', async () => {
    const goalId = 'lonely-goal-1';
    await db.goals.add({
      id: goalId,
      title: 'Solo Goal',
      category: 'health',
      type: 'qualitative',
      startDate: '2026-10-01'
    });

    await db.transaction('rw', [db.goals, db.goalMeasurements], async () => {
      const measurements = await db.goalMeasurements.where('goalId').equals(goalId).toArray();
      const measurementIds = measurements
        .map(m => m.id)
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
      
      if (measurementIds.length > 0) {
        await db.goalMeasurements.bulkDelete(measurementIds);
      }

      await db.goals.delete(goalId);
    });

    expect(await db.goals.get(goalId)).toBeUndefined();
  });
});
