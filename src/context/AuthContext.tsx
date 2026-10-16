import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  type User, 
  type UserCredential,
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { getSettings, saveSettings } from '../utils/settings';
import { getTodayStr } from '../utils/dateUtils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<UserCredential | undefined>;
  signInWithGoogleRedirect: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  continueAsGuest: () => void;
  exitGuestMode: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem('dt_guest_mode') === 'true');

  useEffect(() => {
    // Process returning from signInWithRedirect (Brave / Mobile / Safari)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
          setIsGuest(false);
          localStorage.removeItem('dt_guest_mode');
        }
      })
      .catch((err) => {
        console.error('Redirect sign-in error:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsGuest(false);
        localStorage.removeItem('dt_guest_mode');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('dt_guest_mode', 'true');
    const current = getSettings();
    if (!current.trackingStartDate) {
      saveSettings({ ...current, trackingStartDate: getTodayStr() });
    }
  };

  const exitGuestMode = () => {
    setIsGuest(false);
    localStorage.removeItem('dt_guest_mode');
  };

  const signInWithGoogle = async (): Promise<UserCredential | undefined> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setIsGuest(false);
      localStorage.removeItem('dt_guest_mode');
      return result;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      // Auto-fallback to redirect if popup is blocked or unsupported
      if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
        console.warn('Popup blocked by browser. Automatically falling back to signInWithRedirect...');
        await signInWithRedirect(auth, googleProvider);
        return undefined;
      }
      throw error;
    }
  };

  const signInWithGoogleRedirect = async (): Promise<void> => {
    setIsGuest(false);
    localStorage.removeItem('dt_guest_mode');
    await signInWithRedirect(auth, googleProvider);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      setIsGuest(false);
      localStorage.removeItem('dt_guest_mode');
    } catch (error: any) {
      console.error('Email sign-in error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      setIsGuest(false);
      localStorage.removeItem('dt_guest_mode');
    } catch (error: any) {
      console.error('Email sign-up error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setIsGuest(false);
      localStorage.removeItem('dt_guest_mode');
    } catch (error: any) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isGuest, 
      signInWithGoogle, 
      signInWithGoogleRedirect,
      signInWithEmail, 
      signUpWithEmail, 
      continueAsGuest, 
      exitGuestMode, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
