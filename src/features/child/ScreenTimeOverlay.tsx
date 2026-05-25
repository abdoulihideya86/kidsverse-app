// ──────────────────────────────────────────────
// KidsVerse — Screen Time Overlay
// Full-screen overlay shown when a child's screen
// time is up. Includes a parent gate (math
// challenge) to dismiss.
// ──────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useScreenTimeStore } from '@/store';
import { cn } from '@/lib/utils';

// ── Fun Facts ──
const FUN_FACTS: readonly string[] = [
  'Did you know? Your brain grows when you exercise! 🏃',
  'Did you know? Bananas are berries, but strawberries aren\'t! 🍌',
  'Did you know? Octopuses have three hearts! 🐙',
  'Did you know? The Earth is about 4.5 billion years old! 🌍',
  'Did you know? Honey never spoils! 🍯',
  'Did you know? A group of flamingos is called a "flamboyance"! 🦩',
  'Did you know? Your bones are stronger than steel! 💪',
  'Did you know? Astronauts grow taller in space! 🚀',
] as const;

// ── Number Emojis ──
const NUMBER_EMOJIS: Record<number, string> = {
  0: '0️⃣',
  1: '1️⃣',
  2: '2️⃣',
  3: '3️⃣',
  4: '4️⃣',
  5: '5️⃣',
  6: '6️⃣',
  7: '7️⃣',
  8: '8️⃣',
  9: '9️⃣',
  10: '🔟',
  11: '1️⃣1️⃣',
  12: '1️⃣2️⃣',
  13: '1️⃣3️⃣',
  14: '1️⃣4️⃣',
  15: '1️⃣5️⃣',
  16: '1️⃣6️⃣',
  17: '1️⃣7️⃣',
  18: '1️⃣8️⃣',
} as const;

// ── Generate a math question ──
interface MathQuestion {
  a: number;
  b: number;
  correct: number;
  options: number[];
}

function generateMathQuestion(): MathQuestion {
  const a = Math.floor(Math.random() * 9) + 1; // 1-9
  // Ensure a + b <= 15
  const maxB = Math.min(9, 15 - a);
  const b = Math.floor(Math.random() * maxB) + 1;
  const correct = a + b;

  // Generate 3 wrong options (distinct, no negatives, no duplicates)
  const wrongSet = new Set<number>();
  while (wrongSet.size < 3) {
    const offset = Math.floor(Math.random() * 5) + 1;
    const wrong = correct + (Math.random() < 0.5 ? offset : -offset);
    if (wrong !== correct && wrong >= 0 && wrong <= 20 && !wrongSet.has(wrong)) {
      wrongSet.add(wrong);
    }
  }

  const options = [correct, ...Array.from(wrongSet)].sort(() => Math.random() - 0.5);

  return { a, b, correct, options };
}

// ── Component ──
export function ScreenTimeOverlay() {
  const isTimeUp = useScreenTimeStore((s) => s.isTimeUp);
  const activeChildProfile = useAuthStore((s) => s.activeChildProfile);
  const navigate = useNavigate();

  const [showParentGate, setShowParentGate] = useState(false);
  const [mathQuestion, setMathQuestion] = useState<MathQuestion>(generateMathQuestion);
  const [wrongAnswer, setWrongAnswer] = useState<number | null>(null);
  const [factIndex, setFactIndex] = useState(0);

  const childName = activeChildProfile?.name ?? 'friend';

  // Rotate fun facts every 6 seconds
  useEffect(() => {
    if (!isTimeUp) return;

    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isTimeUp]);

  // Reset state when overlay appears
  useEffect(() => {
    if (isTimeUp) {
      setShowParentGate(false);
      setWrongAnswer(null);
      setMathQuestion(generateMathQuestion());
      setFactIndex(0);
    }
  }, [isTimeUp]);

  // ── Handle answer click ──
  const handleAnswer = useCallback(
    (answer: number) => {
      if (answer === mathQuestion.correct) {
        // Correct — navigate to parent dashboard
        navigate('/parent');
      } else {
        // Wrong — shake
        setWrongAnswer(answer);
        setTimeout(() => setWrongAnswer(null), 600);
      }
    },
    [mathQuestion.correct, navigate]
  );

  // ── Format number to emoji ──
  const numEmoji = useCallback((n: number): string => {
    return NUMBER_EMOJIS[n] ?? String(n);
  }, []);

  // Don't render if time is not up
  if (!isTimeUp) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Screen time limit reached"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Centered card */}
        <motion.div
          className="kv-card max-w-lg w-full text-center p-8 md:p-10 relative overflow-hidden"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
        >
          {/* Floating sleeping emoji */}
          <motion.span
            className="text-7xl md:text-8xl block mb-4"
            aria-hidden="true"
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            😴
          </motion.span>

          {/* Heading */}
          <h2 className="font-display text-3xl text-kv-blue mb-2">
            Time&apos;s Up!
          </h2>

          {/* Friendly message */}
          <p className="text-kv-gray-600 text-lg mb-6">
            Great job today, {childName}! Time to rest your eyes and play outside.
          </p>

          {/* Fun fact section */}
          <div className="bg-kv-blue/5 rounded-2xl p-4 mb-6 min-h-[60px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={factIndex}
                className="text-kv-gray-700 text-sm md:text-base font-semibold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                {FUN_FACTS[factIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Parent gate button */}
          {!showParentGate ? (
            <motion.button
              onClick={() => setShowParentGate(true)}
              className="kv-button-base bg-kv-gray-200 text-kv-gray-600 px-6 py-3 text-base mx-auto"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
            >
              I&apos;m a Grown-Up
            </motion.button>
          ) : (
            /* Math challenge */
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2"
            >
              <p className="text-kv-gray-700 font-display text-xl mb-4">
                What is {mathQuestion.a} + {mathQuestion.b}?
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto" role="group" aria-label="Answer choices">
                {mathQuestion.options.map((option) => (
                  <motion.button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className={cn(
                      'kv-button-base bg-white border-2 border-kv-gray-200 text-2xl py-4 px-2',
                      'hover:border-kv-blue hover:bg-kv-blue/5',
                      wrongAnswer === option && 'border-kv-red bg-kv-red/5'
                    )}
                    whileHover={wrongAnswer !== option ? { scale: 1.05 } : undefined}
                    whileTap={wrongAnswer !== option ? { scale: 0.95 } : undefined}
                    animate={
                      wrongAnswer === option
                        ? { x: [0, -8, 8, -8, 8, 0] }
                        : { x: 0 }
                    }
                    transition={
                      wrongAnswer === option
                        ? { duration: 0.4 }
                        : undefined
                    }
                    type="button"
                    aria-label={`Answer ${option}`}
                  >
                    {numEmoji(option)}
                  </motion.button>
                ))}
              </div>
              {wrongAnswer !== null && (
                <p className="text-kv-red text-sm font-semibold mt-3" role="alert">
                  Not quite! Try again.
                </p>
              )}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
