import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    setSyncStatus('Connecting with Google...');
    try {
      await signInWithGoogle();
      setSyncStatus('Synchronizing cloud data...');
      // After sign-in, onAuthStateChanged in AuthContext sets user.
      onClose();
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized in Firebase Console.');
      } else {
        setError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setIsSubmitting(false);
      setSyncStatus(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    setSyncStatus(isSignUp ? 'Creating your account...' : 'Signing in...');

    try {
      if (isSignUp) {
        await signUpWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
      onClose();
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setIsSubmitting(false);
      setSyncStatus(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-bg-base/80 backdrop-blur-sm p-4 flex"
      onClick={onClose}
    >
      <div 
        className="m-auto relative w-full max-w-md bg-bg-surface border border-border-strong rounded-3xl p-6 sm:p-8 shadow-2xl my-8 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 text-text-muted hover:text-text-main hover:bg-bg-base/50 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="mb-4 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-accent-blue/10 text-accent-blue border border-accent-blue/20 mb-3">
            <LogIn size={20} />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif text-text-main">
            {isSignUp ? 'Create an Account' : 'Welcome to Daily Tracker'}
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Sign in to access your habits, streaks, and logs on any device.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs flex items-center gap-2.5">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {syncStatus && (
          <div className="mb-4 p-2.5 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs flex items-center justify-center gap-2 animate-pulse">
            <Loader2 size={14} className="animate-spin" />
            <span>{syncStatus}</span>
          </div>
        )}

        {/* Google 1-Click Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-bg-base hover:bg-bg-base/80 border border-border-strong hover:border-text-muted rounded-xl text-sm font-medium text-text-main transition-all mb-4 disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative flex items-center justify-center mb-4">
          <div className="w-full border-t border-border-subtle"></div>
          <span className="absolute px-3 bg-bg-surface text-[10px] tracking-widest uppercase text-text-muted">or with email</span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-text-muted mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3 text-text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-bg-base border border-border-strong rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-text-muted transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-text-muted mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3 text-text-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-bg-base border border-border-strong rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-text-muted transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-text-main text-bg-base rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity mt-4 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus size={16} /> Create Account
              </>
            ) : (
              <>
                <LogIn size={16} /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs text-text-muted hover:text-text-main transition-colors cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}
