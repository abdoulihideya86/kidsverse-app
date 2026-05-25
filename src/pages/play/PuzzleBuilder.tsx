import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import { useAgeAdaptiveConfig } from '@/hooks/useAgeAdaptiveConfig';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { saveGameScore, upsertProgress, awardBadge, getProgress } from '@/lib/firestore';
import {
  ProgressBar, MotionCard, MotionButton, Button,
  Badge, StarRating, AchievementBadge,
  IconArrowLeft, IconHome,
  AnimatedContainer, StaggerGrid, StaggerItem,
} from '@/components';
import { cn, shuffle } from '@/lib/utils';
import type { AgeSegment, DifficultyLevel, GameType } from '@/types';

// ═══════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════

interface MatchingTile {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface SwapTile {
  id: number;
  label: number;
  correctIndex: number;
  color: string;
}

type GamePhase = 'ready' | 'playing' | 'complete';

// ═══════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════

const TODDLER_ANIMALS = ['🐱', '🐶', '🦊', '🐼', '🦁', '🐸', '🐵', '🦋'];

const ORDER_COLORS = [
  '#FF6B6B', '#FFA94D', '#FFD93D', '#6BCB77', '#4D96FF',
  '#9B59B6', '#FF69B4', '#00CED1', '#2DD4BF',
];

const PICTURE_COLORS = [
  '#4D96FF', '#5DA6FF', '#6DB6FF', '#7DC6FF',
  '#9B59B6', '#AB69C6', '#BB79D6', '#CB89E6',
  '#FF69B4', '#FF79C4', '#FF89D4', '#FF99E4',
  '#FFA94D', '#FFB96D', '#FFC98D', '#FFD9AD',
];

const SEGMENT_TITLES: Record<AgeSegment, string> = {
  toddler: 'Animal Match',
  'early-learner': 'Number Order',
  kid: 'Picture Puzzle',
};

const SEGMENT_INSTRUCTIONS: Record<AgeSegment, string> = {
  toddler: 'Tap to flip and find matching animals!',
  'early-learner': 'Tap two tiles to swap — order them 1 to 9!',
  kid: 'Swap tiles to complete the picture!',
};

interface SegmentPuzzleConfig {
  gridCols: string;
  gridMaxWidth: string;
  tileSize: string;
  emojiSize: string;
  textSize: string;
  difficulty: DifficultyLevel;
  optimalMoves: number;
  totalPieces: number;
  totalPairs: number;
  showTimer: boolean;
}

const PUZZLE_CONFIGS: Record<AgeSegment, SegmentPuzzleConfig> = {
  toddler: {
    gridCols: 'grid-cols-2',
    gridMaxWidth: 'max-w-xs',
    tileSize: 'min-h-[80px]',
    emojiSize: 'text-5xl md:text-6xl',
    textSize: 'text-lg',
    difficulty: 'easy',
    optimalMoves: 2,
    totalPieces: 4,
    totalPairs: 2,
    showTimer: false,
  },
  'early-learner': {
    gridCols: 'grid-cols-3',
    gridMaxWidth: 'max-w-sm',
    tileSize: 'min-h-[60px]',
    emojiSize: 'text-3xl',
    textSize: 'text-2xl font-bold',
    difficulty: 'medium',
    optimalMoves: 5,
    totalPieces: 9,
    totalPairs: 0,
    showTimer: true,
  },
  kid: {
    gridCols: 'grid-cols-4',
    gridMaxWidth: 'max-w-md',
    tileSize: 'min-h-[48px]',
    emojiSize: 'text-2xl',
    textSize: 'text-lg font-bold',
    difficulty: 'hard',
    optimalMoves: 8,
    totalPieces: 16,
    totalPairs: 0,
    showTimer: true,
  },
};

// ═══════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════

function createMatchingTiles(pairCount: number): MatchingTile[] {
  const selected = shuffle(TODDLER_ANIMALS).slice(0, pairCount);
  const pairs = [...selected, ...selected];
  const tiles = pairs.map((emoji, i) => ({
    id: i,
    emoji,
    isFlipped: false,
    isMatched: false,
  }));
  return shuffle(tiles);
}

function createSwapTiles(count: number, colors: string[]): SwapTile[] {
  const tiles: SwapTile[] = Array.from({ length: count }, (_, i) => ({
    id: i,
    label: i + 1,
    correctIndex: i,
    color: colors[i] ?? '#ccc',
  }));
  let shuffled = shuffle(tiles);
  while (shuffled.every((t, i) => t.correctIndex === i)) {
    shuffled = shuffle(tiles);
  }
  return shuffled;
}

function computeMinSwaps(correctIndices: number[]): number {
  const n = correctIndices.length;
  const visited = new Array<boolean>(n).fill(false);
  let cycles = 0;
  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;
    let j = i;
    while (!visited[j]) {
      visited[j] = true;
      j = correctIndices[j] ?? i;
    }
    cycles++;
  }
  return n - cycles;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════
// Confetti
// ═══════════════════════════════════════════════════════

const CONFETTI_EMOJIS = ['🎉', '⭐', '🎊', '✨', '🌟', '🎈', '🧩', '🏆'];

interface ConfettiParticle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  delay: number;
}

