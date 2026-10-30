import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Palette, Check, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';

import { handleDirectionalNavigation } from '../utils/spatialNavigation';
import { Snowfall } from './Snowfall';
import { COLOR_THEMES, getSavedTheme, applyTheme } from '../utils/theme';

export function Layout() {
  const [currentTheme, setCurrentTheme] = useState(() => getSavedTheme());
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLElement>(null);
  const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setIsMobileMenuOpen(false);
    setShowThemeMenu(false);
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
      if (
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(e.target as Node) &&
        mobileMenuBtnRef.current &&
        !mobileMenuBtnRef.current.contains(e.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      switch (e.key.toLowerCase()) {
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
        case 'enter':
          if (activeElement) {
            if (isInput) {
              e.preventDefault();
              activeElement.dataset.editMode = "true";
            } else {
              e.preventDefault();
              activeElement.click();
            }
          }
          break;
        case 'escape': 
          e.preventDefault();
          if (showThemeMenu || isMobileMenuOpen) {
            setShowThemeMenu(false);
            setIsMobileMenuOpen(false);
            break;
          }
          navigate('/'); 
          break;
        case 'backspace':
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
  }, [navigate, showThemeMenu, isMobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false); // scrolling down
        setIsMobileMenuOpen(false);
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

  return (
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-bg-base text-text-main font-sans selection:bg-accent-yellow-bg selection:text-text-main flex flex-col relative z-0">
      <Snowfall />

      {/* Mobile Navigation Backdrop Scrim */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm md:hidden animate-fade-in transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Floating Pill Navigation */}
      <header 
        className={clsx(
          "fixed top-3 sm:top-6 left-1/2 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] max-w-[calc(100vw-1rem)] sm:max-w-max w-auto",
          isVisible 
            ? "-translate-x-1/2 translate-y-0 opacity-100" 
            : "-translate-x-1/2 -translate-y-28 opacity-0 pointer-events-none"
        )}
      >
        <div className="glass-panel pl-4 pr-3 sm:px-6 h-14 rounded-full flex items-center justify-between gap-2 sm:gap-8 shadow-sm">
          <Link 
            to="/" 
            className="text-lg font-serif italic font-semibold text-text-main hover:opacity-80 transition-opacity shrink-0 min-h-[44px] inline-flex items-center px-1"
          >
            Progress<span className="text-accent-red">.</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-muted">
            <Link to="/highlight" className={clsx("hover:text-text-main transition-colors", location.pathname === '/highlight' && "text-text-main font-semibold")}>Highlight</Link>
            <Link to="/habits" className={clsx("hover:text-text-main transition-colors", location.pathname.startsWith('/habits') && "text-text-main font-semibold")}>Habits</Link>
            <Link to="/pomodoro" className={clsx("hover:text-text-main transition-colors", location.pathname === '/pomodoro' && "text-text-main font-semibold")}>Pomodoro</Link>
            <Link to="/goals" className={clsx("hover:text-text-main transition-colors", location.pathname.startsWith('/goals') && "text-text-main font-semibold")}>Goals</Link>
            <Link to="/logs" className={clsx("hover:text-text-main transition-colors", location.pathname === '/logs' && "text-text-main font-semibold")}>Logs</Link>
            <Link to="/settings" className={clsx("hover:text-text-main transition-colors", location.pathname === '/settings' && "text-text-main font-semibold")}>Settings</Link>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Monkeytype Dark Theme Switcher */}
            <div className="relative shrink-0" ref={themeMenuRef}>
              <button 
                onClick={() => {
                  setShowThemeMenu(!showThemeMenu);
                  setIsMobileMenuOpen(false);
                }}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main transition-transform duration-300 hover:scale-110 focus:outline-none cursor-pointer shrink-0 rounded-full hover:bg-bg-surface tap-press"
                aria-label="Select color theme"
                title="Change theme"
                aria-expanded={showThemeMenu}
              >
                <Palette size={18} />
              </button>

              {showThemeMenu && (
                <div className="absolute right-0 top-14 w-64 max-w-[calc(100vw-2rem)] bg-bg-surface border border-border-strong rounded-2xl p-3 shadow-2xl z-50 animate-scale-in">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle px-1">
                    <span className="text-xs font-serif font-semibold text-text-main">Monkeytype Themes</span>
                    <span className="text-[10px] font-mono text-text-muted uppercase">Dark</span>
                  </div>

                  <div className="space-y-1 max-h-60 overflow-y-auto pr-1 overscroll-contain">
                    {COLOR_THEMES.map(theme => {
                      const isActive = currentTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => {
                            setCurrentTheme(theme.id);
                            applyTheme(theme.id);
                            setShowThemeMenu(false);
                          }}
                          className={clsx(
                            "w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                            isActive 
                              ? "bg-bg-base border border-border-strong text-text-main font-semibold shadow-sm" 
                              : "hover:bg-bg-surface-hover text-text-muted hover:text-text-main border border-transparent"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="w-4 h-4 rounded-full border border-white/20 shrink-0 flex items-center justify-center overflow-hidden" 
                              style={{ backgroundColor: theme.preview.bg }}
                            >
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.preview.accent }} />
                            </div>
                            <div>
                              <div className="leading-none text-text-main">{theme.name}</div>
                              <div className="text-[10px] text-text-muted leading-tight mt-0.5">{theme.category}</div>
                            </div>
                          </div>

                          {isActive && <Check size={14} className="text-accent-blue" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              ref={mobileMenuBtnRef}
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setShowThemeMenu(false);
              }}
              className="md:hidden w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main transition-colors focus:outline-none cursor-pointer rounded-full hover:bg-bg-surface shrink-0 tap-press"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Card */}
        {isMobileMenuOpen && (
          <nav 
            ref={mobileMenuRef}
            className="md:hidden mt-2 bg-bg-surface border border-border-strong rounded-3xl p-3 shadow-2xl flex flex-col gap-1.5 animate-scale-in w-full min-w-[280px] max-w-[calc(100vw-1.5rem)] relative z-50"
          >
            <div className="px-3 py-1.5 border-b border-border-subtle flex items-center justify-between mb-0.5">
              <span className="text-xs font-serif font-semibold text-text-main">Navigation</span>
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Menu</span>
            </div>

            <Link 
              to="/highlight" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={clsx(
                "min-h-[44px] px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors flex items-center justify-between tap-press",
                location.pathname === '/highlight' ? "bg-bg-base border border-border-strong text-text-main font-semibold shadow-sm" : "text-text-muted hover:text-text-main hover:bg-bg-base/60"
              )}
            >
              <span>Highlight</span>
              <span className="text-[10px] text-text-muted font-mono bg-bg-base px-2 py-0.5 rounded-md border border-border-subtle">1</span>
            </Link>
            <Link 
              to="/habits" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={clsx(
                "min-h-[44px] px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors flex items-center justify-between tap-press",
                location.pathname.startsWith('/habits') ? "bg-bg-base border border-border-strong text-text-main font-semibold shadow-sm" : "text-text-muted hover:text-text-main hover:bg-bg-base/60"
              )}
            >
              <span>Habits</span>
              <span className="text-[10px] text-text-muted font-mono bg-bg-base px-2 py-0.5 rounded-md border border-border-subtle">2</span>
            </Link>
            <Link 
              to="/pomodoro" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={clsx(
                "min-h-[44px] px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors flex items-center justify-between tap-press",
                location.pathname === '/pomodoro' ? "bg-bg-base border border-border-strong text-text-main font-semibold shadow-sm" : "text-text-muted hover:text-text-main hover:bg-bg-base/60"
              )}
            >
              <span>Pomodoro</span>
              <span className="text-[10px] text-accent-yellow font-mono bg-accent-yellow-bg px-2 py-0.5 rounded-md border border-accent-yellow/30 font-semibold">Focus</span>
            </Link>
            <Link 
              to="/goals" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={clsx(
                "min-h-[44px] px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors flex items-center justify-between tap-press",
                location.pathname.startsWith('/goals') ? "bg-bg-base border border-border-strong text-text-main font-semibold shadow-sm" : "text-text-muted hover:text-text-main hover:bg-bg-base/60"
              )}
            >
              <span>Goals</span>
              <span className="text-[10px] text-text-muted font-mono bg-bg-base px-2 py-0.5 rounded-md border border-border-subtle">3</span>
            </Link>
            <Link 
              to="/logs" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={clsx(
                "min-h-[44px] px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors flex items-center justify-between tap-press",
                location.pathname === '/logs' ? "bg-bg-base border border-border-strong text-text-main font-semibold shadow-sm" : "text-text-muted hover:text-text-main hover:bg-bg-base/60"
              )}
            >
              <span>Logs</span>
              <span className="text-[10px] text-text-muted font-mono bg-bg-base px-2 py-0.5 rounded-md border border-border-subtle">4</span>
            </Link>
            <Link 
              to="/settings" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={clsx(
                "min-h-[44px] px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors flex items-center justify-between tap-press",
                location.pathname === '/settings' ? "bg-bg-base border border-border-strong text-text-main font-semibold shadow-sm" : "text-text-muted hover:text-text-main hover:bg-bg-base/60"
              )}
            >
              <span>Settings</span>
            </Link>
          </nav>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-3.5 sm:px-6 pt-24 sm:pt-32 pb-20 w-full animate-fade-in flex-1 relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
