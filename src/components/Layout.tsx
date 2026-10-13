import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, User as UserIcon, LogOut, RefreshCw, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';

import { handleDirectionalNavigation } from '../utils/spatialNavigation';
import { Snowfall } from './Snowfall';
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
  const { user, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            <Link to="/settings" className="hover:text-text-main transition-colors">Settings</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2 text-text-muted hover:text-text-main transition-transform duration-300 hover:scale-110 focus:outline-none"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-bg-surface hover:bg-bg-surface/80 border border-border-strong text-xs font-medium text-text-main transition-colors"
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
                  <div className="absolute right-0 mt-3 w-56 bg-bg-surface border border-border-strong rounded-2xl p-2 shadow-2xl z-50 animate-fade-in">
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
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-text-muted hover:text-text-main hover:bg-bg-base transition-colors text-left disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={isSyncing ? "animate-spin text-accent-blue" : ""} />
                      <span>{syncStatusText || (isSyncing ? 'Syncing...' : 'Sync to Cloud')}</span>
                    </button>

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-accent-red hover:bg-accent-red/10 transition-colors text-left"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-text-main text-bg-base text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <UserIcon size={14} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-32 pb-20 w-full animate-fade-in flex-1">
        <Outlet />
      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
