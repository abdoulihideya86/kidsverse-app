import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import { useAgeAdaptiveConfig } from '@/hooks/useAgeAdaptiveConfig';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { upsertProgress, saveGameScore } from '@/lib/firestore';
import { cn, shuffle } from '@/lib/utils';
import {
  ProgressBar,
  StarRating,
  AchievementBadge,
  MotionCard,
  Button,
  IconArrowLeft,
  IconHome,
  AnimatedContainer,
} from '@/components';
import type { AgeSegment, DifficultyLevel } from '@/types';

// ════════════════════════════════════════════════
// Data Types
// ════════════════════════════════════════════════

interface ColorShapeOption {
  label: string;
  emoji: string;
  value: string;
}

interface ColorShapeQuestion {
  id: number;
  type: 'color' | 'shape';
  question: string;
  target: string;
  emoji: string;
  options: ColorShapeOption[];
  difficulty: 'easy' | 'medium' | 'hard';
}

// ════════════════════════════════════════════════
// Question Bank — 16 questions (8 colors + 8 shapes)
// ════════════════════════════════════════════════

const ALL_QUESTIONS: ColorShapeQuestion[] = [
  // ── Easy (1–6) ──
  { id: 1, type: 'color', question: 'Which one is RED?', target: 'red', emoji: '🔴', difficulty: 'easy', options: [
    { label: 'Red', emoji: '🔴', value: 'red' }, { label: 'Blue', emoji: '🔵', value: 'blue' },
    { label: 'Green', emoji: '🟢', value: 'green' }, { label: 'Yellow', emoji: '🟡', value: 'yellow' },
  ]},
  { id: 2, type: 'shape', question: 'Which one is a CIRCLE?', target: 'circle', emoji: '⭕', difficulty: 'easy', options: [
    { label: 'Circle', emoji: '⭕', value: 'circle' }, { label: 'Square', emoji: '⬜', value: 'square' },
    { label: 'Triangle', emoji: '🔺', value: 'triangle' }, { label: 'Star', emoji: '⭐', value: 'star' },
  ]},
  { id: 3, type: 'color', question: 'Which one is BLUE?', target: 'blue', emoji: '🔵', difficulty: 'easy', options: [
    { label: 'Orange', emoji: '🟠', value: 'orange' }, { label: 'Blue', emoji: '🔵', value: 'blue' },
    { label: 'Purple', emoji: '🟣', value: 'purple' }, { label: 'Red', emoji: '🔴', value: 'red' },
  ]},
  { id: 4, type: 'shape', question: 'Which one is a TRIANGLE?', target: 'triangle', emoji: '🔺', difficulty: 'easy', options: [
    { label: 'Heart', emoji: '❤️', value: 'heart' }, { label: 'Diamond', emoji: '💎', value: 'diamond' },
    { label: 'Triangle', emoji: '🔺', value: 'triangle' }, { label: 'Circle', emoji: '⭕', value: 'circle' },
  ]},
  { id: 5, type: 'color', question: 'Which one is GREEN?', target: 'green', emoji: '🟢', difficulty: 'easy', options: [
    { label: 'Pink', emoji: '🩷', value: 'pink' }, { label: 'Yellow', emoji: '🟡', value: 'yellow' },
    { label: 'Green', emoji: '🟢', value: 'green' }, { label: 'Blue', emoji: '🔵', value: 'blue' },
  ]},
  { id: 6, type: 'shape', question: 'Which one is a SQUARE?', target: 'square', emoji: '⬜', difficulty: 'easy', options: [
    { label: 'Square', emoji: '⬜', value: 'square' }, { label: 'Oval', emoji: '🥚', value: 'oval' },
    { label: 'Star', emoji: '⭐', value: 'star' }, { label: 'Triangle', emoji: '🔺', value: 'triangle' },
  ]},
  // ── Medium (7–12) ──
  { id: 7, type: 'color', question: 'Which one is YELLOW?', target: 'yellow', emoji: '🟡', difficulty: 'medium', options: [
    { label: 'Green', emoji: '🟢', value: 'green' }, { label: 'Red', emoji: '🔴', value: 'red' },
    { label: 'Yellow', emoji: '🟡', value: 'yellow' }, { label: 'Blue', emoji: '🔵', value: 'blue' },
  ]},
  { id: 8, type: 'shape', question: 'Which one is a STAR?', target: 'star', emoji: '⭐', difficulty: 'medium', options: [
    { label: 'Circle', emoji: '⭕', value: 'circle' }, { label: 'Heart', emoji: '❤️', value: 'heart' },
    { label: 'Square', emoji: '⬜', value: 'square' }, { label: 'Star', emoji: '⭐', value: 'star' },
  ]},
  { id: 9, type: 'color', question: 'Which one is PURPLE?', target: 'purple', emoji: '🟣', difficulty: 'medium', options: [
    { label: 'Purple', emoji: '🟣', value: 'purple' }, { label: 'Orange', emoji: '🟠', value: 'orange' },
    { label: 'Red', emoji: '🔴', value: 'red' }, { label: 'Blue', emoji: '🔵', value: 'blue' },
  ]},
  { id: 10, type: 'shape', question: 'Which one is a DIAMOND?', target: 'diamond', emoji: '💎', difficulty: 'medium', options: [
    { label: 'Diamond', emoji: '💎', value: 'diamond' }, { label: 'Oval', emoji: '🥚', value: 'oval' },
    { label: 'Star', emoji: '⭐', value: 'star' }, { label: 'Heart', emoji: '❤️', value: 'heart' },
  ]},
  { id: 11, type: 'color', question: 'Which one is PINK?', target: 'pink', emoji: '🩷', difficulty: 'medium', options: [
    { label: 'Pink', emoji: '🩷', value: 'pink' }, { label: 'Purple', emoji: '🟣', value: 'purple' },
    { label: 'Yellow', emoji: '🟡', value: 'yellow' }, { label: 'Green', emoji: '🟢', value: 'green' },
  ]},
  { id: 12, type: 'shape', question: 'Which one is a HEART?', target: 'heart', emoji: '❤️', difficulty: 'medium', options: [
    { label: 'Triangle', emoji: '🔺', value: 'triangle' }, { label: 'Circle', emoji: '⭕', value: 'circle' },
    { label: 'Heart', emoji: '❤️', value: 'heart' }, { label: 'Diamond', emoji: '💎', value: 'diamond' },
  ]},
  // ── Hard (13–16) ──
  { id: 13, type: 'color', question: 'Which one is ORANGE?', target: 'orange', emoji: '🟠', difficulty: 'hard', options: [
    { label: 'White', emoji: '⚪', value: 'white' }, { label: 'Orange', emoji: '🟠', value: 'orange' },
    { label: 'Yellow', emoji: '🟡', value: 'yellow' }, { label: 'Red', emoji: '🔴', value: 'red' },
  ]},
  { id: 14, type: 'shape', question: 'Which one is an OVAL?', target: 'oval', emoji: '🥚', difficulty: 'hard', options: [
    { label: 'Oval', emoji: '🥚', value: 'oval' }, { label: 'Rectangle', emoji: '🟫', value: 'rectangle' },
    { label: 'Diamond', emoji: '💎', value: 'diamond' }, { label: 'Square', emoji: '⬜', value: 'square' },
  ]},
  { id: 15, type: 'color', question: 'Which one is WHITE?', target: 'white', emoji: '⚪', difficulty: 'hard', options: [
    { label: 'Yellow', emoji: '🟡', value: 'yellow' }, { label: 'Blue', emoji: '🔵', value: 'blue' },
    { label: 'White', emoji: '⚪', value: 'white' }, { label: 'Pink', emoji: '🩷', value: 'pink' },
  ]},
  { id: 16, type: 'shape', question: 'Which one is a RECTANGLE?', target: 'rectangle', emoji: '🟫', difficulty: 'hard', options: [
    { label: 'Star', emoji: '⭐', value: 'star' }, { label: 'Rectangle', emoji: '🟫', value: 'rectangle' },
    { label: 'Heart', emoji: '❤️', value: 'heart' }, { label: 'Triangle', emoji: '🔺', value: 'triangle' },
  ]},
  // ── Hard: Color Mixing & Shape Properties (17–20) ──
  { id: 17, type: 'color', question: 'What color do you get when you mix RED and YELLOW?', target: 'orange', emoji: '🟠', difficulty: 'hard', options: [
    { label: 'Purple', emoji: '🟣', value: 'purple' }, { label: 'Orange', emoji: '🟠', value: 'orange' },
    { label: 'Green', emoji: '🟢', value: 'green' }, { label: 'Pink', emoji: '🩷', value: 'pink' },
  ]},
  { id: 18, type: 'color', question: 'What color do you get when you mix BLUE and YELLOW?', target: 'green', emoji: '🟢', difficulty: 'hard', options: [
    { label: 'Orange', emoji: '🟠', value: 'orange' }, { label: 'Purple', emoji: '🟣', value: 'purple' },
    { label: 'Green', emoji: '🟢', value: 'green' }, { label: 'Brown', emoji: '🟤', value: 'brown' },
  ]},
  { id: 19, type: 'color', question: 'What color do you get when you mix RED and BLUE?', target: 'purple', emoji: '🟣', difficulty: 'hard', options: [
    { label: 'Brown', emoji: '🟤', value: 'brown' }, { label: 'Green', emoji: '🟢', value: 'green' },
    { label: 'Purple', emoji: '🟣', value: 'purple' }, { label: 'Orange', emoji: '🟠', value: 'orange' },
  ]},
  { id: 20, type: 'shape', question: 'How many sides does a HEXAGON have?', target: 'hexagon', emoji: '⬡', difficulty: 'hard', options: [
    { label: 'Five', emoji: '5️⃣', value: 'pentagon' }, { label: 'Six', emoji: '6️⃣', value: 'hexagon' },
    { label: 'Seven', emoji: '7️⃣', value: 'heptagon' }, { label: 'Eight', emoji: '8️⃣', value: 'octagon' },
  ]},
];

