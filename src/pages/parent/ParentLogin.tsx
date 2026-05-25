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

/* ── Shared floating decorative shapes ── */
function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Top-left large circle */}
      <div
        className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #1E90FF 0%, transparent 70%)' }}
      />
      {/* Top-right star-like circle */}
      <div
        className="absolute -top-10 right-10 w-48 h-48 rounded-full opacity-15 blur-2xl animate-float-slow"
        style={{ background: 'radial-gradient(circle, #A55EEA 0%, transparent 70%)' }}
      />
      {/* Bottom-right large circle */}
      <div
        className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #A55EEA 0%, transparent 70%)' }}
      />
      {/* Bottom-left small circle */}
      <div
        className="absolute bottom-20 -left-10 w-40 h-40 rounded-full opacity-15 blur-2xl animate-float"
        style={{ background: 'radial-gradient(circle, #00D2D3 0%, transparent 70%)' }}
      />
      {/* Middle accent */}
      <div
        className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full opacity-10 blur-xl animate-float-fast"
        style={{ background: 'radial-gradient(circle, #FFC312 0%, transparent 70%)' }}
      />
      {/* Tiny sparkle dots */}
      <div className="absolute top-[15%] left-[20%] w-2 h-2 rounded-full bg-white/30 animate-sparkle" />
      <div className="absolute top-[25%] right-[15%] w-1.5 h-1.5 rounded-full bg-white/25 animate-sparkle" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-[35%] left-[12%] w-1.5 h-1.5 rounded-full bg-white/20 animate-sparkle" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[60%] right-[25%] w-2 h-2 rounded-full bg-white/20 animate-sparkle" style={{ animationDelay: '0.7s' }} />
    </div>
  );
}

export default function ParentLogin() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/parent', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Trigger fade-in animation after mount
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

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
    <div
      className="fixed inset-0 flex items-center justify-center p-4 md:p-8"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      }}
    >
      <FloatingShapes />

      <div
        className="relative w-full max-w-[440px] transition-all duration-700 ease-out"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(24px)',
        }}
      >
        {/* Card */}
        <div
          className="bg-white rounded-3xl p-8 md:p-10 relative overflow-hidden"
          style={{
            boxShadow: '0 20px 60px rgba(102, 126, 234, 0.25), 0 4px 20px rgba(118, 75, 162, 0.15)',
          }}
        >
          {/* Subtle top accent line */}
          <div
            className="absolute top-0 left-8 right-8 h-[3px] rounded-full"
            style={{ background: 'linear-gradient(90deg, #1E90FF, #A55EEA)' }}
          />

          {/* Logo */}
          <div className="text-center mb-8 mt-2">
            <div className="inline-flex items-center gap-2.5 mb-5">
              <span className="text-4xl" role="img" aria-label="KidsVerse owl mascot">🦉</span>
              <span className="font-display text-2xl tracking-tight text-kv-gray-800">
                KidsVerse
              </span>
            </div>
            <h1
              className="text-3xl md:text-4xl font-display mb-2"
              style={{
                background: 'linear-gradient(135deg, #1E90FF 0%, #A55EEA 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Welcome Back!
            </h1>
            <p className="text-kv-gray-400 text-sm md:text-base">
              Sign in to manage your child&apos;s learning journey
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              className="flex items-start gap-3 bg-red-50 border border-red-100 px-4 py-3.5 rounded-2xl mb-6 text-sm text-red-700"
              role="alert"
            >
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-bold text-kv-gray-600 mb-1.5 tracking-wide uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.08em' }}>
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-transparent focus:outline-none transition-all duration-200 text-base text-kv-gray-800 placeholder:text-kv-gray-300 bg-kv-gray-50/50"
                style={{
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(30, 144, 255, 0.12), 0 0 0 1px #1E90FF';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.background = '#fff';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.background = '';
                }}
                placeholder="parent@example.com"
                autoComplete="email"
                required
                aria-required="true"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-bold text-kv-gray-600 mb-1.5 tracking-wide uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.08em' }}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-transparent focus:outline-none transition-all duration-200 text-base text-kv-gray-800 placeholder:text-kv-gray-300 bg-kv-gray-50/50"
                style={{
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(30, 144, 255, 0.12), 0 0 0 1px #1E90FF';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.background = '#fff';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.background = '';
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                aria-required="true"
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-lg font-display text-white rounded-2xl transition-all duration-300 mt-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #1E90FF 0%, #A55EEA 100%)',
                boxShadow: '0 4px 20px rgba(30, 144, 255, 0.35), 0 2px 8px rgba(165, 94, 234, 0.25)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(30, 144, 255, 0.45), 0 4px 14px rgba(165, 94, 234, 0.35)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(30, 144, 255, 0.35), 0 2px 8px rgba(165, 94, 234, 0.25)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              aria-label="Sign in with email and password"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-kv-gray-300 font-semibold text-xs tracking-wider uppercase">
                or continue with
              </span>
            </div>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 text-base font-bold text-kv-gray-600 bg-white border-2 border-gray-150 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-300"
            style={{ borderColor: '#E5E7EB' }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.borderColor = '#D1D5DB';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '';
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.transform = '';
            }}
            aria-label="Sign in with Google account"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Bottom link */}
          <p className="text-center text-kv-gray-400 mt-7 text-sm">
            Don&apos;t have an account?{' '}
            <Link
              to="/parent/register"
              className="font-bold transition-colors duration-200"
              style={{ color: '#1E90FF' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#A55EEA'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#1E90FF'; }}
            >
              Create one here
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
