import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { db } from './db';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Highlight } from './pages/Highlight';
import { Habits } from './pages/Habits';
import { ProductivityHabits } from './pages/ProductivityHabits';
import { ExerciseTracking } from './pages/ExerciseTracking';
import { Goals } from './pages/Goals';
import { EndOfYearGoals } from './pages/EndOfYearGoals';
import { HealthGoals } from './pages/HealthGoals';
import { Logs } from './pages/Logs';
import { seedInitialDataIfEmpty } from './seedData';
import { getTodayStr } from './utils/dateUtils';

export default function App() {
  useEffect(() => {
    async function init() {
      // Force Deduplication and StartDate correction immediately on load
      const allHabits = await db.habits.toArray();
      const seenHabits = new Set<string>();
      
      // Sort so active ones are processed first and kept, while archived duplicates are deleted
      allHabits.sort((a, b) => (a.archived === b.archived ? 0 : a.archived ? 1 : -1));
      
      for (const h of allHabits) {
        const normalizedName = h.name.toLowerCase().trim();
        if (seenHabits.has(normalizedName)) {
          await db.habits.delete(h.id);
        } else {
          seenHabits.add(normalizedName);
          // Force unarchive to fix state, and set startDate to today
          await db.habits.update(h.id, { 
            startDate: getTodayStr(),
            archived: false
          });
        }
      }

      if (!localStorage.getItem('full_wipe_levels')) {
        console.log('Wiping DB and applying fresh seed...');
        db.close();
        await db.delete();
        await db.open();
        await seedInitialDataIfEmpty();
        localStorage.setItem('full_wipe_levels', 'true');
        window.location.reload();
      } else {
        // Enforce the specific categories for the user
        const cats = await db.hourCategories.toArray();
        for (const c of cats) {
          if (c.name === 'WebDev' || c.name === 'Web Dev') {
            await db.hourCategories.update(c.id, { name: 'Web Dev', color: 'var(--accent-blue)' });
          }
          if (c.name === 'DSA') {
            await db.hourCategories.update(c.id, { color: 'var(--accent-purple)' });
          }
          if (c.name === 'Study') {
            await db.hourCategories.update(c.id, { color: 'var(--accent-red)' });
          }
        }
      }
    }
    init().catch(console.error);
  }, []);

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
          <Route path="logs" element={<Logs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


