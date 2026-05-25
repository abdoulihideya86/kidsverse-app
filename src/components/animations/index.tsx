// ════════════════════════════════════════════════════════════════
// KidsVerse — Playful Animation Library (Framer Motion)
// A comprehensive, bouncy, kid-friendly animation toolkit 🎈
// ════════════════════════════════════════════════════════════════
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, type Variants, type Transition } from 'framer-motion';

// ──────────────────────────────────────────────
// Spring Config Presets
// ──────────────────────────────────────────────

/** Super bouncy spring — great for playful entrances */
const BOUNCY_SPRING = { type: 'spring' as const, stiffness: 400, damping: 15, mass: 0.8 };

/** Gentle spring — soft landing, subtle overshoot */
const GENTLE_SPRING = { type: 'spring' as const, stiffness: 260, damping: 24 };

/** Snappy spring — quick response, minimal bounce */
const SNAPPY_SPRING = { type: 'spring' as const, stiffness: 500, damping: 30 };

/** Slow wobble spring — for loopy, cartoonish motion */
const WOBBLY_SPRING = { type: 'spring' as const, stiffness: 180, damping: 12 };

// ──────────────────────────────────────────────
// 1. ENHANCED EXISTING VARIANTS
// ──────────────────────────────────────────────

/** Smooth fade with a gentle ease-out curve */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

/** Spring-based slide up with squash anticipation */
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 40, scaleY: 0.9, transformOrigin: 'bottom' },
  visible: {
    opacity: 1,
    y: 0,
    scaleY: 1,
    transition: { ...BOUNCY_SPRING, staggerChildren: 0.04 },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.25 },
  },
};

/** Spring-based slide down with anticipation */
export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -40, scaleY: 0.9, transformOrigin: 'top' },
  visible: {
    opacity: 1,
    y: 0,
    scaleY: 1,
    transition: BOUNCY_SPRING,
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.25 },
  },
};

/** Slide from right with gentle ease and subtle rotation */
export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: 60, rotateY: -8 },
  visible: {
    opacity: 1,
    x: 0,
    rotateY: 0,
    transition: { ...GENTLE_SPRING },
  },
  exit: {
    opacity: 0,
    x: -40,
    transition: { duration: 0.3 },
  },
};

/** Slide from left with gentle ease and subtle rotation */
export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: -60, rotateY: 8 },
  visible: {
    opacity: 1,
    x: 0,
    rotateY: 0,
    transition: { ...GENTLE_SPRING },
  },
  exit: {
    opacity: 0,
    x: 40,
    transition: { duration: 0.3 },
  },
};

/** Dramatic pop with overshoot bounce and squash/stretch */
export const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0.3, rotate: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      ...BOUNCY_SPRING,
      // keyframes for squash-stretch
    },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    rotate: 10,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

/** Stagger container with configurable delay and spring orchestration */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
      when: 'beforeChildren' as const,
    },
  },
};

/** Stagger child item with spring bounce */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...BOUNCY_SPRING,
      opacity: { duration: 0.3 },
    },
  },
};

// ──────────────────────────────────────────────
// Page Transitions
// ──────────────────────────────────────────────

/** Smooth page transition with spring physics */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.98, filter: 'blur(4px)' },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      ...GENTLE_SPRING,
      opacity: { duration: 0.35 },
      filter: { duration: 0.4 },
    },
  },
  out: {
    opacity: 0,
    y: -12,
    scale: 0.98,
    filter: 'blur(4px)',
    transition: {
      duration: 0.25,
      ease: 'easeIn',
    },
  },
};

/** Smooth spring-based page transition */
export const pageTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 28,
  mass: 0.8,
};

// ──────────────────────────────────────────────
// Continuous / Looping Animations
// ──────────────────────────────────────────────

