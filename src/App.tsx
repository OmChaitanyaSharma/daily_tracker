import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Highlight } from './pages/Highlight';
import { Habits } from './pages/Habits';
import { ProductivityHabits } from './pages/ProductivityHabits';
import { ExerciseTracking } from './pages/ExerciseTracking';
import { Goals } from './pages/Goals';
import { EndOfYearGoals } from './pages/EndOfYearGoals';
import { HealthGoals } from './pages/HealthGoals';
import { LifetimeGoals } from './pages/LifetimeGoals';
import { PomodoroTimer } from './pages/PomodoroTimer';
import { Logs } from './pages/Logs';
import { Settings } from './pages/Settings';
import { db } from './db';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function init() {
      // Ensure hour categories exist for the graph
      const existingCategories = await db.hourCategories.toArray();
      if (existingCategories.length === 0) {
        await db.hourCategories.bulkAdd([
          { id: crypto.randomUUID(), name: 'Web Dev', color: 'var(--accent-blue)', createdAt: new Date().toISOString() },
          { id: crypto.randomUUID(), name: 'DSA', color: 'var(--accent-purple)', createdAt: new Date().toISOString() },
          { id: crypto.randomUUID(), name: 'Study', color: 'var(--accent-red)', createdAt: new Date().toISOString() }
        ]);
      }

      // Harmonize all current goals start date to 2026-11-25 without altering any other user data
      const GOAL_DATE_MIGRATION_KEY = 'dt_goal_start_date_migration_2026_11_25_v1';
      if (!localStorage.getItem(GOAL_DATE_MIGRATION_KEY)) {
        const goalsToUpdate = await db.goals.toArray();
        if (goalsToUpdate.length > 0) {
          for (const goal of goalsToUpdate) {
            const oldStartDate = goal.startDate;
            await db.goals.update(goal.id, { startDate: '2026-11-25' });
            // Re-align initial baseline measurement recorded on old start date to 2026-11-25
            if (oldStartDate && oldStartDate !== '2026-11-25') {
              const baselineMeasurements = await db.goalMeasurements
                .where('goalId')
                .equals(goal.id)
                .filter(m => m.date === oldStartDate)
                .toArray();
              for (const m of baselineMeasurements) {
                await db.goalMeasurements.update(m.id, { date: '2026-11-25' });
              }
            }
          }
        }
        localStorage.setItem(GOAL_DATE_MIGRATION_KEY, 'true');
      }

      setIsInitializing(false);
    }
    init().catch(console.error);
  }, []);

  if (isInitializing) {
    return <div className="min-h-screen bg-bg-base flex items-center justify-center text-text-muted">Initializing application...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="highlight" element={<Highlight />} />
          <Route path="habits" element={<Habits />} />
          <Route path="habits/productivity" element={<ProductivityHabits />} />
          <Route path="habits/health" element={<ExerciseTracking />} />
          <Route path="goals" element={<Goals />} />
          <Route path="goals/end-of-year" element={<EndOfYearGoals />} />
          <Route path="goals/health" element={<HealthGoals />} />
          <Route path="goals/lifetime" element={<LifetimeGoals />} />
          <Route path="pomodoro" element={<PomodoroTimer />} />
          <Route path="logs" element={<Logs />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


