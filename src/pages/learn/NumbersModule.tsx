// ──────────────────────────────────────────────
// KidsVerse — Numbers Module (Phase 5)
// Counting challenges with age-adaptive difficulty,
// progress tracking, timed challenges, and Firestore sync.
// ──────────────────────────────────────────────
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import { useAgeAdaptiveConfig } from '@/hooks/useAgeAdaptiveConfig';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { getProgress, upsertProgress, saveGameScore } from '@/lib/firestore';
import type { DifficultyLevel } from '@/types';
import {
  ProgressBar,
  MotionCard,
  MotionButton,
  Button,
  Badge,
  StarRating,
  IconArrowLeft,
  IconHome,
  AnimatedContainer,
} from '@/components';
import { cn, shuffle } from '@/lib/utils';

// ── Types ──

interface CountChallenge {
  id: number;
  emoji: string;
  label: string;
  count: number;
  options: number[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ArithmeticChallenge {
  id: number;
  emoji: string;
  label: string;
  problem: string;
  answer: number;
  options: number[];
  difficulty: 'hard';
}

type Challenge = CountChallenge | ArithmeticChallenge;

type FeedbackState = 'correct' | 'wrong' | 'timeout' | null;

function getCorrectAnswer(challenge: Challenge): number {
  return 'answer' in challenge ? challenge.answer : challenge.count;
}

// ── Challenge Data ──

const ALL_CHALLENGES: CountChallenge[] = [
  { id: 1, emoji: '🍎', label: 'Apples', count: 3, options: [2, 3, 4, 5], difficulty: 'easy' },
  { id: 2, emoji: '🌟', label: 'Stars', count: 5, options: [3, 4, 5, 6], difficulty: 'easy' },
  { id: 3, emoji: '🦋', label: 'Butterflies', count: 4, options: [2, 3, 4, 6], difficulty: 'easy' },
  { id: 4, emoji: '🐶', label: 'Dogs', count: 2, options: [1, 2, 3, 4], difficulty: 'easy' },
  { id: 5, emoji: '🐠', label: 'Fish', count: 7, options: [6, 7, 8, 9], difficulty: 'medium' },
  { id: 6, emoji: '🎈', label: 'Balloons', count: 8, options: [7, 8, 9, 10], difficulty: 'medium' },
  { id: 7, emoji: '🌺', label: 'Flowers', count: 6, options: [4, 5, 6, 8], difficulty: 'medium' },
  { id: 8, emoji: '🍪', label: 'Cookies', count: 9, options: [8, 9, 10, 11], difficulty: 'hard' },
  { id: 9, emoji: '🐝', label: 'Bees', count: 10, options: [8, 9, 10, 12], difficulty: 'hard' },
  { id: 10, emoji: '🌈', label: 'Rainbows', count: 1, options: [1, 2, 3, 4], difficulty: 'hard' },
];

const ARITHMETIC_CHALLENGES: ArithmeticChallenge[] = [
  { id: 101, emoji: '➕', label: 'Addition', problem: '3 + 5', answer: 8, options: [6, 7, 8, 9], difficulty: 'hard' },
  { id: 102, emoji: '➖', label: 'Subtraction', problem: '10 - 4', answer: 6, options: [5, 6, 7, 8], difficulty: 'hard' },
  { id: 103, emoji: '➕', label: 'Addition', problem: '7 + 6', answer: 13, options: [11, 12, 13, 14], difficulty: 'hard' },
  { id: 104, emoji: '➖', label: 'Subtraction', problem: '15 - 8', answer: 7, options: [6, 7, 8, 9], difficulty: 'hard' },
];

const TIMER_SECONDS = 15;

// ── Helper: pad easy challenges for toddlers ──

function getChallengesForSegment(
  segment: 'toddler' | 'early-learner' | 'kid',
): Challenge[] {
  const easy = ALL_CHALLENGES.filter((c) => c.difficulty === 'easy');
  const medium = ALL_CHALLENGES.filter((c) => c.difficulty === 'medium');

  switch (segment) {
    case 'toddler': {
      // Repeat easy challenges to get 8 questions
      const padded: CountChallenge[] = [];
      while (padded.length < 8) {
        padded.push(...easy);
      }
      return padded.slice(0, 8);
    }
    case 'early-learner':
      return [...easy, ...medium];
    case 'kid':
      return [...ALL_CHALLENGES, ...ARITHMETIC_CHALLENGES];
  }
}

// ── Component ──

export default function NumbersModule() {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const queryClient = useQueryClient();

  const activeChildProfile = useAuthStore((s) => s.activeChildProfile);
  const { playClick, playSuccess, playError } = useSoundEffects();

  const age = activeChildProfile?.age ?? 5;
  const config = useAgeAdaptiveConfig(age);

  const childId = activeChildProfile?.id ?? '';
  const parentId = activeChildProfile?.parentId ?? '';

  // ── State ──
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState(() => new Date());
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);

  // ── Derived challenges ──
  const challenges = useMemo(
    () => shuffle(getChallengesForSegment(config.segment)),
    [config.segment],
  );

  const totalQuestions = challenges.length;
  const challenge = challenges[currentIndex] ?? null;

  // ── Timer (kids only) ──
  useEffect(() => {
    if (!config.enableTimedChallenges || feedback || completed || !challenge) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setFeedback('timeout');
          playError();
          setTimeout(() => advanceQuestion(), 1200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [config.enableTimedChallenges, feedback, completed, challenge, playError]);

  // Reset timer on new question
  useEffect(() => {
    if (!feedback) {
      setTimeLeft(TIMER_SECONDS);
    }
  }, [currentIndex, feedback]);

  // ── Load Progress ──
  useQuery({
    queryKey: ['progress', childId, 'numbers'],
    queryFn: () => getProgress(childId),
    enabled: !!childId,
  });

  // ── Save score mutation ──
  const saveScoreMutation = useMutation({
    mutationFn: () => {
      const durationSeconds = Math.round((Date.now() - startTime.getTime()) / 1000);
      return Promise.all([
        upsertProgress({
          childId,
          parentId,
          moduleId: 'numbers',
          completed: true,
          stars: score >= Math.round(totalQuestions * 0.9) ? 3 : score >= Math.round(totalQuestions * 0.7) ? 2 : score >= Math.round(totalQuestions * 0.5) ? 1 : 0,
          percentComplete: Math.round((score / totalQuestions) * 100),
          lastAccessedAt: new Date(),
          completedAt: new Date(),
        }),
        saveGameScore({
          childId,
          parentId,
          gameType: 'math-challenge',
          score,
          maxScore: totalQuestions,
          difficulty: config.segment === 'toddler' ? 'easy' as DifficultyLevel : config.segment === 'early-learner' ? 'medium' as DifficultyLevel : 'hard' as DifficultyLevel,
          durationSeconds,
          playedAt: new Date(),
        }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', childId] });
      queryClient.invalidateQueries({ queryKey: ['game-scores', childId] });
    },
  });

  // ── Advance question ──
  const advanceQuestion = useCallback(() => {
    setFeedback(null);
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      saveScoreMutation.mutate();
      setCompleted(true);
    }
  }, [currentIndex, totalQuestions, saveScoreMutation]);

  // ── Handle answer ──
  const handleAnswer = useCallback(
    (answer: number) => {
      if (feedback || !challenge) return;
      playClick();

      const isCorrect = answer === getCorrectAnswer(challenge);
      if (isCorrect) {
        setFeedback('correct');
        playSuccess();
        setScore((s) => s + 1);
      } else {
        setFeedback('wrong');
        playError();
      }

      setTimeout(() => advanceQuestion(), 1200);
    },
    [feedback, challenge, playClick, playSuccess, playError, advanceQuestion],
  );

  // ── Stars calculation ──
  const starRating = useMemo(() => {
    if (score >= Math.round(totalQuestions * 0.9)) return 3;
    if (score >= Math.round(totalQuestions * 0.7)) return 2;
    if (score >= Math.round(totalQuestions * 0.5)) return 1;
    return 0;
  }, [score, totalQuestions]);

  // ── Encouraging message ──
  const encouragingMessage = useMemo(() => {
    if (starRating >= 3) return 'Perfect score! You are a counting champion! 🏆';
    if (starRating >= 2) return 'Well done! Keep up the great work! 🌟';
    if (starRating >= 1) return 'Good try! Practice makes perfect! 💪';
    return 'You can do it! Let us try again! 🎯';
  }, [starRating]);

  // ── Reset game ──
  const handlePlayAgain = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setFeedback(null);
    setCompleted(false);
    setTimeLeft(TIMER_SECONDS);
  }, []);

  const handleGoHome = useCallback(() => {
    navigate(`/kids/${profileId}`);
  }, [navigate, profileId]);

  // ── Age-adaptive layout ──
  const answerGridClass = config.segment === 'toddler'
    ? 'grid-cols-2 gap-4'
    : 'grid-cols-4 gap-3';

  const answerButtonHeight = config.segment === 'toddler'
    ? 'min-h-[80px]'
    : 'min-h-[64px]';

  const answerTextSize = config.segment === 'toddler'
    ? 'text-4xl'
    : 'text-3xl';

  const emojiDisplaySize = config.segment === 'toddler'
    ? 'text-6xl md:text-7xl'
    : 'text-5xl md:text-6xl';

  // ── Timer display color ──
  const timerColorClass = timeLeft <= 5
    ? 'text-kv-red'
    : timeLeft <= 10
      ? 'text-kv-orange'
      : 'text-kv-blue';

  // ═══════════════════════════════════════════
  // Completion Screen
  // ═══════════════════════════════════════════
  if (completed || !challenge) {
    return (
      <div className="kv-page flex flex-col items-center justify-center min-h-[80vh]">
        <AnimatedContainer variant="pop" className="flex flex-col items-center gap-6">
          <motion.span
            className="text-7xl"
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.5 }}
            aria-hidden="true"
          >
            {starRating >= 3 ? '🏆' : starRating >= 2 ? '🌟' : '💪'}
          </motion.span>

          <h1 className="font-display text-4xl text-kv-green text-center">
            {completed ? 'Great Job!' : 'Get Ready!'}
          </h1>

          <StarRating
            rating={starRating}
            size="lg"
            label="Your score rating"
          />

          <p className="text-2xl text-kv-gray-700 text-center">
            You got{' '}
            <span className="font-bold text-kv-blue">{score}</span>{' '}
            out of{' '}
            <span className="font-bold">{totalQuestions}</span>{' '}
            correct!
          </p>
          <p className="text-lg text-kv-gray-500 text-center">
            {encouragingMessage}
          </p>

          <div className="flex gap-4 mt-4">
            <Button variant="primary" size="lg" onClick={handlePlayAgain}>
              Play Again
            </Button>
            <Button variant="secondary" size="lg" onClick={handleGoHome}>
              Home
            </Button>
          </div>
        </AnimatedContainer>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // Game Screen
  // ═══════════════════════════════════════════
  return (
    <div className="kv-page bg-gradient-to-b from-kv-green/5 to-kv-cream min-h-screen">
      {/* ═══ Header ═══ */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleGoHome}
            className="kv-button-base flex items-center gap-2 bg-kv-gray-200 text-kv-gray-600 px-4 py-2 text-sm rounded-xl hover:bg-kv-gray-300 transition-colors"
            aria-label="Back to home"
          >
            <IconArrowLeft size={18} />
            <span>{config.showTextLabels ? 'Home' : ''}</span>
          </button>
          <button
            onClick={handleGoHome}
            className="kv-button-base w-10 h-10 flex items-center justify-center bg-white text-kv-gray-600 rounded-xl shadow-card hover:shadow-card-hover transition-shadow"
            aria-label="Home"
          >
            <IconHome size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-kv-green">
              {config.showTextLabels ? 'Numbers & Counting' : '🔢'}
            </h1>
            {config.showTextLabels && (
              <p className="text-kv-gray-500 mt-1">
                Count the objects and pick the right number!
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Timer (kids only) */}
            {config.enableTimedChallenges && (
              <div className="flex items-center gap-1.5">
                <motion.span
                  className={cn('text-lg font-bold', timerColorClass)}
                  animate={timeLeft <= 5 ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  ⏰
                </motion.span>
                <span className={cn('font-display text-xl font-bold', timerColorClass)}>
                  {timeLeft}s
                </span>
              </div>
            )}

            {/* Score badge */}
            <Badge variant="primary" size="md">
              {`Score: ${score}`}
            </Badge>

            {/* Question indicator */}
            {config.showTextLabels && (
              <Badge variant="default" size="md">
                {`${currentIndex + 1}/${totalQuestions}`}
              </Badge>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <ProgressBar
            value={currentIndex}
            max={totalQuestions}
            variant="green"
            size="md"
            animated
          />
        </div>
      </header>

      {/* ═══ Challenge Area ═══ */}
      <AnimatePresence mode="wait">
        <MotionCard
          key={challenge.id}
          asMotion={true}
          variant="elevated"
          padding="lg"
          className="mb-6"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Question */}
          {'problem' in challenge ? (
            <p className="text-center text-lg text-kv-gray-600 mb-4 font-bold">
              {config.showTextLabels ? `Solve the math problem!` : `Solve it!`}
            </p>
          ) : (
            <p className="text-center text-lg text-kv-gray-600 mb-4 font-bold">
              {config.showTextLabels
                ? `How many ${challenge.label} do you see?`
                : `How many?`}
            </p>
          )}

          {/* Display: Arithmetic problem or Emoji objects */}
          {'problem' in challenge ? (
            <p className="text-5xl md:text-6xl font-display text-kv-green text-center mb-6">
              {challenge.problem} = ?
            </p>
          ) : (
            <div
              className="flex flex-wrap justify-center gap-2 mb-6"
              aria-label={`${challenge.count} ${challenge.label}`}
            >
              {Array.from({ length: challenge.count }, (_, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 20 }}
                  className={cn(emojiDisplaySize, 'select-none')}
                  aria-hidden="true"
                >
                  {challenge.emoji}
                </motion.span>
              ))}
            </div>
          )}

          {/* Answer Options */}
          <div className={cn('grid', answerGridClass)}>
            {challenge.options.map((opt) => {
              const isAnswered = feedback !== null;
              const correctAnswer = getCorrectAnswer(challenge);
              const isCorrectAnswer = opt === correctAnswer;
              const showCorrect = isAnswered && isCorrectAnswer;
              const showWrong =
                isAnswered && feedback === 'wrong' && !isCorrectAnswer;

              return (
                <MotionButton
                  key={opt}
                  variant="primary"
                  onClick={() => handleAnswer(opt)}
                  disabled={isAnswered}
                  whileHover={isAnswered ? {} : { scale: 1.05 }}
                  whileTap={isAnswered ? {} : { scale: 0.95 }}
                  className={cn(
                    answerButtonHeight,
                    answerTextSize,
                    'font-display font-bold text-center',
                    showCorrect &&
                      'bg-kv-green text-white ring-4 ring-kv-green/30',
                    showWrong &&
                      'bg-kv-gray-200 text-kv-gray-400 opacity-50',
                    !showCorrect &&
                      !showWrong &&
                      'bg-white text-kv-gray-800 border-2 border-kv-gray-200 hover:border-kv-green',
                  )}
                  aria-label={cn(
                    `Answer: ${opt}`,
                    showCorrect ? ', correct!' : '',
                    showWrong ? ', wrong' : '',
                  )}
                >
                  {opt}
                </MotionButton>
              );
            })}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'text-center text-xl font-bold mt-4',
                  feedback === 'correct' && 'text-kv-green',
                  feedback === 'wrong' && 'text-kv-red',
                  feedback === 'timeout' && 'text-kv-orange',
                )}
              >
                {feedback === 'correct' && '🎉 Correct!'}
                {feedback === 'wrong' && `Oops! It was ${getCorrectAnswer(challenge)}`}
                {feedback === 'timeout' && '⏰ Time is up!'}
              </motion.p>
            )}
          </AnimatePresence>
        </MotionCard>
      </AnimatePresence>
    </div>
  );
}
