// ──────────────────────────────────────────────
// KidsVerse — Child Profile Resolver
// Wraps child-facing routes, resolves the child
// profile from the URL, initializes screen time
// tracking, and starts the session timer.
// ──────────────────────────────────────────────
import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore, useScreenTimeStore } from '@/store';
import { getTodayScreenTime, saveScreenTimeSession } from '@/lib/firestore';

// ── Props ──
interface ChildProfileResolverProps {
  children: ReactNode;
}

// ── Component ──
export function ChildProfileResolver({ children }: ChildProfileResolverProps) {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();

  const { childProfiles, isLoading, setActiveChildProfile } = useAuthStore();
  const [notFound, setNotFound] = useState(false);

  // ── Resolve profile ──
  useEffect(() => {
    if (isLoading || !profileId) return;

    const profile = childProfiles.find((p) => p.id === profileId);

    if (!profile) {
      setNotFound(true);
      return;
    }

    setActiveChildProfile(profile);
    useScreenTimeStore.getState().resetForNewChild(profile);

    // Load today's screen time from Firestore
    const todayStr = new Date().toISOString().slice(0, 10);
    getTodayScreenTime(profile.id, todayStr)
      .then((minutes) => {
        useScreenTimeStore.getState().loadTodayUsage(minutes);
      })
      .catch((err: unknown) => {
        console.warn('KidsVerse: Failed to load today screen time:', err);
      });
  }, [isLoading, profileId, childProfiles, setActiveChildProfile]);

  // ── Screen time session lifecycle ──
  useEffect(() => {
    if (!profileId || notFound || isLoading) return;

    // Start session
    useScreenTimeStore.getState().startSession(profileId);

    // Tick every minute — increment usage + persist to Firestore
    const tickInterval = setInterval(() => {
      const state = useScreenTimeStore.getState();
      state.tickMinute();

      // Persist current session to Firestore
      const session = useScreenTimeStore.getState().activeSession;
      if (session) {
        saveScreenTimeSession({
          childId: session.childId,
          date: session.date,
          minutesUsed: session.minutesUsed + 1,
          startedAt: session.startedAt,
          endedAt: null,
        }).catch((err: unknown) => {
          console.warn('KidsVerse: Failed to save screen time session:', err);
        });
      }
    }, 60_000);

    // End session on unmount
    return () => {
      clearInterval(tickInterval);
      useScreenTimeStore.getState().endSession();
    };
  }, [profileId, notFound, isLoading]);

  // ── Loading state (same spinner as AuthProvider) ──
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

  // ── Profile not found ──
  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-kv-cream px-4">
        <div className="kv-card max-w-md w-full text-center p-8">
          <span className="text-6xl block mb-4" aria-hidden="true">🤔</span>
          <h1 className="font-display text-2xl text-kv-gray-900 mb-2">
            Oops! We couldn&apos;t find your profile
          </h1>
          <p className="text-kv-gray-500 mb-6">
            It looks like this profile doesn&apos;t exist or may have been removed.
          </p>
          <button
            onClick={() => navigate('/parent')}
            className="kv-button-base bg-kv-blue text-white px-8 py-3 text-lg"
            type="button"
          >
            Go to Parent Dashboard
          </button>
        </div>
      </main>
    );
  }

  // ── Profile resolved — render children ──
  return <>{children}</>;
}
