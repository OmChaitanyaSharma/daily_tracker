import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, Volume2, VolumeX, User as UserIcon, LogOut, RefreshCw, ChevronDown, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';

import { handleDirectionalNavigation } from '../utils/spatialNavigation';
import { Snowfall } from './Snowfall';
import { useSound } from '../hooks/useSound';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import { handleUserLoginSync, uploadLocalToCloud, clearLocalDataOnSignOut } from '../services/cloudSync';

export function Layout() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isGuest, exitGuestMode, logout } = useAuth();
  const { soundEnabled, toggleSound } = useSound();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Sync with cloud on login
  useEffect(() => {
    if (user) {
      const syncKey = `synced_${user.uid}`;
      if (!sessionStorage.getItem(syncKey)) {
        setIsSyncing(true);
        handleUserLoginSync(user.uid)
          .then(() => {
            sessionStorage.setItem(syncKey, 'true');
          })
          .catch((err) => console.error('Auto-sync error:', err))
          .finally(() => setIsSyncing(false));
      }
    }
  }, [user]);

  const handleManualSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    setSyncStatusText('Syncing to Cloud...');
    try {
      await uploadLocalToCloud(user.uid);
      setSyncStatusText('Synced! 🟢');
      setTimeout(() => setSyncStatusText(''), 3000);
    } catch (err: any) {
      console.error('Manual sync error:', err);
      if (err?.code === 'permission-denied') {
        setSyncStatusText('Permission denied (Check rules) ⚠️');
      } else {
        setSyncStatusText('Sync failed ⚠️');
      }
      setTimeout(() => setSyncStatusText(''), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    const confirm = window.confirm('Sign out? Local data will be cleared from this device so the next user starts fresh. Your data remains safely backed up in your Google cloud account.');
    if (!confirm) return;
    try {
      await logout();
      await clearLocalDataOnSignOut();
      window.location.reload();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

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
      const activeTag = (activeElement?.tagName || '').toUpperCase();
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag) || activeElement?.isContentEditable;

      if (isInput) {
        if (e.key === 'Escape') {
          e.preventDefault();
          activeElement?.removeAttribute('data-edit-mode');
          activeElement?.blur();
          return;
        }
        if (e.key === 'Enter') {
          activeElement?.removeAttribute('data-edit-mode');
          return;
        }
        // Do not intercept any other key when inside an input/textarea/select
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'a':
        case 's':
        case 'd':
          handleDirectionalNavigation(e);
          break;
        case 'enter':
          if (activeElement) {
            e.preventDefault();
            activeElement.click();
          }
          break;
        case 'escape': 
          e.preventDefault();
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

    const handleInputFocus = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        target.dataset.editMode = "true";
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleInputFocus);
    window.addEventListener('focusin', handleInputFocus);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleInputFocus);
      window.removeEventListener('focusin', handleInputFocus);
    };
  }, [navigate]);

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
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-bg-base text-text-main font-sans selection:bg-accent-yellow-bg selection:text-text-main flex flex-col relative z-0">
      <Snowfall />
      
      {/* Floating Pill Navigation */}
      <header 
        className={clsx(
          "fixed top-3 sm:top-6 left-1/2 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-1.5rem)] w-auto",
          isVisible 
            ? "-translate-x-1/2 translate-y-0 opacity-100" 
            : "-translate-x-1/2 -translate-y-28 opacity-0 pointer-events-none"
        )}
      >
        <div className="glass-panel pl-4 pr-3 sm:px-6 h-14 rounded-full flex items-center justify-between gap-1.5 sm:gap-8 shadow-sm">
          <Link to="/" className="text-lg font-serif italic font-semibold text-text-main hover:opacity-80 transition-opacity shrink-0 min-h-[44px] inline-flex items-center px-1">
            Progress<span className="text-accent-red">.</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-muted">
            <Link to="/highlight" className={clsx("hover:text-text-main transition-colors", location.pathname === '/highlight' && "text-text-main font-semibold")}>Highlight</Link>
            <Link to="/habits" className={clsx("hover:text-text-main transition-colors", location.pathname.startsWith('/habits') && "text-text-main font-semibold")}>Habits</Link>
            <Link to="/goals" className={clsx("hover:text-text-main transition-colors", location.pathname.startsWith('/goals') && "text-text-main font-semibold")}>Goals</Link>
            <Link to="/logs" className={clsx("hover:text-text-main transition-colors", location.pathname === '/logs' && "text-text-main font-semibold")}>Logs</Link>
            <Link to="/settings" className={clsx("hover:text-text-main transition-colors", location.pathname === '/settings' && "text-text-main font-semibold")}>Settings</Link>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button 
              onClick={toggleSound}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main transition-transform duration-300 hover:scale-110 focus:outline-none cursor-pointer shrink-0 rounded-full hover:bg-bg-surface tap-press"
              aria-label={soundEnabled ? "Mute audio feedback" : "Enable audio feedback"}
              title={soundEnabled ? "Audio: Enabled (Click to mute)" : "Audio: Muted (Click to enable)"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="opacity-60 text-accent-red" />}
            </button>

            <button 
              onClick={toggleTheme}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main transition-transform duration-300 hover:scale-110 focus:outline-none cursor-pointer shrink-0 rounded-full hover:bg-bg-surface tap-press"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                  aria-label="User account menu"
                  className="min-h-[44px] flex items-center gap-1.5 sm:gap-2 pl-2 pr-3 py-1.5 rounded-full bg-bg-surface hover:bg-bg-surface/80 border border-border-strong text-xs font-medium text-text-main transition-colors cursor-pointer shrink-0 tap-press"
                >
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="Avatar" 
                      className="w-6 h-6 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-accent-blue/20 text-accent-blue flex items-center justify-center font-bold text-[10px]">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[100px] truncate hidden sm:inline">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown size={14} className="text-text-muted" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-bg-surface border border-border-strong rounded-2xl p-2 shadow-2xl z-50 animate-fade-in" role="menu">
                    <div className="px-3 py-2 border-b border-border-subtle mb-1">
                      <p className="text-xs font-semibold text-text-main truncate">
                        {user.displayName || 'Tracker User'}
                      </p>
                      <p className="text-[10px] text-text-muted truncate">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-accent-green font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse"></span>
                        Cloud Sync Active
                      </div>
                    </div>

                    <button
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      aria-label={syncStatusText || (isSyncing ? 'Syncing to Cloud' : 'Sync to Cloud')}
                      className="w-full min-h-[44px] flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs text-text-muted hover:text-text-main hover:bg-bg-base transition-colors text-left disabled:opacity-50 cursor-pointer tap-press"
                    >
                      <RefreshCw size={15} className={isSyncing ? "animate-spin text-accent-blue" : ""} />
                      <span>{syncStatusText || (isSyncing ? 'Syncing...' : 'Sync to Cloud')}</span>
                    </button>

                    <button
                      onClick={handleSignOut}
                      className="w-full min-h-[44px] flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs text-accent-red hover:bg-accent-red/10 transition-colors text-left cursor-pointer tap-press"
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : isGuest ? (
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                  aria-label="Guest account menu"
                  className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-yellow/15 border border-accent-yellow/30 text-xs font-medium text-accent-yellow transition-colors cursor-pointer shrink-0 hover:bg-accent-yellow/25 tap-press"
                  title="Guest Mode Active (Offline)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-yellow animate-pulse"></span>
                  <span className="hidden sm:inline">Guest (Offline)</span>
                  <span className="sm:hidden font-mono text-[11px] font-bold">Guest</span>
                  <ChevronDown size={13} className="text-accent-yellow/80" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-60 bg-bg-surface border border-border-strong rounded-2xl p-2.5 shadow-2xl z-50 animate-fade-in text-xs" role="menu">
                    <div className="px-3 py-2 border-b border-border-subtle mb-1.5">
                      <div className="flex items-center gap-1.5 font-semibold text-text-main">
                        <span className="w-2 h-2 rounded-full bg-accent-yellow"></span>
                        Guest Mode (Offline)
                      </div>
                      <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                        Your habits and logs are being saved directly in this browser's local database.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full min-h-[44px] flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs bg-text-main text-bg-base font-semibold hover:opacity-90 transition-opacity text-left cursor-pointer mb-1 tap-press"
                    >
                      <UserIcon size={15} />
                      <span>Connect Cloud Account</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        exitGuestMode();
                      }}
                      className="w-full min-h-[44px] flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs text-text-muted hover:text-text-main hover:bg-bg-base transition-colors text-left cursor-pointer tap-press"
                    >
                      <LogOut size={15} />
                      <span>Switch to Sign In</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-text-main text-bg-base text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shrink-0 tap-press"
              >
                <UserIcon size={15} />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
            className="md:hidden mt-2 glass-panel rounded-3xl p-2 shadow-2xl border border-border-strong flex flex-col gap-1 animate-fade-in w-full min-w-[280px]"
          >
            <Link 
              to="/highlight" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={clsx(
                "min-h-[44px] px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors flex items-center justify-between tap-press",
                location.pathname === '/highlight' ? "bg-bg-surface text-text-main font-semibold" : "text-text-muted hover:text-text-main hover:bg-bg-surface/50"
              )}
            >
              <span>Highlight</span>
              <span className="text-[10px] text-text-muted font-mono bg-bg-base/60 px-2 py-0.5 rounded-md border border-border-subtle">1</span>
            </Link>
            <Link 
              to="/habits" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={clsx(
                "min-h-[44px] px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors flex items-center justify-between tap-press",
                location.pathname.startsWith('/habits') ? "bg-bg-surface text-text-main font-semibold" : "text-text-muted hover:text-text-main hover:bg-bg-surface/50"
              )}
            >
              <span>Habits</span>
              <span className="text-[10px] text-text-muted font-mono bg-bg-base/60 px-2 py-0.5 rounded-md border border-border-subtle">2</span>
            </Link>
            <Link 
              to="/goals" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={clsx(
                "min-h-[44px] px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors flex items-center justify-between tap-press",
                location.pathname.startsWith('/goals') ? "bg-bg-surface text-text-main font-semibold" : "text-text-muted hover:text-text-main hover:bg-bg-surface/50"
              )}
            >
              <span>Goals</span>
              <span className="text-[10px] text-text-muted font-mono bg-bg-base/60 px-2 py-0.5 rounded-md border border-border-subtle">3</span>
            </Link>
            <Link 
              to="/logs" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={clsx(
                "min-h-[44px] px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors flex items-center justify-between tap-press",
                location.pathname === '/logs' ? "bg-bg-surface text-text-main font-semibold" : "text-text-muted hover:text-text-main hover:bg-bg-surface/50"
              )}
            >
              <span>Logs</span>
              <span className="text-[10px] text-text-muted font-mono bg-bg-base/60 px-2 py-0.5 rounded-md border border-border-subtle">4</span>
            </Link>
            <Link 
              to="/settings" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={clsx(
                "min-h-[44px] px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors flex items-center justify-between tap-press",
                location.pathname === '/settings' ? "bg-bg-surface text-text-main font-semibold" : "text-text-muted hover:text-text-main hover:bg-bg-surface/50"
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

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
