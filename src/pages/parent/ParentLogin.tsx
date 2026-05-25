import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { useAuthStore } from '@/store';

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email. Please register first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function ParentLogin() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/parent', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth!, email, password);
      navigate('/parent');
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : '';
      setError(getAuthErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth!, new GoogleAuthProvider());
      navigate('/parent');
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : '';
      setError(getAuthErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  if (!isFirebaseConfigured) {
    return (
      <div className="kv-page flex flex-col items-center justify-center gap-6 p-6">
        <div className="text-6xl animate-float">🔧</div>
        <h1 className="text-3xl font-display text-kv-blue">Setup Required</h1>
        <div className="kv-card p-6 max-w-md text-center">
          <p className="text-kv-gray-700 mb-4">
            KidsVerse needs Firebase to be configured before you can use the app.
          </p>
          <div className="text-left bg-kv-gray-50 rounded-2xl p-4 text-sm text-kv-gray-600 space-y-1">
            <p className="font-semibold text-kv-gray-800">Required Environment Variables:</p>
            <p>VITE_FIREBASE_API_KEY</p>
            <p>VITE_FIREBASE_AUTH_DOMAIN</p>
            <p>VITE_FIREBASE_PROJECT_ID</p>
            <p>VITE_FIREBASE_APP_ID</p>
          </div>
          <p className="text-kv-gray-500 text-sm mt-4">
            Set these in your Vercel Dashboard under Settings → Environment Variables, then redeploy.
          </p>
        </div>
        <p className="text-kv-gray-400 text-sm">
          See DEPLOY.md for detailed instructions.
        </p>
      </div>
    );
  }

  return (
    <div className="kv-page flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="kv-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display text-kv-blue mb-2">Welcome Back!</h1>
            <p className="text-kv-gray-500">Sign in to manage your child&apos;s learning journey</p>
          </div>

          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-bold text-kv-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-kv-gray-200 focus:border-kv-blue focus:outline-none transition-colors text-lg"
                placeholder="parent@example.com"
                autoComplete="email"
                required
                aria-required="true"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-bold text-kv-gray-700 mb-1">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-kv-gray-200 focus:border-kv-blue focus:outline-none transition-colors text-lg"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                aria-required="true"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full kv-button-base bg-kv-blue text-white py-3 text-lg font-display disabled:opacity-50"
              aria-label="Sign in with email and password"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-kv-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-kv-gray-400 font-bold">OR</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full kv-button-base bg-white border-2 border-kv-gray-200 text-kv-gray-700 py-3 text-lg font-bold flex items-center justify-center gap-3 hover:bg-kv-gray-50 disabled:opacity-50"
            aria-label="Sign in with Google account"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-kv-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link
              to="/parent/register"
              className="text-kv-blue font-bold hover:underline"
            >
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
