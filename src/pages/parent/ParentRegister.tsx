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

/* ── Shared floating decorative shapes ── */
function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Top-left large circle */}
      <div
        className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #2ED573 0%, transparent 70%)' }}
      />
      {/* Top-right star-like circle */}
      <div
        className="absolute -top-10 right-10 w-48 h-48 rounded-full opacity-15 blur-2xl animate-float-slow"
        style={{ background: 'radial-gradient(circle, #0ABDE3 0%, transparent 70%)' }}
      />
      {/* Bottom-right large circle */}
      <div
        className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #0ABDE3 0%, transparent 70%)' }}
      />
      {/* Bottom-left small circle */}
      <div
        className="absolute bottom-20 -left-10 w-40 h-40 rounded-full opacity-15 blur-2xl animate-float"
        style={{ background: 'radial-gradient(circle, #2ED573 0%, transparent 70%)' }}
      />
      {/* Middle accent */}
      <div
        className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full opacity-10 blur-xl animate-float-fast"
        style={{ background: 'radial-gradient(circle, #00D2D3 0%, transparent 70%)' }}
      />
      {/* Tiny sparkle dots */}
      <div className="absolute top-[15%] left-[20%] w-2 h-2 rounded-full bg-white/30 animate-sparkle" />
      <div className="absolute top-[25%] right-[15%] w-1.5 h-1.5 rounded-full bg-white/25 animate-sparkle" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-[35%] left-[12%] w-1.5 h-1.5 rounded-full bg-white/20 animate-sparkle" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[60%] right-[25%] w-2 h-2 rounded-full bg-white/20 animate-sparkle" style={{ animationDelay: '0.7s' }} />
    </div>
  );
}

/* ── Reusable input styling props ── */
const inputBaseClass =
  'w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-transparent focus:outline-none transition-all duration-200 text-base text-kv-gray-800 placeholder:text-kv-gray-300 bg-kv-gray-50/50';

const inputBaseStyle: React.CSSProperties = {
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
};

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
  const [mounted, setMounted] = useState(false);

  const passwordMinLength = 8;

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/parent', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(46, 213, 115, 0.12), 0 0 0 1px #2ED573';
    e.currentTarget.style.borderColor = 'transparent';
    e.currentTarget.style.background = '#fff';
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
    e.currentTarget.style.borderColor = '';
    e.currentTarget.style.background = '';
  };

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
    <div
      className="fixed inset-0 flex items-center justify-center p-4 md:p-8 overflow-y-auto"
      style={{
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 50%, #0ABDE3 100%)',
      }}
    >
      <FloatingShapes />

      <div
        className="relative w-full max-w-[440px] transition-all duration-700 ease-out my-6"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(24px)',
        }}
      >
        {/* Card */}
        <div
          className="bg-white rounded-3xl p-8 md:p-10 relative overflow-hidden"
          style={{
            boxShadow: '0 20px 60px rgba(46, 213, 115, 0.20), 0 4px 20px rgba(10, 189, 227, 0.12)',
          }}
        >
          {/* Subtle top accent line */}
          <div
            className="absolute top-0 left-8 right-8 h-[3px] rounded-full"
            style={{ background: 'linear-gradient(90deg, #2ED573, #0ABDE3)' }}
          />

          {/* Logo */}
          <div className="text-center mb-7 mt-2">
            <div className="inline-flex items-center gap-2.5 mb-5">
              <span className="text-4xl" role="img" aria-label="KidsVerse owl mascot">🦉</span>
              <span className="font-display text-2xl tracking-tight text-kv-gray-800">
                KidsVerse
              </span>
            </div>
            <h1
              className="text-3xl md:text-4xl font-display mb-2"
              style={{
                background: 'linear-gradient(135deg, #2ED573 0%, #0ABDE3 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Create Account
            </h1>
            <p className="text-kv-gray-400 text-sm md:text-base">
              Start your child&apos;s learning adventure today
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              className="flex items-start gap-3 bg-red-50 border border-red-100 px-4 py-3.5 rounded-2xl mb-5 text-sm text-red-700"
              role="alert"
            >
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Name */}
            <div>
              <label htmlFor="reg-name" className="block text-sm font-bold text-kv-gray-600 mb-1.5 tracking-wide uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.08em' }}>
                Your Name
              </label>
              <input
                id="reg-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputBaseClass}
                style={inputBaseStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Your display name"
                autoComplete="name"
                required
                aria-required="true"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-bold text-kv-gray-600 mb-1.5 tracking-wide uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.08em' }}>
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputBaseClass}
                style={inputBaseStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="parent@example.com"
                autoComplete="email"
                required
                aria-required="true"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-bold text-kv-gray-600 mb-1.5 tracking-wide uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.08em' }}>
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputBaseClass}
                style={inputBaseStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder={`At least ${passwordMinLength} characters`}
                autoComplete="new-password"
                required
                aria-required="true"
              />
              {password && password.length < passwordMinLength && (
                <p className="text-xs text-red-400 mt-1 ml-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Password must be at least {passwordMinLength} characters
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-bold text-kv-gray-600 mb-1.5 tracking-wide uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.08em' }}>
                Confirm Password
              </label>
              <input
                id="reg-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputBaseClass}
                style={inputBaseStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
                aria-required="true"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1 ml-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 pt-1 pb-1">
              <input
                id="reg-terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-kv-green focus:ring-kv-green/30 cursor-pointer"
                required
                aria-required="true"
              />
              <label htmlFor="reg-terms" className="text-sm text-kv-gray-500 leading-relaxed cursor-pointer">
                I agree to the{' '}
                <span
                  className="font-bold cursor-pointer transition-colors duration-200"
                  style={{ color: '#2ED573' }}
                >
                  Terms of Service
                </span>
                {' '}and{' '}
                <span
                  className="font-bold cursor-pointer transition-colors duration-200"
                  style={{ color: '#2ED573' }}
                >
                  Privacy Policy
                </span>
                . KidsVerse is COPPA-compliant and does not collect data directly from children.
              </label>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-lg font-display text-white rounded-2xl transition-all duration-300 mt-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #2ED573 0%, #0ABDE3 100%)',
                boxShadow: '0 4px 20px rgba(46, 213, 115, 0.35), 0 2px 8px rgba(10, 189, 227, 0.25)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(46, 213, 115, 0.45), 0 4px 14px rgba(10, 189, 227, 0.35)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(46, 213, 115, 0.35), 0 2px 8px rgba(10, 189, 227, 0.25)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              aria-label="Create your parent account"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Bottom link */}
          <p className="text-center text-kv-gray-400 mt-6 text-sm">
            Already have an account?{' '}
            <Link
              to="/parent/login"
              className="font-bold transition-colors duration-200"
              style={{ color: '#2ED573' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#0ABDE3'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#2ED573'; }}
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer branding */}
        <p className="text-center text-white/40 text-xs mt-6 font-medium">
          © {new Date().getFullYear()} KidsVerse · Safe learning for kids
        </p>
      </div>
    </div>
  );
}
