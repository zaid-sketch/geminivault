import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from './lib/firebase';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import type { UserProfile } from './types';
import { Lock, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [signInLoading, setSignInLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Synchronize Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user: User | null) => {
        if (user) {
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: user.metadata.creationTime,
          });
        } else {
          setCurrentUser(null);
        }
        setAuthLoading(false);
      },
      (error) => {
        console.error('[GeminiVault] Auth state listener error:', error);
        setAuthError('Authentication service encountered an unexpected error.');
        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Federated Google Sign-In flow
  const handleGoogleSignIn = async () => {
    setSignInLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error('[GeminiVault] Sign-in error:', err);
      const errorObj = err as { code?: string; message?: string };
      if (errorObj.code === 'auth/popup-blocked') {
        setAuthError('Pop-up was blocked by your browser. Please allow pop-ups for this site or open in a new tab.');
      } else if (errorObj.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in cancelled. Please click "Sign In with Google" to retry.');
      } else if (errorObj.code === 'auth/cancelled-popup-request') {
        // Ignored, user clicked again
      } else {
        setAuthError(errorObj.message || 'Unable to authenticate with Google. Please try again.');
      }
    } finally {
      setSignInLoading(false);
    }
  };

  // Sign out flow
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error('[GeminiVault] Sign-out error:', err);
    }
  };

  // Initializing auth state loading screen
  if (authLoading) {
    return (
      <div 
        id="app-auth-loading-screen"
        className="min-h-screen bg-[#0A0A0B] text-[#E4E4E7] flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-950/50 animate-pulse">
            <Lock className="w-6 h-6" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-lg font-bold tracking-tight text-white">GeminiVault</h1>
            <p className="text-xs text-[#A1A1AA] font-mono flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verifying Cryptographic Auth Session...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, render protected dashboard
  if (currentUser) {
    return (
      <Dashboard
        user={currentUser}
        onSignOut={handleSignOut}
      />
    );
  }

  // Unauthenticated landing page
  return (
    <LandingPage
      onSignIn={handleGoogleSignIn}
      isLoading={signInLoading}
      authError={authError}
    />
  );
}
