// ──────────────────────────────────────────────
// KidsVerse — Card Component
// ──────────────────────────────────────────────
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'elevated' | 'interactive' | 'flat';
type CardGradient = 'blue' | 'green' | 'orange' | 'purple' | 'pink' | 'rainbow';
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardBaseProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  gradient?: CardGradient;
  padding?: CardPadding;
  hoverable?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white rounded-2xl shadow-card',
  elevated: 'bg-white rounded-3xl shadow-card-hover',
  interactive: 'bg-white rounded-2xl shadow-card cursor-pointer hover:shadow-card-hover active:scale-[0.98] transition-all duration-200',
  flat: 'bg-white rounded-2xl border-2 border-kv-gray-100',
};

const gradientClasses: Record<CardGradient, string> = {
  blue: 'bg-gradient-to-br from-kv-blue to-blue-400 text-white',
  green: 'bg-gradient-to-br from-kv-green to-emerald-400 text-white',
  orange: 'bg-gradient-to-br from-kv-orange to-amber-400 text-white',
  purple: 'bg-gradient-to-br from-kv-purple to-violet-400 text-white',
  pink: 'bg-gradient-to-br from-kv-pink to-rose-400 text-white',
  rainbow: 'bg-gradient-to-br from-kv-red via-kv-yellow via-kv-green to-kv-blue text-white',
};

const paddingClasses: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3 md:p-4',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
  xl: 'p-8 md:p-10',
};

/* ═══════ Card Header Sub-component ═══════ */
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ children, className, ...rest }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center gap-3 mb-4', className)} {...rest}>
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
    <div className={cn('', className)} {...rest}>
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
    <div className={cn('flex items-center gap-3 mt-4 pt-4 border-t border-kv-gray-100', className)} {...rest}>
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
  ({ variant = 'default', gradient, padding = 'md', hoverable = false, children, className, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          paddingClasses[padding],
          gradient && gradientClasses[gradient],
          hoverable && 'hover:-translate-y-1 transition-transform duration-200',
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

/* ═══════ Motion Card ═══════ */
export interface MotionCardProps extends Omit<HTMLMotionProps<'div'>, 'children' | 'onAnimationStart'> {
  asMotion: true;
  variant?: CardVariant;
  gradient?: CardGradient;
  padding?: CardPadding;
  children: ReactNode;
}

export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  ({ variant = 'interactive', gradient, padding = 'md', children, className, whileHover = { y: -4, scale: 1.01 }, whileTap = { scale: 0.98 }, ...rest }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={whileHover}
        whileTap={whileTap}
        className={cn(
          variantClasses[variant],
          paddingClasses[padding],
          gradient && gradientClasses[gradient],
          'transition-shadow duration-300',
          className
        )}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }
);
MotionCard.displayName = 'MotionCard';