// ════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════

function filterQuestionsByAge(segment: AgeSegment): ColorShapeQuestion[] {
  switch (segment) {
    case 'toddler': {
      const easy = ALL_QUESTIONS.filter((q) => q.difficulty === 'easy');
      return [...shuffle(easy), ...shuffle(easy)];
    }
    case 'early-learner':
      return shuffle(ALL_QUESTIONS.filter((q) => q.difficulty === 'easy' || q.difficulty === 'medium'));
    case 'kid':
      return shuffle(ALL_QUESTIONS);
  }
}

function ensureCorrectInOptions(
  options: ColorShapeOption[],
  target: string,
  count: number,
): ColorShapeOption[] {
  const correct = options.find((o) => o.value === target);
  if (!correct) return options;
  const others = shuffle(options.filter((o) => o.value !== target)).slice(0, count - 1);
  return shuffle([correct, ...others]);
}

function calculateStars(score: number, total: number): 0 | 1 | 2 | 3 {
  if (total === 0) return 0;
  const pct = score / total;
  if (pct >= 0.9) return 3;
  if (pct >= 0.7) return 2;
  return 1;
}

function getEncouragement(stars: 0 | 1 | 2 | 3): string {
  switch (stars) {
    case 3: return 'Amazing! You are a color & shape superstar! 🌟';
    case 2: return 'Great job! You know your colors and shapes! 🎉';
    case 1: return 'Good try! Keep practicing and you will get even better! 💪';
    default: return 'Nice effort! Let us try again! 🌈';
  }
}

