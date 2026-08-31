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
import { Logs } from './pages/Logs';
import { resetAndSeedDatabase } from './seedData';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function init() {
      // Check if we need to run the final September 2026 reset
      if (!localStorage.getItem('sept_2026_reset_final')) {
        await resetAndSeedDatabase();
        localStorage.setItem('sept_2026_reset_final', 'true');
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
          <Route path="logs" element={<Logs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


