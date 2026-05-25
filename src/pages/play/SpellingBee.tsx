import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import { useAgeAdaptiveConfig } from '@/hooks/useAgeAdaptiveConfig';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { saveGameScore, upsertProgress, awardBadge, getProgress } from '@/lib/firestore';
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
import { cn, shuffle } from '@/lib/utils';
import type { DifficultyLevel, GameType, AgeSegment, AgeRange } from '@/types';

// ──────────────────────────────────────────────
// Types & Constants
// ──────────────────────────────────────────────

interface SpellingWord {
  word: string;
  emoji: string;
  hint: string;
  category: string;
}

type FeedbackState = 'correct' | 'wrong' | null;

interface SegmentConfig {
  wordsPerRound: number;
  speechRate: number;
  difficulty: DifficultyLevel;
  timedMode: boolean;
}

const SEGMENT_SETTINGS: Record<AgeSegment, SegmentConfig> = {
  toddler: {
    wordsPerRound: 10,
    speechRate: 0.8,
    difficulty: 'easy',
    timedMode: false,
  },
  'early-learner': {
    wordsPerRound: 8,
    speechRate: 0.9,
    difficulty: 'medium',
    timedMode: false,
  },
  kid: {
    wordsPerRound: 15,
    speechRate: 1.0,
    difficulty: 'hard',
    timedMode: true,
  },
};

const GAME_TYPE: GameType = 'spelling-bee';
const TIME_PER_WORD_KID = 20;
const STREAK_MILESTONES = [3, 5, 7] as const;
const CONFETTI_EMOJIS = ['🎉', '⭐', '🌟', '✨', '🎊', '🏆', '🐝', '🌈'];

// ──────────────────────────────────────────────
// Word Lists by Age Segment
// ──────────────────────────────────────────────

const TODDLER_WORDS: SpellingWord[] = [
  { word: 'cat', emoji: '🐱', hint: 'A small furry pet that purrs', category: 'animals' },
  { word: 'dog', emoji: '🐶', hint: 'A loyal furry friend', category: 'animals' },
  { word: 'sun', emoji: '☀️', hint: 'It shines bright in the sky', category: 'nature' },
  { word: 'hat', emoji: '🎩', hint: 'You wear it on your head', category: 'clothing' },
  { word: 'cup', emoji: '🥤', hint: 'You drink from it', category: 'objects' },
  { word: 'box', emoji: '📦', hint: 'You put things inside it', category: 'objects' },
  { word: 'red', emoji: '🔴', hint: 'The color of an apple', category: 'colors' },
  { word: 'big', emoji: '🐘', hint: 'Opposite of small', category: 'words' },
  { word: 'run', emoji: '🏃', hint: 'Moving fast on your feet', category: 'actions' },
  { word: 'hop', emoji: '🐰', hint: 'What a bunny does', category: 'actions' },
];

const EARLY_LEARNER_WORDS: SpellingWord[] = [
  { word: 'apple', emoji: '🍎', hint: 'A red or green fruit', category: 'food' },
  { word: 'house', emoji: '🏠', hint: 'Where families live', category: 'places' },
  { word: 'happy', emoji: '😊', hint: 'Feeling joyful and glad', category: 'feelings' },
  { word: 'green', emoji: '🟢', hint: 'The color of grass', category: 'colors' },
  { word: 'water', emoji: '💧', hint: 'You drink it to stay healthy', category: 'nature' },
  { word: 'bird', emoji: '🐦', hint: 'It has wings and can fly', category: 'animals' },
  { word: 'cake', emoji: '🎂', hint: 'Sweet treat for birthdays', category: 'food' },
  { word: 'fish', emoji: '🐟', hint: 'It swims in the water', category: 'animals' },
  { word: 'moon', emoji: '🌙', hint: 'You see it at night', category: 'nature' },
  { word: 'tree', emoji: '🌳', hint: 'It has leaves and grows tall', category: 'nature' },
  { word: 'star', emoji: '⭐', hint: 'It twinkles in the night sky', category: 'nature' },
  { word: 'rain', emoji: '🌧️', hint: 'Water falling from clouds', category: 'nature' },
];

