import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { createParentProfile } from '@/lib/firestore';
import { useAuthStore } from '@/store';
import type { Subscription } from '@/types';

// ── Firestore write timeout helper ──
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(label + ' timed out after ' + ms / 1000 + 's')), ms),
    ),
  ]);
}

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 8 characters.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-up is not enabled. Enable it in Firebase Console > Authentication > Sign-in method.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function ParentRegister() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const passwordMinLength = 8;

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/parent', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < passwordMinLength) {
      setError(`Password must be at least ${passwordMinLength} characters long.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create Firebase Auth user
      const userCredential = await withTimeout(
        createUserWithEmailAndPassword(auth!, email, password),
        15_000,
        'Account creation',
      );
      const { uid } = userCredential.user;

      // Step 2: Update display name
      await withTimeout(
        updateProfile(userCredential.user, { displayName }),
        10_000,
        'Profile update',
      );

      // Step 3: Create Firestore parent profile (may fail if Firestore DB not created)
      const subscription: Subscription = {
        tier: 'free',
        status: 'active',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };

      try {
        await withTimeout(
          createParentProfile({
            uid,
            email,
            displayName,
            photoURL: null,
            childProfileIds: [],
            subscription,
          }),
          10_000,
          'Profile save',
        );
      } catch (firestoreErr: unknown) {
        // Account was created but profile save failed — still navigate to dashboard
        const msg = firestoreErr instanceof Error ? firestoreErr.message : String(firestoreErr);
        console.error('KidsVerse: Failed to save parent profile (account still created):', msg);
      }

      navigate('/parent');
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(getAuthErrorMessage(err.code));
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
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
    <div className="kv-page flex items-center justify-center py-10">
      <div className="w-full max-w-md">
        <div className="kv-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display text-kv-green mb-2">Create Account</h1>
            <p className="text-kv-gray-500">Start your child&apos;s learning adventure today</p>
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
              <label htmlFor="reg-name" className="block text-sm font-bold text-kv-gray-700 mb-1">
                Your Name
              </label>
              <input
                id="reg-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-kv-gray-200 focus:border-kv-blue focus:outline-none transition-colors text-lg"
                placeholder="Your display name"
                autoComplete="name"
                required
                aria-required="true"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-bold text-kv-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="reg-email"
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
              <label htmlFor="reg-password" className="block text-sm font-bold text-kv-gray-700 mb-1">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-kv-gray-200 focus:border-kv-blue focus:outline-none transition-colors text-lg"
                placeholder={`At least ${passwordMinLength} characters`}
                autoComplete="new-password"
                required
                aria-required="true"
              />
              {password && password.length < passwordMinLength && (
                <p className="text-xs text-kv-red mt-1">
                  Password must be at least {passwordMinLength} characters
                </p>
              )}
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-bold text-kv-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="reg-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-kv-gray-200 focus:border-kv-blue focus:outline-none transition-colors text-lg"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
                aria-required="true"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-kv-red mt-1">Passwords do not match</p>
              )}
            </div>

            <div className="flex items-start gap-3 pt-2">
              <input
                id="reg-terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-kv-gray-300 text-kv-blue focus:ring-kv-blue"
                required
                aria-required="true"
              />
              <label htmlFor="reg-terms" className="text-sm text-kv-gray-600">
                I agree to the{' '}
                <span className="text-kv-blue font-bold cursor-pointer hover:underline">Terms of Service</span>
                {' '}and{' '}
                <span className="text-kv-blue font-bold cursor-pointer hover:underline">Privacy Policy</span>
                {'. '}KidsVerse is COPPA-compliant and does not collect data directly from children.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full kv-button-base bg-kv-green text-white py-3 text-lg font-display disabled:opacity-50 mt-2"
              aria-label="Create your parent account"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-kv-gray-500 mt-6">
            Already have an account?{' '}
            <Link
              to="/parent/login"
              className="text-kv-blue font-bold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