/** Natural floating motion with multi-axis drift and subtle rotation */
export const floatingAnimation = {
  animate: {
    y: [0, -10, -4, -14, 0],
    x: [0, 3, -2, 4, 0],
    rotate: [0, 2, -1, 1.5, 0],
  },
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

/** Cute wiggle with anticipation pause */
export const wiggleAnimation = {
  animate: {
    rotate: [0, -4, 4, -3, 3, -2, 2, 0],
    scale: [1, 1.02, 1, 1.02, 1, 1.01, 1, 1],
  },
  transition: {
    duration: 1.2,
    repeat: Infinity,
    ease: 'easeInOut',
    repeatDelay: 0.8,
  },
};

/** Multi-color glow pulse that cycles through rainbow tones */
export const pulseGlowAnimation = {
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(99, 102, 241, 0.5)',
      '0 0 0 8px rgba(99, 102, 241, 0)',
      '0 0 0 0 rgba(168, 85, 247, 0.5)',
      '0 0 0 8px rgba(168, 85, 247, 0)',
      '0 0 0 0 rgba(236, 72, 153, 0.5)',
      '0 0 0 8px rgba(236, 72, 153, 0)',
      '0 0 0 0 rgba(34, 197, 94, 0.5)',
      '0 0 0 8px rgba(34, 197, 94, 0)',
    ],
  },
  transition: {
    duration: 3.2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// ──────────────────────────────────────────────
// 2. NEW ENTRANCE VARIANTS
// ──────────────────────────────────────────────

/** Bouncy entrance with squash-and-stretch cartoon physics */
export const bounceInVariants: Variants = {
  hidden: { opacity: 0, scale: 0, y: 60 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 10,
      mass: 0.6,
    },
  },
  exit: {
    opacity: 0,
    scale: 0,
    y: -30,
    transition: { duration: 0.25, ease: 'easeIn' },
  },
};

/** Jelly wobble effect — like squishing a gummy bear */
export const jellyVariants: Variants = {
  hidden: { opacity: 0, scale: 0.3, rotate: -5 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 8,
      mass: 1.2,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.6,
    transition: { duration: 0.2 },
  },
};

/** 3D tilt entrance — card flips in from the side */
export const tiltInVariants: Variants = {
  hidden: {
    opacity: 0,
    rotateX: 30,
    rotateY: -15,
    scale: 0.85,
    transformPerspective: 800,
  },
  visible: {
    opacity: 1,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    transformPerspective: 800,
    transition: {
      ...GENTLE_SPRING,
      opacity: { duration: 0.3 },
    },
  },
  exit: {
    opacity: 0,
    rotateX: -15,
    scale: 0.9,
    transition: { duration: 0.25 },
  },
};

/** Small particle burst — great for celebrations */
export const confettiVariants: Variants = {
  hidden: { opacity: 0, scale: 0, y: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      ...SNAPPY_SPRING,
      scale: {
        type: 'spring',
        stiffness: 600,
        damping: 10,
      },
    },
  },
  exit: {
    opacity: 0,
    scale: 0,
    y: -80,
    rotate: 180,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
};

/** Scale + rotate entrance — dramatic spinning zoom */
export const scaleRotateVariants: Variants = {
  hidden: { opacity: 0, scale: 0, rotate: -180 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      ...WOBBLY_SPRING,
      opacity: { duration: 0.25 },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    rotate: 90,
    transition: { duration: 0.3 },
  },
};

/** Blur-to-focus entrance — magical reveal */
export const blurInVariants: Variants = {
  hidden: { opacity: 0, filter: 'blur(12px)', scale: 1.1 },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    filter: 'blur(8px)',
    scale: 0.95,
    transition: { duration: 0.3 },
  },
};

/** Shimmer loading effect — sparkling gradient sweep */
export const shimmerVariants: Variants = {
  hidden: { opacity: 0.5 },
  visible: {
    opacity: 1,
    backgroundPosition: ['-200% 0', '200% 0'],
    transition: {
      duration: 1.8,
      repeat: Infinity,
      ease: 'linear',
    },
  },
  exit: {
    opacity: 0,
  },
};

