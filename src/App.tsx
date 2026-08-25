import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { db } from './db';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Highlight } from './pages/Highlight';
import { Habits } from './pages/Habits';
import { Goals } from './pages/Goals';
import { EndOfYearGoals } from './pages/EndOfYearGoals';
import { HealthGoals } from './pages/HealthGoals';
import { Logs } from './pages/Logs';
import { seedInitialDataIfEmpty } from './seedData';

export default function App() {
  useEffect(() => {
    async function init() {
      if (!localStorage.getItem('v3_seeded_fixed')) {
        console.log('Wiping DB and applying fresh seed...');
        db.close();
        await db.delete();
        await db.open();
        await seedInitialDataIfEmpty();
        localStorage.setItem('v3_seeded_fixed', 'true');
        window.location.reload();
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
          <Route path="goals" element={<Goals />} />
          <Route path="goals/end-of-year" element={<EndOfYearGoals />} />
          <Route path="goals/health" element={<HealthGoals />} />
          <Route path="logs" element={<Logs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


