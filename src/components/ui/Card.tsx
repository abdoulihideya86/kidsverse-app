// ──────────────────────────────────────────────
// KidsVerse — Card Component (Duolingo-grade polish)
// ──────────────────────────────────────────────
import { type HTMLAttributes, type ReactNode, forwardRef, useState } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'elevated' | 'interactive' | 'flat' | 'glow';
type CardGradient = 'blue' | 'green' | 'orange' | 'purple' | 'pink' | 'rainbow';
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardBaseProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  gradient?: CardGradient;
  padding?: CardPadding;
  hoverable?: boolean;
  /** Colored accent line on top of card. Pass a Tailwind bg class e.g. "bg-kv-blue" */
  borderTop?: string;
}

/* ═══════ Variant classes ═══════ */
const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white rounded-2xl shadow-card',
  elevated: 'bg-white rounded-3xl shadow-card-hover',
  interactive:
    'bg-white rounded-2xl shadow-card cursor-pointer hover:shadow-card-hover active:scale-[0.97] transition-all duration-200',
  flat: 'bg-white rounded-2xl border-2 border-kv-gray-100',
  glow: 'bg-white rounded-2xl shadow-glow-blue',
};

/* ═══════ Gradient classes — 3-stop vibrant gradients ═══════ */
const gradientClasses: Record<CardGradient, string> = {
  blue: 'bg-gradient-to-br from-kv-blue via-blue-400 to-kv-cyan text-white',
  green: 'bg-gradient-to-br from-kv-green via-emerald-400 to-teal-300 text-white',
  orange: 'bg-gradient-to-br from-kv-orange via-amber-400 to-kv-yellow text-white',
  purple: 'bg-gradient-to-br from-kv-purple via-violet-400 to-fuchsia-400 text-white',
  pink: 'bg-gradient-to-br from-kv-pink via-rose-400 to-pink-300 text-white',
  rainbow: 'bg-gradient-to-br from-kv-red via-kv-yellow via-kv-green to-kv-blue text-white',
};

/* ═══════ Colored glow shadows per gradient ═══════ */
const gradientGlowShadow: Record<CardGradient, string> = {
  blue: 'shadow-glow-blue',
  green: 'shadow-glow-green',
  orange: 'shadow-glow-orange',
  purple: 'shadow-glow-purple',
  pink: 'shadow-glow-pink',
  rainbow: 'shadow-glow-cyan',
};

/* ═══════ Padding — generous spacing ═══════ */
const paddingClasses: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-4 md:p-5',
  md: 'p-5 md:p-7',
  lg: 'p-7 md:p-9',
  xl: 'p-9 md:p-12',
};

/* ═══════ Inner highlight for 3D depth ═══════ */
const innerHighlight =
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1px_4px_rgba(0,0,0,0.04)]';

/* ═══════ Card Header Sub-component ═══════ */
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ children, className, ...rest }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center gap-3 mb-5', className)} {...rest}>
      {children}
    </div>
  );
}

/* ═══════ Card Body Sub-component ═══════ */
interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardBody({ children, className, ...rest }: CardBodyProps) {
  return (
    <div className={cn('relative z-10', className)} {...rest}>
      {children}
    </div>
  );
}

/* ═══════ Card Footer Sub-component ═══════ */
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardFooter({ children, className, ...rest }: CardFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 mt-5 pt-5 border-t border-white/15',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ═══════ Static Card ═══════ */
export interface CardProps extends CardBaseProps {
  asMotion?: false;
  children: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      gradient,
      padding = 'md',
      hoverable = false,
      borderTop,
      children,
      className,
      ...rest
    },
    ref
  ) => {
    const hasGradient = !!gradient;
    const isGlow = variant === 'glow';
    const glowClass =
      isGlow && gradient ? gradientGlowShadow[gradient] : isGlow ? 'shadow-glow-blue' : '';

    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant === 'glow' ? 'default' : variant],
          paddingClasses[padding],
          gradient && gradientClasses[gradient],
          glowClass,
          hasGradient && innerHighlight,
          hoverable &&
            'hover:-translate-y-1.5 hover:shadow-card-hover transition-all duration-300 ease-out',
          borderTop && `border-t-4 ${borderTop}`,
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

/* ═══════ Spotlight overlay ═══════ */
function SpotlightOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
      style={{
        background:
          'radial-gradient(600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(255,255,255,0.18), transparent 40%)',
      }}
    />
  );
}

/* ═══════ Motion Card (animated) ═══════ */
export interface MotionCardProps extends Omit<
  HTMLMotionProps<'div'>,
  'children' | 'onAnimationStart'
> {
  asMotion: true;
  variant?: CardVariant;
  gradient?: CardGradient;
  padding?: CardPadding;
  /** Adds a radial gradient spotlight overlay that follows the cursor on hover */
  spotlight?: boolean;
  /** Colored accent line on top of card. Pass a Tailwind bg class e.g. "bg-kv-blue" */
  borderTop?: string;
  children: ReactNode;
}

export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  (
    {
      variant = 'interactive',
      gradient,
      padding = 'md',
      spotlight = false,
      borderTop,
      children,
      className,
      whileHover = {
        y: -6,
        scale: 1.02,
        rotateX: 2,
        rotateY: -2,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      },
      whileTap = { scale: 0.95, borderRadius: '1.5rem' },
      ...rest
    },
    ref
  ) => {
    const hasGradient = !!gradient;
    const isGlow = variant === 'glow';
    const glowClass =
      isGlow && gradient ? gradientGlowShadow[gradient] : isGlow ? 'shadow-glow-blue' : '';

    // Spotlight mouse tracking
    const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!spotlight) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setSpotlightPos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };

    return (
      <motion.div
        ref={ref}
        whileHover={whileHover}
        whileTap={whileTap}
        onMouseMove={handleMouseMove}
        style={{
          ...(spotlight
            ? { '--spotlight-x': `${spotlightPos.x}%`, '--spotlight-y': `${spotlightPos.y}%` }
            : {}),
          transformStyle: 'preserve-3d',
        } as React.CSSProperties}
        className={cn(
          'group/card relative overflow-hidden',
          variantClasses[variant === 'glow' ? 'interactive' : variant],
          paddingClasses[padding],
          gradient && gradientClasses[gradient],
          glowClass,
          hasGradient && innerHighlight,
          'transition-shadow duration-300 ease-out',
          borderTop && `border-t-4 ${borderTop}`,
          className
        )}
        {...rest}
      >
        {spotlight && <SpotlightOverlay />}
        {/* Subtle inner highlight bar at top for 3D depth */}
        {!hasGradient && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        )}
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);
MotionCard.displayName = 'MotionCard';
