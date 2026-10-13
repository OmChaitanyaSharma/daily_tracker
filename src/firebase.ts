import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDS1lzlIDEL9NhZYf0uZOh2Ebt9La2MvcU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "daily-tracker-5a456.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "daily-tracker-5a456",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "daily-tracker-5a456.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "232295874706",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:232295874706:web:dbd25088003fad57e1e64b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-358ST1S88L"
};

// Fail-fast assertion
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error("Missing required Firebase configuration (apiKey and projectId are mandatory).");
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

// Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
