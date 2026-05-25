// ──────────────────────────────────────────────
// KidsVerse — Auth Provider
// Wraps the app, listens to Firebase auth state,
// and hydrates the Zustand auth store with
// user, parent profile, and child profiles.
// ──────────────────────────────────────────────
import { useEffect, useRef, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { getParentProfile, getChildProfiles } from '@/lib/firestore';
import { useAuthStore } from '@/store';
import type { User } from '@/types';

// ── Safety timeout: force-exit loading after 8 s ──
const AUTH_TIMEOUT_MS = 8_000;

// ── Map Firebase User → App User ──
function mapFirebaseUser(firebaseUser: FirebaseUser): User {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    createdAt: new Date(),
  };
}

// ── Props ──
interface AuthProviderProps {
  children: ReactNode;
}

// ── Component ──
export function AuthProvider({ children }: AuthProviderProps) {
  const { isLoading } = useAuthStore();
  const settledRef = useRef(false);

  useEffect(() => {
    // Graceful degradation when Firebase is not configured
    if (!isFirebaseConfigured || !auth) {
      console.warn('KidsVerse: Firebase not configured. Running in demo mode.');
      useAuthStore.getState().setLoading(false);
      return;
    }

    const {
      initializeAuth,
      logout,
      setLoading,
      setParentProfile,
      setChildProfiles,
    } = useAuthStore.getState();

    setLoading(true);

    // ── Timeout guard ──
    const timer = setTimeout(() => {
      if (!settledRef.current) {
        settledRef.current = true;
        console.warn('KidsVerse: Auth check timed out after ' + AUTH_TIMEOUT_MS / 1000 + 's — proceeding anyway.');
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Ignore stale callbacks after timeout already fired
      if (settledRef.current) return;

      try {
        if (firebaseUser) {
          const user = mapFirebaseUser(firebaseUser);
          initializeAuth(user);

          // Keep loading while we fetch profiles
          setLoading(true);

          try {
            const parentProfile = await getParentProfile(user.uid);
            if (parentProfile) {
              setParentProfile(parentProfile);
              const children = await getChildProfiles(parentProfile.uid);
              setChildProfiles(children);
            }
          } catch (error: unknown) {
            console.warn('KidsVerse: Failed to load user profiles:', error);
          }
        } else {
          logout();
        }
      } catch (error: unknown) {
        console.error('KidsVerse: Unexpected error in auth state handler:', error);
      } finally {
        settledRef.current = true;
        clearTimeout(timer);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // ── Full-screen loading spinner ──
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-kv-cream"
        role="status"
        aria-label="Loading KidsVerse"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-kv-blue border-t-transparent animate-spin" />
          <p className="text-kv-gray-500 font-sans text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
