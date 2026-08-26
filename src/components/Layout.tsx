import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Layout() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      switch (e.key) {
        case 'Escape': navigate('/'); break;
        case '1': navigate('/highlight'); break;
        case '2': navigate('/habits'); break;
        case '3': navigate('/goals'); break;
        case '4': navigate('/logs'); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="min-h-screen w-full bg-bg-base text-text-main font-sans selection:bg-accent-yellow-bg selection:text-text-main flex flex-col">
      
      {/* Floating Pill Navigation */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="glass-panel px-6 h-14 rounded-full flex items-center justify-between gap-8 shadow-sm">
          <Link to="/" className="text-lg font-serif italic font-semibold text-text-main hover:opacity-80 transition-opacity">
            Progress<span className="text-accent-red">.</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-muted">
            <Link to="/highlight" className="hover:text-text-main transition-colors">Highlight</Link>
            <Link to="/habits" className="hover:text-text-main transition-colors">Habits</Link>
            <Link to="/goals" className="hover:text-text-main transition-colors">Goals</Link>
            <Link to="/logs" className="hover:text-text-main transition-colors">Logs</Link>
          </nav>

          <button 
            onClick={toggleTheme}
            className="p-2 text-text-muted hover:text-text-main transition-transform duration-300 hover:scale-110 focus:outline-none"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-32 pb-20 w-full animate-fade-in flex-1">
        <Outlet />
      </main>
    </div>
  );
}
