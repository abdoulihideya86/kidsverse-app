// ──────────────────────────────────────────────
// KidsVerse — Animation Helpers (Framer Motion)
// ──────────────────────────────────────────────
import { motion, type Variants, type Transition } from 'framer-motion';

/* ═══════ Preset Variants ═══════ */

/** Fade in/out */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Slide up */
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

/** Slide down */
export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

/** Slide from right */
export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

/** Slide from left */
export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 },
};

/** Scale pop */
export const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

/** Stagger children container */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/** Stagger child item */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
};

/* ═══════ Page Transition Variants ═══════ */

export const pageVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 },
};

export const pageTransition: Transition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
};

/* ═══════ Floating Animation (idle mascot) ═══════ */

export const floatingAnimation = {
  animate: {
    y: [0, -8, 0],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

/* ═══════ Wiggle Animation ═══════ */

export const wiggleAnimation = {
  animate: {
    rotate: [-3, 3, -3],
  },
  transition: {
    duration: 0.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

/* ═══════ Pulse Glow (for interactive elements) ═══════ */

export const pulseGlowAnimation = {
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(77, 150, 255, 0.4)',
      '0 0 0 12px rgba(77, 150, 255, 0)',
    ],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
  },
};

/* ═══════ Reusable Motion Wrappers ═══════ */

interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'fade' | 'slideUp' | 'slideDown' | 'pop' | 'slideLeft' | 'slideRight';
  delay?: number;
  duration?: number;
}

export function AnimatedContainer({
  children,
  className,
  variant = 'fade',
  delay = 0,
  duration = 0.4,
}: AnimatedContainerProps) {
  const variantMap: Record<string, Variants> = {
    fade: fadeVariants,
    slideUp: slideUpVariants,
    slideDown: slideDownVariants,
    pop: popVariants,
    slideLeft: slideLeftVariants,
    slideRight: slideRightVariants,
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variantMap[variant]}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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
          transition: { staggerChildren: stagger, delayChildren: 0.05 },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { type: 'spring', stiffness: 300, damping: 30 },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
