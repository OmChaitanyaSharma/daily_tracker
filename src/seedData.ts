
import { db } from './db';

export async function seedInitialDataIfEmpty() {
  const habitsCount = await db.habits.count();
  const goalsCount = await db.goals.count();

  if (habitsCount === 0 && goalsCount === 0) {
    const defaultDate = '2026-08-27';
    
    // 1. Seed Habits
    const habitsList = [
      'Serum & Conditioner', 'Moisturizer', 'SKOW 1 (Voice)', 'SKOW 2 (Photos)',
      'Cardio', 'Strength', 'Stretching', '<2000 Kcals (diet)', '3 l water',
      'Email', 'Github', 'Linked In', 'Productivity', 'Minoxidil',
      'Cleaning Room', '2x Brush', 'Books / Socials', 'Weight'
    ];
    
    for (const name of habitsList) {
      await db.habits.add({
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
        startDate: defaultDate,
        archived: false
      });
    }

    // 2. Seed Health Goals
    const healthGoals = [
      { title: 'Stomach', start: '96', type: 'numeric', unit: 'cm' },
      { title: 'Chest', start: '93', type: 'numeric', unit: 'cm' },
      { title: 'R bicep', start: '28', type: 'numeric', unit: 'cm' },
      { title: 'L bicep', start: '29', type: 'numeric', unit: 'cm' },
      { title: 'R quads', start: '50', type: 'numeric', unit: 'cm' },
      { title: 'L quads', start: '52', type: 'numeric', unit: 'cm' },
      { title: 'R calfs', start: '37', type: 'numeric', unit: 'cm' },
      { title: 'L calfs', start: '38', type: 'numeric', unit: 'cm' },
      { title: 'Weight', start: '69.5', target: '63', type: 'numeric', unit: 'kg' }
    ];

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
        startDate: defaultDate
      });
      await db.goalMeasurements.add({
        id: crypto.randomUUID(),
        goalId: goalId,
        date: defaultDate,
        value: hg.start,
        unit: hg.unit || undefined
      });
    }

    // 3. Seed End of Year Goals
    const yearGoals = [
      { title: 'Plain belly', type: 'qualitative', start: 'Photo taken', target: 'Plain belly' },
      { title: '5 pullups in a row', type: 'numeric', start: '0', target: '5', unit: 'reps' },
      { title: '30 pushups in a row', type: 'numeric', start: '7', target: '30', unit: 'reps' },
      { title: 'Split 100%', type: 'percentage', start: '40', target: '100', unit: '%' },
      { title: 'Forward bend 100%', type: 'percentage', start: '60', target: '100', unit: '%' },
      { title: '45+ posts', type: 'numeric', start: '39', target: '45', unit: 'posts' },
      { title: 'Better Skin and Hair', type: 'qualitative', start: 'Photos', target: 'Better Skin and Hair' },
      { title: 'Deeper Modulated Voice', type: 'qualitative', start: 'Recorded', target: 'Deeper Modulated Voice' },
      { title: 'Skipping Max (5 min)', type: 'numeric', start: '64', target: '300', unit: 'sec' },
      { title: 'Dead Hang (2 mins)', type: 'numeric', start: '38', target: '120', unit: 'sec' },
      { title: 'Make 3K a month', type: 'numeric', start: '0', target: '3000', unit: '$' },
      { title: 'Make 3 web dev projects', type: 'numeric', start: '0', target: '3', unit: 'projects' },
      { title: 'Solve 100+ leetcodes', type: 'numeric', start: '0', target: '100', unit: 'problems' },
      { title: 'Typing Accuracy & Speed', type: 'qualitative', start: '82% / 130 WPM', target: '100% / 130 WPM' },
      { title: 'Run 5 km non stop', type: 'numeric', start: '2', target: '5', unit: 'km' },
      { title: 'Monitize one skill', type: 'qualitative', start: 'NO', target: 'Yes' }
    ];

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
        startDate: defaultDate
      });
      await db.goalMeasurements.add({
        id: crypto.randomUUID(),
        goalId: goalId,
        date: defaultDate,
        value: yg.start,
        unit: yg.unit || undefined
      });
    }
  }
}

