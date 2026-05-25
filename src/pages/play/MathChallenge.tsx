import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import { useAgeAdaptiveConfig } from '@/hooks/useAgeAdaptiveConfig';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { saveGameScore, upsertProgress, awardBadge } from '@/lib/firestore';
import {
  Card,
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
} from '@/components';
import { cn } from '@/lib/utils';
import type { DifficultyLevel, GameType } from '@/types';

// ════════════════════════════════════════════
// Types
// ════════════════════════════════════════════

interface MathProblem {
  questionText: string;
  visualEmojis: string;
  answer: number;
  options: number[];
  operator: string;
}

type GamePhase = 'ready' | 'playing' | 'completed';

interface GameConfig {
  totalQuestions: number;
  optionCount: number;
  timeLimit: number;
  difficulty: DifficultyLevel;
  tapTargetPx: number;
}

// ════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════

const COUNTING_EMOJIS = ['🍎', '🌟', '🐱', '🎈', '🌸', '🍓', '🐶', '🦋'];

const GAME_TYPE: GameType = 'math-challenge';
const TIMER_SECONDS = 30;
const STREAK_MILESTONES = [3, 5, 7, 10];

// ════════════════════════════════════════════
// Problem Generation
// ════════════════════════════════════════════

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i]!, result[j]!] = [result[j]!, result[i]!];
  }
  return result;
}

function generateDistinctOptions(answer: number, count: number, maxRange: number): number[] {
  const optionsSet = new Set<number>([answer]);
  let attempts = 0;
  while (optionsSet.size < count && attempts < 200) {
    const offset = Math.floor(Math.random() * Math.min(10, maxRange)) + 1;
    const wrong = Math.random() > 0.5 ? answer + offset : answer - offset;
    if (wrong >= 0 && wrong !== answer && wrong <= maxRange * 2) {
      optionsSet.add(wrong);
    }
    attempts++;
  }
  // Fallback: add sequential numbers
  let fallback = 0;
  while (optionsSet.size < count) {
    if (fallback !== answer && fallback >= 0) {
      optionsSet.add(fallback);
    }
    fallback++;
  }
  return shuffleArray(Array.from(optionsSet));
}

function generateToddlerProblem(): MathProblem {
  const count = Math.floor(Math.random() * 5) + 1; // 1-5
  const emoji = pickRandom(COUNTING_EMOJIS);
  const visualEmojis = Array(count).fill(emoji).join(' ');
  const options = generateDistinctOptions(count, 2, 5);
  return {
    questionText: 'How many?',
    visualEmojis,
    answer: count,
    options,
    operator: 'count',
  };
}

function generateEarlyLearnerProblem(): MathProblem {
  const operator = Math.random() > 0.5 ? '+' : '-';
  let num1: number;
  let num2: number;
  let answer: number;

  if (operator === '+') {
    num1 = Math.floor(Math.random() * 15) + 1; // 1-15
    num2 = Math.floor(Math.random() * 15) + 1; // 1-15
    answer = num1 + num2;
  } else {
    num1 = Math.floor(Math.random() * 15) + 2; // 2-16
    num2 = Math.floor(Math.random() * (num1 - 1)) + 1; // 1 to num1-1
    answer = num1 - num2;
  }

  const emoji = pickRandom(COUNTING_EMOJIS);
  const visualA = Array(num1).fill(emoji).join('');
  const visualB = Array(num2).fill(emoji).join('');

  const visualEmojis = `${visualA}  ${operator === '-' ? '−' : '+'}  ${visualB}`;
  const questionText = `${num1} ${operator} ${num2} = ?`;
  const options = generateDistinctOptions(answer, 4, 30);

  return { questionText, visualEmojis, answer, options, operator };
}

function generateKidProblem(): MathProblem {
  const operators = ['+', '-', '×', '÷'] as const;
  const operator = pickRandom(operators);
  let num1: number;
  let num2: number;
  let answer: number;

  switch (operator) {
    case '+':
      num1 = Math.floor(Math.random() * 90) + 10;
      num2 = Math.floor(Math.random() * 90) + 10;
      answer = num1 + num2;
      break;
    case '-':
      num1 = Math.floor(Math.random() * 90) + 10;
      num2 = Math.floor(Math.random() * 90) + 10;
      if (num2 > num1) [num1, num2] = [num2, num1];
      answer = num1 - num2;
      break;
    case '×':
      num1 = Math.floor(Math.random() * 12) + 2;
      num2 = Math.floor(Math.random() * 12) + 2;
      answer = num1 * num2;
      break;
    case '÷': {
      num2 = Math.floor(Math.random() * 12) + 2;
      answer = Math.floor(Math.random() * 12) + 2;
      num1 = num2 * answer; // clean division
      break;
    }
  }

  const questionText = `${num1} ${operator} ${num2} = ?`;
  const options = generateDistinctOptions(answer, 4, 100);

  return { questionText, visualEmojis: '', answer, options, operator };
}

