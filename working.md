# Daily Tracker: Core Mechanics & Scoring Systems

This document explains the mathematical formulas, algorithms, and logic used behind the scenes in the Daily Tracker application to calculate streaks, XP, Levels, and Personal Records.

## 1. RPG Leveling System & XP

The application converts daily productivity and exercise tracking into a quantifiable progression system using RPG mechanics.

### Experience Points (XP) Calculation
- **Developer XP:** Calculated from the total number of hours logged in `db.hourLogs` (which includes WebDev, Study, and DSA categories).
  - `1 Hour = 100 XP`
- **Fitness XP:** Calculated from the total number of reps and minutes logged in `db.exerciseLogs`. The XP granted per rep scales dynamically based on the exercise's set difficulty and tracking type.
  - **Rep-based Exercises:**
    - Very Easy = `2 XP / rep`
    - Easy = `5 XP / rep`
    - Medium = `10 XP / rep`
    - Hard = `15 XP / rep`
    - Very Hard = `20 XP / rep`
  - **Time-based Exercises (Cardio):**
    - `1 Minute = 10 XP`

### Level Formula
A standard RPG polynomial curve is used to ensure early levels are achieved quickly to build momentum, while higher levels require significantly more effort (a "grind").

`Level = floor(sqrt(TotalXP / 100)) + 1`

**Examples (Developer XP):**
- 0 hours = 0 XP = Level 1
- 1 hour = 100 XP = Level 2
- 4 hours = 400 XP = Level 3
- 9 hours = 900 XP = Level 4
- 25 hours = 2,500 XP = Level 6
- 100 hours = 10,000 XP = Level 11

Progress towards the next level is calculated as a percentage between the base XP of the current level and the base XP of the next level.

## 2. Streak Calculations

### Productivity Streak (Habits)
The productivity streak is binary.
- A day is considered "active" if at least one habit was marked as either `partial` or `completed`.
- The streak function starts from "today" and walks backward day by day.
- If it encounters a day with 0 habits checked, the streak breaks.
- If today has no habits checked yet, it does *not* break the streak, but checking yesterday will.

### Exercise Streak (Strict Logic)
The exercise streak utilizes strict validation logic to ensure discipline.
- The strict tracking start date is enforced as **August 27, 2026**. Days prior to this date are ignored.
- For a day to be considered "successful", the user must have logged **at least 1 rep for EVERY un-archived exercise** that existed in their list on that day.
- If the user had 3 exercises active on Tuesday, and they only logged reps for 2 of them, the streak breaks. 
- Exception: Archiving an exercise removes it from the daily requirement without breaking historical streaks.

## 3. Personal Records (PRs) & Hall of Fame

PRs are dynamically calculated on the client side using IndexedDB (Dexie).
- The system queries all historical `exerciseLogs`.
- It groups the logs by `exerciseId` and finds the `MAX(reps)` for a single day.
- **Real-time Evaluation:** Today's reps are excluded from the baseline PR calculation. When the user increments their reps today, the system continuously compares the new total against the historical baseline.
- If `Today's Reps > Historical PR`, a Web Audio API success sound is triggered, and a pulsing "🔥 New PR" badge is rendered in the UI.

## 4. GitHub-Style Heatmap Scoring

The Activity Heatmap matrix computes a 365-day array and assigns an "intensity" score from `0` to `4` for each day to determine the CSS color opacity.

The raw activity count for a day is computed as:
- `Habit Partial = +1`
- `Habit Completed = +2`
- `Exercise Reps = +[Total Reps]`

**Intensity Thresholds:**
- **Intensity 0:** 0 habits, 0 reps (Transparent)
- **Intensity 1:** >0 habits OR >0 reps (30% Opacity)
- **Intensity 2:** >2 habits OR >10 reps (60% Opacity)
- **Intensity 3:** >4 habits OR >30 reps (80% Opacity)
- **Intensity 4:** >6 habits OR >50 reps (100% Opacity)

## 5. Subjective & Objective Scoring

In the Daily Highlight / Log view, users are evaluated on two metrics:
1. **Subjective Score (1-10):** A self-reported metric evaluating how the user *felt* about their day.
2. **Objective Score (1-10):** Currently a manual self-evaluation, but designed to eventually be an aggregate calculation of: `(Hours Logged / Goal Hours) + (Habits Completed / Total Habits) + (Reps / Baseline Reps)`.

## 6. Storage & Offline Capabilities

All data is stored purely client-side using **IndexedDB via Dexie.js**. 
Because everything is local:
- Read/write operations take ~1-5ms.
- PRs and Level progression calculations are done iteratively in memory on mount.
- Data privacy is absolute; the JSON export feature is the only bridge to external storage.