const KID_WORDS: SpellingWord[] = [
  { word: 'planet', emoji: '🪐', hint: 'Earth is one of these in space', category: 'space' },
  { word: 'bridge', emoji: '🌉', hint: 'It connects two sides over water', category: 'structures' },
  { word: 'castle', emoji: '🏰', hint: 'A king or queen lives here', category: 'structures' },
  { word: 'jungle', emoji: '🌴', hint: 'A thick tropical forest', category: 'nature' },
  { word: 'garden', emoji: '🌻', hint: 'Where flowers and plants grow', category: 'nature' },
  { word: 'rocket', emoji: '🚀', hint: 'It flies into space', category: 'space' },
  { word: 'forest', emoji: '🌲', hint: 'Full of trees and wildlife', category: 'nature' },
  { word: 'puzzle', emoji: '🧩', hint: 'A game where you fit pieces together', category: 'games' },
  { word: 'silver', emoji: '🥈', hint: 'A shiny gray metal', category: 'materials' },
  { word: 'frozen', emoji: '🧊', hint: 'Turned to ice, very cold', category: 'words' },
  { word: 'dragon', emoji: '🐉', hint: 'A mythical fire-breathing creature', category: 'fantasy' },
  { word: 'market', emoji: '🏪', hint: 'A place where you buy things', category: 'places' },
  { word: 'window', emoji: '🪟', hint: 'You look through it to see outside', category: 'objects' },
  { word: 'basket', emoji: '🧺', hint: 'You carry things in it', category: 'objects' },
  { word: 'pirate', emoji: '🏴‍☠️', hint: 'Sails the seas looking for treasure', category: 'fantasy' },
];

const WORD_LISTS: Record<AgeSegment, SpellingWord[]> = {
  toddler: TODDLER_WORDS,
  'early-learner': EARLY_LEARNER_WORDS,
  kid: KID_WORDS,
};

// ──────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────

function generateWrongLetter(correctLetter: string): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const wrongLetters = alphabet.split('').filter((l) => l !== correctLetter);
  const idx = Math.floor(Math.random() * wrongLetters.length);
  return wrongLetters[idx] ?? 'b';
}

function getWordsForSegment(segment: AgeSegment): SpellingWord[] {
  const allWords = WORD_LISTS[segment];
  const count = SEGMENT_SETTINGS[segment].wordsPerRound;
  return shuffle(allWords).slice(0, count);
}

function calcStars(score: number, total: number): 0 | 1 | 2 | 3 {
  if (total === 0) return 0;
  const pct = (score / total) * 100;
  if (pct >= 90) return 3;
  if (pct >= 70) return 2;
  if (pct >= 50) return 1;
  return 0;
}

// ──────────────────────────────────────────────
// SpellingBee Component
// ──────────────────────────────────────────────