// ════════════════════════════════════════════
// Star Rating Helper
// ════════════════════════════════════════════

function computeStars(percent: number): 0 | 1 | 2 | 3 {
  if (percent >= 90) return 3;
  if (percent >= 70) return 2;
  if (percent >= 50) return 1;
  return 0;
}

// ════════════════════════════════════════════
// Confetti Particles
// ════════════════════════════════════════════

const CONFETTI_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF69B4', '#9B59B6', '#FFA94D'];

function ConfettiOverlay({ show }: { show: boolean }) {
  if (!show) return null;

  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
      size: Math.random() * 8 + 4,
      duration: Math.random() * 2 + 2,
    }));
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          initial={{ y: '-5%', x: `${p.x}%`, opacity: 1, rotate: 0 }}
          animate={{ y: '110%', opacity: 0, rotate: 720 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

// ════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════

export default function MathChallenge() {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const queryClient = useQueryClient();

  const activeChildProfile = useAuthStore((s) => s.activeChildProfile);
  const { playClick, playSuccess, playError, playPop } = useSoundEffects();

  const config = useAgeAdaptiveConfig(activeChildProfile?.age ?? 5);

  // ── Game state ──
  const [phase, setPhase] = useState<GamePhase>('ready');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [badgeEarned, setBadgeEarned] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Derived config per age segment ──
  const gameConfig: GameConfig = useMemo(() => {
    switch (config.segment) {
      case 'toddler':
        return {
          totalQuestions: 10,
          optionCount: 2,
          timeLimit: 0,
          difficulty: 'easy' as DifficultyLevel,
          tapTargetPx: config.minTapTargetPx,
        };
      case 'early-learner':
        return {
          totalQuestions: 12,
          optionCount: 4,
          timeLimit: 0,
          difficulty: 'medium' as DifficultyLevel,
          tapTargetPx: config.minTapTargetPx,
        };
      case 'kid':
        return {
          totalQuestions: 15,
          optionCount: 4,
          timeLimit: TIMER_SECONDS,
          difficulty: 'hard' as DifficultyLevel,
          tapTargetPx: config.minTapTargetPx,
        };
    }
  }, [config.segment, config.minTapTargetPx]);

  const enableTimer = config.enableTimedChallenges;

  // ── Generate problem ──
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);

  const generateProblem = useCallback((): MathProblem => {
    switch (config.segment) {
      case 'toddler':
        return generateToddlerProblem();
      case 'early-learner':
        return generateEarlyLearnerProblem();
      case 'kid':
        return generateKidProblem();
    }
  }, [config.segment]);

  // ── Start / advance question ──
  const advanceToNext = useCallback(() => {
    if (currentIndex >= gameConfig.totalQuestions - 1) {
      setPhase('completed');
      return;
    }
    setCurrentIndex((i) => i + 1);
  }, [currentIndex, gameConfig.totalQuestions]);

  // ── Timer effect ──
  useEffect(() => {
    if (phase !== 'playing' || !enableTimer || feedback !== null) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timeout
          playError();
          setFeedback('wrong');
          setTimeout(() => advanceToNext(), 1200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, enableTimer, feedback, advanceToNext, playError]);

  // ── Elapsed time tracker ──
  useEffect(() => {
    if (phase !== 'playing') return;

    elapsedRef.current = setInterval(() => {
      setTotalElapsed((e) => e + 1);
    }, 1000);

    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [phase]);

  // ── Start game ──
  useEffect(() => {
    if (phase === 'playing') {
      const problem = generateProblem();
      setCurrentProblem(problem);
      setScore(0);
      setCurrentIndex(0);
      setStreak(0);
      setTotalElapsed(0);
      setFeedback(null);
      setBadgeEarned(false);
      setShowConfetti(false);
      if (enableTimer) {
        setTimeLeft(gameConfig.timeLimit);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Load existing progress ──
  const { data: existingProgress } = useQuery({
    queryKey: ['progress', activeChildProfile?.id, GAME_TYPE],
    queryFn: async () => {
      if (!activeChildProfile?.id) return null;
      const { getProgress } = await import('@/lib/firestore');
      const progressList = await getProgress(activeChildProfile.id);
      return progressList.find((p) => p.moduleId === GAME_TYPE) ?? null;
    },
    enabled: !!activeChildProfile?.id,
  });

  // ── Save score mutation ──
  const saveScoreMutation = useMutation({
    mutationFn: async (data: {
      score: number;
      maxScore: number;
      durationSeconds: number;
      stars: number;
    }) => {
      if (!activeChildProfile?.id || !activeChildProfile.parentId) return;
      await saveGameScore({
        childId: activeChildProfile.id,
        parentId: activeChildProfile.parentId,
        gameType: GAME_TYPE,
        score: data.score,
        maxScore: data.maxScore,
        difficulty: gameConfig.difficulty,
        durationSeconds: data.durationSeconds,
        playedAt: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-scores', activeChildProfile?.id] });
    },
  });

  // ── Upsert progress mutation ──
  const upsertProgressMutation = useMutation({
    mutationFn: async (data: { stars: number; percent: number }) => {
      if (!activeChildProfile?.id || !activeChildProfile.parentId) return;
      await upsertProgress({
        childId: activeChildProfile.id,
        parentId: activeChildProfile.parentId,
        moduleId: GAME_TYPE,
        completed: true,
        stars: data.stars as 0 | 1 | 2 | 3,
        percentComplete: data.percent,
        lastAccessedAt: new Date(),
        completedAt: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', activeChildProfile?.id] });
    },
  });

  // ── Award badge mutation ──
  const awardBadgeMutation = useMutation({
    mutationFn: async () => {
      if (!activeChildProfile?.id || !activeChildProfile.parentId) return;
      await awardBadge({
        childId: activeChildProfile.id,
        parentId: activeChildProfile.parentId,
        category: 'perfect-score',
        name: 'Math Whiz',
        description: 'Scored 90% or higher in Math Challenge!',
        icon: '🧮',
        earnedAt: new Date(),
      });
    },
    onSuccess: () => {
      setBadgeEarned(true);
      queryClient.invalidateQueries({ queryKey: ['badges', activeChildProfile?.id] });
    },
  });

  // ── Completion effect ──
  useEffect(() => {
    if (phase === 'completed') {
      const percent = Math.round((score / gameConfig.totalQuestions) * 100);
      const stars = computeStars(percent);

      if (stars >= 3) {
        setShowConfetti(true);
      }

      saveScoreMutation.mutate({
        score,
        maxScore: gameConfig.totalQuestions,
        durationSeconds: totalElapsed,
        stars,
      });

      upsertProgressMutation.mutate({ stars, percent });

      if (percent >= 90) {
        awardBadgeMutation.mutate();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Handle answer ──
  const handleAnswer = useCallback(
    (selected: number) => {
      if (!currentProblem || feedback !== null) return;

      playClick();

      const isCorrect = selected === currentProblem.answer;
      setFeedback(isCorrect ? 'correct' : 'wrong');

      if (isCorrect) {
        playSuccess();
        setScore((s) => s + 1);
        const newStreak = streak + 1;
        setStreak(newStreak);

        if (STREAK_MILESTONES.includes(newStreak)) {
          playPop();
        }
      } else {
        playError();
        setStreak(0);
      }

      // Auto-advance after feedback display
      setTimeout(() => {
        advanceToNext();
        if (enableTimer) {
          setTimeLeft(gameConfig.timeLimit);
        }
        if (isCorrect && currentIndex < gameConfig.totalQuestions - 1) {
          setCurrentProblem(generateProblem());
          setFeedback(null);
        }
      }, 1200);
    },
    [currentProblem, feedback, playClick, playSuccess, playError, playPop, streak, advanceToNext, enableTimer, gameConfig.timeLimit, currentIndex, gameConfig.totalQuestions, generateProblem],
  );

  // ── Keyboard support ──
  useEffect(() => {
    if (phase !== 'playing' || feedback !== null || !currentProblem) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const num = parseInt(key, 10);
      if (num >= 1 && num <= currentProblem.options.length) {
        handleAnswer(currentProblem.options[num - 1]!);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, feedback, currentProblem, handleAnswer]);

  // ── Focus management ──
  useEffect(() => {
    if (feedback === null && currentProblem) {
      // Focus the first option button
      const firstOption = document.querySelector<HTMLButtonElement>(
        '[data-answer-option]:first-of-type',
      );
      firstOption?.focus();
    }
  }, [feedback, currentProblem]);

  // ── Completion values ──
  const finalPercent = gameConfig.totalQuestions > 0
    ? Math.round((score / gameConfig.totalQuestions) * 100)
    : 0;
  const finalStars = computeStars(finalPercent);

  // ════════════════════════════════════════════
  // Render: Ready Screen
  // ════════════════════════════════════════════

  if (phase === 'ready') {
    const segmentLabels: Record<string, { title: string; description: string; emoji: string }> = {
      toddler: {
        title: 'Counting Fun!',
        description: 'Count the emojis and pick the right number',
        emoji: '🔢',
      },
      'early-learner': {
        title: 'Math Adventure!',
        description: 'Solve addition and subtraction with picture clues',
        emoji: '🧮',
      },
      kid: {
        title: 'Math Challenge',
        description: `Solve ${gameConfig.totalQuestions} questions against the clock — all operations!`,
        emoji: '🚀',
      },
    };

    const label = segmentLabels[config.segment]!;

    return (
      <div className="kv-page flex flex-col items-center justify-center min-h-screen">
        <AnimatedContainer variant="slideUp" className="w-full max-w-lg mx-auto text-center">
          {/* Navigation */}
          <div className="flex items-center gap-2 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/kids/${profileId}`)}
              aria-label="Go back to home"
            >
              <IconArrowLeft size={20} />
              <span>Back</span>
            </Button>
          </div>

          {/* Title */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="mb-8"
          >
            <span className="text-7xl block mb-4" aria-hidden="true">{label.emoji}</span>
            <h1 className="text-4xl md:text-5xl font-display text-kv-red mb-3">
              {label.title}
            </h1>
            <p className="text-kv-gray-500 text-lg md:text-xl">{label.description}</p>
          </motion.div>

          {/* Game config preview */}
          <div className="kv-card p-4 md:p-6 mb-8 text-left">
            <div className="flex items-center justify-between text-sm text-kv-gray-600 mb-2">
              <span className="font-bold">Questions</span>
              <Badge variant="primary">{String(gameConfig.totalQuestions)}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm text-kv-gray-600 mb-2">
              <span className="font-bold">Difficulty</span>
              <Badge variant={
                gameConfig.difficulty === 'easy' ? 'success'
                  : gameConfig.difficulty === 'medium' ? 'warning'
                    : 'danger'
              }>
                {gameConfig.difficulty.charAt(0).toUpperCase() + gameConfig.difficulty.slice(1)}
              </Badge>
            </div>
            {enableTimer && (
              <div className="flex items-center justify-between text-sm text-kv-gray-600">
                <span className="font-bold">Timer</span>
                <Badge variant="danger">{`${TIMER_SECONDS}s per question`}</Badge>
              </div>
            )}
          </div>

          {/* Best score */}
          {existingProgress && (
            <div className="mb-6">
              <Badge variant="achievement" size="lg" pulse>
                {`⭐ Best: ${existingProgress.stars} star${existingProgress.stars !== 1 ? 's' : ''}`}
              </Badge>
            </div>
          )}

          {/* Start button */}
          <MotionButton
            variant="primary"
            size="xl"
            fullWidth
            onClick={() => setPhase('playing')}
            aria-label="Start the math challenge"
            className="mb-4"
          >
            Let&apos;s Go! 🎉
          </MotionButton>

          <Button
            variant="ghost"
            onClick={() => navigate(`/kids/${profileId}`)}
            aria-label="Return to home"
            leftIcon={<IconHome size={18} />}
          >
            Home
          </Button>
        </AnimatedContainer>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // Render: Completion Screen
  // ════════════════════════════════════════════

  if (phase === 'completed') {
    return (
      <div className="kv-page flex flex-col items-center justify-center min-h-screen">
        <ConfettiOverlay show={showConfetti} />

        <AnimatedContainer variant="pop" className="w-full max-w-md mx-auto text-center">
          <Card variant="elevated" padding="xl" className="text-center">
            <motion.span
              className="text-7xl block mb-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              aria-hidden="true"
            >
              {finalStars >= 3 ? '🏆' : finalStars >= 2 ? '🎉' : finalStars >= 1 ? '👍' : '💪'}
            </motion.span>

            <h1 className="text-3xl md:text-4xl font-display text-kv-red mb-2">
              {finalStars >= 3 ? 'Amazing!' : finalStars >= 2 ? 'Great Job!' : finalStars >= 1 ? 'Good Try!' : 'Keep Practicing!'}
            </h1>

            <StarRating rating={finalStars} size="lg" label={`Score: ${finalStars} out of 3 stars`} />

            <div className="mt-6 space-y-2" aria-live="polite">
              <p className="text-2xl font-bold text-kv-gray-800">
                {score}
                <span className="text-kv-gray-400"> / {gameConfig.totalQuestions}</span>
              </p>
              <Badge variant={finalPercent >= 90 ? 'success' : finalPercent >= 70 ? 'primary' : finalPercent >= 50 ? 'warning' : 'danger'} size="lg">
                {`${finalPercent}% Correct`}
              </Badge>
            </div>

            <div className="mt-4 flex items-center justify-center gap-3 text-sm text-kv-gray-500">
              <Badge variant="default" icon="⏱️">
                {`${Math.floor(totalElapsed / 60)}:${(totalElapsed % 60).toString().padStart(2, '0')}`}
              </Badge>
              <Badge variant="default" icon="🔥">
                {`Best streak: ${streak}`}
              </Badge>
            </div>

            {/* Badge earned notification */}
            {badgeEarned && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6"
              >
                <AchievementBadge
                  name="Math Whiz"
                  description="Scored 90% or higher!"
                  emoji="🧮"
                  earned={true}
                  size="lg"
                />
              </motion.div>
            )}

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <MotionButton
                variant="primary"
                size="lg"
                onClick={() => setPhase('playing')}
                aria-label="Play again"
              >
                Play Again
              </MotionButton>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate(`/kids/${profileId}`)}
                aria-label="Return to home"
                leftIcon={<IconHome size={18} />}
              >
                Home
              </Button>
            </div>
          </Card>
        </AnimatedContainer>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // Render: Playing Screen
  // ════════════════════════════════════════════

  if (!currentProblem) return null;

  const timerPercent = enableTimer ? (timeLeft / gameConfig.timeLimit) * 100 : 0;
  const isTimerLow = enableTimer && timeLeft <= 10 && timeLeft > 0;

  const optionGridCols = gameConfig.optionCount <= 2
    ? 'grid-cols-2 gap-4 max-w-xs mx-auto'
    : 'grid-cols-2 gap-3 md:gap-4 max-w-md mx-auto';

  return (
    <div className="kv-page flex flex-col min-h-screen">
      {/* Header */}
      <header className="mb-4 md:mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPhase('ready')}
            aria-label="Back to start screen"
          >
            <IconArrowLeft size={20} />
          </Button>
          <div className="flex-1" />
          <Badge variant="primary" icon="⏱️" aria-live="off">
            {`${Math.floor(totalElapsed / 60)}:${(totalElapsed % 60).toString().padStart(2, '0')}`}
          </Badge>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl md:text-2xl font-display text-kv-red">
              Math Challenge
            </h1>
            <p className="text-sm text-kv-gray-400">
              Question {currentIndex + 1} of {gameConfig.totalQuestions}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak indicator */}
            {streak >= 2 && (
              <motion.span
                className="text-2xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                aria-label={`Streak: ${streak} correct in a row`}
              >
                <motion.span
                  animate={streak >= 3 ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                >
                  🔥
                </motion.span>
                <span className="sr-only">{streak} streak</span>
              </motion.span>
            )}

            {/* Score */}
            <div aria-live="polite" className="flex items-center gap-1">
              <Badge variant="success" size="lg">
                {String(score)}
              </Badge>
              <span className="text-sm text-kv-gray-400 font-bold" aria-hidden="true">
                / {gameConfig.totalQuestions}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <ProgressBar
          value={currentIndex}
          max={gameConfig.totalQuestions}
          variant="orange"
          size="md"
          aria-label={`Question progress: ${currentIndex} of ${gameConfig.totalQuestions}`}
        />

        {/* Timer bar (kids only) */}
        {enableTimer && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-kv-gray-400 font-bold">Time Left</span>
              <motion.span
                className={cn(
                  'text-sm font-bold tabular-nums',
                  isTimerLow ? 'text-kv-red' : 'text-kv-gray-600',
                )}
                animate={isTimerLow ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
                role="timer"
                aria-live="assertive"
                aria-label={`${timeLeft} seconds remaining`}
              >
                ⏱ {timeLeft}s
              </motion.span>
            </div>
            <ProgressBar
              value={timerPercent}
              max={100}
              variant={isTimerLow ? 'red' : 'blue'}
              size="sm"
              aria-label={`Timer: ${timeLeft} seconds left`}
            />
          </div>
        )}
      </header>

      {/* Question Card */}
      <main className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-lg mx-auto"
          >
            <MotionCard
              asMotion={true}
              variant="elevated"
              padding="lg"
              className="text-center mb-6"
            >
              {/* Visual emojis (toddler & early learner) */}
              {currentProblem.visualEmojis && (
                <div
                  className={cn(
                    'mb-4 leading-relaxed select-none',
                    config.segment === 'toddler' ? 'text-4xl md:text-5xl' : 'text-xl md:text-2xl',
                  )}
                  aria-hidden="true"
                >
                  {currentProblem.visualEmojis}
                </div>
              )}

              {/* Question text */}
              {config.segment === 'toddler' ? (
                <p className="text-2xl md:text-3xl font-display font-bold text-kv-gray-800 mb-8">
                  {currentProblem.questionText}
                </p>
              ) : (
                <p className="text-3xl md:text-5xl font-display font-bold text-kv-gray-800 mb-8 tracking-wider">
                  {currentProblem.questionText}
                </p>
              )}

              {/* Answer options */}
              <div
                className={cn('grid', optionGridCols)}
                role="group"
                aria-label="Answer choices"
              >
                {currentProblem.options.map((opt, idx) => {
                  const isCorrect = opt === currentProblem.answer;
                  const showCorrectFeedback = feedback === 'correct' && isCorrect;
                  const showWrongFeedback = feedback === 'wrong' && !isCorrect;

                  return (
                    <motion.button
                      key={`${currentIndex}-${opt}`}
                      data-answer-option
                      disabled={feedback !== null}
                      onClick={() => handleAnswer(opt)}
                      whileHover={feedback === null ? { scale: 1.05 } : {}}
                      whileTap={feedback === null ? { scale: 0.92 } : {}}
                      animate={
                        showCorrectFeedback
                          ? {
                              scale: [1, 1.15, 1],
                              backgroundColor: '#D4EDDA',
                            }
                          : showWrongFeedback
                            ? {
                                x: [0, -8, 8, -8, 8, 0],
                                backgroundColor: '#F8D7DA',
                              }
                            : {}
                      }
                      transition={
                        showWrongFeedback
                          ? { duration: 0.4 }
                          : showCorrectFeedback
                            ? { type: 'spring', stiffness: 400, damping: 15 }
                            : {}
                      }
                      className={cn(
                        'flex items-center justify-center rounded-2xl font-display font-bold transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-kv-blue/40',
                        'kv-button-base',
                        config.segment === 'toddler' && 'text-3xl md:text-4xl',
                        config.segment === 'early-learner' && 'text-2xl md:text-3xl',
                        config.segment === 'kid' && 'text-xl md:text-2xl',
                        feedback === null
                          ? 'bg-white border-2 border-kv-gray-200 text-kv-gray-800 hover:border-kv-blue hover:bg-kv-blue/5'
                          : showCorrectFeedback
                            ? 'bg-kv-green/20 border-2 border-kv-green text-kv-green'
                            : showWrongFeedback
                              ? 'bg-kv-red/10 border-2 border-kv-red/40 text-kv-red/60'
                              : 'bg-kv-gray-50 border-2 border-kv-gray-100 text-kv-gray-300',
                      )}
                      aria-label={`Answer option ${idx + 1}: ${opt}${showCorrectFeedback ? ', correct!' : ''}${showWrongFeedback && isCorrect ? ', this was the correct answer' : ''}`}
                      aria-pressed={feedback === 'correct' && isCorrect ? true : undefined}
                    >
                      {opt}
                    </motion.button>
                  );
                })}
              </div>

              {/* Feedback message */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="mt-6"
                    role="alert"
                    aria-live="assertive"
                  >
                    <p
                      className={cn(
                        'text-xl md:text-2xl font-bold',
                        feedback === 'correct' ? 'text-kv-green' : 'text-kv-red',
                      )}
                    >
                      {feedback === 'correct'
                        ? streak >= 3
                          ? `🔥 ${streak} in a row!`
                          : '🎉 Correct!'
                        : `The answer was ${currentProblem.answer}`}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </MotionCard>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Keyboard hint for kids */}
      {config.segment === 'kid' && (
        <footer className="text-center pb-4">
          <p className="text-xs text-kv-gray-400" aria-hidden="true">
            Press 1-{currentProblem.options.length} to answer quickly
          </p>
        </footer>
      )}
    </div>
  );
}
