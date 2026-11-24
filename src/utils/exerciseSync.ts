import { db, type Exercise, type ExerciseDifficulty, type TrackingType } from '../db';

export interface WorkoutExerciseDefinition {
  name: string;
  category: string;
  difficulty: ExerciseDifficulty;
  trackingType: TrackingType;
  targetSets: number;
  targetReps: string;
  targetRepsNumeric: number;
  restTime: string;
  execution: string;
  order: number;
}

export const DIFFICULTY_POINTS: Record<ExerciseDifficulty, number> = {
  very_easy: 2,
  easy: 5,
  medium: 10,
  hard: 15,
  very_hard: 20
};

export const DIFFICULTY_LABELS: Record<ExerciseDifficulty, string> = {
  very_easy: 'Very Easy',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  very_hard: 'Very Hard'
};

export const WORKOUT_EXERCISES: WorkoutExerciseDefinition[] = [
  // PART A: HIGH-VELOCITY IMPACT & BONE-STRAIN ENGINE (20 MINS)
  {
    name: 'Max Tuck Jumps',
    category: 'Part A: High-Velocity Impact & Bone-Strain Engine',
    difficulty: 'hard',
    trackingType: 'reps',
    targetSets: 4,
    targetReps: '4 × 8 reps',
    targetRepsNumeric: 8,
    restTime: '60s',
    execution: 'Quarter-squat dip, explode straight up, pull knees to chest. Land softly on balls of feet and rebound immediately.',
    order: 1
  },
  {
    name: 'High-Knee Sprints',
    category: 'Part A: High-Velocity Impact & Bone-Strain Engine',
    difficulty: 'hard',
    trackingType: 'time',
    targetSets: 5,
    targetReps: '5 × 30 secs',
    targetRepsNumeric: 30,
    restTime: '30s walk',
    execution: 'Sprint in place or 20–30m. Drive knees to waist height and strike forcefully on the balls of your feet.',
    order: 2
  },
  {
    name: 'Speed Skipping',
    category: 'Part A: High-Velocity Impact & Bone-Strain Engine',
    difficulty: 'medium',
    trackingType: 'time',
    targetSets: 4,
    targetReps: '4 × 60 secs',
    targetRepsNumeric: 60,
    restTime: '30s',
    execution: 'Rope or invisible rope. Fast, rhythmic bounce on balls of feet; keep spine tall and heels off the floor.',
    order: 3
  },
  {
    name: 'Single-Leg Hops',
    category: 'Part A: High-Velocity Impact & Bone-Strain Engine',
    difficulty: 'medium',
    trackingType: 'reps',
    targetSets: 3,
    targetReps: '3 × 15 / leg',
    targetRepsNumeric: 15,
    restTime: '30s',
    execution: 'Continuous vertical hops on one leg with stiff ankle rebound to send axial load up the kinetic chain.',
    order: 4
  },

  // PART B: POSTURAL ALIGNMENT & PELVIC DE-ROTATION (15 MINS — RECLAIMS 1.5–3 CM)
  {
    name: 'Pull-up Negatives + Active Hangs',
    category: 'Part B: Postural Alignment & Pelvic De-Rotation',
    difficulty: 'hard',
    trackingType: 'reps',
    targetSets: 4,
    targetReps: '4 sets (3–5s lower + max hang)',
    targetRepsNumeric: 5,
    restTime: '60s',
    execution: 'Decompresses thoracic spine and strengthens upper back to pull rounded shoulders back into alignment.',
    order: 5
  },
  {
    name: 'Glute Bridges (3s Hold)',
    category: 'Part B: Postural Alignment & Pelvic De-Rotation',
    difficulty: 'easy',
    trackingType: 'reps',
    targetSets: 3,
    targetReps: '3 × 15 reps',
    targetRepsNumeric: 15,
    restTime: '45s',
    execution: 'Squeeze glutes hard at top for 3s to unclamp tight hip flexors and eliminate anterior pelvic tilt.',
    order: 6
  },
  {
    name: 'Wall Angels',
    category: 'Part B: Postural Alignment & Pelvic De-Rotation',
    difficulty: 'very_easy',
    trackingType: 'reps',
    targetSets: 2,
    targetReps: '2 × 15 slow reps',
    targetRepsNumeric: 15,
    restTime: '30s',
    execution: 'Press heels, glutes, upper back, and head flat against wall. Slide arms W-to-Y without lower back arching.',
    order: 7
  },
  {
    name: 'Hanging Knee Raises',
    category: 'Part B: Postural Alignment & Pelvic De-Rotation',
    difficulty: 'medium',
    trackingType: 'reps',
    targetSets: 3,
    targetReps: '3 × 8–10 reps',
    targetRepsNumeric: 10,
    restTime: '45s',
    execution: 'Hang from bar, tuck tailbone under, lift knees to chest without swinging to reverse lumbar compression.',
    order: 8
  },

  // PART C: FLEXIBILITY & FINAL AXIAL DECOMPRESSION (10–15 MINS)
  {
    name: '@MovementbyDavid Video',
    category: 'Part C: Flexibility & Final Axial Decompression',
    difficulty: 'easy',
    trackingType: 'reps',
    targetSets: 1,
    targetReps: 'Full routine',
    targetRepsNumeric: 1,
    restTime: '—',
    execution: 'Run his Daily Stretch Routine for Tight Muscles & Full-Body Flexibility while fascia is warm.',
    order: 9
  },
  {
    name: 'Final Dead Hang',
    category: 'Part C: Flexibility & Final Axial Decompression',
    difficulty: 'medium',
    trackingType: 'time',
    targetSets: 3,
    targetReps: '3 × 45–60 secs',
    targetRepsNumeric: 60,
    restTime: '45s',
    execution: 'Let ribs, lower back, and hips go completely limp. Step onto a chair/stool gently—never drop hard onto heels.',
    order: 10
  }
];

// Compatibility export
export const EXERCISE_CONFIGS = WORKOUT_EXERCISES.map(w => ({
  name: w.name,
  difficulty: w.difficulty,
  trackingType: w.trackingType
}));

export async function seedWorkoutRoutine(forceReset = true): Promise<void> {
  if (forceReset) {
    await db.exercises.clear();
  }

  const existingCount = await db.exercises.count();
  if (existingCount > 0 && !forceReset) return;

  const createdAt = new Date().toISOString();
  const exercisesToSeed: Exercise[] = WORKOUT_EXERCISES.map(w => ({
    id: crypto.randomUUID(),
    name: w.name,
    createdAt,
    archived: false,
    difficulty: w.difficulty,
    trackingType: w.trackingType,
    category: w.category,
    targetSets: w.targetSets,
    targetReps: w.targetReps,
    targetRepsNumeric: w.targetRepsNumeric,
    restTime: w.restTime,
    execution: w.execution,
    order: w.order
  }));

  await db.exercises.bulkAdd(exercisesToSeed);
}

export async function syncExercisesScores(): Promise<void> {
  await seedWorkoutRoutine(false);
}