function Confetti() {
  const particles = useMemo<ConfettiParticle[]>(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length]!,
        x: (Math.random() - 0.5) * 500,
        y: -(Math.random() * 300 + 50),
        rotate: Math.random() * 720 - 360,
        scale: 0.6 + Math.random() * 0.8,
        delay: Math.random() * 0.6,
      })),
    [],
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 0 }}
          animate={{
            opacity: 0,
            y: p.y,
            x: p.x,
            rotate: p.rotate,
            scale: p.scale,
          }}
          transition={{ duration: 2.5, delay: p.delay, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 text-3xl select-none"
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════

export default function PuzzleBuilder() {
  // ── Navigation & Auth ──
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const { activeChildProfile } = useAuthStore();

  // ── Age-Adaptive Config ──
  const age = activeChildProfile?.age ?? 5;
  const adaptiveConfig = useAgeAdaptiveConfig(age as 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10);
  const segment = adaptiveConfig.segment;
  const pCfg = PUZZLE_CONFIGS[segment];
  const isMatching = segment === 'toddler';

  // ── Sound Effects ──
  const { playClick, playSuccess, playPop, playSound } = useSoundEffects();

  // ── Firestore Queries & Mutations ──
  const queryClient = useQueryClient();
  const childId = activeChildProfile?.id ?? '';
  const parentId = activeChildProfile?.parentId ?? '';

  const { data: progressData } = useQuery({
    queryKey: ['progress', childId],
    queryFn: () => getProgress(childId),
    enabled: !!childId,
  });

  const bestStars = useMemo(() => {
    if (!progressData) return 0;
    const puzzleProgress = progressData.filter((p) => p.moduleId === 'puzzle');
    if (puzzleProgress.length === 0) return 0;
    return Math.max(...puzzleProgress.map((p) => p.stars));
  }, [progressData]);

  const saveScoreMutation = useMutation({
    mutationFn: saveGameScore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', childId] });
    },
  });

  const upsertProgressMutation = useMutation({
    mutationFn: upsertProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', childId] });
    },
  });

  const awardBadgeMutation = useMutation({
    mutationFn: awardBadge,
  });

  // ── Game State ──
  const [matchingTiles, setMatchingTiles] = useState<MatchingTile[]>([]);
  const [swapTiles, setSwapTiles] = useState<SwapTile[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>('ready');
  const [showConfetti, setShowConfetti] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSavedRef = useRef(false);
  const announcementRef = useRef<HTMLDivElement>(null);

  // ── Derived State ──
  const isComplete = gamePhase === 'complete';

  const progressPercent = useMemo(() => {
    if (isMatching) {
      return pCfg.totalPairs > 0 ? Math.round((matches / pCfg.totalPairs) * 100) : 0;
    }
    const correctCount = swapTiles.filter((t, i) => t.correctIndex === i).length;
    return pCfg.totalPieces > 0 ? Math.round((correctCount / pCfg.totalPieces) * 100) : 0;
  }, [isMatching, matches, swapTiles, pCfg.totalPairs, pCfg.totalPieces]);

  const dynamicOptimalMoves = useMemo(() => {
    if (isMatching) return pCfg.optimalMoves;
    const indices = swapTiles.map((t) => t.correctIndex);
    return computeMinSwaps(indices);
  }, [isMatching, swapTiles, pCfg.optimalMoves]);

  const effectiveStars = useMemo((): number => {
    if (moves === 0) return 0;
    const optimal = isMatching ? pCfg.optimalMoves : dynamicOptimalMoves;
    if (moves <= optimal + 3) return 3;
    if (moves <= optimal + 8) return 2;
    return 1;
  }, [moves, isMatching, pCfg.optimalMoves, dynamicOptimalMoves]);

  // ── Announce for screen readers ──
  const announce = useCallback((message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
    }
  }, []);

  // ── Timer Effect ──
  useEffect(() => {
    if (gamePhase === 'playing') {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gamePhase]);

  // ── Completion Detection & Saving ──
  useEffect(() => {
    if (gamePhase !== 'playing') return;

    if (isMatching) {
      if (matches === pCfg.totalPairs) {
        setGamePhase('complete');
      }
    } else {
      const allCorrect = swapTiles.length > 0 && swapTiles.every((t, i) => t.correctIndex === i);
      if (allCorrect) {
        setGamePhase('complete');
      }
    }
  }, [gamePhase, isMatching, matches, swapTiles, pCfg.totalPairs]);

  useEffect(() => {
    if (!isComplete || hasSavedRef.current || !childId || !parentId) return;
    hasSavedRef.current = true;
    setShowConfetti(true);
    playSound('/sounds/success.mp3');

    const finalStars = effectiveStars as 0 | 1 | 2 | 3;
    const gameType: GameType = 'puzzle';

    saveScoreMutation.mutate({
      childId,
      parentId,
      gameType,
      score: finalStars,
      maxScore: 3,
      difficulty: pCfg.difficulty,
      durationSeconds: timer,
      playedAt: new Date(),
    });

    upsertProgressMutation.mutate({
      childId,
      parentId,
      moduleId: 'puzzle',
      completed: true,
      stars: finalStars,
      percentComplete: 100,
      lastAccessedAt: new Date(),
      completedAt: new Date(),
    });

    if (finalStars === 3) {
      awardBadgeMutation.mutate({
        childId,
        parentId,
        category: 'perfect-score',
        name: 'Puzzle Pro',
        description: 'Completed a puzzle with 3 stars!',
        icon: '🧩',
        earnedAt: new Date(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  // ── Initialize Game ──
  const initGame = useCallback(() => {
    hasSavedRef.current = false;
    setShowConfetti(false);

    if (isMatching) {
      const tiles = createMatchingTiles(pCfg.totalPairs);
      setMatchingTiles(tiles);
      setFlippedIds([]);
      setIsChecking(false);
      setMatches(0);
    } else {
      const colors = segment === 'kid' ? PICTURE_COLORS : ORDER_COLORS;
      const tiles = createSwapTiles(pCfg.totalPieces, colors);
      setSwapTiles(tiles);
      setSelectedId(null);
    }

    setMoves(0);
    setTimer(0);
    setGamePhase('ready');
  }, [isMatching, segment, pCfg.totalPairs, pCfg.totalPieces]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // ── Ensure game starts playing on first interaction ──
  const ensurePlaying = useCallback(() => {
    if (gamePhase === 'ready') {
      setGamePhase('playing');
    }
  }, [gamePhase]);

  // ── Matching Game Handler ──
  const handleMatchingClick = useCallback(
    (tileId: number) => {
      if (isChecking || gamePhase === 'complete') return;
      ensurePlaying();
      playClick();

      const tile = matchingTiles.find((t) => t.id === tileId);
      if (!tile || tile.isFlipped || tile.isMatched) return;

      setMatchingTiles((prev) =>
        prev.map((t) => (t.id === tileId ? { ...t, isFlipped: true } : t)),
      );

      const newFlipped = [...flippedIds, tileId];
      setFlippedIds(newFlipped);

      if (newFlipped.length === 2) {
        setMoves((m) => m + 1);
        setIsChecking(true);
        playPop();

        const first = matchingTiles.find((t) => t.id === newFlipped[0]);
        const second = tile;

        if (first?.emoji === second.emoji) {
          setMatches((m) => m + 1);
          playSuccess();
          setMatchingTiles((prev) =>
            prev.map((t) =>
              t.id === newFlipped[0] || t.id === newFlipped[1]
                ? { ...t, isMatched: true }
                : t,
            ),
          );
          setFlippedIds([]);
          setIsChecking(false);
          announce('Match found!');
        } else {
          setTimeout(() => {
            setMatchingTiles((prev) =>
              prev.map((t) =>
                t.id === newFlipped[0] || t.id === newFlipped[1]
                  ? { ...t, isFlipped: false }
                  : t,
              ),
            );
            setFlippedIds([]);
            setIsChecking(false);
          }, 800);
        }
      }
    },
    [isChecking, gamePhase, ensurePlaying, playClick, matchingTiles, flippedIds, playPop, playSuccess, announce],
  );

  // ── Swap Game Handler ──
  const handleSwapClick = useCallback(
    (index: number) => {
      if (gamePhase === 'complete') return;
      ensurePlaying();
      playClick();

      if (selectedId === null) {
        setSelectedId(index);
      } else if (selectedId === index) {
        setSelectedId(null);
      } else {
        playPop();
        setSwapTiles((prev) => {
          const next = [...prev];
          const temp = next[index]!;
          next[index] = next[selectedId]!;
          next[selectedId] = temp;
          return next;
        });
        setMoves((m) => m + 1);
        setSelectedId(null);
        announce(`Swapped tiles`);
      }
    },
    [gamePhase, ensurePlaying, playClick, selectedId, playPop, announce],
  );

  // ── New Game Handler ──
  const handleNewGame = useCallback(() => {
    initGame();
  }, [initGame]);

  // ── Keyboard handler for swap pieces ──
  const handleSwapKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSwapClick(index);
      }
    },
    [handleSwapClick],
  );

  // ── Loading guard ──
  if (!activeChildProfile) {
    return (
      <div className="kv-page flex flex-col items-center justify-center gap-4">
        <AnimatedContainer variant="pop">
          <p className="text-xl font-display text-kv-gray-500">Loading profile...</p>
        </AnimatedContainer>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // Completion Screen
  // ═══════════════════════════════════════════════════════

  if (isComplete) {
    const finalStars = effectiveStars;
    return (
      <div className="kv-page flex flex-col items-center justify-center min-h-screen">
        {showConfetti && <Confetti />}

        <MotionCard
          asMotion
          variant="elevated"
          padding="lg"
          className="text-center max-w-md w-full mx-4"
        >
          <AnimatedContainer variant="pop" delay={0.2}>
            <h1 className="text-4xl md:text-5xl font-display text-kv-teal mb-2">
              {isMatching ? '🎉 All Matched!' : '🧩 Puzzle Complete!'}
            </h1>
          </AnimatedContainer>

          <AnimatedContainer variant="slideUp" delay={0.4}>
            <div className="flex justify-center my-4">
              <StarRating
                rating={finalStars}
                size="lg"
                label={`${finalStars} out of 3 stars`}
              />
            </div>
          </AnimatedContainer>

          <AnimatedContainer variant="slideUp" delay={0.5}>
            <div className="flex justify-center gap-6 text-lg text-kv-gray-700 mb-2">
              <span>
                Moves: <strong className="text-kv-teal">{moves}</strong>
              </span>
              {pCfg.showTimer && (
                <span>
                  Time: <strong className="text-kv-teal">{formatTime(timer)}</strong>
                </span>
              )}
            </div>
          </AnimatedContainer>

          {finalStars === 3 && (
            <AnimatedContainer variant="slideUp" delay={0.7}>
              <div className="flex justify-center mb-4">
                <AchievementBadge
                  name="Puzzle Pro"
                  description="3 stars earned!"
                  emoji="🧩"
                  earned
                  size="md"
                />
              </div>
            </AnimatedContainer>
          )}

          {bestStars > 0 && bestStars < 3 && finalStars > bestStars && (
            <AnimatedContainer variant="slideUp" delay={0.8}>
              <Badge variant="success" size="lg" icon="📈">
                New best score!
              </Badge>
            </AnimatedContainer>
          )}

          <AnimatedContainer variant="slideUp" delay={0.9}>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <MotionButton
                variant="primary"
                size="lg"
                onClick={handleNewGame}
                aria-label="Play new puzzle"
              >
                New Puzzle
              </MotionButton>
              <MotionButton
                variant="secondary"
                size="lg"
                onClick={() => navigate(`/kids/${profileId}`)}
                leftIcon={<IconHome />}
                aria-label="Go home"
              >
                Home
              </MotionButton>
            </div>
          </AnimatedContainer>
        </MotionCard>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // Game Board
  // ═══════════════════════════════════════════════════════

  const gridGap = segment === 'toddler' ? 'gap-3 md:gap-4' : 'gap-2 md:gap-3';

  return (
    <div className="kv-page">
      {/* ARIA live region for announcements */}
      <div ref={announcementRef} aria-live="polite" className="sr-only" />

      {/* ── Header ── */}
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/kids/${profileId}`)}
            leftIcon={<IconArrowLeft />}
            aria-label="Back to home"
          >
            Back
          </Button>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-display text-kv-teal">
              {SEGMENT_TITLES[segment]}
            </h1>
            <Badge variant="primary" size="sm">
              {pCfg.difficulty}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm font-bold text-kv-gray-600" aria-live="polite">
            {pCfg.showTimer && (
              <span aria-label={`Time: ${formatTime(timer)}`}>
                ⏱️ {formatTime(timer)}
              </span>
            )}
            <span aria-label={`${moves} moves made`}>
              🔄 {moves} moves
            </span>
            {bestStars > 0 && (
              <span aria-label={`Best: ${bestStars} stars`}>
                ⭐ Best: {bestStars}
              </span>
            )}
          </div>
        </div>

        <p className="text-kv-gray-500 text-sm mt-2">
          {SEGMENT_INSTRUCTIONS[segment]}
        </p>
      </header>

      {/* ── Progress Bar ── */}
      <div className="mb-6 max-w-md mx-auto">
        <ProgressBar
          value={progressPercent}
          variant="green"
          size="md"
          showLabel
          labelPosition="top"
          animated
        />
      </div>

      {/* ── Kid Mode: Picture Reference ── */}
      {segment === 'kid' && (
        <AnimatedContainer variant="slideUp" delay={0.1} className="flex justify-center mb-4">
          <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-card">
            <div>
              <p className="text-xs font-bold text-kv-gray-500 mb-1">Target:</p>
              <div className="grid grid-cols-4 gap-px w-20 h-20 rounded overflow-hidden border border-kv-gray-200">
                {PICTURE_COLORS.map((color, i) => (
                  <div
                    key={i}
                    className="aspect-square"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          </div>
        </AnimatedContainer>
      )}

      {/* ── Matching Game Board (Toddler) ── */}
      {isMatching && (
        <StaggerGrid
          className={cn(
            'grid mx-auto w-full',
            pCfg.gridCols,
            pCfg.gridMaxWidth,
            gridGap,
          )}
          key="matching-grid"
        >
          {matchingTiles.map((tile) => {
            const isFlipped = tile.isFlipped || tile.isMatched;
            const isSelected = flippedIds.includes(tile.id);
            return (
              <StaggerItem key={tile.id}>
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleMatchingClick(tile.id)}
                  disabled={isFlipped || isChecking}
                  className={cn(
                    'aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer',
                    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-kv-teal/50',
                    pCfg.tileSize,
                    tile.isMatched
                      ? 'bg-kv-green/20 ring-2 ring-kv-green/40 shadow-none'
                      : isFlipped
                        ? 'bg-white shadow-card-hover ring-2 ring-kv-teal/30'
                        : 'bg-kv-teal shadow-button hover:shadow-card-hover',
                  )}
                  aria-label={
                    isFlipped
                      ? `${tile.emoji} animal${tile.isMatched ? ', matched' : ', flipping'}`
                      : 'Hidden card, tap to flip'
                  }
                  aria-pressed={isSelected}
                >
                  <motion.span
                    initial={isFlipped ? { rotate: 0 } : false}
                    animate={isFlipped ? { rotate: 360 } : {}}
                    transition={{ duration: 0.3 }}
                    className={pCfg.emojiSize}
                    aria-hidden="true"
                  >
                    {isFlipped ? tile.emoji : '?'}
                  </motion.span>
                </motion.button>
              </StaggerItem>
            );
          })}
        </StaggerGrid>
      )}

      {/* ── Swap Game Board (Early Learner & Kid) ── */}
      {!isMatching && (
        <StaggerGrid
          className={cn(
            'grid mx-auto w-full',
            pCfg.gridCols,
            pCfg.gridMaxWidth,
            gridGap,
          )}
          key="swap-grid"
        >
          {swapTiles.map((tile, index) => {
            const isCorrect = tile.correctIndex === index;
            const isSelected = selectedId === index;
            const isKidMode = segment === 'kid';

            return (
              <StaggerItem key={tile.id}>
                <motion.button
                  layout
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleSwapClick(index)}
                  onKeyDown={(e) => handleSwapKeyDown(e, index)}
                  className={cn(
                    'aspect-square rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer select-none',
                    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-kv-teal/50',
                    pCfg.tileSize,
                    isSelected
                      ? 'ring-4 ring-white scale-110 shadow-card-hover z-10'
                      : '',
                    isCorrect && gamePhase === 'playing'
                      ? 'ring-2 ring-kv-green/50 opacity-80'
                      : '',
                  )}
                  style={{ backgroundColor: tile.color }}
                  aria-label={`Tile ${tile.label}${isSelected ? ', selected' : ''}${isCorrect ? ', in correct position' : ''}`}
                  aria-pressed={isSelected}
                >
                  <motion.span
                    className={cn(
                      'text-white drop-shadow-sm',
                      isKidMode ? 'text-xs font-bold' : pCfg.textSize,
                    )}
                    animate={isCorrect ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    {tile.label}
                  </motion.span>

                  {isKidMode && (
                    <span className="absolute bottom-0.5 right-1 text-[10px] text-white/60 font-mono" aria-hidden="true">
                      {String.fromCharCode(65 + Math.floor(index / 4))}{index % 4 + 1}
                    </span>
                  )}
                </motion.button>
              </StaggerItem>
            );
          })}
        </StaggerGrid>
      )}

      {/* ── Action Buttons ── */}
      <div className="flex justify-center mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <MotionButton
              variant="secondary"
              size="lg"
              onClick={handleNewGame}
              aria-label="Shuffle and start new puzzle"
              leftIcon={<span aria-hidden="true">🔀</span>}
            >
              New Puzzle
            </MotionButton>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Hint for swap mode ── */}
      {!isMatching && selectedId !== null && (
        <AnimatedContainer variant="slideUp" className="text-center mt-4">
          <Badge variant="info" size="md">
            Tap another tile to swap
          </Badge>
        </AnimatedContainer>
      )}
    </div>
  );
}
