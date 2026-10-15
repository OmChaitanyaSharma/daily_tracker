import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Palette, Check, Volume2, VolumeX, User as UserIcon, LogOut, RefreshCw, ChevronDown, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';

import { handleDirectionalNavigation } from '../utils/spatialNavigation';
import { Snowfall } from './Snowfall';
import { useSound } from '../hooks/useSound';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import { handleUserLoginSync, uploadLocalToCloud, clearLocalDataOnSignOut } from '../services/cloudSync';
import { usePageSEO } from '../hooks/usePageSEO';
import { COLOR_THEMES, getSavedTheme, applyTheme, previewTheme, cancelThemePreview } from '../utils/theme';

export function Layout() {
  usePageSEO();
  const [currentTheme, setCurrentTheme] = useState(() => getSavedTheme());
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  
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
  const [avatarError, setAvatarError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);

  const menusRef = useRef({ isMobileMenuOpen, isThemeMenuOpen, isUserMenuOpen });
  useEffect(() => {
    menusRef.current = { isMobileMenuOpen, isThemeMenuOpen, isUserMenuOpen };
  });

  useEffect(() => {
    const timer = setTimeout(() => setAvatarError(false), 0);
    return () => clearTimeout(timer);
  }, [user?.photoURL]);

  useEffect(() => {
    const timer = setTimeout(() => setIsMobileMenuOpen(false), 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Sync active theme when modified externally (e.g. in Settings)
  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const custom = e as CustomEvent<{ themeId: string }>;
      if (custom.detail?.themeId) {
        setCurrentTheme(custom.detail.themeId);
      }
    };
    window.addEventListener('app_theme_changed', handleThemeChange);
    return () => {
      window.removeEventListener('app_theme_changed', handleThemeChange);
      cancelThemePreview();
    };
  }, []);

  // Close dropdowns on outside click or touch
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(target)) {
        setIsThemeMenuOpen(false);
        cancelThemePreview();
      }
      if (
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(target) &&
        (!mobileMenuBtnRef.current || !mobileMenuBtnRef.current.contains(target))
      ) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Lock body scroll when mobile drawer is open to prevent background bleed scrolling
  useEffect(() => {
    if (isMobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileMenuOpen]);


  // Sync with cloud on login
  useEffect(() => {
    if (user) {
      const syncKey = `synced_${user.uid}`;
      if (!sessionStorage.getItem(syncKey)) {
        const timer = setTimeout(() => {
          setIsSyncing(true);
          handleUserLoginSync(user.uid)
            .then(() => {
              sessionStorage.setItem(syncKey, 'true');
            })
            .catch((err) => console.error('Auto-sync error:', err))
            .finally(() => setIsSyncing(false));
        }, 0);
        return () => clearTimeout(timer);
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
      if (user?.uid) {
        setIsSyncing(true);
        try {
          await uploadLocalToCloud(user.uid, true);
        } catch (syncErr) {
          console.warn('Pre-logout cloud sync warning:', syncErr);
        }
      }
      await logout();
      await clearLocalDataOnSignOut();
      window.location.reload();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsSyncing(false);
    }
  };


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
        case 'escape': {
          const { isMobileMenuOpen: mOpen, isThemeMenuOpen: tOpen, isUserMenuOpen: uOpen } = menusRef.current;
          if (mOpen || tOpen || uOpen) {
            e.preventDefault();
            setIsMobileMenuOpen(false);
            setIsThemeMenuOpen(false);
            setIsUserMenuOpen(false);
            cancelThemePreview();
            break;
          }
          e.preventDefault();
          navigate('/'); 
          break;
        }
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

  const handleSelectTheme = (id: string) => {
    setCurrentTheme(id);
    applyTheme(id);
    setIsThemeMenuOpen(false);
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-bg-base text-text-main font-sans selection:bg-accent-yellow-bg selection:text-text-main flex flex-col relative z-0">
      <Snowfall />

      {/* Mobile Navigation Backdrop Scrim */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden animate-fade-in transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      
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

            {/* Monkeytype Dark Theme Switcher */}
            <div className="relative shrink-0" ref={themeMenuRef}>
              <button 
                onClick={() => {
                  if (isThemeMenuOpen) {
                    cancelThemePreview();
                  }
                  setIsThemeMenuOpen(!isThemeMenuOpen);
                  setIsMobileMenuOpen(false);
                  setIsUserMenuOpen(false);
                }}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main transition-transform duration-300 hover:scale-110 focus:outline-none cursor-pointer shrink-0 rounded-full hover:bg-bg-surface tap-press"
                aria-label="Select color theme"
                title="Change theme"
                aria-expanded={isThemeMenuOpen}
              >
                <Palette size={18} />
              </button>

              {isThemeMenuOpen && (
                <div 
                  className="absolute right-0 top-14 w-64 max-w-[calc(100vw-2rem)] bg-bg-surface border border-border-strong rounded-2xl p-3 shadow-2xl z-50 animate-scale-in"
                  onMouseLeave={cancelThemePreview}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle px-1">
                    <span className="text-xs font-serif font-semibold text-text-main">Monkeytype Themes</span>
                    <span className="text-[10px] font-mono text-text-muted uppercase">Dark</span>
                  </div>

                  <div 
                    className="space-y-1 max-h-60 overflow-y-auto pr-1 overscroll-contain"
                    onMouseLeave={cancelThemePreview}
                  >
                    {COLOR_THEMES.map(theme => {
                      const isActive = currentTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => handleSelectTheme(theme.id)}
                          onMouseEnter={() => previewTheme(theme.id)}
                          onFocus={() => previewTheme(theme.id)}
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

            {user ? (
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(!isUserMenuOpen);
                    setIsMobileMenuOpen(false);
                    setIsThemeMenuOpen(false);
                  }}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                  aria-label="User account menu"
                  className="min-h-[44px] flex items-center gap-1.5 sm:gap-2 pl-2 pr-3 py-1.5 rounded-full bg-bg-surface hover:bg-bg-surface/80 border border-border-strong text-xs font-medium text-text-main transition-colors cursor-pointer shrink-0 tap-press"
                >
                  {user.photoURL && !avatarError ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName ? `${user.displayName}'s avatar` : "User profile picture"} 
                      width={24}
                      height={24}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                      className="w-6 h-6 rounded-full object-cover aspect-square shrink-0" 
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-accent-blue/20 text-accent-blue flex items-center justify-center font-bold text-[10px] aspect-square shrink-0" aria-hidden="true">
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
                  onClick={() => {
                    setIsUserMenuOpen(!isUserMenuOpen);
                    setIsMobileMenuOpen(false);
                    setIsThemeMenuOpen(false);
                  }}
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
              ref={mobileMenuBtnRef}
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsThemeMenuOpen(false);
                setIsUserMenuOpen(false);
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

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
