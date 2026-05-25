import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import { useAgeAdaptiveConfig } from '@/hooks/useAgeAdaptiveConfig';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import {
  upsertProgress,
  addFavoriteStory,
  removeFavoriteStory,
  awardBadge,
  getProgress,
  getFavoriteStories,
} from '@/lib/firestore';
import {
  MotionCard,
  MotionButton,
  Button,
  ProgressBar,
  Badge,
  AchievementBadge,
  IconArrowLeft,
  IconHome,
  AnimatedContainer,
} from '@/components';
import { cn } from '@/lib/utils';
import type { Story, AgeSegment } from '@/types';
import { ALL_STORIES, SCENE_EMOJIS } from './StoriesLibrary';

// ── Confetti Particles ──
const CONFETTI = [
  { emoji: '🎉', x: 10, delay: 0 },
  { emoji: '⭐', x: 25, delay: 0.1 },
  { emoji: '📖', x: 40, delay: 0.2 },
  { emoji: '🌟', x: 55, delay: 0.15 },
  { emoji: '✨', x: 70, delay: 0.25 },
  { emoji: '💫', x: 85, delay: 0.3 },
  { emoji: '🏅', x: 50, delay: 0.05 },
  { emoji: '🎊', x: 30, delay: 0.35 },
];

// ── Gradient backgrounds per category ──
const CATEGORY_GRADIENTS: Record<string, string> = {
  adventure: 'from-kv-orange/20 to-kv-yellow/20',
  learning: 'from-kv-green/20 to-kv-cyan/20',
  bedtime: 'from-kv-purple/20 to-kv-pink/20',
  funny: 'from-kv-pink/20 to-kv-red/20',
};

// ── TTS settings per age segment ──
const TTS_CONFIG: Record<AgeSegment, { rate: number; pitch: number }> = {
  toddler: { rate: 0.7, pitch: 1.2 },
  'early-learner': { rate: 0.85, pitch: 1.1 },
  kid: { rate: 1.0, pitch: 1.0 },
};

// ── Age-adaptive layout config ──
const AGE_LAYOUT: Record<
  AgeSegment,
  {
    textSize: string;
    sceneHeight: string;
    sceneEmojiSize: string;
    navButtonSize: 'toddler' | 'lg' | 'md';
    showPageNumbers: boolean;
    autoPlay: boolean;
  }
> = {
  toddler: {
    textSize: 'text-2xl md:text-3xl',
    sceneHeight: 'h-56 md:h-72',
    sceneEmojiSize: 'text-7xl md:text-9xl',
    navButtonSize: 'toddler',
    showPageNumbers: false,
    autoPlay: true,
  },
  'early-learner': {
    textSize: 'text-xl md:text-2xl',
    sceneHeight: 'h-48 md:h-64',
    sceneEmojiSize: 'text-6xl md:text-8xl',
    navButtonSize: 'lg',
    showPageNumbers: true,
    autoPlay: false,
  },
  kid: {
    textSize: 'text-lg md:text-xl',
    sceneHeight: 'h-40 md:h-56',
    sceneEmojiSize: 'text-5xl md:text-7xl',
    navButtonSize: 'md',
    showPageNumbers: true,
    autoPlay: false,
  },
};

// ── Bookworm badge threshold ──
const BOOKWORM_THRESHOLD = 5;

