import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';

import { handleDirectionalNavigation } from '../utils/spatialNavigation';
import { Snowfall } from './Snowfall';

export function Layout() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      
      const activeElement = document.activeElement as HTMLElement | null;
      const activeTag = activeElement?.tagName || '';
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag);
      const isEditMode = activeElement?.dataset.editMode === "true";

      if (isInput && isEditMode) {
        if (e.key === 'Enter') {
          e.preventDefault();
          activeElement.removeAttribute('data-edit-mode');
          return;
        }
        
        const keyLower = e.key.toLowerCase();
        if (keyLower === 'w' || keyLower === 's') {
          if (activeTag === 'INPUT' && (activeElement as HTMLInputElement).type === 'number') {
            e.preventDefault();
            const input = activeElement as HTMLInputElement;
            const step = parseFloat(input.step) || 1;
            const current = parseFloat(input.value) || 0;
            if (keyLower === 'w') {
              input.value = String(current + step);
            } else {
              input.value = String(Math.max(0, current - step));
            }
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return;
          } else if (activeTag === 'SELECT') {
            e.preventDefault();
            const select = activeElement as HTMLSelectElement;
            if (keyLower === 'w' && select.selectedIndex > 0) {
              select.selectedIndex--;
            } else if (keyLower === 's' && select.selectedIndex < select.options.length - 1) {
              select.selectedIndex++;
            }
            select.dispatchEvent(new Event('change', { bubbles: true }));
            return;
          }
        }
        if (e.key !== 'Escape') return;
      }

      switch (e.key) {
        case 'w':
        case 'a':
        case 's':
        case 'd':
        case 'W':
        case 'A':
        case 'S':
        case 'D':
          handleDirectionalNavigation(e);
          break;
        case 'Enter':
          if (activeElement) {
            if (isInput) {
              e.preventDefault();
              activeElement.dataset.editMode = "true";
            } else if (!['BUTTON', 'A'].includes(activeTag)) {
              activeElement.click();
            }
          }
          break;
        case 'Escape': 
          e.preventDefault();
          navigate('/'); 
          break;
        case 'Backspace':
          e.preventDefault();
          navigate(-1);
          break;
        case '1': 
          e.preventDefault();
          navigate('/highlight'); 
          break;
        case '2': 
          e.preventDefault();
          navigate('/habits'); 
          break;
        case '3': 
          e.preventDefault();
          navigate('/goals'); 
          break;
        case '4': 
          e.preventDefault();
          navigate('/logs'); 
          break;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        target.dataset.editMode = "true";
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false); // scrolling down
      } else {
        setIsVisible(true); // scrolling up
      }
      setLastScrollY(currentScrollY);
    };

    let frameId: number;
    const throttledScroll = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      frameId = window.requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [lastScrollY]);

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
    <div className="min-h-screen w-full bg-bg-base text-text-main font-sans selection:bg-accent-yellow-bg selection:text-text-main flex flex-col relative z-0">
      <Snowfall />
      
      {/* Floating Pill Navigation */}
      <header 
        className={clsx(
          "fixed top-6 left-1/2 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isVisible 
            ? "-translate-x-1/2 translate-y-0 opacity-100" 
            : "-translate-x-1/2 -translate-y-24 opacity-0 pointer-events-none"
        )}
      >
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
