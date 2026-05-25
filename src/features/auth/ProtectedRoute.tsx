// ──────────────────────────────────────────────
// KidsVerse — Protected Route Guard
// Redirects unauthenticated users to login
// while the app resolves Firebase auth state.
// ──────────────────────────────────────────────
import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';

// ── Props ──
interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

// ── Component ──
export function ProtectedRoute({
  children,
  redirectTo = '/parent/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();

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

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
