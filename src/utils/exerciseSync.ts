import { db, type ExerciseDifficulty, type TrackingType } from '../db';

export interface ExerciseConfig {
  name: string;
  difficulty: ExerciseDifficulty;
  trackingType: TrackingType;
  aliases?: string[];
}

export const EXERCISE_CONFIGS: ExerciseConfig[] = [
  // Current exercises with updated scores
  { name: 'Pullups', difficulty: 'hard', trackingType: 'reps' },
  { name: 'Squats', difficulty: 'easy', trackingType: 'reps' },
  { name: 'Dumbbell Squats', difficulty: 'medium', trackingType: 'reps' },
  { name: 'Hollow Body', difficulty: 'medium', trackingType: 'reps' },
  { name: 'Active Hang', difficulty: 'easy', trackingType: 'reps' },
  { name: 'Pushups', difficulty: 'medium', trackingType: 'reps' },
  { name: 'Dips', difficulty: 'medium', trackingType: 'reps' },
  { name: 'Parallel Bar Dips', difficulty: 'hard', trackingType: 'reps' },
  { name: 'Running / Skipping', difficulty: 'medium', trackingType: 'time', aliases: ['Running', 'Skipping'] },

  // Suggested exercises to add
  { name: 'Bulgarian Split Squats', difficulty: 'hard', trackingType: 'reps' },
  { name: 'Hanging Leg Raises', difficulty: 'hard', trackingType: 'reps' },
  { name: 'Dumbbell Romanian Deadlifts', difficulty: 'medium', trackingType: 'reps' },
  { name: 'Dumbbell Overhead Press', difficulty: 'medium', trackingType: 'reps' },
  { name: 'Dumbbell Bent-Over Rows', difficulty: 'medium', trackingType: 'reps' },
  { name: 'Walking Lunges', difficulty: 'medium', trackingType: 'reps' },
  { name: 'Dumbbell Bicep Curls', difficulty: 'easy', trackingType: 'reps' },
  { name: 'Dumbbell Lateral Raises', difficulty: 'easy', trackingType: 'reps' },
];

export const DIFFICULTY_POINTS: Record<ExerciseDifficulty, number> = {
  very_easy: 2,
  easy: 5,
  medium: 10,
  hard: 15,
  very_hard: 20
};

export async function syncExercisesScores(): Promise<void> {
  const existingExercises = await db.exercises.toArray();
  const createdAt = new Date().toISOString();

  for (const config of EXERCISE_CONFIGS) {
    const targetNames = [config.name.toLowerCase(), ...(config.aliases?.map(a => a.toLowerCase()) || [])];
    const match = existingExercises.find(ex => targetNames.includes(ex.name.toLowerCase().trim()));

    if (match) {
      // Update existing exercise difficulty and name if needed
      await db.exercises.update(match.id, {
        name: config.name,
        difficulty: config.difficulty,
        trackingType: config.trackingType
      });
    } else {
      // Add new exercise
      await db.exercises.add({
        id: crypto.randomUUID(),
        name: config.name,
        createdAt,
        archived: false,
        difficulty: config.difficulty,
        trackingType: config.trackingType
      });
    }
  }
}
