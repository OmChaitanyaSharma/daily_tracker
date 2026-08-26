# Daily Tracker

A digital diary and personal progress tracker designed to log daily highlights, habits, goals, exercise reps, and study hours entirely on the client side.

## Core Features

### Highlight of the Day & Journal
- **Daily Reflection:** Track mood, sleep quality and duration, a one-line summary, and main highlights.
- **Weekly Digest:** Automatically aggregates daily highlights and reflections into a week-by-week masonry layout for easy review.

### Habit & Exercise Tracking
- **Productivity Habits:** A monthly drag-and-drop habit grid with a bottom-to-top layout. Cycle between Not Done, Partially Done, and Fully Done states.
- **Exercise Tracking:** A rep-counting system allowing incremental addition (+1, +5, +10) to active exercises.
- **Difficulty & Cardio Tracking:** Set custom difficulties (Very Easy to Very Hard) that dynamically scale your XP rewards. Switch an exercise from 'Reps' to 'Cardio' to track and earn points by the minute.
- **Personal Records (PR):** Real-time PR detection that triggers a badge and audio feedback when a daily maximum is surpassed.
- **Strict Streaks & Freezes:** Enforces discipline by requiring at least a 75% habit completion score and 3+ hours logged for productivity, and at least 1 rep/minute for every active exercise. Earn up to 2 "Freeze Tokens" for every 7 days of perfection to automatically protect your streak if life gets in the way.

### Gamification & Analytics
- **RPG Leveling System & Titles:** Converts logged hours and exercise output into discrete Developer and Fitness levels with highly-tuned polynomial curves (Dev `^1.75`, Fit `^2.0`). Unlock dynamic RPG titles like *Code Apprentice*, *Iron Juggernaut*, and *Digital God* as you climb the ranks.
- **Level-Up Celebrations:** Hitting a new level milestone triggers a massive, classy on-screen celebration with bouncing rank icons and gold/blue confetti.
- **Activity Heatmap:** A 365-day GitHub-style matrix showing overall activity intensity based on combined habit and exercise volume.
- **Web Audio Feedback:** Native synthesized audio (via Web Audio API) providing satisfying "pop" clicks and "ding" success sounds on interactions.

### Long-Term Goals
- **15-Day Check-ins:** Generates a strict 15-day measurement schedule ending on December 31st.
- **Chronological Progress System:** Goals track Starting, Current, and Next Log milestones.
- **End of Year & Health Goals:** Track qualitative goals, numerical goals, percentages, and body metrics. Easily drag and drop to rearrange goal priority, and seamlessly toggle goals between categories in the settings panel.

### UI & Architecture
- **Warm Editorial Theme:** A minimal light theme featuring beige, ink colors, and distinct accents (Red, Blue, Purple) for maximum clarity and readability.
- **Local-First Data:** Uses Dexie.js (IndexedDB) for completely private, offline-first data persistence.
- **Export & Backup:** Export all historical data (day entries, habit logs, exercise logs, goal measurements) to JSON for backup and portability.
- **Keyboard Navigation:** Navigate core sections seamlessly using `1-4` numeric keys, and instantly back out of menus or return home with `Esc` or `Backspace`.

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

3. **Open your browser**
   Navigate to `http://localhost:5173`.

## Data Privacy

All data is stored locally in the browser using IndexedDB. No data leaves the client. Use the JSON export tool in the Logs tab to backup data before clearing browser cache.
