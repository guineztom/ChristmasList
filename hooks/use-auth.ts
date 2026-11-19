'use client';

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {auth, googleProvider, testFirestoreConnection} from '@/lib/firebase';

const GUEST_MODE_KEY = 'christmaslist-guest-mode';
const guestListeners = new Set<() => void>();

function subscribeGuestMode(listener: () => void) {
  guestListeners.add(listener);
  return () => guestListeners.delete(listener);
}

function getGuestModeSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(GUEST_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

function setGuestModeStorage(enabled: boolean) {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      window.localStorage.setItem(GUEST_MODE_KEY, '1');
    } else {
      window.localStorage.removeItem(GUEST_MODE_KEY);
    }
  } catch {
    // ignore storage quota errors
  }
  guestListeners.forEach((l) => l());
}

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const guestMode = useSyncExternalStore(
    subscribeGuestMode,
    getGuestModeSnapshot,
    () => false
  );

  useEffect(() => {
    void testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setAuthLoading(false);
        if (nextUser) {
          setGuestModeStorage(false);
        }
      },
      () => {
        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setGuestModeStorage(false);
      return true;
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as {code?: string}).code)
          : '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError(null);
      } else if (code === 'auth/unauthorized-domain') {
        setAuthError(
          'Domaine non autorisé dans Firebase Auth (ajoutez ce domaine dans Console Firebase → Authentication → Domaines autorisés).'
        );
      } else {
        setAuthError(
          'Connexion Google indisponible. Utilisez le mode test invité ou vérifiez la config Firebase.'
        );
      }
      return false;
    } finally {
      setSigningIn(false);
    }
  }, []);

  const enterGuestMode = useCallback(() => {
    setAuthError(null);
    setGuestModeStorage(true);
  }, []);

  const signOutAll = useCallback(async () => {
    setAuthError(null);
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } finally {
      setGuestModeStorage(false);
    }
  }, []);

  return {
    user,
    authLoading,
    guestMode,
    authError,
    signingIn,
    signInWithGoogle,
    enterGuestMode,
    signOutAll,
  };
}
