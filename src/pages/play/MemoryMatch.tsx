// ──────────────────────────────────────────────
// KidsVerse — Memory Match Game (Task 6a)
// Age-adaptive memory card matching with
// Firestore integration, sound effects, and WCAG accessibility.
// ──────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import { useAgeAdaptiveConfig } from '@/hooks/useAgeAdaptiveConfig';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import {
  saveGameScore,
  upsertProgress,
  awardBadge,
  getProgress,
} from '@/lib/firestore';
import {
  ProgressBar,
  MotionCard,
  MotionButton,
  Button,
  Badge,
  StarRating,
  AchievementBadge,
  IconArrowLeft,
  IconHome,
  AnimatedContainer,
  StaggerGrid,
  StaggerItem,
  fadeVariants,
  popVariants,
} from '@/components';
import { cn, shuffle } from '@/lib/utils';
import type { DifficultyLevel, GameType } from '@/types';

// ── Types ──

type GamePhase = 'ready' | 'playing' | 'complete';

interface EmojiItem {
  emoji: string;
  label: string;
}

interface MemoryCard {
  id: number;
  pairId: number;
  emoji: string;
  label: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface DifficultyConfig {
  difficulty: DifficultyLevel;
  pairs: number;
  gridClass: string;
  cardMinClass: string;
  emojiSizeClass: string;
  showLabels: boolean;
}

// ── Emoji Pools by Age Segment ──

const TODDLER_EMOJIS: EmojiItem[] = [
  { emoji: '🐱', label: '' },
  { emoji: '🐶', label: '' },
  { emoji: '🐼', label: '' },
  { emoji: '🦁', label: '' },
  { emoji: '🐸', label: '' },
  { emoji: '🐰', label: '' },
  { emoji: '🐻', label: '' },
  { emoji: '🐵', label: '' },
];

const EARLY_LEARNER_EMOJIS: EmojiItem[] = [
  { emoji: '🐱', label: 'Cat' },
  { emoji: '🐶', label: 'Dog' },
  { emoji: '🦊', label: 'Fox' },
  { emoji: '🐼', label: 'Panda' },
  { emoji: '🦁', label: 'Lion' },
  { emoji: '🐸', label: 'Frog' },
  { emoji: '🐵', label: 'Monkey' },
  { emoji: '🦋', label: 'Butterfly' },
  { emoji: '🐬', label: 'Dolphin' },
  { emoji: '🦉', label: 'Owl' },
];

const KID_EMOJIS: EmojiItem[] = [
  { emoji: '🧠', label: 'Brain' },
  { emoji: '🎨', label: 'Art' },
  { emoji: '🔬', label: 'Science' },
  { emoji: '📚', label: 'Books' },
  { emoji: '🌍', label: 'Earth' },
  { emoji: '🎵', label: 'Music' },
  { emoji: '🚀', label: 'Rocket' },
  { emoji: '💡', label: 'Idea' },
  { emoji: '🔭', label: 'Telescope' },
  { emoji: '🎭', label: 'Theater' },
  { emoji: '🏛️', label: 'Museum' },
  { emoji: '🧩', label: 'Puzzle' },
];

// ── Difficulty Configurations ──

const DIFFICULTY_CONFIGS: Record<string, DifficultyConfig> = {
  toddler: {
    difficulty: 'easy',
    pairs: 4,
    gridClass: 'grid-cols-4 gap-3 md:gap-4',
    cardMinClass: 'min-h-[80px] md:min-h-[100px]',
    emojiSizeClass: 'text-4xl md:text-5xl',
    showLabels: false,
  },
  'early-learner': {
    difficulty: 'medium',
    pairs: 6,
    gridClass: 'grid-cols-4 gap-3 md:gap-4',
    cardMinClass: 'min-h-[60px] md:min-h-[80px]',
    emojiSizeClass: 'text-3xl md:text-4xl',
    showLabels: true,
  },
  kid: {
    difficulty: 'hard',
    pairs: 8,
    gridClass: 'grid-cols-4 gap-2 md:gap-3',
    cardMinClass: 'min-h-[48px] md:min-h-[64px]',
    emojiSizeClass: 'text-2xl md:text-3xl',
    showLabels: true,
  },
};

// ── Confetti Pieces (no inline styles — Tailwind position classes) ──

const CONFETTI_PIECES = [
  { emoji: '🎉', xClass: 'left-[10%]', delay: 0, drift: 30 },
  { emoji: '⭐', xClass: 'left-[25%]', delay: 0.1, drift: -20 },
  { emoji: '🎊', xClass: 'left-[50%]', delay: 0.2, drift: 40 },
  { emoji: '🌟', xClass: 'left-[75%]', delay: 0.15, drift: -35 },
  { emoji: '✨', xClass: 'left-[90%]', delay: 0.25, drift: 25 },
  { emoji: '🎈', xClass: 'left-[15%]', delay: 0.3, drift: -30 },
  { emoji: '🏅', xClass: 'left-[40%]', delay: 0.05, drift: 15 },
  { emoji: '💫', xClass: 'left-[60%]', delay: 0.2, drift: -25 },
  { emoji: '🎪', xClass: 'left-[85%]', delay: 0.1, drift: 35 },
  { emoji: '🎊', xClass: 'left-[30%]', delay: 0.35, drift: -15 },
];

// ── Constants ──

const GAME_TYPE: GameType = 'memory-match';
const MISMATCH_DELAY_MS = 800;

// ── Helpers ──

function createCards(pairs: number, pool: EmojiItem[]): MemoryCard[] {
  const selected = shuffle(pool).slice(0, pairs);
  const cards: MemoryCard[] = [];
  selected.forEach((item, index) => {
    cards.push({
      id: index * 2,
      pairId: index,
      emoji: item.emoji,
      label: item.label,
      isFlipped: false,
      isMatched: false,
    });
    cards.push({
      id: index * 2 + 1,
      pairId: index,
      emoji: item.emoji,
      label: item.label,
      isFlipped: false,
      isMatched: false,
    });
  });
  return shuffle(cards);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function calculateStars(moves: number, totalPairs: number): 1 | 2 | 3 {
  if (moves <= totalPairs + 2) return 3;
  if (moves <= totalPairs + 6) return 2;
  return 1;
}

// ═══════════════════════════════════════════
// Component
// ═══════════════════════════════════════════

export default function MemoryMatch() {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const queryClient = useQueryClient();

  const activeChildProfile = useAuthStore((s) => s.activeChildProfile);
  const { playClick, playSuccess, playError, playPop } = useSoundEffects();

  const age = activeChildProfile?.age ?? 5;
  const config = useAgeAdaptiveConfig(age);

  const childId = activeChildProfile?.id ?? '';
  const parentId = activeChildProfile?.parentId ?? '';

  // ── Auto-select difficulty based on age segment ──
  const diffConfig: DifficultyConfig =
    DIFFICULTY_CONFIGS[config.segment] ?? DIFFICULTY_CONFIGS['early-learner']!;

  // ── State ──
  const [phase, setPhase] = useState<GamePhase>('ready');
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [mismatchedIds, setMismatchedIds] = useState<Set<number>>(new Set());
  const [gameKey, setGameKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // ── Computed Values ──
  const totalPairs = diffConfig.pairs;
  const isComplete = phase === 'playing' && matches === totalPairs;
  const stars = isComplete ? calculateStars(moves, totalPairs) : 0;
  const showTimer = config.enableTimedChallenges && phase === 'playing';

  // ── Emoji pool by segment ──
  const emojiPool = useMemo<EmojiItem[]>(() => {
    switch (config.segment) {
      case 'toddler':
        return TODDLER_EMOJIS;
      case 'early-learner':
        return EARLY_LEARNER_EMOJIS;
      case 'kid':
        return KID_EMOJIS;
    }
  }, [config.segment]);

  // ── Load existing progress ──
  const { data: progressData } = useQuery({
    queryKey: ['progress', childId, 'memory-match'],
    queryFn: () => getProgress(childId),
    enabled: !!childId,
  });

  const memoryProgress = useMemo(() => {
    return (progressData ?? []).filter((p) => p.moduleId === 'memory-match');
  }, [progressData]);

  const bestStars = useMemo(() => {
    if (memoryProgress.length === 0) return 0;
    return Math.max(...memoryProgress.map((p) => p.stars));
  }, [memoryProgress]);

  const gamesPlayed = memoryProgress.length;

  // ── Firestore Mutations ──
  const saveScoreMutation = useMutation({
    mutationFn: () =>
      saveGameScore({
        childId,
        parentId,
        gameType: GAME_TYPE,
        score: stars,
        maxScore: 3,
        difficulty: diffConfig.difficulty,
        durationSeconds: timer,
        playedAt: new Date(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['progress', childId, 'memory-match'],
      });
    },
  });

  const progressMutation = useMutation({
    mutationFn: () =>
      upsertProgress({
        childId,
        parentId,
        moduleId: GAME_TYPE,
        completed: true,
        stars: stars as 0 | 1 | 2 | 3,
        percentComplete: 100,
        lastAccessedAt: new Date(),
        completedAt: new Date(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['progress', childId, 'memory-match'],
      });
    },
  });

  const badgeMutation = useMutation({
    mutationFn: () =>
      awardBadge({
        childId,
        parentId,
        category: 'perfect-score',
        name: 'Memory Master',
        description: 'You earned 3 stars on Memory Match!',
        icon: '🧠',
        earnedAt: new Date(),
      }),
  });

  // ── Timer Effect ──
  useEffect(() => {
    if (phase === 'playing' && !isComplete) {
      timerRef.current = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, isComplete]);

  // ── Completion Effect ──
  useEffect(() => {
    if (phase !== 'playing' || matches !== totalPairs || completedRef.current) {
      return;
    }
    completedRef.current = true;
    playPop();

    if (childId && parentId) {
      saveScoreMutation.mutate();
      progressMutation.mutate();
      if (stars === 3) {
        badgeMutation.mutate();
      }
    }

    const timeout = setTimeout(() => setPhase('complete'), 1800);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, totalPairs, phase]);

  // ── Handlers ──

  const startGame = useCallback(() => {
    setCards(createCards(totalPairs, emojiPool));
    setFlippedIds([]);
    setMoves(0);
    setMatches(0);
    setTimer(0);
    setIsChecking(false);
    setMismatchedIds(new Set());
    setGameKey((k) => k + 1);
    completedRef.current = false;
    setPhase('playing');
    playClick();
  }, [totalPairs, emojiPool, playClick]);

  const handleCardClick = useCallback(
    (cardId: number) => {
      if (isChecking || flippedIds.length >= 2) return;
      const card = cards.find((c) => c.id === cardId);
      if (!card || card.isFlipped || card.isMatched) return;

      playClick();
      const newFlipped = [...flippedIds, cardId];
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c)),
      );
      setFlippedIds(newFlipped);

      if (newFlipped.length === 2) {
        const newMoves = moves + 1;
        setMoves(newMoves);
        setIsChecking(true);

        const firstId = newFlipped[0]!;
        const secondId = newFlipped[1]!;
        const card1 = cards.find((c) => c.id === firstId)!;
        const card2 = cards.find((c) => c.id === secondId)!;

        if (card1.pairId === card2.pairId) {
          // ── Match ──
          playSuccess();
          const newMatches = matches + 1;
          setMatches(newMatches);
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, isMatched: true }
                : c,
            ),
          );
          setFlippedIds([]);
          setIsChecking(false);
        } else {
          // ── Mismatch ──
          playError();
          setMismatchedIds(new Set([firstId, secondId]));
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, isFlipped: false }
                  : c,
              ),
            );
            setFlippedIds([]);
            setIsChecking(false);
            setMismatchedIds(new Set());
          }, MISMATCH_DELAY_MS);
        }
      }
    },
    [cards, flippedIds, isChecking, moves, matches, playClick, playSuccess, playError],
  );

  const handleGoHome = useCallback(() => {
    navigate(`/kids/${profileId}`);
  }, [navigate, profileId]);

  const handlePlayAgain = useCallback(() => {
    startGame();
  }, [startGame]);

  // ── Size variant for buttons based on age ──
  const buttonSize = config.segment === 'toddler' ? 'toddler' as const : 'lg' as const;

  // ═══════════════════════════════════════════
  // Ready Screen
  // ═══════════════════════════════════════════

  const readyScreen = (
    <div className="kv-page flex flex-col items-center justify-center min-h-[80vh]">
      <AnimatedContainer variant="pop" className="flex flex-col items-center gap-6 w-full max-w-md px-4">
        <motion.span
          className="text-7xl select-none"
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          aria-hidden="true"
        >
          🧠
        </motion.span>

        <div className="text-center">
          <h1 className="font-display text-4xl text-kv-blue mb-2">
            Memory Match
          </h1>
          {config.showTextLabels && (
            <p className="text-kv-gray-500 text-lg">
              Find all the matching pairs!
            </p>
          )}
        </div>

        <MotionCard asMotion={true} variant="elevated" padding="md" className="w-full text-center">
          <div className="flex flex-col items-center gap-3">
            <Badge variant="primary" size="lg">
              {`${diffConfig.pairs} pairs`}
            </Badge>
            <Badge variant="default" size="md">
              {diffConfig.difficulty === 'easy'
                ? '😊 Easy'
                : diffConfig.difficulty === 'medium'
                  ? '🤔 Medium'
                  : '🧠 Hard'}
            </Badge>

            {gamesPlayed > 0 && config.showTextLabels && (
              <div className="flex flex-col items-center gap-1 mt-2">
                <p className="text-sm text-kv-gray-500">
                  Games played: <span className="font-bold text-kv-gray-700">{gamesPlayed}</span>
                </p>
                {bestStars > 0 && (
                  <StarRating rating={bestStars} size="sm" label="Best score" />
                )}
              </div>
            )}
          </div>
        </MotionCard>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <MotionButton
            variant="primary"
            size={buttonSize}
            fullWidth
            onClick={startGame}
            aria-label="Start Memory Match game"
          >
            Play! 🎮
          </MotionButton>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={handleGoHome}
            leftIcon={<IconHome size={18} />}
            aria-label="Go home"
          >
            Home
          </Button>
        </div>
      </AnimatedContainer>
    </div>
  );

  // ═══════════════════════════════════════════
  // Playing Screen
  // ═══════════════════════════════════════════

  const playingScreen = (
    <div className="kv-page">
      {/* Skip to game content link */}
      <a
        href="#game-board"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-kv-blue focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:shadow-card kv-button-base"
      >
        Skip to game
      </a>

      {/* ── Header ── */}
      <header className="mb-4 md:mb-6">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={startGame}
            className="kv-button-base flex items-center gap-2 bg-kv-gray-200 text-kv-gray-600 px-3 py-2 text-sm rounded-xl hover:bg-kv-gray-300 transition-colors"
            aria-label="Restart game"
          >
            <IconArrowLeft size={18} />
            {config.showTextLabels && <span>Restart</span>}
          </button>
          <h1 className="font-display text-2xl md:text-3xl text-kv-blue">
            {config.showTextLabels ? 'Memory Match' : '🧠'}
          </h1>
          <button
            onClick={handleGoHome}
            className="kv-button-base w-10 h-10 flex items-center justify-center bg-white text-kv-gray-600 rounded-xl shadow-card hover:shadow-card-hover transition-shadow"
            aria-label="Go home"
          >
            <IconHome size={18} />
          </button>
        </div>

        {/* ── Stats Bar ── */}
        <div className="flex items-center justify-between gap-2 mb-3" aria-live="polite">
          {showTimer && (
            <Badge variant="info" size="sm">
              {`⏱ ${formatTime(timer)}`}
            </Badge>
          )}
          <Badge variant="default" size="sm">
            {`🔄 ${moves}`}
          </Badge>
          <Badge variant="success" size="sm">
            {`✅ ${matches}/${totalPairs}`}
          </Badge>
        </div>

        {/* ── Progress Bar ── */}
        <ProgressBar
          value={matches}
          max={totalPairs}
          variant="green"
          size="md"
          showLabel
          labelPosition="top"
          animated
          aria-label={`Match progress: ${matches} of ${totalPairs} pairs found`}
        />
      </header>

      {/* ── Game Board ── */}
      <main id="game-board" tabIndex={-1} className="outline-none">
        <StaggerGrid key={gameKey} className={cn('grid', diffConfig.gridClass, 'max-w-xl mx-auto')}>
          {cards.map((card) => {
            const isMismatched = mismatchedIds.has(card.id);

            return (
              <StaggerItem key={card.id}>
                <motion.button
                  animate={
                    isMismatched
                      ? { x: [0, -6, 6, -6, 6, 0] }
                      : card.isMatched
                        ? { scale: [1, 1.15, 1] }
                        : {}
                  }
                  transition={
                    isMismatched
                      ? { duration: 0.4 }
                      : card.isMatched
                        ? { duration: 0.5, type: 'spring' as const, stiffness: 300 }
                        : { duration: 0.2 }
                  }
                  onClick={() => handleCardClick(card.id)}
                  disabled={card.isFlipped || card.isMatched || isChecking}
                  className={cn(
                    'aspect-square rounded-2xl cursor-pointer outline-none',
                    'focus-visible:ring-4 focus-visible:ring-kv-blue/50 focus-visible:ring-offset-2',
                    'disabled:cursor-default',
                    diffConfig.cardMinClass,
                  )}
                  aria-label={
                    card.isFlipped || card.isMatched
                      ? `${card.emoji}${card.label ? `, ${card.label}` : ''}${card.isMatched ? ', matched' : ''}`
                      : 'Hidden card, tap to flip'
                  }
                >
                  <div className="perspective-[1000px] w-full h-full">
                    <motion.div
                      animate={{
                        rotateY: card.isFlipped || card.isMatched ? 180 : 0,
                      }}
                      transition={{
                        duration: 0.4,
                        type: 'spring' as const,
                        stiffness: 260,
                        damping: 25,
                      }}
                      className="relative w-full h-full [transform-style:preserve-3d]"
                    >
                      {/* ── Front Face (hidden) ── */}
                      <div
                        className={cn(
                          'absolute inset-0 flex items-center justify-center rounded-2xl backface-hidden',
                          'bg-kv-blue shadow-card',
                          'hover:shadow-card-hover transition-shadow duration-200',
                          !card.isFlipped && !card.isMatched && 'cursor-pointer',
                        )}
                      >
                        <span
                          className="text-white text-2xl md:text-3xl font-bold select-none"
                          aria-hidden="true"
                        >
                          ?
                        </span>
                      </div>

                      {/* ── Back Face (emoji) ── */}
                      <div
                        className={cn(
                          'absolute inset-0 flex flex-col items-center justify-center rounded-2xl backface-hidden rotate-y-180',
                          card.isMatched
                            ? 'bg-kv-green/15 shadow-none ring-2 ring-kv-green/40'
                            : isMismatched
                              ? 'bg-kv-red/10 shadow-card-hover ring-2 ring-kv-red/40'
                              : 'bg-white shadow-card-hover ring-2 ring-kv-blue/20',
                        )}
                      >
                        <span
                          className={cn('select-none', diffConfig.emojiSizeClass)}
                          aria-hidden="true"
                        >
                          {card.emoji}
                        </span>
                        {diffConfig.showLabels && card.label && (
                          <span className="text-xs md:text-sm text-kv-gray-600 font-bold mt-1 leading-tight text-center px-1">
                            {card.label}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </motion.button>
              </StaggerItem>
            );
          })}
        </StaggerGrid>
      </main>

      {/* ── Match celebration toast ── */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              variants={popVariants}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-3xl shadow-modal px-8 py-6 text-center"
            >
              <span className="text-5xl block mb-2" aria-hidden="true">
                🎉
              </span>
              <p className="font-display text-2xl text-kv-blue font-bold">
                Amazing!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ═══════════════════════════════════════════
  // Complete Screen
  // ═══════════════════════════════════════════

  const completeScreen = (
    <div className="kv-page flex flex-col items-center justify-center min-h-[80vh]">
      {/* ── Confetti ── */}
      {CONFETTI_PIECES.map((piece, i) => (
        <motion.div
          key={i}
          className={cn(
            'fixed pointer-events-none select-none text-3xl md:text-4xl z-50',
            piece.xClass,
            '-top-5',
          )}
          initial={{ opacity: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [0, 120, 240, 460],
            x: [0, piece.drift, piece.drift * -0.5, piece.drift * 1.2],
            scale: [0, 1.2, 1, 0.6],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 3, delay: piece.delay, ease: 'easeOut' as const }}
          aria-hidden="true"
        >
          {piece.emoji}
        </motion.div>
      ))}

      <AnimatedContainer variant="pop" className="flex flex-col items-center gap-6 px-4">
        <motion.span
          className="text-7xl select-none"
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.5 }}
          aria-hidden="true"
        >
          {stars === 3 ? '🏆' : stars === 2 ? '🌟' : '💪'}
        </motion.span>

        <h1 className="font-display text-4xl text-kv-blue text-center">
          {stars === 3 ? 'Memory Master!' : 'Great Job!'}
        </h1>

        <StarRating
          rating={stars}
          size="lg"
          label={`You earned ${stars} out of 3 stars`}
        />

        <p className="text-2xl text-kv-gray-700 text-center">
          Completed in{' '}
          <span className="font-bold text-kv-blue">{moves}</span>{' '}
          move{moves !== 1 ? 's' : ''}
        </p>

        {showTimer && (
          <p className="text-lg text-kv-gray-500 text-center">
            Time:{' '}
            <span className="font-bold text-kv-gray-700">{formatTime(timer)}</span>
          </p>
        )}

        <p className="text-lg text-kv-gray-500 text-center">
          {stars === 3
            ? 'Perfect memory! You are a Memory Master! 🏆'
            : stars === 2
              ? 'Great job! Try for 3 stars next time! 🌟'
              : 'Good try! Keep practicing to improve! 💪'}
        </p>

        {/* ── Memory Master Badge ── */}
        {stars === 3 && (
          <motion.div
            variants={popVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
          >
            <AchievementBadge
              name="Memory Master"
              description="You earned 3 stars on Memory Match!"
              emoji="🧠"
              earned
              size="lg"
            />
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <MotionButton
            variant="primary"
            size={buttonSize}
            onClick={handlePlayAgain}
            aria-label="Play again"
          >
            Play Again 🔄
          </MotionButton>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleGoHome}
            leftIcon={<IconHome size={18} />}
            aria-label="Go home"
          >
            Home
          </Button>
        </div>
      </AnimatedContainer>
    </div>
  );

  // ═══════════════════════════════════════════
  // Phase Router (fade transition between phases)
  // ═══════════════════════════════════════════

  return (
    <div className="kv-page bg-gradient-to-b from-kv-blue/5 to-kv-cream min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          {phase === 'ready' && readyScreen}
          {phase === 'playing' && playingScreen}
          {phase === 'complete' && completeScreen}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