/** Star achievement burst — for rewards and celebrations */
export const starBurstVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
    rotate: -90,
    filter: 'drop-shadow(0 0 0px rgba(250, 204, 21, 0))',
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    filter: 'drop-shadow(0 0 16px rgba(250, 204, 21, 0.8))',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10,
      mass: 0.5,
      filter: { duration: 0.5 },
    },
  },
  exit: {
    opacity: 0,
    scale: 1.5,
    rotate: 45,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// ──────────────────────────────────────────────
// Stagger Helpers
// ──────────────────────────────────────────────

/** Stagger container optimized for items sliding up one by one */
export const slideUpStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
      when: 'beforeChildren' as const,
    },
  },
};

// ──────────────────────────────────────────────
// 3. NEW LOOPING ANIMATIONS
// ──────────────────────────────────────────────

/** Pulsing heart effect — two-beat rhythm like a real heartbeat */
export const heartBeatAnimation = {
  animate: {
    scale: [1, 1.2, 1, 1.2, 1],
  },
  transition: {
    duration: 0.8,
    repeat: Infinity,
    ease: 'easeInOut',
    repeatDelay: 0.6,
  },
};

/** Twinkling sparkle — rotating scale pulse */
export const sparkleAnimation = {
  animate: {
    scale: [1, 0.4, 1.2, 0.6, 1],
    rotate: [0, 90, 180, 270, 360],
    opacity: [1, 0.6, 1, 0.6, 1],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

/** Continuous gentle bounce — soft landing with slight squash */
export const bounceAnimation = {
  animate: {
    y: [0, -14, 0],
    scaleY: [1, 1.06, 0.94, 1.02, 1],
    scaleX: [1, 0.95, 1.03, 0.99, 1],
  },
  transition: {
    duration: 0.6,
    repeat: Infinity,
    ease: 'easeInOut',
    repeatDelay: 0.4,
  },
};

/** Card flip effect — 180° Y-axis rotation */
export const flipAnimation = {
  animate: {
    rotateY: [0, 180],
  },
  transition: {
    duration: 0.7,
    repeat: Infinity,
    repeatType: 'reverse' as const,
    ease: [0.4, 0, 0.2, 1],
    repeatDelay: 1,
  },
};

/** Wave motion for decorative elements */
export const waveAnimation = {
  animate: {
    y: [0, -8, 0, 8, 0],
    rotate: [0, 5, 0, -5, 0],
  },
  transition: {
    duration: 2.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// ──────────────────────────────────────────────
// 4. WRAPPER COMPONENTS
// ──────────────────────────────────────────────

// ── AnimatedContainer (enhanced) ──

interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'fade' | 'slideUp' | 'slideDown' | 'pop' | 'slideLeft' | 'slideRight' |
            'bounceIn' | 'jelly' | 'tiltIn' | 'scaleRotate' | 'blurIn' | 'shimmer';
  delay?: number;
  duration?: number;
}

const VARIANT_MAP: Record<string, Variants> = {
  fade: fadeVariants,
  slideUp: slideUpVariants,
  slideDown: slideDownVariants,
  pop: popVariants,
  slideLeft: slideLeftVariants,
  slideRight: slideRightVariants,
  bounceIn: bounceInVariants,
  jelly: jellyVariants,
  tiltIn: tiltInVariants,
  scaleRotate: scaleRotateVariants,
  blurIn: blurInVariants,
  shimmer: shimmerVariants,
};

export function AnimatedContainer({
  children,
  className,
  variant = 'fade',
  delay = 0,
  duration = 0.4,
}: AnimatedContainerProps) {
  const variants = VARIANT_MAP[variant] ?? fadeVariants;
  const isShimmer = variant === 'shimmer';

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
      transition={
        isShimmer
          ? { duration, delay }
          : { duration, delay }
      }
      className={className}
      {...(isShimmer && {
        style: {
          backgroundImage:
            'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.4) 50%, transparent 75%)',
          backgroundSize: '200% 100%',
        } as React.CSSProperties,
      })}
    >
      {children}
    </motion.div>
  );
}

// ── StaggerGrid (enhanced with spring physics) ──

interface StaggerGridProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}

export function StaggerGrid({ children, className, stagger = 0.08 }: StaggerGridProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: stagger,
            delayChildren: 0.1,
            when: 'beforeChildren' as const,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── StaggerItem (enhanced with scale bounce) ──

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.85, rotate: -2 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          rotate: 0,
          transition: {
            ...BOUNCY_SPRING,
            opacity: { duration: 0.25 },
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── ParallaxFloat ──

interface ParallaxFloatProps {
  children: React.ReactNode;
  className?: string;
  /** Float intensity in px (default 12) */
  intensity?: number;
  /** Duration of one float cycle in seconds (default 3.5) */
  speed?: number;
  /** Rotation amount in degrees (default 3) */
  rotation?: number;
}

export function ParallaxFloat({
  children,
  className,
  intensity = 12,
  speed = 3.5,
  rotation = 3,
}: ParallaxFloatProps) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -intensity, -intensity * 0.3, -intensity * 1.1, 0],
        x: [0, intensity * 0.2, -intensity * 0.15, intensity * 0.3, 0],
        rotate: [0, rotation, -rotation * 0.5, rotation * 0.6, 0],
      }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

// ── AnimatedCounter ──

interface AnimatedCounterProps {
  /** Target number to count up to */
  value: number;
  /** Duration in seconds (default 1.5) */
  duration?: number;
  /** Prefix string (e.g. "$") */
  prefix?: string;
  /** Suffix string (e.g. "%") */
  suffix?: string;
  /** Number of decimal places (default 0) */
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  // Derive spring stiffness from duration: shorter → snappier, longer → smoother
  const springStiffness = Math.round(150 / Math.max(duration, 0.3));
  const springValue = useSpring(0, {
    stiffness: springStiffness,
    damping: Math.round(springStiffness * 0.2),
    mass: 1,
  });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) {
      springValue.set(value);
    } else {
      hasAnimated.current = true;
      // Initial animation with a delay to trigger mount
      const timer = setTimeout(() => springValue.set(value), 100);
      return () => clearTimeout(timer);
    }
  }, [value, springValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      setDisplayValue(Number(latest.toFixed(decimals)));
    });
    return unsubscribe;
  }, [springValue, decimals]);

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </motion.span>
  );
}

