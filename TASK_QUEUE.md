# Autonomous Development Backlog

## 1. Code Cleanliness & Hygiene
- [x] Remove orphaned scripts and patch files (`fix_*.py`, `patch_*.py`).
- [x] Audit for unused imports, dead styles, and redundant state variables across `src/`.
- [ ] Refactor business logic to ensure pure utility functions.

## 2. Performance & Reliability
- [x] Optimize Dexie.js indexes and LiveQuery subscriptions (Fixed infinite re-renders via array memoization).
- [x] Inspect keyboard navigation (`Layout.tsx`, `Home.tsx`) for event listener memory leaks (proper cleanup in `useEffect`).
- [x] Verify Web Audio API cleanup and confetti memory management (Implemented AudioContext singleton and cleared Confetti requestAnimationFrame leak).

## 3. Feature Refinements & Edge Cases
- [x] Review date calculations (leap years, month-end boundaries).
- [x] Review PR detection algorithm and streak logic for edge cases.

## 4. Automated Test Coverage
- [x] Ensure 100% build pass (`npm run build`).

## Completed Tasks
- **[2026-09-16 10:03]** Hardened codebase: Fixed AudioContext max limit leak in `useSound.ts`. Fixed Confetti `requestAnimationFrame` loop in `LevelUpCelebration.tsx`. Fixed array re-allocation inside `useLiveQuery` in `Home.tsx`. Added missing dependencies in `Home.tsx` key handler to prevent stale closures.