// ═══════════════════════════════════════════════════
// StoryViewer Component
// ═══════════════════════════════════════════════════
export default function StoryViewer() {
  const navigate = useNavigate();
  const { profileId, storyId } = useParams<{ profileId: string; storyId: string }>();
  const queryClient = useQueryClient();
  const activeChildProfile = useAuthStore((s) => s.activeChildProfile);
  const { playClick, playPop, playSuccess } = useSoundEffects();

  // ── Find story data ──
  const story: Story | undefined = useMemo(
    () => ALL_STORIES.find((s) => s.id === storyId),
    [storyId],
  );

  // ── Age-adaptive config ──
  const age = activeChildProfile?.age ?? 5;
  const config = useAgeAdaptiveConfig(age as 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10);
  const segment = config.segment;
  const layout = AGE_LAYOUT[segment];
  const ttsConfig = TTS_CONFIG[segment];

  // ── State ──
  const [currentPage, setCurrentPage] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(layout.autoPlay);
  const [showCompletion, setShowCompletion] = useState(false);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
  const pageRef = useRef<HTMLDivElement>(null);

  // ── Queries ──
  const childId = activeChildProfile?.id ?? '';
  const parentId = activeChildProfile?.parentId ?? '';

  const { data: favoriteStories = [] } = useQuery({
    queryKey: ['favorites', childId],
    queryFn: () => getFavoriteStories(childId),
    enabled: !!childId,
  });

  const { data: progressRecords = [] } = useQuery({
    queryKey: ['progress', childId],
    queryFn: () => getProgress(childId),
    enabled: !!childId,
  });

  const isFavorite = useMemo(
    () => storyId ? favoriteStories.some((f) => f.storyId === storyId) : false,
    [favoriteStories, storyId],
  );

  const favoriteDocId = useMemo(
    () => storyId ? favoriteStories.find((f) => f.storyId === storyId)?.id : undefined,
    [favoriteStories, storyId],
  );

  // ── Mutations ──
  const progressMutation = useMutation({
    mutationFn: (data: {
      moduleId: string;
      completed: boolean;
      percentComplete: number;
      stars: 0 | 1 | 2 | 3;
    }) =>
      upsertProgress({
        childId,
        parentId,
        moduleId: data.moduleId as 'alphabet' | 'numbers' | 'colors' | 'shapes' | 'science' | 'memory-match' | 'puzzle' | 'spelling-bee' | 'math-challenge',
        completed: data.completed,
        stars: data.stars,
        percentComplete: data.percentComplete,
        lastAccessedAt: new Date(),
        completedAt: data.completed ? new Date() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', childId] });
    },
  });

  const addFavMutation = useMutation({
    mutationFn: () =>
      addFavoriteStory({
        childId,
        parentId,
        storyId: storyId ?? '',
        addedAt: new Date(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', childId] });
    },
  });

  const removeFavMutation = useMutation({
    mutationFn: () => removeFavoriteStory(favoriteDocId ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', childId] });
    },
  });

  const badgeMutation = useMutation({
    mutationFn: () =>
      awardBadge({
        childId,
        parentId,
        category: 'bookworm',
        name: 'Bookworm',
        description: 'Read 5 or more stories!',
        icon: '🐛',
        earnedAt: new Date(),
      }),
  });

  // ── Text-to-Speech ──
  const ttsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTTS = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsReading(false);
    setHighlightedWordIndex(-1);
    if (ttsTimeoutRef.current) {
      clearTimeout(ttsTimeoutRef.current);
      ttsTimeoutRef.current = null;
    }
  }, []);

  const speakPage = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!('speechSynthesis' in window)) return;

      stopTTS();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = ttsConfig.rate;
      utterance.pitch = ttsConfig.pitch;
      utterance.onboundary = (event) => {
        if (segment === 'early-learner' && event.name === 'word') {
          const wordStart = event.charIndex;
          const precedingText = text.substring(0, wordStart);
          const wordIndex = precedingText.split(/\s+/).length - 1;
          setHighlightedWordIndex(wordIndex);
        }
      };
      utterance.onend = () => {
        setIsReading(false);
        setHighlightedWordIndex(-1);
        onEnd?.();
      };
      utterance.onerror = () => {
        setIsReading(false);
        setHighlightedWordIndex(-1);
      };
      setIsReading(true);
      window.speechSynthesis.speak(utterance);
    },
    [ttsConfig, segment, stopTTS],
  );

  // ── Auto-read on page change for toddlers ──
  useEffect(() => {
    if (!story || !page) return;

    if (segment === 'toddler' && isAutoPlay) {
      speakPage(page.text, () => {
        if (currentPage < totalPages - 1) {
          ttsTimeoutRef.current = setTimeout(() => {
            goNext();
          }, 1200);
        }
      });
    }

    return () => {
      stopTTS();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // ── Cleanup TTS on unmount ──
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (ttsTimeoutRef.current) {
        clearTimeout(ttsTimeoutRef.current);
      }
    };
  }, []);

  // ── Keyboard navigation ──
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        toggleReadAloud();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, isReading, story]);

  // ── Derived state ──
  const totalPages = story?.pages.length ?? 0;
  const page = story?.pages[currentPage];
  const progressPercent = totalPages > 0 ? Math.round(((currentPage + 1) / totalPages) * 100) : 0;
  const isLastPage = currentPage === totalPages - 1;
  const gradientClass = story ? CATEGORY_GRADIENTS[story.category] ?? 'from-kv-blue/20 to-kv-purple/20' : 'from-kv-blue/20 to-kv-purple/20';

  // ── Navigation handlers ──
  const goNext = useCallback(() => {
    playClick();
    if (currentPage < totalPages - 1) {
      setSlideDirection(1);
      stopTTS();
      setCurrentPage((p) => p + 1);
    } else if (!showCompletion) {
      setShowCompletion(true);
      playSuccess();
      // Upsert progress (story completed)
      if (storyId) {
        progressMutation.mutate({
          moduleId: storyId,
          completed: true,
          percentComplete: 100,
          stars: 3,
        });
      }
      // Check for Bookworm badge
      const completedStories = progressRecords.filter(
        (p) => p.completed && p.moduleId !== storyId,
      ).length;
      if (completedStories + 1 >= BOOKWORM_THRESHOLD) {
        badgeMutation.mutate();
      }
    }
  }, [currentPage, totalPages, showCompletion, storyId, progressMutation, progressRecords, badgeMutation, playClick, playSuccess, stopTTS]);

  const goPrev = useCallback(() => {
    playClick();
    if (currentPage > 0) {
      setSlideDirection(-1);
      stopTTS();
      setCurrentPage((p) => p - 1);
    }
  }, [currentPage, playClick, stopTTS]);

  const toggleReadAloud = useCallback(() => {
    if (isReading) {
      stopTTS();
    } else if (page) {
      speakPage(page.text);
    }
  }, [isReading, page, speakPage, stopTTS]);

  const toggleFavorite = useCallback(() => {
    if (isFavorite) {
      removeFavMutation.mutate();
    } else {
      addFavMutation.mutate();
    }
    playPop();
  }, [isFavorite, addFavMutation, removeFavMutation, playPop]);

  const handleReadAgain = useCallback(() => {
    setShowCompletion(false);
    setCurrentPage(0);
    stopTTS();
  }, [stopTTS]);

  // ── Focus management on page change ──
  useEffect(() => {
    pageRef.current?.focus();
  }, [currentPage]);

  // ── Story not found ──
  if (!story) {
    return (
      <div className="kv-page flex flex-col items-center justify-center min-h-screen gap-6">
        <span className="text-7xl" aria-hidden="true">📖</span>
        <h1 className="text-3xl font-display text-kv-gray-700">Story not found</h1>
        <p className="text-kv-gray-500 text-center">
          The story you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button
          variant="primary"
          size="lg"
          leftIcon={<IconArrowLeft size={20} />}
          onClick={() => navigate(`/stories/${profileId}`)}
        >
          Back to Library
        </Button>
      </div>
    );
  }

  if (!page) return null;

  const sceneEmoji = SCENE_EMOJIS[page.svgScene] || '📖';
  const words = page.text.split(/\s+/);

  // ── Completion overlay ──
  if (showCompletion) {
    return (
      <div className="kv-page flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
        {/* Confetti */}
        {CONFETTI.map((c, i) => (
          <motion.span
            key={i}
            className="absolute text-4xl md:text-6xl pointer-events-none select-none"
            aria-hidden="true"
            initial={{ y: -60, opacity: 0, x: `${c.x}%` }}
            animate={{ y: '110vh', opacity: [0, 1, 1, 0], x: `${c.x}%` }}
            transition={{ duration: 2.5, delay: c.delay, ease: 'easeOut' }}
          >
            {c.emoji}
          </motion.span>
        ))}

        <AnimatedContainer variant="pop" delay={0.1}>
          <div className="kv-card p-8 md:p-12 flex flex-col items-center gap-6 text-center max-w-md mx-auto relative z-10">
            <motion.span
              className="text-8xl md:text-9xl"
              aria-hidden="true"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
            >
              🏆
            </motion.span>

            <h2 className="text-3xl md:text-4xl font-display text-kv-yellow">
              Story Complete!
            </h2>

            <p className="text-lg text-kv-gray-600">
              You finished reading &ldquo;{story.title}&rdquo;!
            </p>

            <AchievementBadge
              name="Story Reader"
              description="Finished a story"
              emoji="📖"
              earned={true}
              size="lg"
            />

            <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full">
              <Button
                variant="success"
                size="lg"
                fullWidth
                onClick={handleReadAgain}
              >
                🔄 Read Again
              </Button>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => navigate(`/stories/${profileId}`)}
              >
                📚 Library
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<IconHome size={20} />}
                onClick={() => navigate(`/kids/${profileId}`)}
              >
                Home
              </Button>
            </div>
          </div>
        </AnimatedContainer>
      </div>
    );
  }

  // ── Main viewer ──
  return (
    <div className="kv-page flex flex-col min-h-screen">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            stopTTS();
            navigate(`/stories/${profileId}`);
          }}
          aria-label="Back to story library"
          leftIcon={<IconArrowLeft size={18} />}
        >
          Library
        </Button>

        <h1 className="flex-1 text-lg md:text-xl font-display text-kv-gray-800 text-center truncate px-2">
          {story.title}
        </h1>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            stopTTS();
            navigate(`/kids/${profileId}`);
          }}
          aria-label="Go to home"
          leftIcon={<IconHome size={18} />}
        >
          Home
        </Button>
      </header>

      {/* ── Progress bar ── */}
      <div className="mb-4">
        <ProgressBar
          value={currentPage + 1}
          max={totalPages}
          variant="pink"
          size="sm"
          showLabel={segment !== 'toddler'}
          labelPosition="top"
          animated
        />
      </div>

      {/* ── Auto-play indicator (toddlers) ── */}
      {segment === 'toddler' && isAutoPlay && (
        <div className="flex items-center justify-center gap-2 mb-2">
          <motion.span
            className="w-2.5 h-2.5 rounded-full bg-kv-green"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            aria-hidden="true"
          />
          <span className="text-xs font-bold text-kv-green uppercase tracking-wider">
            Auto-playing
          </span>
        </div>
      )}

      {/* ── Story Content ── */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait" custom={slideDirection}>
          <motion.div
            key={currentPage}
            custom={slideDirection}
            initial={{ opacity: 0, x: slideDirection * 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -slideDirection * 80 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="w-full max-w-2xl"
          >
            <MotionCard
              asMotion
              variant="default"
              padding="lg"
              whileHover={undefined}
              whileTap={undefined}
            >
              {/* ── Scene Illustration ── */}
              <div
                className={cn(
                  'w-full rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 relative overflow-hidden',
                  layout.sceneHeight,
                  gradientClass,
                )}
                role="img"
                aria-label={`Scene illustration for page ${currentPage + 1}: ${sceneEmoji}`}
              >
                <motion.span
                  className={cn('select-none', layout.sceneEmojiSize)}
                  aria-hidden="true"
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {sceneEmoji}
                </motion.span>
              </div>

              {/* ── Story Text ── */}
              <div
                ref={pageRef}
                tabIndex={-1}
                aria-live="polite"
                className="outline-none"
              >
                <p
                  className={cn(
                    'text-kv-gray-800 leading-relaxed text-center font-sans mb-6',
                    layout.textSize,
                  )}
                >
                  {segment === 'early-learner' && isReading
                    ? words.map((word, i) => (
                        <span
                          key={i}
                          className={cn(
                            'transition-colors duration-150',
                            i === highlightedWordIndex
                              ? 'text-kv-pink font-bold underline decoration-2 underline-offset-4'
                              : '',
                          )}
                        >
                          {word}{' '}
                        </span>
                      ))
                    : page.text}
                </p>
              </div>

              {/* ── Page Indicator ── */}
              {layout.showPageNumbers ? (
                <p className="text-center text-sm text-kv-gray-400 mb-2">
                  Page {currentPage + 1} of {totalPages}
                </p>
              ) : (
                /* Dots indicator for toddlers */
                <div className="flex items-center justify-center gap-2 mb-2" aria-label={`Page ${currentPage + 1} of ${totalPages}`}>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'w-3 h-3 rounded-full transition-all duration-300',
                        i === currentPage
                          ? 'bg-kv-pink scale-125'
                          : 'bg-kv-gray-200',
                      )}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              )}
            </MotionCard>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Controls ── */}
      <nav
        className="flex items-center justify-between max-w-2xl mx-auto w-full py-4 gap-3"
        aria-label="Story navigation"
      >
        {/* Previous button */}
        <Button
          variant="secondary"
          size={layout.navButtonSize}
          disabled={currentPage === 0}
          onClick={goPrev}
          aria-label="Previous page"
        >
          ← Prev
        </Button>

        {/* Center controls */}
        <div className="flex items-center gap-2">
          {/* Read Aloud / Stop button */}
          <MotionButton
            variant={isReading ? 'warning' : 'success'}
            size={layout.navButtonSize}
            onClick={toggleReadAloud}
            aria-label={isReading ? 'Stop reading aloud' : 'Read aloud'}
            whileTap={{ scale: 0.9 }}
          >
            {isReading ? '🔊 Stop' : '🔊 Read Aloud'}
          </MotionButton>

          {/* Auto-play toggle (early-learner only) */}
          {segment === 'early-learner' && (
            <Button
              variant={isAutoPlay ? 'primary' : 'ghost'}
              size={layout.navButtonSize}
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              aria-label={isAutoPlay ? 'Turn off auto-play' : 'Turn on auto-play'}
              aria-pressed={isAutoPlay}
            >
              ▶️ Auto
            </Button>
          )}

          {/* Favorite toggle */}
          <motion.button
            onClick={toggleFavorite}
            className={cn(
              'flex items-center justify-center rounded-2xl border-2 transition-colors',
              isFavorite
                ? 'border-kv-pink bg-kv-pink/10'
                : 'border-kv-gray-200 bg-white hover:border-kv-pink/40',
            )}
            style={{
              width: config.minTapTargetPx,
              height: config.minTapTargetPx,
            }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.span
              className="text-3xl"
              aria-hidden="true"
              animate={isFavorite ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {isFavorite ? '❤️' : '🤍'}
            </motion.span>
          </motion.button>
        </div>

        {/* Next / Finish button */}
        <Button
          variant={isLastPage ? 'success' : 'secondary'}
          size={layout.navButtonSize}
          onClick={goNext}
          disabled={false}
          aria-label={isLastPage ? 'Finish story' : 'Next page'}
        >
          {isLastPage ? '✨ Finish' : 'Next →'}
        </Button>
      </nav>

      {/* ── Story info badges ── */}
      <div className="flex items-center justify-center gap-2 mt-2 mb-4">
        <Badge variant="info" size="sm" icon="📖">
          {story.category}
        </Badge>
        {progressPercent === 100 && (
          <Badge variant="achievement" size="sm" icon="⭐">
            Complete!
          </Badge>
        )}
      </div>
    </div>
  );
}
