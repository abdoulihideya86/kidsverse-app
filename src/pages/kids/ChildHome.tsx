import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore, useScreenTimeStore } from '@/store';
import { getProgress, getBadges } from '@/lib/firestore';
import { Avatar, SoundToggleBar, ProgressBar, MotionCard } from '@/components';
import { StaggerGrid, StaggerItem, AnimatedContainer, floatingAnimation } from '@/components';
import { useAgeAdaptiveConfig } from '@/hooks/useAgeAdaptiveConfig';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ScreenTimeOverlay } from '@/features/child';

// ── Interfaces ──

interface SubItem {
  label: string;
  emoji: string;
  path: string;
}

interface ActivitySection {
  id: string;
  title: string;
  emoji: string;
  gradient: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
  description: string;
  path: string | null;
  audioLabel: string;
  subItems?: SubItem[];
}

// ── Constants ──

const ACTIVITY_SECTIONS: ActivitySection[] = [
  {
    id: 'learn',
    title: 'Learn',
    emoji: '📚',
    gradient: 'blue',
    description: 'Learn new things',
    path: null,
    audioLabel: 'Learn new things',
    subItems: [
      { label: 'Alphabet', emoji: '🅰️', path: 'learn/alphabet' },
      { label: 'Numbers', emoji: '🔢', path: 'learn/numbers' },
      { label: 'Colors & Shapes', emoji: '🎨', path: 'learn/colors-shapes' },
      { label: 'Science', emoji: '🔬', path: 'learn/science' },
    ],
  },
  {
    id: 'play',
    title: 'Play',
    emoji: '🎮',
    gradient: 'green',
    description: 'Play fun games',
    path: null,
    audioLabel: 'Play fun games',
    subItems: [
      { label: 'Memory Match', emoji: '🃏', path: 'play/memory-match' },
      { label: 'Puzzle', emoji: '🧩', path: 'play/puzzle' },
      { label: 'Spelling Bee', emoji: '🐝', path: 'play/spelling-bee' },
      { label: 'Math', emoji: '➕', path: 'play/math-challenge' },
    ],
  },
  {
    id: 'watch',
    title: 'Watch',
    emoji: '📺',
    gradient: 'purple',
    description: 'Watch videos',
    path: 'watch',
    audioLabel: 'Watch videos',
  },
  {
    id: 'create',
    title: 'Create',
    emoji: '🎨',
    gradient: 'orange',
    description: 'Be creative',
    path: null,
    audioLabel: 'Be creative',
    subItems: [
      { label: 'Draw', emoji: '✏️', path: 'create/draw' },
      { label: 'Coloring', emoji: '🖌️', path: 'create/coloring' },
      { label: 'Gallery', emoji: '🖼️', path: 'create/gallery' },
    ],
  },
  {
    id: 'stories',
    title: 'Stories',
    emoji: '📖',
    gradient: 'pink',
    description: 'Read stories',
    path: 'stories',
    audioLabel: 'Read stories',
  },
];

const ENCOURAGEMENTS = [
  "Let's learn something amazing today!",
  'Ready for an adventure?',
  'What will we discover today?',
];

// ── Helpers ──

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDailyEncouragement(): string {
  const idx = new Date().getDay() % ENCOURAGEMENTS.length;
  return ENCOURAGEMENTS[idx] ?? ENCOURAGEMENTS[0]!;
}

function toDateStr(date: Date): string {
  return new Date(date).toISOString().slice(0, 10);
}

// ── Component ──

