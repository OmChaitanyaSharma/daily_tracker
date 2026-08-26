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

### Level Formula & Titles
The application uses differing polynomial curves to ensure appropriate scaling for both mental and physical effort.

**Developer Level Curve (`^1.75` exponent)**
`Level = floor( (TotalXP / 100) ^ (1 / 1.75) ) + 1`
Because hours take longer to accumulate than reps, the developer scaling was softened to `^1.75` to provide a steadier sense of progression.

**Fitness Level Curve (`^2.0` exponent)**
`Level = floor( sqrt(TotalXP / 100) ) + 1`
Requires exponentially more effort to level up to reflect physiological adaptation.

**RPG Titles**
Based on the computed level (1 to 100+), users earn dynamic titles ranging from *Logic Initiate* and *Iron Novice* at lower ranks, up to *Digital God* and *God of Iron* at Level 100+.

## 2. Streak Calculations & Freezes

### Streak Rules
- **Productivity Streak (Habits & Hours):** 
  - To maintain the streak, a user must achieve at least a **75% completion score** across all active habits (1.0 for completed, 0.5 for partial).
  - AND log **greater than 3.0 total hours** for the day.
- **Exercise Streak:** 
  - The strict tracking start date is enforced as August 27, 2026.
  - A user must log **at least 1 rep (or minute) for EVERY un-archived exercise** that existed in their list on that day.
  - Archiving an exercise removes it from the requirement without breaking historical streaks.

### Streak Freezes
To reward consistency while forgiving life's unpredictability, the app features a highly requested **Freeze Token** system.
- **Earning Freezes:** For every **7 consecutive days** of a perfect streak, the user earns 1 Freeze Token (capped at a maximum of 2).
- **Consumption:** The streak algorithm crawls chronologically from the user's first log. If a required condition fails on a past day, but the user owns a Freeze Token, the streak does *not* reset to 0. Instead, 1 token is consumed, the streak remains at its previous number (it does not increment on a frozen day), and the timeline continues.

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

## 7. Keyboard Navigation & Vim-Style Edit Mode
The application implements custom spatial navigation allowing full usage without a mouse.
- **Directional Navigation:** W, A, S, D move focus between tiles based on bounding box geometry.
- **Edit Mode:** To prevent accidental typing while navigating, standard W/A/S/D inputs do not type into focused fields. Pressing Enter on an input enters **Edit Mode** (highlighted by a red focus ring).
- **Custom Edit Commands:** In Edit Mode, pressing W or S on number inputs increments/decrements the value by its step attribute. On select dropdowns, it cycles through the available options.
- **Escape / Backspace:** Esc instantly returns to the home view, clearing all modals. Backspace performs a localized back action (closing the uppermost modal or navigating history.back()).