// ── MorphingEmoji ──

interface MorphingEmojiProps {
  /** Array of emojis to cycle through */
  emojis: string[];
  /** Duration each emoji is shown in seconds (default 2) */
  interval?: number;
  /** Size in CSS units (default "2rem") */
  size?: string;
  className?: string;
}

export function MorphingEmoji({
  emojis,
  interval = 2,
  size = '2rem',
  className,
}: MorphingEmojiProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (emojis.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % emojis.length);
    }, interval * 1000);
    return () => clearInterval(timer);
  }, [emojis, interval]);

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        fontSize: size,
        lineHeight: 1,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.5, rotate: -30, y: 10 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: 0,
            y: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.5,
            rotate: 30,
            y: -10,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 15,
          }}
          style={{ display: 'inline-block' }}
        >
          {emojis[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// ── SpotlightCard ──

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  /** Spotlight color (default rgba(99, 102, 241, 0.15)) */
  spotlightColor?: string;
  /** Border radius for the spotlight overlay (default "1rem") */
  borderRadius?: string;
  /** Whether the spotlight effect is active (default true) */
  enabled?: boolean;
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = 'rgba(99, 102, 241, 0.15)',
  borderRadius = '1rem',
  enabled = true,
}: SpotlightCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || !enabled) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY, enabled],
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const spotlightX = useTransform(mouseX, (x: number) => `${x}px`);
  const spotlightY = useTransform(mouseY, (y: number) => `${y}px`);

  return (
    <motion.div
      ref={containerRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative', overflow: 'hidden' }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {children}
      {/* Spotlight overlay */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          borderRadius,
          background: useTransform(
            [spotlightX, spotlightY],
            ([x, y]: string[]) =>
              `radial-gradient(250px circle at ${x} ${y}, ${spotlightColor}, transparent 70%)`,
          ),
        }}
      />
    </motion.div>
  );
}
