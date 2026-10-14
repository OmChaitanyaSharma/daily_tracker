import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { Layout } from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { runDatabaseMigrations } from './utils/migrations';

// Code-split route components to eliminate monolithic bundle
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Highlight = lazy(() => import('./pages/Highlight').then(m => ({ default: m.Highlight })));
const Habits = lazy(() => import('./pages/Habits').then(m => ({ default: m.Habits })));
const ProductivityHabits = lazy(() => import('./pages/ProductivityHabits').then(m => ({ default: m.ProductivityHabits })));
const ExerciseTracking = lazy(() => import('./pages/ExerciseTracking').then(m => ({ default: m.ExerciseTracking })));
const Goals = lazy(() => import('./pages/Goals').then(m => ({ default: m.Goals })));
const EndOfYearGoals = lazy(() => import('./pages/EndOfYearGoals').then(m => ({ default: m.EndOfYearGoals })));
const HealthGoals = lazy(() => import('./pages/HealthGoals').then(m => ({ default: m.HealthGoals })));
const Logs = lazy(() => import('./pages/Logs').then(m => ({ default: m.Logs })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-[40vh] text-text-muted">
      <div className="w-6 h-6 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin"></div>
    </div>
  );
}

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function init() {
      await runDatabaseMigrations();
      setIsInitializing(false);
    }
    init().catch(console.error);
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center text-text-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin"></div>
          <span className="text-xs font-mono">Initializing Daily Tracker OS...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Suspense fallback={<RouteFallback />}><Home /></Suspense>} />
            <Route path="highlight" element={<Suspense fallback={<RouteFallback />}><Highlight /></Suspense>} />
            <Route path="habits" element={<Suspense fallback={<RouteFallback />}><Habits /></Suspense>} />
            <Route path="habits/productivity" element={<Suspense fallback={<RouteFallback />}><ProductivityHabits /></Suspense>} />
            <Route path="habits/health" element={<Suspense fallback={<RouteFallback />}><ExerciseTracking /></Suspense>} />
            <Route path="goals" element={<Suspense fallback={<RouteFallback />}><Goals /></Suspense>} />
            <Route path="goals/end-of-year" element={<Suspense fallback={<RouteFallback />}><EndOfYearGoals /></Suspense>} />
            <Route path="goals/health" element={<Suspense fallback={<RouteFallback />}><HealthGoals /></Suspense>} />
            <Route path="logs" element={<Suspense fallback={<RouteFallback />}><Logs /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<RouteFallback />}><Settings /></Suspense>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
