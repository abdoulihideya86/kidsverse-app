import { useMemo, useState, useEffect } from 'react';
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

// ── Gradient maps for cards with enhanced 3-stop gradients ──

const SECTION_GRADIENTS: Record<string, string> = {
  blue: 'bg-gradient-to-br from-kv-blue via-blue-400 to-kv-cyan',
  green: 'bg-gradient-to-br from-kv-green via-emerald-400 to-teal-400',
  purple: 'bg-gradient-to-br from-kv-purple via-violet-400 to-fuchsia-400',
  orange: 'bg-gradient-to-br from-kv-orange via-amber-400 to-yellow-400',
  pink: 'bg-gradient-to-br from-kv-pink via-rose-400 to-pink-300',
};

const SECTION_GLOW: Record<string, string> = {
  blue: 'hover:shadow-glow-blue',
  green: 'hover:shadow-glow-green',
  purple: 'hover:shadow-glow-purple',
  orange: 'hover:shadow-glow-orange',
  pink: 'hover:shadow-glow-pink',
};

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

// ── Floating Decoration Component ──

function FloatingShape({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={cn('absolute rounded-full opacity-20 pointer-events-none', className)}
      animate={{
        y: [0, -14, -6, -18, 0],
        x: [0, 6, -4, 8, 0],
        scale: [1, 1.05, 0.97, 1.08, 1],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      aria-hidden="true"
    />
  );
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

  // Scroll state for glassmorphism header
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Age-adaptive layout (mobile-first)
  const gridClass =
    config.segment === 'toddler'
      ? 'grid-cols-2 gap-3 sm:gap-4'
      : config.segment === 'early-learner'
        ? 'grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3'
        : 'grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-5';

  const emojiSize = config.segment === 'toddler' ? 'text-4xl sm:text-5xl md:text-6xl' : 'text-3xl sm:text-4xl md:text-5xl';
  const subItemSize = config.segment === 'toddler' ? 'w-12 h-12 text-xl sm:w-14 sm:h-14 sm:text-2xl' : 'w-10 h-10 text-lg sm:w-12 sm:h-12 sm:text-xl';

  const showScreenTimeWarning = remainingTime <= 5 && remainingTime > 0;

  // Navigation handler with sound feedback
  const handleNavigate = (path: string) => {
    playClick();
    navigate(`/${path}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-kv-cream pb-24 relative overflow-hidden">
      {/* ═══════ Subtle background pattern ═══════ */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #1E90FF 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden="true"
      />

      {/* ═══════ 1. Sticky Header ═══════ */}
      <header
        className={cn(
          'sticky top-0 z-40 transition-all duration-300',
          scrolled
            ? 'bg-white/70 backdrop-blur-xl shadow-[0_1px_24px_rgba(0,0,0,0.06)] border-b border-white/50'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-2.5 sm:px-6 sm:py-3">
          {/* Left: Owl mascot + brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div
              {...floatingAnimation}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-kv-blue to-kv-cyan flex items-center justify-center shadow-glow-blue"
              aria-hidden="true"
            >
              <span className="text-lg sm:text-xl">🦉</span>
            </motion.div>
            <h1 className="font-display text-lg sm:text-xl md:text-2xl bg-gradient-to-r from-kv-blue via-kv-purple to-kv-pink bg-clip-text text-transparent select-none">
              KidsVerse
            </h1>
          </div>

          {/* Right: Avatar + Sound + Parent mode */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {activeChildProfile && (
              <Avatar
                animal={activeChildProfile.avatar}
                size="sm"
                name={activeChildProfile.name}
                className="w-8 h-8 sm:w-9 sm:h-9 ring-2 ring-white shadow-card"
              />
            )}
            <SoundToggleBar />
            <button
              onClick={() => handleNavigate('parent')}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-kv-gray-50 hover:bg-kv-gray-100 text-kv-gray-500 shadow-card hover:shadow-card-hover transition-all duration-200"
              aria-label="Switch to parent mode"
            >
              <span className="text-sm sm:text-base">👤</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* ═══════ 2. Welcome Banner ═══════ */}
        <AnimatedContainer variant="slideUp" delay={0.05} className="mt-4 sm:mt-6 mb-6 sm:mb-8">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-kv-blue via-kv-cyan to-kv-teal p-5 sm:p-7 md:p-9 shadow-glow-blue">
            {/* Shimmer overlay */}
            <div
              className="absolute inset-0 animate-shimmer pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
                backgroundSize: '300% 100%',
                animation: 'shimmer 4s linear infinite',
              }}
              aria-hidden="true"
            />

            {/* Floating decorative shapes */}
            <FloatingShape className="w-16 h-16 sm:w-24 sm:h-24 bg-white -top-4 -right-4 sm:top-2 sm:right-8" delay={0} />
            <FloatingShape className="w-8 h-8 sm:w-12 sm:h-12 bg-kv-yellow -top-2 left-[20%] sm:left-[25%]" delay={1.2} />
            <FloatingShape className="w-10 h-10 sm:w-16 sm:h-16 bg-kv-pink -bottom-3 left-[10%] sm:left-[15%]" delay={0.6} />
            <FloatingShape className="w-6 h-6 sm:w-10 sm:h-10 bg-white -bottom-2 right-[15%] sm:right-[20%]" delay={1.8} />
            <FloatingShape className="w-4 h-4 sm:w-8 sm:h-8 bg-kv-cyan top-[30%] right-[5%] sm:right-[8%]" delay={2.4} />
            {/* Star shapes */}
            <motion.span
              className="absolute top-3 right-[30%] sm:top-6 sm:right-[28%] text-xl sm:text-3xl opacity-20 pointer-events-none"
              animate={{ rotate: [0, 15, -10, 20, 0], scale: [1, 1.1, 0.95, 1.15, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            >
              ✦
            </motion.span>
            <motion.span
              className="absolute bottom-4 left-[40%] sm:bottom-6 sm:left-[38%] text-lg sm:text-2xl opacity-15 pointer-events-none"
              animate={{ rotate: [0, -20, 10, -15, 0], scale: [1, 0.9, 1.1, 0.95, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              aria-hidden="true"
            >
              ✦
            </motion.span>

            {/* Content */}
            <div className="relative z-10">
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)] leading-tight">
                {getGreeting()}, {childName}!{' '}
                <motion.span
                  className="inline-block"
                  animate={{ rotate: [0, 12, -8, 12, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
                >
                  ✨
                </motion.span>
              </h2>
              <p className="text-white/85 mt-2 sm:mt-3 text-sm sm:text-base md:text-lg font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.1)]">
                {getDailyEncouragement()}
              </p>
            </div>
          </div>
        </AnimatedContainer>

        {/* ═══════ 3. Activity Grid ═══════ */}
        <nav aria-label="Activity sections" className="mb-8 sm:mb-10">
          <StaggerGrid className={cn('grid', gridClass, 'auto-rows-fr')}>
            {ACTIVITY_SECTIONS.map((section) => (
              <StaggerItem key={section.id}>
                {section.subItems ? (
                  /* ── Section WITH sub-items ── */
                  <MotionCard
                    asMotion={true}
                    variant="interactive"
                    padding="none"
                    className={cn(
                      'h-full flex flex-col rounded-2xl sm:rounded-3xl text-white overflow-hidden',
                      'shadow-card hover:shadow-card-hover transition-all duration-300',
                      SECTION_GRADIENTS[section.gradient],
                      SECTION_GLOW[section.gradient],
                      'hover:-translate-y-1'
                    )}
                    aria-label={section.audioLabel}
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {/* Inner shine overlay for 3D feel */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-[0.12]"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%, rgba(255,255,255,0.15) 100%)',
                      }}
                      aria-hidden="true"
                    />

                    <div className="relative z-10 flex flex-col items-center h-full p-4 sm:p-5 md:p-6 gap-2 sm:gap-3">
                      {/* Emoji with float */}
                      <motion.div
                        animate={{ y: [0, -6, -2, -8, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <span className={cn(emojiSize, 'select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)]')} aria-hidden="true">
                          {section.emoji}
                        </span>
                      </motion.div>

                      {/* Title */}
                      {config.showTextLabels && (
                        <span className="font-display text-base sm:text-lg md:text-xl font-bold tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
                          {section.title}
                        </span>
                      )}

                      {/* Sub-items 2×2 grid */}
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5 w-full mt-auto pt-1">
                        {section.subItems.map((sub) => (
                          <button
                            key={sub.path}
                            onClick={() => handleNavigate(`${sub.path}/${profileId}`)}
                            className={cn(
                              'group relative flex flex-col items-center justify-center gap-0.5 sm:gap-1',
                              subItemSize,
                              'rounded-2xl sm:rounded-2xl',
                              'bg-white/20 hover:bg-white/35 active:bg-white/45',
                              'backdrop-blur-sm',
                              'transition-all duration-200',
                              'hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]',
                              'focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none',
                              config.showTextLabels && 'h-auto py-1.5 sm:py-2'
                            )}
                            aria-label={
                              config.showTextLabels
                                ? `${sub.label}`
                                : `${section.title} ${sub.label}`
                            }
                          >
                            <span className="transition-transform duration-200 group-hover:scale-110" aria-hidden="true">
                              {sub.emoji}
                            </span>
                            {config.showTextLabels && (
                              <span className="text-[9px] sm:text-[10px] md:text-xs font-bold leading-none text-white/90 truncate max-w-full px-0.5">
                                {sub.label}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </MotionCard>
                ) : (
                  /* ── Section WITHOUT sub-items (direct navigation) ── */
                  <MotionCard
                    asMotion={true}
                    variant="interactive"
                    padding="none"
                    className={cn(
                      'h-full flex flex-col rounded-2xl sm:rounded-3xl text-white overflow-hidden',
                      'shadow-card hover:shadow-card-hover transition-all duration-300',
                      SECTION_GRADIENTS[section.gradient],
                      SECTION_GLOW[section.gradient],
                      'hover:-translate-y-1 cursor-pointer'
                    )}
                    onClick={() => handleNavigate(`${section.path}/${profileId}`)}
                    aria-label={section.audioLabel}
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {/* Inner shine overlay */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-[0.12]"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%, rgba(255,255,255,0.15) 100%)',
                      }}
                      aria-hidden="true"
                    />

                    <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 sm:p-5 md:p-6 gap-2 sm:gap-3">
                      {/* Emoji with float */}
                      <motion.div
                        animate={{ y: [0, -6, -2, -8, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <span className={cn(emojiSize, 'select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)]')} aria-hidden="true">
                          {section.emoji}
                        </span>
                      </motion.div>

                      {config.showTextLabels && (
                        <span className="font-display text-base sm:text-lg md:text-xl font-bold tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
                          {section.title}
                        </span>
                      )}

                      {config.showTextLabels && section.description && (
                        <span className="text-xs sm:text-sm text-white/70 font-medium">
                          {section.description}
                        </span>
                      )}
                    </div>
                  </MotionCard>
                )}
              </StaggerItem>
            ))}
          </StaggerGrid>
        </nav>

        {/* ═══════ 4. Stats Bar (Glassmorphism) ═══════ */}
        <AnimatedContainer variant="slideUp" delay={0.3} className="mb-6 sm:mb-8">
          <div
            className={cn(
              'rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6',
              'bg-white/60 backdrop-blur-xl',
              'border border-white/60',
              'shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
            )}
            aria-label="Today's progress summary"
            aria-live="polite"
          >
            <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-around gap-3 sm:gap-4">
              {/* Stars Today */}
              <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-kv-yellow/10">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-kv-yellow to-amber-400 flex items-center justify-center shadow-button">
                  <span className="text-lg sm:text-xl">⭐</span>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-kv-yellow leading-none">
                    {stats.starsToday}
                  </p>
                  <p className="text-[10px] sm:text-xs text-kv-gray-500 mt-0.5 font-medium">
                    {config.segment === 'toddler' ? 'Stars ⭐' : 'Stars'}
                  </p>
                </div>
              </div>

              {/* Lessons Done */}
              <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-kv-blue/10">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-kv-blue to-blue-400 flex items-center justify-center shadow-button">
                  <span className="text-lg sm:text-xl">📚</span>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-kv-blue leading-none">
                    {stats.lessonsDone}
                  </p>
                  <p className="text-[10px] sm:text-xs text-kv-gray-500 mt-0.5 font-medium">
                    {config.segment === 'toddler' ? 'Lessons 📚' : 'Lessons'}
                  </p>
                </div>
              </div>

              {/* New Badges */}
              <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-kv-orange/10">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-kv-orange to-amber-400 flex items-center justify-center shadow-button">
                  <span className="text-lg sm:text-xl">🏆</span>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-kv-orange leading-none">
                    {stats.newBadges}
                  </p>
                  <p className="text-[10px] sm:text-xs text-kv-gray-500 mt-0.5 font-medium">
                    {config.segment === 'toddler' ? 'Badges 🏆' : 'Badges'}
                  </p>
                </div>
              </div>

              {/* Time Left */}
              <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-kv-green/10">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-kv-green to-emerald-400 flex items-center justify-center shadow-button">
                  <span className="text-lg sm:text-xl">⏰</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-xl sm:text-2xl md:text-3xl font-display font-bold leading-none', timeColorClass)}>
                    {remainingTime}m
                  </p>
                  <p className="text-[10px] sm:text-xs text-kv-gray-500 mt-0.5 font-medium">
                    {config.segment === 'toddler' ? 'Time ⏰' : 'Time Left'}
                  </p>
                  <div className="mt-1.5">
                    <ProgressBar
                      value={todayMinutesUsed}
                      max={limitMinutes}
                      variant={timeBarVariant}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedContainer>

        {/* ═══════ 5. Screen Time Warning Banner ═══════ */}
        <AnimatePresence>
          {showScreenTimeWarning && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-r from-kv-orange/10 via-kv-orange/15 to-kv-orange/10 border-2 border-kv-orange/60 rounded-2xl p-3 sm:p-4 mb-6 flex items-center gap-3 shadow-glow-orange"
              role="alert"
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                className="text-2xl sm:text-3xl flex-shrink-0"
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
      </div>

      {/* ═══════ 6. Screen Time Overlay ═══════ */}
      <ScreenTimeOverlay />
    </div>
  );
}
