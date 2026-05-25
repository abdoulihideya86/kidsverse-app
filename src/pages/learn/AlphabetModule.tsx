// ──────────────────────────────────────────────
// KidsVerse — Alphabet Module (Phase 5)
// Interactive alphabet learning with phonics,
// word association, progress tracking, and Firestore sync.
// ──────────────────────────────────────────────
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import { useAgeAdaptiveConfig } from '@/hooks/useAgeAdaptiveConfig';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { getProgress, upsertProgress, awardBadge, saveGameScore } from '@/lib/firestore';
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
  StaggerGrid,
  StaggerItem,
  AnimatedContainer,
} from '@/components';
import { cn, shuffle } from '@/lib/utils';
import type { DifficultyLevel } from '@/types';

// ── Types ──

interface LetterData {
  letter: string;
  word: string;
  emoji: string;
  phonetic: string;
  color: string;
  sentence: string;
}

interface LetterQuizQuestion {
  letter: string;
  word: string;
  emoji: string;
  options: string[];
}

// ── Alphabet Data ──

const COLORS = [
  'bg-kv-blue',
  'bg-kv-green',
  'bg-kv-orange',
  'bg-kv-purple',
  'bg-kv-pink',
  'bg-kv-cyan',
] as const;

const ALPHABET: LetterData[] = [
  { letter: 'A', word: 'Apple', emoji: '🍎', phonetic: 'ah', color: COLORS[0]!, sentence: 'A is for Apple. I like to eat red apples!' },
  { letter: 'B', word: 'Ball', emoji: '⚽', phonetic: 'buh', color: COLORS[1]!, sentence: 'B is for Ball. Let us bounce the ball together!' },
  { letter: 'C', word: 'Cat', emoji: '🐱', phonetic: 'kuh', color: COLORS[2]!, sentence: 'C is for Cat. The cat is sleeping on the mat.' },
  { letter: 'D', word: 'Dog', emoji: '🐶', phonetic: 'duh', color: COLORS[3]!, sentence: 'D is for Dog. My dog loves to play fetch!' },
  { letter: 'E', word: 'Elephant', emoji: '🐘', phonetic: 'eh', color: COLORS[4]!, sentence: 'E is for Elephant. Elephants are the biggest land animals!' },
  { letter: 'F', word: 'Fish', emoji: '🐟', phonetic: 'fuh', color: COLORS[5]!, sentence: 'F is for Fish. Fish swim in the ocean.' },
  { letter: 'G', word: 'Grape', emoji: '🍇', phonetic: 'guh', color: COLORS[0]!, sentence: 'G is for Grape. Grapes grow in bunches on vines!' },
  { letter: 'H', word: 'House', emoji: '🏠', phonetic: 'huh', color: COLORS[1]!, sentence: 'H is for House. My house has a red door.' },
  { letter: 'I', word: 'Ice Cream', emoji: '🍦', phonetic: 'ih', color: COLORS[2]!, sentence: 'I is for Ice Cream. Ice cream is cold and sweet!' },
  { letter: 'J', word: 'Jump', emoji: '🦘', phonetic: 'juh', color: COLORS[3]!, sentence: 'J is for Jump. Kangaroos love to jump high!' },
  { letter: 'K', word: 'Kite', emoji: '🪁', phonetic: 'kuh', color: COLORS[4]!, sentence: 'K is for Kite. We fly kites on windy days.' },
  { letter: 'L', word: 'Lion', emoji: '🦁', phonetic: 'luh', color: COLORS[5]!, sentence: 'L is for Lion. The lion is the king of the jungle!' },
  { letter: 'M', word: 'Moon', emoji: '🌙', phonetic: 'muh', color: COLORS[0]!, sentence: 'M is for Moon. The moon shines at night.' },
  { letter: 'N', word: 'Nut', emoji: '🥜', phonetic: 'nuh', color: COLORS[1]!, sentence: 'N is for Nut. Squirrels love to eat nuts.' },
  { letter: 'O', word: 'Orange', emoji: '🍊', phonetic: 'oh', color: COLORS[2]!, sentence: 'O is for Orange. Oranges are juicy and round!' },
  { letter: 'P', word: 'Panda', emoji: '🐼', phonetic: 'puh', color: COLORS[3]!, sentence: 'P is for Panda. Pandas eat bamboo all day.' },
  { letter: 'Q', word: 'Queen', emoji: '👑', phonetic: 'kwuh', color: COLORS[4]!, sentence: 'Q is for Queen. The queen wears a golden crown!' },
  { letter: 'R', word: 'Rain', emoji: '🌧️', phonetic: 'ruh', color: COLORS[5]!, sentence: 'R is for Rain. Rain helps flowers grow.' },
  { letter: 'S', word: 'Star', emoji: '⭐', phonetic: 'ss', color: COLORS[0]!, sentence: 'S is for Star. Stars twinkle in the night sky.' },
  { letter: 'T', word: 'Tree', emoji: '🌳', phonetic: 'tuh', color: COLORS[1]!, sentence: 'T is for Tree. Trees have green leaves and brown trunks.' },
  { letter: 'U', word: 'Umbrella', emoji: '☂️', phonetic: 'uh', color: COLORS[2]!, sentence: 'U is for Umbrella. I use my umbrella when it rains!' },
  { letter: 'V', word: 'Violin', emoji: '🎻', phonetic: 'vuh', color: COLORS[3]!, sentence: 'V is for Violin. The violin makes beautiful music.' },
  { letter: 'W', word: 'Whale', emoji: '🐋', phonetic: 'wuh', color: COLORS[4]!, sentence: 'W is for Whale. Whales live in the deep blue ocean.' },
  { letter: 'X', word: 'Xylophone', emoji: '🎵', phonetic: 'zuh', color: COLORS[5]!, sentence: 'X is for Xylophone. Tap the xylophone to make a song!' },
  { letter: 'Y', word: 'Yarn', emoji: '🧶', phonetic: 'yuh', color: COLORS[0]!, sentence: 'Y is for Yarn. Grandma knits with colorful yarn.' },
  { letter: 'Z', word: 'Zebra', emoji: '🦓', phonetic: 'zuh', color: COLORS[1]!, sentence: 'Z is for Zebra. Zebras have black and white stripes!' },
];