function getDifficultyFromSegment(segment: AgeSegment): DifficultyLevel {
  switch (segment) {
    case 'toddler': return 'easy';
    case 'early-learner': return 'medium';
    case 'kid': return 'hard';
  }
}

// ════════════════════════════════════════════════
// Timer per question for kids 8-10
// ════════════════════════════════════════════════

const TIMER_SECONDS = 10;

// ════════════════════════════════════════════════
// Component
// ════════════════════════════════════════════════

export default function ColorsShapesModule() {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const { activeChildProfile } = useAuthStore();
  const config = useAgeAdaptiveConfig(activeChildProfile?.age ?? 5);
  const { playClick, playSuccess, playError } = useSoundEffects();

  // ── State ──
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);

  // ── Active questions (age-filtered, shuffled once) ──
  const activeQuestions = useMemo(
    () => filterQuestionsByAge(config.segment),
    [config.segment],
  );

  const totalQuestions = activeQuestions.length;
  const currentQuestion = activeQuestions[currentIndex];

  // ── Filtered + shuffled options per question (re-shuffle on question change) ──
  const displayOptions = useMemo(() => {
    if (!currentQuestion) return [];
    const shuffled = shuffle(currentQuestion.options);

    if (config.segment === 'toddler') {
      return ensureCorrectInOptions(shuffled, currentQuestion.target, 2);
    }
    return shuffled;
  }, [currentQuestion, config.segment]);

  // ── Timer effect (kids 8-10 only) ──
  useEffect(() => {
    if (!config.enableTimedChallenges || feedback !== null || completed) return;

    setTimeLeft(TIMER_SECONDS);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Time's up — treat as wrong
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, feedback, completed, config.enableTimedChallenges]);

  // ── Firestore mutations ──
  const saveProgressMutation = useMutation({
    mutationFn: (data: Parameters<typeof upsertProgress>[0]) => upsertProgress(data),
  });

  const saveScoreMutation = useMutation({
    mutationFn: (data: Parameters<typeof saveGameScore>[0]) => saveGameScore(data),
  });

  // ── Handlers ──
  const handleTimeout = useCallback(() => {
    if (feedback !== null || completed) return;
    playError();
    setFeedback('wrong');
    setSelectedValue(null);

    setTimeout(() => {
      setFeedback(null);
      setSelectedValue(null);
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        setCompleted(true);
      }
    }, 1500);
  }, [feedback, completed, currentIndex, totalQuestions, playError]);

  const handleAnswer = useCallback(
    (value: string) => {
      if (feedback !== null || !currentQuestion) return;
      playClick();
      setSelectedValue(value);

      const isCorrect = value === currentQuestion.target;

      if (isCorrect) {
        playSuccess();
        setScore((s) => s + 1);
        setFeedback('correct');
      } else {
        playError();
        setFeedback('wrong');
      }

      setTimeout(() => {
        setFeedback(null);
        setSelectedValue(null);
        if (currentIndex < totalQuestions - 1) {
          setCurrentIndex((i) => i + 1);
        } else {
          setCompleted(true);
        }
      }, 1500);
    },
    [feedback, currentQuestion, currentIndex, totalQuestions, playClick, playSuccess, playError],
  );

  const handlePlayAgain = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setFeedback(null);
    setSelectedValue(null);
    setCompleted(false);
    startTimeRef.current = Date.now();
    setTimeLeft(TIMER_SECONDS);
    playClick();
  }, [playClick]);

  const handleHome = useCallback(() => {
    playClick();
    navigate(`/kids/${profileId}`);
  }, [navigate, profileId, playClick]);

  // ── Save progress on completion ──
  useEffect(() => {
    if (!completed || !activeChildProfile) return;

    const stars = calculateStars(score, totalQuestions);
    const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);

    saveProgressMutation.mutate({
      childId: activeChildProfile.id,
      parentId: activeChildProfile.parentId,
      moduleId: 'colors',
      completed: true,
      stars,
      percentComplete: 100,
      lastAccessedAt: new Date(),
      completedAt: new Date(),
    });

    saveScoreMutation.mutate({
      childId: activeChildProfile.id,
      parentId: activeChildProfile.parentId,
      gameType: 'puzzle',
      score,
      maxScore: totalQuestions,
      difficulty: getDifficultyFromSegment(config.segment),
      durationSeconds,
      playedAt: new Date(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed]);

  // ── Guard ──
  if (!activeChildProfile || !currentQuestion) {
    return (
      <div className="kv-page flex items-center justify-center">
        <p className="text-kv-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  const stars = calculateStars(score, totalQuestions);

  // ════════════════════════════════════════════════
  // Completion Screen
  // ════════════════════════════════════════════════

  if (completed) {
    return (
      <div className="kv-page flex flex-col items-center justify-center min-h-[70vh]">
        <AnimatedContainer variant="pop" className="w-full max-w-md text-center">
          <MotionCard asMotion={true} variant="elevated" padding="xl">
            <h1 className="font-display text-3xl md:text-4xl text-kv-orange mb-2">
              Colors & Shapes Complete!
            </h1>
            <p className="text-kv-gray-500 text-lg mb-6">Great learning session!</p>

            <div className="flex justify-center mb-4">
              <StarRating rating={stars} size="lg" label="Your star rating" />
            </div>

            <p className="text-2xl font-bold text-kv-gray-800 mb-1">
              {score} / {totalQuestions}
            </p>
            <p className="text-kv-gray-500 mb-6">{getEncouragement(stars)}</p>

            {stars === 3 && (
              <div className="flex justify-center mb-6">
                <AchievementBadge
                  name="Color & Shape Master"
                  description="Perfect score achieved!"
                  emoji="🎨"
                  size="lg"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
              <Button variant="warning" size="lg" fullWidth onClick={handlePlayAgain}>
                Play Again
              </Button>
              <Button variant="secondary" size="lg" fullWidth onClick={handleHome}>
                Home
              </Button>
            </div>
          </MotionCard>
        </AnimatedContainer>
      </div>
    );
  }

  // ════════════════════════════════════════════════
  // Game Screen
  // ════════════════════════════════════════════════

  const isToddler = config.segment === 'toddler';
  const isKid = config.segment === 'kid';

  return (
    <div className="kv-page">
      {/* ── Header ── */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleHome}
            className="kv-button-base inline-flex items-center gap-2 bg-kv-gray-200 text-kv-gray-600 px-4 py-2 text-sm rounded-xl hover:bg-kv-gray-300 transition-colors"
            aria-label="Back to home"
          >
            <IconArrowLeft size={18} />
            <span>Home</span>
          </button>
          <button
            onClick={handleHome}
            className="kv-button-base w-10 h-10 flex items-center justify-center bg-white text-kv-gray-600 rounded-xl shadow-card hover:shadow-card-hover transition-shadow"
            aria-label="Home"
          >
            <IconHome size={18} />
          </button>
        </div>

        <h1 className="font-display text-2xl md:text-3xl text-kv-orange">
          Colors & Shapes 🎨
        </h1>
        {!isToddler && (
          <p className="text-kv-gray-500 mt-1">Identify the correct color or shape!</p>
        )}

        <div className="mt-4">
          <ProgressBar
            value={currentIndex}
            max={totalQuestions}
            variant="orange"
            size="lg"
            showLabel
            labelPosition="top"
          />
        </div>
      </header>

      {/* ── Question Card ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35 }}
        >
          <div className="text-center mb-6">
            {/* Timer (kids 8-10 only) */}
            {isKid && config.enableTimedChallenges && feedback === null && (
              <div className="mb-3">
                <motion.div
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold',
                    timeLeft <= 3
                      ? 'bg-kv-red/15 text-kv-red'
                      : 'bg-kv-gray-100 text-kv-gray-600',
                  )}
                  animate={timeLeft <= 3 ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  <span>⏱️</span>
                  <span>{timeLeft}s</span>
                </motion.div>
              </div>
            )}

            <span
              className={cn(
                'block mb-4',
                isToddler ? 'text-8xl' : 'text-7xl',
              )}
              aria-hidden="true"
            >
              {currentQuestion.emoji}
            </span>
            <h2
              className={cn(
                'font-display text-kv-gray-800 mb-2',
                isToddler ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl',
              )}
            >
              {currentQuestion.question}
            </h2>
            <p className="text-sm text-kv-gray-400">
              Question {currentIndex + 1} of {totalQuestions}
              {!isToddler && (
                <span className="ml-2 text-kv-orange font-bold">
                  Score: {score}
                </span>
              )}
            </p>
          </div>

          {/* ── Answer Grid ── */}
          <div
            className={cn(
              'grid gap-4 max-w-2xl mx-auto',
              isToddler && 'grid-cols-2',
              !isToddler && !isKid && 'grid-cols-2',
              isKid && 'grid-cols-4',
            )}
          >
            {displayOptions.map((opt) => {
              const isCorrectOption = opt.value === currentQuestion.target;
              const isSelectedWrong = feedback === 'wrong' && opt.value === selectedValue;

              const isHighlightCorrect =
                feedback === 'correct' && isCorrectOption;
              const isShowCorrectOnWrong =
                feedback === 'wrong' && isCorrectOption;
              const isDimmed =
                feedback !== null &&
                !isHighlightCorrect &&
                !isShowCorrectOnWrong &&
                !isSelectedWrong;

              return (
                <MotionCard
                  key={opt.value}
                  asMotion={true}
                  variant="interactive"
                  padding="none"
                  whileHover={feedback === null ? { scale: 1.05, y: -2 } : {}}
                  whileTap={feedback === null ? { scale: 0.95 } : {}}
                  animate={
                    isHighlightCorrect
                      ? { scale: [1, 1.1, 1] }
                      : isSelectedWrong
                        ? { x: [0, -8, 8, -8, 0] }
                        : {}
                  }
                  transition={{ duration: 0.4 }}
                  onClick={() => handleAnswer(opt.value)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200',
                    isToddler ? 'min-h-[100px] py-4' : 'min-h-[80px] py-3',
                    isHighlightCorrect && 'ring-4 ring-kv-green bg-kv-green/10',
                    isShowCorrectOnWrong && 'ring-4 ring-kv-green bg-kv-green/10',
                    isSelectedWrong && 'opacity-40',
                    isDimmed && 'opacity-50',
                    feedback !== null && 'pointer-events-none',
                  )}
                  role="button"
                  aria-label={opt.label}
                  tabIndex={feedback === null ? 0 : -1}
                >
                  <span
                    className={cn(
                      isToddler ? 'text-6xl' : 'text-4xl',
                    )}
                    aria-hidden="true"
                  >
                    {opt.emoji}
                  </span>
                  {config.showTextLabels && (
                    <span
                      className={cn(
                        'font-bold text-kv-gray-700',
                        isToddler ? 'text-lg' : 'text-sm',
                      )}
                    >
                      {opt.label}
                    </span>
                  )}
                </MotionCard>
              );
            })}
          </div>

          {/* ── Feedback Display ── */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-center mt-6"
                role="alert"
                aria-live="assertive"
              >
                {feedback === 'correct' ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-4xl" aria-hidden="true">🎉</span>
                    <p className="text-xl font-bold text-kv-green">That&apos;s right!</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-4xl" aria-hidden="true">🤔</span>
                    <p className="text-lg font-bold text-kv-orange">
                      The answer is{' '}
                      <span className="text-kv-green">
                        {displayOptions.find((o) => o.value === currentQuestion.target)?.label ?? currentQuestion.target}
                      </span>
                      !
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