export default function SpellingBee() {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const queryClient = useQueryClient();

  // ── Auth & Profile ──
  const activeChildProfile = useAuthStore((s) => s.activeChildProfile);
  const user = useAuthStore((s) => s.user);
  const childId = activeChildProfile?.id ?? '';
  const parentId = user?.uid ?? activeChildProfile?.parentId ?? '';
  const childAge: AgeRange = activeChildProfile?.age ?? 5;

  // ── Age-Adaptive Config ──
  const config = useAgeAdaptiveConfig(childAge);
  const segment = config.segment;
  const segmentCfg = SEGMENT_SETTINGS[segment];

  // ── Sound Effects ──
  const { playClick, playSuccess, playError, playPop } = useSoundEffects();

  // ── Game State ──
  const [gameWords, setGameWords] = useState<SpellingWord[]>(() => getWordsForSegment(segment));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [completed, setCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [input, setInput] = useState('');
  const [toddlerOptions, setToddlerOptions] = useState<string[]>([]);
  const [timedModeEnabled, setTimedModeEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStartedAt] = useState(() => Date.now());

  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived State ──
  const currentWord = gameWords[currentIndex] ?? null;
  const totalQuestions = gameWords.length;

  // ── Firestore Queries ──
  const { data: previousProgress } = useQuery({
    queryKey: ['progress', childId, GAME_TYPE],
    queryFn: () => getProgress(childId),
    enabled: !!childId,
  });

  const previousBest = useMemo(() => {
    if (!previousProgress) return null;
    const beeProgress = previousProgress.find((p) => p.moduleId === GAME_TYPE);
    return beeProgress ?? null;
  }, [previousProgress]);

  // ── Firestore Mutations ──
  const saveScoreMutation = useMutation({
    mutationFn: saveGameScore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', childId] });
    },
  });

  const saveProgressMutation = useMutation({
    mutationFn: upsertProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', childId] });
    },
  });

  const awardBadgeMutation = useMutation({
    mutationFn: awardBadge,
  });

  // ── Confetti Particles (memoized) ──
  const confettiParticles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length] ?? '🎉',
        x: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.5 + Math.random() * 2,
      })),
    [],
  );

  // ── TTS ──
  const speak = useCallback((text: string, rate: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ── Speak & Setup on Question Change ──
  useEffect(() => {
    const word = gameWords[currentIndex];
    if (!word) return;

    setFeedback(null);
    setShowHint(false);
    setToddlerOptions([]);

    if (segment === 'toddler') {
      const correctLetter = word.word[0] ?? 'a';
      const wrongLetter = generateWrongLetter(correctLetter);
      const opts = Math.random() > 0.5 ? [correctLetter, wrongLetter] : [wrongLetter, correctLetter];
      setToddlerOptions(opts);
      setInput('');
      speak(correctLetter.toUpperCase(), segmentCfg.speechRate);
    } else if (segment === 'early-learner') {
      setInput(word.word[0] ?? '');
      speak(word.word, segmentCfg.speechRate);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setInput('');
      speak(word.word, segmentCfg.speechRate);
      setTimeout(() => inputRef.current?.focus(), 100);
    }

    if (segment === 'kid' && timedModeEnabled) {
      setTimeLeft(TIME_PER_WORD_KID);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, gameWords, segment, segmentCfg.speechRate, timedModeEnabled, speak]);

  // ── Timer Effect (Kid Timed Mode) ──
  useEffect(() => {
    if (segment !== 'kid' || !timedModeEnabled || feedback || completed || timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, segment, timedModeEnabled, feedback, completed]);

  // Handle timeout
  useEffect(() => {
    if (segment !== 'kid' || !timedModeEnabled || feedback || completed) return;
    if (timeLeft === 0) {
      playError();
      setFeedback('wrong');
      setStreak(0);
      feedbackTimerRef.current = setTimeout(() => advanceQuestion(), 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, segment, timedModeEnabled, feedback, completed]);

  // ── Streak Milestones ──
  useEffect(() => {
    if (STREAK_MILESTONES.includes(streak as 3 | 5 | 7)) {
      playPop();
    }
  }, [streak, playPop]);

  // ── Handlers ──
  const advanceQuestion = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCompleted(true);
    }
  }, [currentIndex, totalQuestions]);

  const handleToddlerAnswer = useCallback(
    (letter: string) => {
      if (feedback || !currentWord) return;
      playClick();

      const isCorrect = letter === currentWord.word[0];
      if (isCorrect) {
        playSuccess();
        setScore((s) => s + 1);
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > bestStreak) setBestStreak(newStreak);
        setFeedback('correct');
        speak(`Correct! ${currentWord.word[0]} is for ${currentWord.word}.`, segmentCfg.speechRate);
      } else {
        playError();
        setStreak(0);
        setFeedback('wrong');
        speak(`${currentWord.word[0]}. The letter is ${currentWord.word[0]}.`, segmentCfg.speechRate);
      }

      feedbackTimerRef.current = setTimeout(() => advanceQuestion(), isCorrect ? 1800 : 2000);
    },
    [feedback, currentWord, playClick, playSuccess, playError, streak, bestStreak, segmentCfg.speechRate, speak, advanceQuestion],
  );

  const handleSpellingSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (feedback || !currentWord || !input.trim()) return;

      playClick();
      const isCorrect = input.trim().toLowerCase() === currentWord.word.toLowerCase();

      if (isCorrect) {
        playSuccess();
        setScore((s) => s + 1);
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > bestStreak) setBestStreak(newStreak);
        setFeedback('correct');
      } else {
        playError();
        setStreak(0);
        setFeedback('wrong');
      }

      feedbackTimerRef.current = setTimeout(() => advanceQuestion(), 1500);
    },
    [feedback, currentWord, input, playClick, playSuccess, playError, streak, bestStreak, advanceQuestion],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.toLowerCase().replace(/[^a-z]/g, '');
      if (!currentWord) return;

      if (segment === 'early-learner') {
        const firstLetter = currentWord.word[0] ?? '';
        if (raw.length === 0) {
          setInput(firstLetter);
        } else if (raw[0] !== firstLetter) {
          setInput(firstLetter + raw.slice(1));
        } else {
          setInput(raw.slice(0, currentWord.word.length));
        }
      } else {
        setInput(raw.slice(0, currentWord.word.length));
      }
    },
    [segment, currentWord],
  );

  const handleHintToggle = useCallback(() => {
    playClick();
    setShowHint((h) => !h);
  }, [playClick]);

  const handleHearAgain = useCallback(() => {
    if (!currentWord) return;
    playClick();
    if (segment === 'toddler') {
      speak(currentWord.word[0]?.toUpperCase() ?? '', segmentCfg.speechRate);
    } else {
      speak(currentWord.word, segmentCfg.speechRate);
    }
  }, [currentWord, segment, segmentCfg.speechRate, speak, playClick]);

  const handlePlayAgain = useCallback(() => {
    const newWords = getWordsForSegment(segment);
    setGameWords(newWords);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setFeedback(null);
    setShowHint(false);
    setInput('');
    setToddlerOptions([]);
    setCompleted(false);
    if (segment === 'kid' && timedModeEnabled) {
      setTimeLeft(TIME_PER_WORD_KID);
    }
  }, [segment, timedModeEnabled]);

  // ── Save to Firestore on Completion ──
  useEffect(() => {
    if (!completed || !childId || !parentId) return;

    const stars = calcStars(score, totalQuestions);
    const durationSeconds = Math.round((Date.now() - gameStartedAt) / 1000);

    saveScoreMutation.mutate({
      childId,
      parentId,
      gameType: GAME_TYPE,
      score,
      maxScore: totalQuestions,
      difficulty: segmentCfg.difficulty,
      durationSeconds,
      playedAt: new Date(),
    });

    saveProgressMutation.mutate({
      childId,
      parentId,
      moduleId: GAME_TYPE,
      completed: true,
      stars,
      percentComplete: totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0,
      lastAccessedAt: new Date(),
      completedAt: new Date(),
    });

    if (stars >= 3) {
      awardBadgeMutation.mutate({
        childId,
        parentId,
        category: 'perfect-score',
        name: 'Spelling Champion',
        description: 'Scored 90% or higher in Spelling Bee!',
        icon: '🐝',
        earnedAt: new Date(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed]);

  // ── Cleanup feedback timer ──
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  // ──────────────────────────────────────────
  // RENDER: Completion Screen
  // ──────────────────────────────────────────

  if (completed) {
    const stars = calcStars(score, totalQuestions);
    const percent = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const earnedChampion = stars >= 3;

    return (
      <div className="kv-page flex flex-col items-center justify-center min-h-screen">
        {/* Confetti */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          {confettiParticles.map((p) => (
            <motion.span
              key={p.id}
              className="absolute text-2xl md:text-3xl"
              initial={{ y: '110vh', x: `${p.x}%`, opacity: 1, rotate: 0 }}
              animate={{ y: '-10vh', opacity: 0, rotate: 360 }}
              transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
            >
              {p.emoji}
            </motion.span>
          ))}
        </div>

        <AnimatedContainer variant="pop" className="w-full max-w-md mx-auto">
          <Card className="text-center py-10 px-6">
            <h1 className="text-3xl md:text-4xl font-display text-kv-yellow mb-3">
              🐝 Spelling Bee Complete!
            </h1>

            <StarRating rating={stars} maxRating={3} size="lg" label={`You earned ${stars} out of 3 stars`} />

            <div className="mt-4 mb-2">
              <Badge variant="primary" size="lg" icon={<span aria-hidden="true">✅</span>}>
                {`${score} / ${totalQuestions}`}
              </Badge>
            </div>
            <p className="text-lg text-kv-gray-600 mb-1">
              {`${percent}% correct`}
            </p>
            <p className="text-base text-kv-gray-500 mb-6">
              Best Streak:{' '}
              <span className="font-bold text-kv-orange">
                {`${bestStreak} 🔥`}
              </span>
            </p>

            {/* Previous best */}
            {previousBest && previousBest.stars > 0 && (
              <p className="text-sm text-kv-gray-400 mb-4">
                {`Previous best: ${previousBest.stars} star${previousBest.stars > 1 ? 's' : ''}`}
              </p>
            )}

            {/* Badge */}
            {earnedChampion && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                className="flex justify-center mb-6"
              >
                <AchievementBadge
                  name="Spelling Champion"
                  description="90%+ Score!"
                  emoji="🐝"
                  earned
                  size="lg"
                />
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
              <MotionButton variant="warning" size="lg" onClick={handlePlayAgain} aria-label="Play again">
                Play Again
              </MotionButton>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate(`/kids/${profileId}`)}
                leftIcon={<IconHome />}
                aria-label="Go home"
              >
                Home
              </Button>
            </div>
          </Card>
        </AnimatedContainer>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // RENDER: Game Screen
  // ──────────────────────────────────────────

  if (!currentWord) return null;

  return (
    <div className="kv-page flex flex-col min-h-screen">
      {/* Screen reader live region */}
      <div aria-live="assertive" className="sr-only">
        {feedback === 'correct' && 'Correct! Well done!'}
        {feedback === 'wrong' && `The correct word was ${currentWord.word}. Try again next time!`}
      </div>

      {/* ── Header ── */}
      <header className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/kids/${profileId}`)}
            leftIcon={<IconArrowLeft size={18} />}
            aria-label="Back to home"
          >
            Back
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/kids/${profileId}`)}
            leftIcon={<IconHome size={18} />}
            aria-label="Go home"
          >
            Home
          </Button>
        </div>

        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-display text-kv-yellow">🐝 Spelling Bee</h1>
            <p className="text-kv-gray-500 text-sm mt-0.5">
              {segment === 'toddler' && 'Find the first letter!'}
              {segment === 'early-learner' && 'Listen and spell the word!'}
              {segment === 'kid' && 'Full spelling challenge!'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm" icon={<span aria-hidden="true">✅</span>}>
              {String(score)}
            </Badge>
            {streak >= 2 && (
              <motion.span
                key={streak}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-sm font-bold text-kv-orange"
                aria-label={`${streak} answer streak`}
              >
                {`🔥 ${streak}`}
              </motion.span>
            )}
            <Badge variant="default" size="sm">
              {`${currentIndex + 1}/${totalQuestions}`}
            </Badge>
          </div>
        </div>

        {/* Kid timed mode toggle */}
        {segment === 'kid' && segmentCfg.timedMode && (
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant={timedModeEnabled ? 'warning' : 'secondary'}
              size="xs"
              onClick={() => {
                playClick();
                setTimedModeEnabled((t) => !t);
                setTimeLeft(TIME_PER_WORD_KID);
              }}
              aria-label={timedModeEnabled ? 'Disable timed mode' : 'Enable timed mode'}
              aria-pressed={timedModeEnabled}
            >
              {timedModeEnabled ? '⏱️ Timed On' : '⏱️ Timed Off'}
            </Button>
            {timedModeEnabled && (
              <span
                className={cn(
                  'text-lg font-bold tabular-nums',
                  timeLeft <= 5 ? 'text-kv-red animate-pulse' : 'text-kv-gray-600',
                )}
                aria-label={`${timeLeft} seconds remaining`}
              >
                {`${timeLeft}s`}
              </span>
            )}
          </div>
        )}

        <ProgressBar
          value={currentIndex}
          max={totalQuestions}
          variant="orange"
          size="md"
          showLabel
          labelPosition="top"
          aria-label={`Question ${currentIndex + 1} of ${totalQuestions}`}
        />
      </header>

      {/* ── Question Card ── */}
      <AnimatePresence mode="wait">
        <MotionCard
          key={currentIndex}
          asMotion
          variant="elevated"
          padding="lg"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-lg mx-auto text-center"
        >
          {/* Hear Again Button */}
          <button
            type="button"
            onClick={handleHearAgain}
            className={cn(
              'w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-button',
              'bg-kv-yellow hover:bg-amber-400 active:scale-95 transition-all duration-150',
            )}
            aria-label={
              segment === 'toddler'
                ? 'Hear the letter again'
                : 'Hear the word again'
            }
          >
            <span className="text-3xl md:text-4xl" aria-hidden="true">🔊</span>
          </button>

          {/* Emoji */}
          <span className="text-6xl md:text-7xl block mb-3" aria-hidden="true">
            {currentWord.emoji}
          </span>

          {/* Segment: Category hint for kids */}
          {segment === 'kid' && (
            <p className="text-sm text-kv-gray-400 mb-3">
              Category: <span className="font-bold text-kv-gray-500">{currentWord.category}</span>
            </p>
          )}

          {/* Segment: Toddler Multiple Choice */}
          {segment === 'toddler' && (
            <ToddlerQuestion
              word={currentWord}
              options={toddlerOptions}
              feedback={feedback}
              onSelect={handleToddlerAnswer}
            />
          )}

          {/* Segment: Early Learner Spelling */}
          {segment === 'early-learner' && (
            <EarlyLearnerQuestion
              word={currentWord}
              input={input}
              feedback={feedback}
              showHint={showHint}
              onInputChange={handleInputChange}
              onSubmit={handleSpellingSubmit}
              onHintToggle={handleHintToggle}
              inputRef={inputRef}
            />
          )}

          {/* Segment: Kid Full Spelling */}
          {segment === 'kid' && (
            <KidQuestion
              word={currentWord}
              input={input}
              feedback={feedback}
              onInputChange={handleInputChange}
              onSubmit={handleSpellingSubmit}
              inputRef={inputRef}
            />
          )}

          {/* Feedback Display */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{
                opacity: 1,
                y: 0,
                x: feedback === 'wrong' ? [0, -8, 8, -8, 8, 0] : 0,
              }}
              transition={{ duration: feedback === 'wrong' ? 0.4 : 0.3 }}
              aria-live="polite"
              role="status"
            >
              {feedback === 'correct' ? (
                <div className="mt-4">
                  <motion.span
                    className="text-4xl block mb-1"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.4 }}
                    aria-hidden="true"
                  >
                    🎉
                  </motion.span>
                  <p className="text-xl font-bold text-kv-green">Correct!</p>
                  {streak >= 2 && (
                    <motion.p
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-sm font-bold text-kv-orange mt-1"
                    >
                      {`🔥 ${streak} streak!`}
                    </motion.p>
                  )}
                </div>
              ) : (
                <div className="mt-4">
                  <span className="text-4xl block mb-1" aria-hidden="true">😅</span>
                  <p className="text-xl font-bold text-kv-red">
                    {`The word was: ${currentWord.word.toUpperCase()}`}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </MotionCard>
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────
// Sub-Components
// ──────────────────────────────────────────────

interface ToddlerQuestionProps {
  word: SpellingWord;
  options: string[];
  feedback: FeedbackState;
  onSelect: (letter: string) => void;
}

function ToddlerQuestion({ word, options, feedback, onSelect }: ToddlerQuestionProps) {
  const handleKeyDown = useCallback(
    (letter: string) => (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(letter);
      }
    },
    [onSelect],
  );

  return (
    <div>
      <p className="text-lg text-kv-gray-500 mb-2 font-bold">
        What letter does this start with?
      </p>

      {/* Word with blanks showing first letter */}
      <div className="flex justify-center gap-1.5 mb-6" aria-hidden="true">
        {word.word.split('').map((letter, i) => (
          <div
            key={i}
            className={cn(
              'w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-bold border-2 transition-colors duration-200',
              i === 0
                ? 'border-kv-blue bg-kv-blue/10 text-kv-blue'
                : 'border-kv-gray-200 bg-kv-gray-50 text-kv-gray-300',
            )}
          >
            {i === 0 ? letter.toUpperCase() : '_'}
          </div>
        ))}
      </div>

      {/* Letter options */}
      <div className="flex justify-center gap-4" role="group" aria-label="Letter choices">
        {options.map((letter) => {
          const isCorrect = letter === word.word[0];
          const showCorrect = feedback === 'correct' && isCorrect;
          const showWrong = feedback === 'wrong' && !isCorrect;
          const showCorrectHighlight = feedback === 'wrong' && isCorrect;

          return (
            <motion.button
              key={letter}
              type="button"
              whileHover={feedback ? {} : { scale: 1.08 }}
              whileTap={feedback ? {} : { scale: 0.92 }}
              onClick={() => onSelect(letter)}
              disabled={feedback !== null}
              onKeyDown={handleKeyDown(letter)}
              className={cn(
                'w-20 h-20 rounded-2xl font-bold text-white uppercase transition-all duration-200',
                'focus:outline-none focus:ring-4 focus:ring-kv-yellow/50 text-5xl',
                showCorrect && 'bg-kv-green ring-4 ring-kv-green/40',
                showWrong && 'bg-kv-gray-300 opacity-50',
                showCorrectHighlight && 'bg-kv-green ring-4 ring-kv-green/40',
                !feedback && 'bg-kv-blue hover:bg-blue-400 active:bg-blue-500',
              )}
              aria-label={`Letter ${letter.toUpperCase()}`}
              aria-disabled={feedback !== null}
            >
              {letter.toUpperCase()}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

interface EarlyLearnerQuestionProps {
  word: SpellingWord;
  input: string;
  feedback: FeedbackState;
  showHint: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onHintToggle: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function EarlyLearnerQuestion({
  word,
  input,
  feedback,
  showHint,
  onInputChange,
  onSubmit,
  onHintToggle,
  inputRef,
}: EarlyLearnerQuestionProps) {
  return (
    <div>
      {/* Letter boxes visual */}
      <div className="flex justify-center gap-2 mb-4" aria-hidden="true">
        {word.word.split('').map((letter, i) => {
          const isFilled = !!input[i];
          const isCorrectFeedback = feedback === 'correct';
          const isWrongFeedback = feedback === 'wrong';
          const isMatch = letter.toLowerCase() === input[i];

          return (
            <div
              key={i}
              className={cn(
                'w-10 h-12 rounded-xl flex items-center justify-center text-2xl font-bold border-2 transition-all duration-200',
                isFilled && !isWrongFeedback && 'border-kv-blue bg-kv-blue/10 text-kv-blue',
                !isFilled && 'border-kv-gray-200 bg-kv-gray-50 text-kv-gray-300',
                isCorrectFeedback && 'border-kv-green bg-kv-green/10 text-kv-green',
                isWrongFeedback && isMatch && 'border-kv-green bg-kv-green/10 text-kv-green',
                isWrongFeedback && !isMatch && input[i] && 'border-kv-red bg-kv-red/10 text-kv-red',
              )}
            >
              {input[i]?.toUpperCase() ?? '_'}
            </div>
          );
        })}
      </div>

      {/* Hidden accessible input */}
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={input}
        onChange={onInputChange}
        className="sr-only"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        aria-label={`Spell the word, ${input.length}/${word.word.length} letters typed`}
        disabled={feedback !== null}
        maxLength={word.word.length}
      />

      {/* Hint button */}
      {!showHint && !feedback && (
        <Button
          variant="secondary"
          size="lg"
          onClick={onHintToggle}
          className="mb-3"
          aria-label="Show hint"
        >
          💡 Show Hint
        </Button>
      )}

      {showHint && (
        <AnimatedContainer variant="slideUp" className="mb-3">
          <p className="text-base text-kv-orange italic font-bold px-4 py-2 bg-kv-orange/10 rounded-xl">
            {`💡 ${word.hint}`}
          </p>
        </AnimatedContainer>
      )}

      {/* Visual submit form */}
      <form onSubmit={onSubmit}>
        <MotionButton
          type="submit"
          variant="warning"
          fullWidth
          disabled={input.length < word.word.length || feedback !== null}
          size="lg"
          aria-label="Submit your spelling"
        >
          Submit ✨
        </MotionButton>
      </form>
    </div>
  );
}

interface KidQuestionProps {
  word: SpellingWord;
  input: string;
  feedback: FeedbackState;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function KidQuestion({
  word,
  input,
  feedback,
  onInputChange,
  onSubmit,
  inputRef,
}: KidQuestionProps) {
  return (
    <div>
      {/* Letter boxes for visual feedback */}
      <div className="flex justify-center gap-1.5 mb-4" aria-hidden="true">
        {word.word.split('').map((letter, i) => {
          const isFilled = !!input[i];
          const isCorrectFeedback = feedback === 'correct';
          const isWrongFeedback = feedback === 'wrong';
          const isMatch = letter.toLowerCase() === input[i];

          return (
            <div
              key={i}
              className={cn(
                'w-9 h-11 rounded-lg flex items-center justify-center text-xl font-bold border-2 transition-all duration-200',
                isFilled && !isWrongFeedback && 'border-kv-blue bg-kv-blue/10 text-kv-blue',
                !isFilled && 'border-kv-gray-200 bg-kv-gray-50 text-kv-gray-300',
                isCorrectFeedback && 'border-kv-green bg-kv-green/10 text-kv-green',
                isWrongFeedback && isMatch && 'border-kv-green bg-kv-green/10 text-kv-green',
                isWrongFeedback && !isMatch && input[i] && 'border-kv-red bg-kv-red/10 text-kv-red',
              )}
            >
              {input[i]?.toUpperCase() ?? '_'}
            </div>
          );
        })}
      </div>

      {/* Text input */}
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={input}
          onChange={onInputChange}
          className="w-full px-5 py-3 rounded-2xl border-2 border-kv-gray-200 focus:border-kv-yellow focus:ring-4 focus:ring-kv-yellow/20 focus:outline-none text-xl text-center font-bold tracking-widest uppercase transition-all duration-200"
          placeholder="Type the word..."
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          disabled={feedback !== null}
          maxLength={word.word.length}
          aria-label="Type the spelling word"
        />
        <MotionButton
          type="submit"
          variant="warning"
          fullWidth
          disabled={input.trim().length === 0 || feedback !== null}
          size="lg"
          aria-label="Submit your spelling"
        >
          Submit ✨
        </MotionButton>
      </form>
    </div>
  );
}
