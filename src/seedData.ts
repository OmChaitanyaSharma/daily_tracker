
import { db } from './db';

export async function resetAndSeedDatabase() {
  console.log('Performing final DB reset and seed for Sept 2026...');
  
  // Clean wipe
  await db.dayEntries.clear();
  await db.tasks.clear();
  await db.habits.clear();
  await db.habitLogs.clear();
  await db.hourLogs.clear();
  await db.hourCategories.clear();
  await db.goals.clear();
  await db.goalMeasurements.clear();
  await db.exercises.clear();
  await db.exerciseLogs.clear();

  const startDate = '2026-09-27';
  const createdAt = new Date('2026-09-27T00:00:00Z').toISOString();

  // 1. Seed Original Habits
  const habitsList = [
    'Drink 2L Water', 'Morning Walk', 'Meditate 10m', 'Stretch',
    'Code for 1 hour', 'Read 10 pages', 'Clean Room', 'Inbox Zero'
  ];
  
  let order = 0;
  for (const name of habitsList) {
    await db.habits.add({
      id: crypto.randomUUID(),
      name,
      createdAt,
      startDate,
      archived: false,
      order: order++
    });
  }

  // 2. Seed Hour Categories
  await db.hourCategories.bulkAdd([
    { id: crypto.randomUUID(), name: 'Coding', color: 'var(--accent-blue)', createdAt },
    { id: crypto.randomUUID(), name: 'Studying', color: 'var(--accent-purple)', createdAt },
    { id: crypto.randomUUID(), name: 'Deep Work', color: 'var(--accent-red)', createdAt }
  ]);

  // 3. Seed Original Health Goals
  const healthGoals = [
    { title: 'Weight', start: '75', target: '70', type: 'numeric', unit: 'kg' },
    { title: 'Body Fat %', start: '20', target: '15', type: 'percentage', unit: '%' },
    { title: 'Resting HR', start: '70', target: '60', type: 'numeric', unit: 'bpm' }
  ];

  let hOrder = 0;
  for (const hg of healthGoals) {
    const goalId = crypto.randomUUID();
    await db.goals.add({
      id: goalId,
      category: 'health',
      title: hg.title,
      targetValue: hg.target || undefined,
      unit: hg.unit || undefined,
      type: hg.type as any,
      startingValue: hg.start,
      startDate,
      order: hOrder++
    });
    await db.goalMeasurements.add({
      id: crypto.randomUUID(),
      goalId: goalId,
      date: startDate,
      value: hg.start,
      unit: hg.unit || undefined
    });
  }

  // 4. Seed Original End of Year Goals
  const yearGoals = [
    { title: 'Read 12 Books', type: 'numeric', start: '0', target: '12', unit: 'books' },
    { title: 'Run a 5k', type: 'numeric', start: '0', target: '5', unit: 'km' },
    { title: 'Save $5000', type: 'numeric', start: '0', target: '5000', unit: '$' },
    { title: 'Launch 1 Project', type: 'numeric', start: '0', target: '1', unit: 'projects' },
    { title: 'Meditate Daily', type: 'qualitative', start: 'Inconsistent', target: 'Consistent' }
  ];

  let yOrder = 0;
  for (const yg of yearGoals) {
    const goalId = crypto.randomUUID();
    await db.goals.add({
      id: goalId,
      category: 'end-of-year',
      title: yg.title,
      targetValue: yg.target,
      unit: yg.unit || undefined,
      type: yg.type as any,
      startingValue: yg.start,
      startDate,
      order: yOrder++
    });
    await db.goalMeasurements.add({
      id: crypto.randomUUID(),
      goalId: goalId,
      date: startDate,
      value: yg.start,
      unit: yg.unit || undefined
    });
  }

  // 5. Seed Exercises (with difficulties mapped)
  await db.exercises.bulkAdd([
    { id: crypto.randomUUID(), name: 'Pushups', createdAt, archived: false, difficulty: 'medium', trackingType: 'reps' },
    { id: crypto.randomUUID(), name: 'Pullups', createdAt, archived: false, difficulty: 'hard', trackingType: 'reps' },
    { id: crypto.randomUUID(), name: 'Squats', createdAt, archived: false, difficulty: 'easy', trackingType: 'reps' },
    { id: crypto.randomUUID(), name: 'Running', createdAt, archived: false, difficulty: 'medium', trackingType: 'time' },
    { id: crypto.randomUUID(), name: 'Cycling', createdAt, archived: false, difficulty: 'medium', trackingType: 'time' }
  ]);
}

