import { Outlet, Link, useNavigate } from 'react-router-dom';

import { useState, useEffect } from 'react';
import clsx from 'clsx';

import { handleDirectionalNavigation } from '../utils/spatialNavigation';
import { Snowfall } from './Snowfall';
import { SakuraFall } from './SakuraFall';
import { AutumnLeaves } from './AutumnLeaves';

export function Layout() {
  const [arcTheme, setArcTheme] = useState(() => {
    const saved = localStorage.getItem('arcTheme');
    if (saved) return saved;
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  });
  
  const [isVisible, setIsVisible] = useState(true);
  const [zenMode, setZenMode] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.className = '';
    document.documentElement.classList.add(`theme-${arcTheme}`);
  }, [arcTheme]);

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
    const themes = ['winter', 'spring', 'summer', 'autumn'];
    const nextTheme = themes[(themes.indexOf(arcTheme) + 1) % themes.length];
    setArcTheme(nextTheme);
    localStorage.setItem('arcTheme', nextTheme);
  };

  return (
    <div className={clsx(
      "min-h-screen w-full text-text-main font-sans selection:bg-accent-yellow-bg selection:text-text-main flex flex-col relative z-0 transition-colors duration-1000",
      zenMode ? "bg-[#09090b]" : "bg-bg-base"
    )}>
      {!zenMode && arcTheme === 'winter' && <Snowfall />}
      {!zenMode && arcTheme === 'spring' && <SakuraFall />}
      {!zenMode && arcTheme === 'autumn' && <AutumnLeaves />}
      
      {/* Floating Bottom Dock */}
      <div 
        className={clsx(
          "fixed bottom-6 left-1/2 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isVisible 
            ? "-translate-x-1/2 translate-y-0 opacity-100" 
            : "-translate-x-1/2 translate-y-24 opacity-0 pointer-events-none"
        )}
      >
        <nav className="bg-bg-surface/80 backdrop-blur-xl border border-border-strong px-4 py-3 rounded-3xl flex items-center gap-2 shadow-2xl">
          <Link to="/" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">🏠</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">HOME</span>
          </Link>
          <div className="w-[1px] h-8 bg-border-strong mx-1" />
          <Link to="/highlight" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">📝</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">HIGHLIGHT</span>
          </Link>
          <Link to="/habits/productivity" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">⚔️</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">HABITS</span>
          </Link>
          <Link to="/goals" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">🎯</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">GOALS</span>
          </Link>
          <Link to="/logs" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">📊</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">LOGS</span>
          </Link>
          <div className="w-[1px] h-8 bg-border-strong mx-1" />
          <Link to="/calendar" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">📅</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">PLAN</span>
          </Link>
          <Link to="/habits/health" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">💪</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">FIT</span>
          </Link>
          <div className="w-[1px] h-8 bg-border-strong mx-1" />
          <button onClick={() => setZenMode(!zenMode)} className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">{zenMode ? '🧘‍♂️' : '👁️'}</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">ZEN</span>
          </button>
          <button onClick={toggleTheme} className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">
               {arcTheme === 'winter' ? '❄️' : arcTheme === 'spring' ? '🌸' : arcTheme === 'summer' ? '☀️' : '🍁'}
             </span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">THEME</span>
          </button>
        </nav>
      </div>

      <main className={clsx(
        "max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-32 w-full animate-fade-in flex-1",
        zenMode && "hidden"
      )}>
        <Outlet />
      </main>

      {zenMode && (
        <div className="fixed inset-0 z-40 bg-[#09090b] flex flex-col items-center justify-center animate-fade-in">
           <div className="text-[#a1a1aa] font-mono text-xs uppercase tracking-[0.5em] mb-12">Focus Mode Activated</div>
           <h1 className="text-5xl md:text-7xl font-serif text-[#ececf1] mb-16 tracking-tight text-center max-w-2xl leading-tight">
             Time to execute.<br />Do the next thing.
           </h1>
           <button 
             onClick={() => {
               const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
               window.dispatchEvent(e);
             }}
             className="px-10 py-5 rounded-full border border-[#27272a] hover:border-accent-blue bg-transparent text-[#ececf1] font-mono text-sm uppercase tracking-widest hover:bg-accent-blue/5 hover:text-accent-blue transition-all duration-500 shadow-[0_0_0_rgba(59,130,246,0)] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]"
           >
             Launch Command Palette
           </button>
        </div>
      )}
    </div>
  );
}
