# Daily Tracker

A beautifully crafted digital diary and personal progress tracker designed to feel like a premium physical notebook. It is built to help you track your daily highlights, habits, long-term goals, and study hours with elegance and simplicity.

## ✨ Features

### 📖 Highlight of the Day
- A focused daily journaling experience.
- Track your mood, write a one-line summary, and note your main highlight.
- Includes a smooth "Completed" read-only view and an easy edit flow.

### 📅 Habit & Progress Tracker
- **Physical Diary Grid:** A monthly habit grid that reads bottom-to-top, replicating the feel of a physical notebook.
- **Fast Interactions:** Click cells to cycle instantly between Not Done, Partially Done (◐), and Fully Done (●).
- **Time Tracking:** Integrated line graph tracking hours spent on WebDev, Study, and DSA. Add hours incrementally throughout the day!
- **Safe Management:** Edit or safely archive habits without ever losing historical data.

### 🎯 Long-Term Goals
- **15-Day Check-ins:** Automatically generates a strict 15-day measurement schedule ending exactly on December 31st.
- **Chronological Progress System:** Goals are tracked using a strict `Starting → Current → Next Log` pipeline:
  - **Starting:** The original baseline measurement.
  - **Current:** The most recent valid measurement on or after the starting date.
  - **Next Log:** Automatically calculates the next scheduled check-in *after* your current measurement.
- **End of Year Goals:** Track qualitative goals (e.g., "Better skin"), numerical goals (e.g., "Solve 100+ LeetCode questions"), and percentages.
- **Health Goals:** A dedicated dashboard for physical measurements with an automatic weight-change calculator.
- **Historical Integrity:** Every measurement is saved as an independent historical record, ensuring timelines can never be overwritten or accidentally reversed.

### ⏳ Global Date Editing & Strict Chronology
- **Editable Timelines:** Everything across the application can be retroactively edited. If you forgot to log a highlight or measurement yesterday, you can log it today and set the date back safely.
- **Conflict Resolution:** Safely move Daily Highlights to other dates with built-in clash detection (Replace vs. Cancel).
- **UUID Data Architecture:** Habit and Goal measurements use unique identifiers (UUIDs) completely decoupled from their date, ensuring you can freely move or modify past records without accidentally overwriting data from the same day.
- **Merged Goal Timelines:** The goals system smoothly combines your strictly scheduled 15-day check-ins with any ad-hoc custom measurements you enter, presenting them in a unified chronological history.

### 🎨 Premium UI & Finishing Touches
- **PWA Ready:** Install the app locally to your device for a native-like experience.
- **Journal Streak Counter:** A delightful streak counter to keep you motivated to write daily.
- **Export to CSV:** Safely export all your historical journal data to a `.csv` file anytime.
- **Keyboard Navigation:** Use `1-4` and `Esc` to instantly traverse the application without touching the mouse.
- **Micro-animations:** Satisfying button feedback and smooth transitions throughout.

### 📓 Logs & Archive
- A central calendar view to look back at any previous day.
- Instantly review your journal entry, completed habits, and exact hours tracked for that specific date.

## 🛠️ Tech Stack

- **Framework:** React 18 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Dexie.js (IndexedDB for offline-first, local data persistence)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Date Utilities:** date-fns

## 🚀 Getting Started

To run this project locally on your machine:

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to `http://localhost:5173` to view the application.

## 💾 Data Privacy

All data is stored completely locally in your browser using IndexedDB. No data is sent to external servers, ensuring your personal diary and habits remain 100% private.