export default function ChildHome() {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();

  const activeChildProfile = useAuthStore((s) => s.activeChildProfile);
  const { todayMinutesUsed, limitMinutes } = useScreenTimeStore();
  const { playClick } = useSoundEffects();

  const age = activeChildProfile?.age ?? 5;
  const config = useAgeAdaptiveConfig(age);

  const childId = activeChildProfile?.id;
  const childName = activeChildProfile?.name ?? 'Friend';
  const today = new Date().toISOString().slice(0, 10);

  // Firestore data via React Query
  const { data: progressData } = useQuery({
    queryKey: ['progress', childId],
    queryFn: () => getProgress(childId!),
    enabled: !!childId,
  });

  const { data: badgesData } = useQuery({
    queryKey: ['badges', childId],
    queryFn: () => getBadges(childId!),
    enabled: !!childId,
  });

  // Computed daily stats
  const stats = useMemo(() => {
    const starsToday = (progressData ?? []).reduce((sum, p) => {
      return toDateStr(p.lastAccessedAt) === today ? sum + p.stars : sum;
    }, 0);

    const lessonsDone = (progressData ?? []).filter(
      (p) => toDateStr(p.lastAccessedAt) === today && p.completed
    ).length;

    const newBadges = (badgesData ?? []).filter(
      (b) => toDateStr(b.earnedAt) === today
    ).length;

    return { starsToday, lessonsDone, newBadges };
  }, [progressData, badgesData, today]);

  const remainingTime = Math.max(0, limitMinutes - todayMinutesUsed);
  const timePercent = limitMinutes > 0 ? (todayMinutesUsed / limitMinutes) * 100 : 0;

  // Time colour: green < 75%, orange 75–100%, red >= 100%
  const timeColorClass =
    timePercent < 75 ? 'text-kv-green' : timePercent < 100 ? 'text-kv-orange' : 'text-kv-red';

  const timeBarVariant = timePercent < 75 ? 'green' : timePercent < 100 ? 'orange' : 'red';

  // Age-adaptive layout
  const gridClass =
    config.segment === 'toddler'
      ? 'grid-cols-2 gap-4'
      : config.segment === 'early-learner'
        ? 'grid-cols-3 gap-4'
        : 'grid-cols-5 gap-4';

  const cardMinHeight = config.segment === 'toddler' ? 'min-h-[120px]' : '';

  const emojiSize = config.segment === 'toddler' ? 'text-5xl' : 'text-4xl';
  const subItemSize = config.segment === 'toddler' ? 'w-16 h-16 text-2xl' : 'w-12 h-12 text-xl';

  const showScreenTimeWarning = remainingTime <= 5 && remainingTime > 0;

  // Navigation handler with sound feedback
  const handleNavigate = (path: string) => {
    playClick();
    navigate(`/${path}`);
  };

  return (
    <div className="kv-page bg-gradient-to-b from-kv-blue/5 to-kv-cream min-h-screen">
      {/* ═══════ 1. Header Bar ═══════ */}
      <header className="flex flex-wrap gap-3 items-center justify-between mb-6">
        {/* Left: Mascot owl + brand */}
        <div className="flex items-center gap-3">
          <motion.div
            {...floatingAnimation}
            className="w-14 h-14 rounded-full bg-kv-blue flex items-center justify-center shadow-card"
            aria-hidden="true"
          >
            <span className="text-2xl">🦉</span>
          </motion.div>
          <h1 className="font-display text-2xl md:text-3xl text-kv-blue select-none">
            KidsVerse
          </h1>
        </div>

        {/* Center: Child avatar */}
        <div className="flex flex-col items-center">
          {activeChildProfile && (
            <Avatar
              animal={activeChildProfile.avatar}
              size="lg"
              name={activeChildProfile.name}
            />
          )}
        </div>

        {/* Right: Sound controls + parent button */}
        <div className="flex items-center gap-3">
          <SoundToggleBar />
          <button
            onClick={() => handleNavigate('parent')}
            className="kv-button-base bg-white text-kv-gray-600 px-4 py-2 text-sm shadow-card rounded-xl hover:shadow-card-hover transition-shadow duration-200"
            aria-label="Switch to parent mode"
          >
            👤 Parent
          </button>
        </div>
      </header>

      {/* ═══════ 2. Welcome Banner ═══════ */}
      <AnimatedContainer variant="slideUp" className="mb-8">
        <div className="bg-gradient-to-r from-kv-blue to-kv-cyan text-white rounded-3xl shadow-card p-6 md:p-8">
          <h2 className="font-display text-2xl md:text-3xl">
            {getGreeting()}, {childName}! 🌟
          </h2>
          <p className="text-white/80 mt-2 text-lg">{getDailyEncouragement()}</p>
        </div>
      </AnimatedContainer>

      {/* ═══════ 3. Activity Grid ═══════ */}
      <nav aria-label="Activity sections" className="mb-8">
        <StaggerGrid className={cn('grid', gridClass)}>
          {ACTIVITY_SECTIONS.map((section) => (
            <StaggerItem key={section.id}>
              {section.subItems ? (
                /* ── Section WITH sub-items ── */
                <MotionCard
                  asMotion={true}
                  variant="elevated"
                  gradient={section.gradient}
                  padding="sm"
                  className={cn(cardMinHeight, 'flex flex-col items-center gap-3')}
                  aria-label={section.audioLabel}
                >
                  <span className={cn(emojiSize, 'select-none')} aria-hidden="true">
                    {section.emoji}
                  </span>
                  {config.showTextLabels && (
                    <span className="font-display text-lg font-bold">{section.title}</span>
                  )}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {section.subItems.map((sub) => (
                      <button
                        key={sub.path}
                        onClick={() => handleNavigate(`${sub.path}/${profileId}`)}
                        className={cn(
                          subItemSize,
                          'rounded-full bg-white/20 hover:bg-white/30',
                          'flex items-center justify-center transition-colors duration-200',
                          'focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none'
                        )}
                        aria-label={
                          config.showTextLabels
                            ? `${sub.label}`
                            : `${section.title} ${sub.label}`
                        }
                      >
                        <span aria-hidden="true">{sub.emoji}</span>
                      </button>
                    ))}
                  </div>
                </MotionCard>
              ) : (
                /* ── Section WITHOUT sub-items (direct navigation) ── */
                <MotionCard
                  asMotion={true}
                  variant="interactive"
                  gradient={section.gradient}
                  padding="sm"
                  className={cn(
                    cardMinHeight,
                    'flex flex-col items-center justify-center gap-2'
                  )}
                  onClick={() => handleNavigate(`${section.path}/${profileId}`)}
                  aria-label={section.audioLabel}
                >
                  <span className={cn(emojiSize, 'select-none')} aria-hidden="true">
                    {section.emoji}
                  </span>
                  {config.showTextLabels && (
                    <span className="font-display text-lg font-bold">{section.title}</span>
                  )}
                </MotionCard>
              )}
            </StaggerItem>
          ))}
        </StaggerGrid>
      </nav>

      {/* ═══════ 4. Quick Stats Bar ═══════ */}
      <div
        className="kv-card flex items-center justify-around py-4 px-4 mb-6"
        aria-label="Today's progress summary"
        aria-live="polite"
      >
        {/* Stars Today */}
        <div className="text-center flex-1">
          <p className="text-2xl md:text-3xl font-display font-bold text-kv-yellow">
            {stats.starsToday}
          </p>
          <p className="text-xs text-kv-gray-500 mt-1">
            {config.segment === 'toddler' ? '⭐ Stars' : 'Stars Today'}
          </p>
        </div>

        <div className="w-px h-10 bg-kv-gray-200 flex-shrink-0" aria-hidden="true" />

        {/* Lessons Done */}
        <div className="text-center flex-1">
          <p className="text-2xl md:text-3xl font-display font-bold text-kv-blue">
            {stats.lessonsDone}
          </p>
          <p className="text-xs text-kv-gray-500 mt-1">
            {config.segment === 'toddler' ? '📚 Lessons' : 'Lessons Done'}
          </p>
        </div>

        <div className="w-px h-10 bg-kv-gray-200 flex-shrink-0" aria-hidden="true" />

        {/* New Badges */}
        <div className="text-center flex-1">
          <p className="text-2xl md:text-3xl font-display font-bold text-kv-orange">
            {stats.newBadges}
          </p>
          <p className="text-xs text-kv-gray-500 mt-1">
            {config.segment === 'toddler' ? '🏆 Badges' : 'New Badges'}
          </p>
        </div>

        <div className="w-px h-10 bg-kv-gray-200 flex-shrink-0" aria-hidden="true" />

        {/* Time Left */}
        <div className="text-center flex-1">
          <p className={cn('text-2xl md:text-3xl font-display font-bold', timeColorClass)}>
            {remainingTime}m
          </p>
          <p className="text-xs text-kv-gray-500 mt-1">
            {config.segment === 'toddler' ? '⏰ Time' : 'Time Left'}
          </p>
          <ProgressBar
            value={todayMinutesUsed}
            max={limitMinutes}
            variant={timeBarVariant}
            size="sm"
            className="mt-1"
          />
        </div>
      </div>

      {/* ═══════ 5. Screen Time Warning Banner ═══════ */}
      <AnimatePresence>
        {showScreenTimeWarning && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-kv-orange/10 border-2 border-kv-orange rounded-2xl p-3 mb-6 flex items-center gap-3"
            role="alert"
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              className="text-2xl flex-shrink-0"
              aria-hidden="true"
            >
              ⚠️
            </motion.span>
            <p className="text-kv-orange font-bold text-sm md:text-base">
              Only {remainingTime} minute{remainingTime !== 1 ? 's' : ''} left! Make them count!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ 6. Screen Time Overlay ═══════ */}
      <ScreenTimeOverlay />
    </div>
  );
}