const TOTAL_LETTERS = ALPHABET.length;

const QUIZ_TIMER_SECONDS = 10;

// ── Confetti Particles ──

const CONFETTI_PIECES = [
  { emoji: '🎉', x: 10, y: -20, delay: 0 },
  { emoji: '⭐', x: 25, y: -30, delay: 0.1 },
  { emoji: '🎊', x: 50, y: -25, delay: 0.2 },
  { emoji: '🌟', x: 75, y: -35, delay: 0.15 },
  { emoji: '✨', x: 90, y: -20, delay: 0.25 },
  { emoji: '🎈', x: 15, y: -40, delay: 0.3 },
  { emoji: '🏅', x: 40, y: -15, delay: 0.05 },
  { emoji: '💫', x: 60, y: -30, delay: 0.2 },
  { emoji: '🎪', x: 85, y: -25, delay: 0.1 },
  { emoji: '🎊', x: 30, y: -35, delay: 0.35 },
];

// ── Component ──

export default function AlphabetModule() {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const queryClient = useQueryClient();

  const activeChildProfile = useAuthStore((s) => s.activeChildProfile);
  const { playClick, playSuccess, playError } = useSoundEffects();

  const age = activeChildProfile?.age ?? 5;
  const config = useAgeAdaptiveConfig(age);

  const childId = activeChildProfile?.id ?? '';
  const parentId = activeChildProfile?.parentId ?? '';

  const [mode, setMode] = useState<'explore' | 'quiz'>('explore');
  const [activeLetter, setActiveLetter] = useState<LetterData | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);

  // ── Quiz State ──
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizTimeLeft, setQuizTimeLeft] = useState(QUIZ_TIMER_SECONDS);

  // ── Quiz Questions ──
  const quizQuestions = useMemo<LetterQuizQuestion[]>(() => {
    const shuffled = shuffle([...ALPHABET]);
    const selected = shuffled.slice(0, 10);
    return selected.map((item) => {
      const wrongCount = config.segment === 'toddler' ? 1 : 3;
      const wrongOptions = shuffle(ALPHABET.filter((a) => a.letter !== item.letter))
        .slice(0, wrongCount)
        .map((a) => a.letter);
      return {
        letter: item.letter,
        word: item.word,
        emoji: item.emoji,
        options: shuffle([item.letter, ...wrongOptions]),
      };
    });
  }, [config.segment]);

  const totalQuizQuestions = quizQuestions.length;
  const currentQuizQuestion = quizQuestions[quizIndex] ?? null;

  // ── Quiz Timer (kids 8-10 only) ──
  useEffect(() => {
    if (mode !== 'quiz') return;
    if (!config.enableTimedChallenges || quizFeedback || quizCompleted || !currentQuizQuestion) return;

    const interval = setInterval(() => {
      setQuizTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setQuizFeedback('timeout');
          playError();
          setTimeout(() => advanceQuizQuestion(), 1200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, config.enableTimedChallenges, quizFeedback, quizCompleted, currentQuizQuestion, playError]);

  // Reset quiz timer on new question
  useEffect(() => {
    if (mode !== 'quiz' || !quizFeedback) {
      setQuizTimeLeft(QUIZ_TIMER_SECONDS);
    }
  }, [mode, quizIndex, quizFeedback]);

  // ── Quiz Save Mutation ──
  const quizSaveMutation = useMutation({
    mutationFn: () =>
      saveGameScore({
        childId,
        parentId,
        gameType: 'spelling-bee',
        score: quizScore,
        maxScore: totalQuizQuestions,
        difficulty: config.segment === 'toddler' ? 'easy' as DifficultyLevel : config.segment === 'early-learner' ? 'medium' as DifficultyLevel : 'hard' as DifficultyLevel,
        durationSeconds: 0,
        playedAt: new Date(),
      }),
  });

  // ── Quiz Award Badge Mutation ──
  const quizBadgeMutation = useMutation({
    mutationFn: () =>
      awardBadge({
        childId,
        parentId,
        category: 'perfect-score',
        name: 'Alphabet Master',
        description: 'You scored 90% or higher on the letter quiz!',
        icon: '🏆',
        earnedAt: new Date(),
      }),
  });

  // ── Load Progress ──
  const { data: progressData } = useQuery({
    queryKey: ['progress', childId, 'alphabet'],
    queryFn: () => getProgress(childId),
    enabled: !!childId,
  });

  // Derive completed letters from Firestore progress count.
  // Each progress entry with moduleId 'alphabet' represents one explored letter.
  // On load, we mark the first N alphabet letters as completed based on the count.
  const completedLetters = useMemo(() => {
    const set = new Set<string>();
    const alphabetCount = (progressData ?? []).filter(
      (p) => p.moduleId === 'alphabet'
    ).length;
    for (let i = 0; i < Math.min(alphabetCount, TOTAL_LETTERS); i++) {
      set.add(ALPHABET[i]!.letter);
    }
    return set;
  }, [progressData]);

  const completedCount = completedLetters.size;

  // ── Mark letter explored mutation ──
  const exploreMutation = useMutation({
    mutationFn: () =>
      upsertProgress({
        childId,
        parentId,
        moduleId: 'alphabet',
        completed: false,
        stars: 0,
        percentComplete: Math.round(((completedCount + 1) / TOTAL_LETTERS) * 100),
        lastAccessedAt: new Date(),
        completedAt: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', childId, 'alphabet'] });
    },
  });

  // ── Award badge mutation ──
  const badgeMutation = useMutation({
    mutationFn: () =>
      awardBadge({
        childId,
        parentId,
        category: 'explorer',
        name: 'Alphabet Explorer',
        description: 'You explored all 26 letters!',
        icon: '🏅',
        earnedAt: new Date(),
      }),
  });

  // ── Completion save mutation ──
  const completionMutation = useMutation({
    mutationFn: () =>
      upsertProgress({
        childId,
        parentId,
        moduleId: 'alphabet',
        completed: true,
        stars: 3,
        percentComplete: 100,
        lastAccessedAt: new Date(),
        completedAt: new Date(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', childId, 'alphabet'] });
      badgeMutation.mutate();
      playSuccess();
      setShowCompletion(true);
    },
  });

  // ── Check completion when completedCount changes ──
  useEffect(() => {
    if (completedCount >= TOTAL_LETTERS && !showCompletion) {
      completionMutation.mutate();
    }
  }, [completedCount, showCompletion, completionMutation]);

  // ── Handle letter click ──
  const handleLetterClick = useCallback(
    (item: LetterData) => {
      playClick();
      setActiveLetter(item);

      if (!completedLetters.has(item.letter)) {
        exploreMutation.mutate();
      }
    },
    [playClick, completedLetters, exploreMutation]
  );

  // ── Quiz Handlers ──
  const advanceQuizQuestion = useCallback(() => {
    setQuizFeedback(null);
    if (quizIndex < totalQuizQuestions - 1) {
      setQuizIndex((i) => i + 1);
    } else {
      quizSaveMutation.mutate();
      if (quizScore >= Math.round(totalQuizQuestions * 0.9)) {
        quizBadgeMutation.mutate();
      }
      setQuizCompleted(true);
    }
  }, [quizIndex, totalQuizQuestions, quizSaveMutation, quizBadgeMutation, quizScore]);

  const handleQuizAnswer = useCallback(
    (letter: string) => {
      if (quizFeedback || !currentQuizQuestion) return;
      playClick();

      if (letter === currentQuizQuestion.letter) {
        setQuizFeedback('correct');
        playSuccess();
        setQuizScore((s) => s + 1);
      } else {
        setQuizFeedback('wrong');
        playError();
      }

      setTimeout(() => advanceQuizQuestion(), 1200);
    },
    [quizFeedback, currentQuizQuestion, playClick, playSuccess, playError, advanceQuizQuestion],
  );

  const handleQuizPlayAgain = useCallback(() => {
    setQuizIndex(0);
    setQuizScore(0);
    setQuizFeedback(null);
    setQuizCompleted(false);
    setQuizTimeLeft(QUIZ_TIMER_SECONDS);
  }, []);

  const handleModeSwitch = useCallback((newMode: 'explore' | 'quiz') => {
    playClick();
    if (newMode === 'quiz') {
      setQuizIndex(0);
      setQuizScore(0);
      setQuizFeedback(null);
      setQuizCompleted(false);
      setQuizTimeLeft(QUIZ_TIMER_SECONDS);
    }
    setMode(newMode);
    setActiveLetter(null);
  }, [playClick]);

  // ── Reset ──
  const handlePlayAgain = useCallback(() => {
    setShowCompletion(false);
    setActiveLetter(null);
    queryClient.invalidateQueries({ queryKey: ['progress', childId, 'alphabet'] });
  }, [queryClient, childId]);

  const handleGoHome = useCallback(() => {
    navigate(`/kids/${profileId}`);
  }, [navigate, profileId]);

  // ── Age-adaptive grid class ──
  const gridClass = useMemo(() => {
    switch (config.segment) {
      case 'toddler':
        return 'grid-cols-4 gap-3';
      case 'early-learner':
        return 'grid-cols-6 gap-3';
      case 'kid':
        return 'grid-cols-8 lg:grid-cols-13 gap-2';
    }
  }, [config.segment]);

  const cardMinHeight = config.segment === 'toddler' ? 'min-h-[90px]' : '';

  const letterTextSize = config.segment === 'kid' ? 'text-xl' : 'text-2xl';

  const emojiSize = config.segment === 'toddler' ? 'text-3xl' : 'text-xl';

  // ── Quiz star rating ──
  const quizStarRating = useMemo(() => {
    if (quizScore >= Math.round(totalQuizQuestions * 0.9)) return 3;
    if (quizScore >= Math.round(totalQuizQuestions * 0.7)) return 2;
    if (quizScore >= Math.round(totalQuizQuestions * 0.5)) return 1;
    return 0;
  }, [quizScore, totalQuizQuestions]);

  const quizEncouragingMessage = useMemo(() => {
    if (quizStarRating >= 3) return 'Perfect! You are an Alphabet Master! 🏆';
    if (quizStarRating >= 2) return 'Great job! Keep practicing! 🌟';
    if (quizStarRating >= 1) return 'Good try! You can do even better! 💪';
    return 'Keep learning! You will get there! 🎯';
  }, [quizStarRating]);

  // ── Quiz timer display color ──
  const quizTimerColorClass = quizTimeLeft <= 3
    ? 'text-kv-red'
    : quizTimeLeft <= 6
      ? 'text-kv-orange'
      : 'text-kv-blue';

  // ═══════════════════════════════════════════
  // Quiz Completion Screen
  // ═══════════════════════════════════════════
  if (mode === 'quiz' && quizCompleted) {
    const isMaster = quizScore >= Math.round(totalQuizQuestions * 0.9);
    return (
      <div className="kv-page flex flex-col items-center justify-center min-h-[80vh]">
        <AnimatedContainer variant="pop" className="flex flex-col items-center gap-6">
          <motion.span
            className="text-7xl"
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.5 }}
            aria-hidden="true"
          >
            {isMaster ? '🏆' : quizStarRating >= 2 ? '🌟' : '💪'}
          </motion.span>

          <h1 className="font-display text-4xl text-kv-blue text-center">
            {isMaster ? 'Alphabet Master!' : 'Quiz Complete!'}
          </h1>

          <StarRating rating={quizStarRating} size="lg" label="Quiz score rating" />

          <p className="text-2xl text-kv-gray-700 text-center">
            You got{' '}
            <span className="font-bold text-kv-blue">{quizScore}</span>{' '}
            out of{' '}
            <span className="font-bold">{totalQuizQuestions}</span>{' '}
            correct!
          </p>
          <p className="text-lg text-kv-gray-500 text-center">
            {quizEncouragingMessage}
          </p>

          {isMaster && (
            <AchievementBadge
              name="Alphabet Master"
              description="You scored 90% or higher on the letter quiz!"
              emoji="🏆"
              earned
              size="lg"
            />
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button variant="primary" size="lg" onClick={handleQuizPlayAgain}>
              Play Again
            </Button>
            <Button variant="secondary" size="lg" onClick={() => handleModeSwitch('explore')}>
              Explore Letters
            </Button>
            <Button variant="ghost" size="lg" onClick={handleGoHome}>
              Home
            </Button>
          </div>
        </AnimatedContainer>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // Completion Celebration
  // ═══════════════════════════════════════════
  if (showCompletion) {
    return (
      <div className="kv-page flex flex-col items-center justify-center min-h-[80vh]">
        {/* Confetti */}
        {CONFETTI_PIECES.map((piece, i) => (
          <motion.div
            key={i}
            className="fixed pointer-events-none select-none text-4xl"
            style={{ left: `${piece.x}%`, top: `${piece.y}%` }}
            initial={{ opacity: 0, y: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [0, 100, 200, 400],
              x: [0, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 80],
              scale: [0, 1.2, 1, 0.6],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 3, delay: piece.delay, ease: 'easeOut' }}
            aria-hidden="true"
          >
            {piece.emoji}
          </motion.div>
        ))}

        <AnimatedContainer variant="pop" className="flex flex-col items-center gap-6">
          <motion.span
            className="text-7xl"
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1 }}
            aria-hidden="true"
          >
            🏅
          </motion.span>

          <h1 className="font-display text-4xl text-kv-blue text-center">
            Alphabet Explorer!
          </h1>
          <p className="text-lg text-kv-gray-600 text-center">
            You explored all 26 letters! Amazing work!
          </p>

          <AchievementBadge
            name="Alphabet Explorer"
            description="You explored all 26 letters!"
            emoji="🏅"
            earned
            size="lg"
          />

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
  // Main Module View
  // ═══════════════════════════════════════════
  return (
    <div className="kv-page bg-gradient-to-b from-kv-blue/5 to-kv-cream min-h-screen">
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

        <h1 className="font-display text-3xl text-kv-blue">
          {config.showTextLabels ? 'Alphabet & Phonics' : '🅰️'}
        </h1>
        {config.showTextLabels && (
          <p className="text-kv-gray-500 mt-1">
            {mode === 'explore' ? 'Tap a letter to hear its sound!' : 'What letter does each word start with?'}
          </p>
        )}

        {/* Mode Toggle */}
        {config.showTextLabels && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleModeSwitch('explore')}
              className={cn(
                'kv-button-base px-4 py-2 rounded-full text-sm font-bold transition-all duration-200',
                mode === 'explore'
                  ? 'bg-kv-blue text-white shadow-card'
                  : 'bg-kv-gray-100 text-kv-gray-600 hover:bg-kv-gray-200',
              )}
              aria-label="Explore mode"
              aria-pressed={mode === 'explore'}
            >
              Explore 🔍
            </button>
            <button
              onClick={() => handleModeSwitch('quiz')}
              className={cn(
                'kv-button-base px-4 py-2 rounded-full text-sm font-bold transition-all duration-200',
                mode === 'quiz'
                  ? 'bg-kv-blue text-white shadow-card'
                  : 'bg-kv-gray-100 text-kv-gray-600 hover:bg-kv-gray-200',
              )}
              aria-label="Quiz mode"
              aria-pressed={mode === 'quiz'}
            >
              Quiz 🎯
            </button>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-4">
          <ProgressBar
            value={completedCount}
            max={TOTAL_LETTERS}
            variant="blue"
            size="md"
            showLabel
            labelPosition="right"
            animated
          />
        </div>
      </header>

      {/* ═══ Quiz Mode View ═══ */}
      {mode === 'quiz' && currentQuizQuestion && (
        <AnimatePresence mode="wait">
          <MotionCard
            key={`quiz-${quizIndex}`}
            asMotion={true}
            variant="elevated"
            padding="lg"
            className="mb-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center justify-between mb-4">
              {config.showTextLabels && (
                <Badge variant="default" size="md">
                  {`${quizIndex + 1} / ${totalQuizQuestions}`}
                </Badge>
              )}
              <Badge variant="primary" size="md">
                {`Score: ${quizScore}`}
              </Badge>
              {/* Timer (kids 8-10 only) */}
              {config.enableTimedChallenges && quizFeedback === null && (
                <div className="flex items-center gap-1.5">
                  <motion.span
                    className={cn('text-lg font-bold', quizTimerColorClass)}
                    animate={quizTimeLeft <= 3 ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    ⏰
                  </motion.span>
                  <span className={cn('font-display text-xl font-bold', quizTimerColorClass)}>
                    {quizTimeLeft}s
                  </span>
                </div>
              )}
            </div>

            {/* Question */}
            <div className="text-center mb-6">
              <span className="text-7xl block mb-4" aria-hidden="true">
                {currentQuizQuestion.emoji}
              </span>
              <p className="text-2xl font-bold text-kv-gray-800 mb-1">
                {currentQuizQuestion.word}
              </p>
              {config.showTextLabels && (
                <p className="text-kv-gray-500">What letter does this start with?</p>
              )}
            </div>

            {/* Answer Options */}
            <div className={cn(
              'grid gap-3',
              config.segment === 'toddler' ? 'grid-cols-2' : 'grid-cols-4',
            )}>
              {currentQuizQuestion.options.map((opt) => {
                const isAnswered = quizFeedback !== null;
                const isCorrectOpt = opt === currentQuizQuestion.letter;
                const showCorrect = isAnswered && isCorrectOpt;
                const showDimmed = isAnswered && !showCorrect;

                return (
                  <MotionButton
                    key={opt}
                    variant="primary"
                    onClick={() => handleQuizAnswer(opt)}
                    disabled={isAnswered}
                    whileHover={isAnswered ? {} : { scale: 1.05 }}
                    whileTap={isAnswered ? {} : { scale: 0.95 }}
                    className={cn(
                      'min-h-[64px] text-3xl font-display font-bold text-center',
                      config.segment === 'toddler' && 'min-h-[80px] text-4xl',
                      showCorrect && 'bg-kv-green text-white ring-4 ring-kv-green/30',
                      showDimmed && 'bg-kv-gray-200 text-kv-gray-400 opacity-50',
                      !showCorrect && !showDimmed && 'bg-white text-kv-gray-800 border-2 border-kv-gray-200 hover:border-kv-blue',
                    )}
                    aria-label={`Answer: ${opt}`}
                  >
                    {opt}
                  </MotionButton>
                );
              })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {quizFeedback && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    'text-center text-xl font-bold mt-4',
                    quizFeedback === 'correct' && 'text-kv-green',
                    quizFeedback === 'wrong' && 'text-kv-red',
                    quizFeedback === 'timeout' && 'text-kv-orange',
                  )}
                >
                  {quizFeedback === 'correct' && '🎉 Correct!'}
                  {quizFeedback === 'wrong' && `Oops! It starts with ${currentQuizQuestion.letter}`}
                  {quizFeedback === 'timeout' && `⏰ Time is up! It starts with ${currentQuizQuestion.letter}`}
                </motion.p>
              )}
            </AnimatePresence>
          </MotionCard>
        </AnimatePresence>
      )}

      {/* ═══ Active Letter Detail Card (Explore Mode) ═══ */}
      {mode === 'explore' && (
      <>
      <AnimatePresence mode="wait">
        {activeLetter && (
          <MotionCard
            key={activeLetter.letter}
            asMotion={true}
            gradient="blue"
            padding="lg"
            className="mb-6 text-center overflow-hidden"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            aria-live="polite"
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-7xl select-none" aria-hidden="true">
                {activeLetter.emoji}
              </span>
              <p className="text-6xl font-display leading-none">
                {activeLetter.letter}
              </p>
              {config.showTextLabels && (
                <>
                  <p className="text-2xl font-bold opacity-90">
                    is for {activeLetter.word}
                  </p>
                  <p className="text-base opacity-75 italic">
                    Sounds like &quot;{activeLetter.phonetic}&quot;
                  </p>
                </>
              )}
              {config.segment === 'kid' && (
                <p className="text-sm opacity-80 mt-1 max-w-md">
                  {activeLetter.sentence}
                </p>
              )}
            </div>
          </MotionCard>
        )}
      </AnimatePresence>

      {/* ═══ Letter Grid ═══ */}
      <nav aria-label="Alphabet letters">
        <StaggerGrid className={cn('grid', gridClass)}>
          {ALPHABET.map((item) => {
            const isCompleted = completedLetters.has(item.letter);
            const isActive = activeLetter?.letter === item.letter;

            return (
              <StaggerItem key={item.letter}>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleLetterClick(item)}
                  className={cn(
                    'kv-card-interactive flex flex-col items-center justify-center gap-1 rounded-2xl p-2 transition-all duration-200',
                    cardMinHeight,
                    isActive && 'ring-4 ring-kv-blue bg-kv-blue/10 shadow-card-hover',
                    isCompleted && !isActive && 'bg-kv-green/10',
                    !isActive && !isCompleted && 'bg-white',
                  )}
                  aria-label={cn(
                    `Letter ${item.letter}, ${item.word}`,
                    isCompleted ? ', completed' : '',
                  )}
                >
                  <span
                    className={cn(emojiSize, 'select-none')}
                    aria-hidden="true"
                  >
                    {item.emoji}
                  </span>
                  <span className={cn(letterTextSize, 'font-display font-bold text-kv-gray-800')}>
                    {item.letter}
                  </span>
                  {config.showTextLabels && (
                    <span className="text-xs text-kv-gray-500 truncate max-w-full px-1">
                      {item.word}
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-xs text-kv-green font-bold" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </motion.button>
              </StaggerItem>
            );
          })}
        </StaggerGrid>
      </nav>
      </>
      )}
    </div>
  );
}
