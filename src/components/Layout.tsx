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
    <div className="min-h-screen w-full bg-bg-base text-text-main transition-colors duration-300 font-sans selection:bg-accent-red-bg selection:text-accent-red">
      
      {/* Minimal Top Navigation */}
      <header className="sticky top-0 z-50 bg-bg-base/80 backdrop-blur-md border-b border-border-subtle transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight text-text-main">
            Progress<span className="text-accent-red">.</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleTheme}
              className="p-2 text-text-muted hover:text-text-main transition-colors rounded-full hover:bg-bg-surface focus:outline-none"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <Outlet />
      </main>
    </div>
  );
}
