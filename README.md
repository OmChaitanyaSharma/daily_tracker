# Daily Tracker

A client-side journal and personal tracker for highlights, habits, goals, workout sets, and study hours.

## Core Features

### Highlight of the Day & Journal
- **Daily Reflection:** Track mood, sleep duration, a one-line summary, and key highlights.
- **Weekly Digest:** Aggregates daily entries into a masonry view by week for retrospective review.

### Habit & Exercise Tracking
- **Productivity Habits:** Monthly habit matrix with bottom-to-top layout. Supports Not Done, Partial, and Completed states.
- **Exercise Tracking:** Set and rep counter with incremental buttons (+1, +5, +10) for active exercises.
- **Difficulty & Cardio:** Assign difficulty tiers (Very Easy to Very Hard) to scale XP. Switch any exercise between Reps and Cardio (logged in minutes).
- **Personal Records (PR):** Real-time PR detection with badge alerts and sound cues when passing previous personal bests.
- **Streak Discipline & Freezes:** Requires meeting the configured habit completion percentage (default 75%), minimum focus hours, and exercise targets. Perfect 7-day streaks earn freeze tokens to safeguard streaks against missed days.

### Progression & Analytics
- **Leveling Curves & Titles:** Converts focused hours and workout volume into Developer and Fitness levels with polynomial scaling.
- **Milestone Alerts:** Leveling up triggers visual milestones with rank badges and sound effects.
- **Activity Heatmap:** 365-day activity matrix showing density based on combined habits and workout volume.
- **Web Audio Feedback:** Synthesized audio cues for button clicks, completions, and PR alerts.

### Long-Term Goals
- **Bi-Weekly Check-ins:** Structured check-in cadence for periodic progress reviews.
- **Milestone Tracking:** Tracks Starting, Current, and Target values with chronological logging.
- **Health & Target Metrics:** Supports numeric metrics, percentages, body measurements, and qualitative milestones. Reorder priorities via drag-and-drop.

### UI & Navigation
- **Editorial Theme:** Minimalist light aesthetic with high-contrast text and clear accent states.
- **Local-First Storage:** Dexie.js (IndexedDB) keeps all personal records offline on device.
- **Data Export:** Export and import full database backups as JSON.
- **Keyboard Navigation:**
  - `W`, `A`, `S`, `D` for spatial navigation between cards and inputs.
  - `Enter` to enter Edit Mode. In Edit Mode, `W`/`S` adjust values or cycle options. `Enter` exits Edit Mode.
  - `Backspace` closes open dialogs or returns to the previous view.
  - `Escape` cancels edit states or dismisses modals.
  - `1-4` jumps directly to core sections.

## Tech Stack

- **Framework:** React 19 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Dexie.js (IndexedDB)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Date Utilities:** date-fns

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Open local application**
   Navigate to `http://localhost:5173`.

## Data Privacy

All records are stored locally in IndexedDB. No personal logs leave the browser unless explicitly synced or exported.
