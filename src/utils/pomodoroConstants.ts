export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroDurations {
  focus: number;       // in minutes
  shortBreak: number;  // in minutes
  longBreak: number;   // in minutes
}

export const DEFAULT_DURATIONS: PomodoroDurations = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15
};
