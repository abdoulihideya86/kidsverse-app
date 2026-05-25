import { useAuthStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { cn, getAvatarEmoji } from '@/lib/utils';
import { MotionCard } from '@/components';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/components/animations';

// ── Navigation Card Data ──

interface NavCard {
  title: string;
  description: string;
  path: string;
  emoji: string;
  color: string;
}

const navCards: NavCard[] = [
  { title: 'Child Profiles', description: 'Manage your children\'s accounts and avatars', path: '/parent/children', emoji: '👶', color: 'bg-kv-blue' },
  { title: 'Screen Time', description: 'Set daily time limits per child', path: '/parent/screen-time', emoji: '⏰', color: 'bg-kv-orange' },
  { title: 'Progress Reports', description: 'View learning progress and earned badges', path: '/parent/progress', emoji: '📊', color: 'bg-kv-green' },
  { title: 'Subscription', description: 'Manage your plan and billing', path: '/parent/subscription', emoji: '⭐', color: 'bg-kv-purple' },
  { title: 'Video Manager', description: 'Approve and manage video playlists', path: '/parent/videos', emoji: '🎬', color: 'bg-kv-pink' },
];

// ── Avatar background class mapping (avoids inline styles) ──

const avatarBgClasses: Record<string, string> = {
  bear: 'bg-orange-100',
  bunny: 'bg-pink-100',
  cat: 'bg-yellow-100',
  dog: 'bg-green-100',
  elephant: 'bg-blue-100',
  fox: 'bg-red-100',
  giraffe: 'bg-yellow-100',
  koala: 'bg-gray-100',
  lion: 'bg-orange-100',
  monkey: 'bg-purple-100',
  panda: 'bg-gray-100',
  penguin: 'bg-blue-100',
};

// ── Component ──

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { parentProfile, childProfiles } = useAuthStore();

  const displayName = parentProfile?.displayName ?? 'Parent';
  const planLabel = parentProfile?.subscription?.tier === 'premium' ? 'Premium ⭐' : 'Free 🎁';

  const handleLogout = async () => {
    try {
      if (auth) signOut(auth);
      useAuthStore.getState().logout();
      navigate('/parent/login');
    } catch (error) {
      console.error('Sign out failed:', error);
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
    <div className="kv-page">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display text-kv-blue">
            Hi, {displayName} 👋
          </h1>
          <p className="text-kv-gray-500 mt-1 text-lg">Manage your family&apos;s KidsVerse experience</p>
        </div>
        <button
          onClick={handleLogout}
          className="kv-button-base bg-kv-gray-200 text-kv-gray-700 px-5 py-2 text-sm font-bold hover:bg-kv-gray-300"
          aria-label="Sign out of your account"
        >
          Sign Out
        </button>
      </header>

      {/* Quick Stats */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {[
          { label: 'Children', value: String(childProfiles.length), emoji: '👨‍👧‍👦' },
          { label: 'Badges Earned', value: '—', emoji: '🏆' },
          { label: 'Stories Read', value: '—', emoji: '📖' },
          { label: 'Plan', value: planLabel, emoji: '🎁' },
        ].map((stat) => (
          <motion.div key={stat.label} variants={staggerItem}>
            <div className="kv-card text-center py-4">
              <span className="text-3xl" aria-hidden="true">{stat.emoji}</span>
              <p className="text-2xl font-display font-bold text-kv-gray-800 mt-1">{stat.value}</p>
              <p className="text-sm text-kv-gray-500">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Child Cards Section */}
      <section className="mb-8" aria-label="Your children">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-kv-gray-800">Your Children</h2>
          {childProfiles.length > 0 && (
            <button
              onClick={() => navigate('/parent/children')}
              className="text-sm text-kv-blue font-semibold hover:underline"
              aria-label="Manage all child profiles"
            >
              Manage →
            </button>
          )}
        </div>

        {childProfiles.length === 0 ? (
          <MotionCard
            asMotion
            variant="default"
            className="text-center py-10"
          >
            <span className="text-5xl block mb-4" aria-hidden="true">👶</span>
            <h3 className="text-lg font-bold text-kv-gray-700 mb-2">No children yet</h3>
            <p className="text-kv-gray-500 mb-4">
              Create your first child profile to get started with KidsVerse.
            </p>
            <button
              onClick={() => navigate('/parent/children')}
              className="kv-button-base bg-kv-blue text-white px-6 py-3 font-display"
              aria-label="Create your first child profile"
            >
              + Create First Profile
            </button>
          </MotionCard>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {childProfiles.map((child) => (
              <motion.div key={child.id} variants={staggerItem}>
                <div className="kv-card p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-14 h-14 rounded-full flex items-center justify-center text-3xl flex-shrink-0',
                        avatarBgClasses[child.avatar] ?? 'bg-kv-blue/10',
                      )}
                      aria-hidden="true"
                    >
                      {getAvatarEmoji(child.avatar)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-kv-gray-800 truncate">{child.name}</h3>
                      <p className="text-sm text-kv-gray-500">Age {child.age}</p>
                    </div>
                    <button
                      onClick={() => navigate('/parent/children')}
                      className="w-9 h-9 rounded-full bg-kv-gray-100 flex items-center justify-center text-kv-gray-400 hover:bg-kv-gray-200 hover:text-kv-gray-600 transition-colors"
                      aria-label={`Settings for ${child.name}`}
                    >
                      ⚙️
                    </button>
                  </div>
                  <button
                    onClick={() => navigate(`/kids/${child.id}`)}
                    className="w-full kv-button-base bg-kv-blue text-white py-2.5 mt-4 text-sm font-display"
                    aria-label={`Launch Kids Mode for ${child.name}`}
                  >
                    🚀 Launch
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Navigation Cards */}
      <section aria-label="Parent tools">
        <h2 className="text-xl font-display font-bold text-kv-gray-800 mb-4">Parent Tools</h2>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {navCards.map((card) => (
            <motion.div key={card.path} variants={staggerItem}>
              <MotionCard
                asMotion
                onClick={() => navigate(card.path)}
                className="flex items-start gap-4 text-left"
                role="button"
                tabIndex={0}
                aria-label={`Go to ${card.title}: ${card.description}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(card.path);
                  }
                }}
              >
                <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <span className="text-2xl" aria-hidden="true">{card.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-kv-gray-800">{card.title}</h3>
                  <p className="text-sm text-kv-gray-500 mt-1">{card.description}</p>
                </div>
                <span className="text-kv-gray-300 text-xl flex-shrink-0" aria-hidden="true">→</span>
              </MotionCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* COPPA Footer */}
      <footer className="mt-12 text-center text-sm text-kv-gray-400">
        <p>KidsVerse is COPPA-compliant. No child data is collected without parental consent.</p>
      </footer>
    </div>
  );
}
