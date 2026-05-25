// ──────────────────────────────────────────────
// KidsVerse — Button Component (Duolingo-grade polish)
// ──────────────────────────────────────────────
import {
  forwardRef,
  useState,
  useCallback,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'ghost'
  | 'premium'
  | 'rainbow';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'toddler';

interface ButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

/* ═══════ Gradient variant classes + colored shadows ═══════ */
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-blue-400 via-kv-blue to-blue-600 text-white shadow-glow-blue hover:shadow-[0_8px_32px_rgba(30,144,255,0.45)]',
  secondary:
    'bg-gradient-to-b from-kv-gray-100 via-kv-gray-200 to-kv-gray-300 text-kv-gray-700 shadow-card hover:shadow-button-hover',
  success:
    'bg-gradient-to-b from-emerald-400 via-kv-green to-emerald-600 text-white shadow-glow-green hover:shadow-[0_8px_32px_rgba(46,213,115,0.45)]',
  warning:
    'bg-gradient-to-b from-amber-300 via-kv-orange to-amber-500 text-white shadow-glow-orange hover:shadow-[0_8px_32px_rgba(255,107,43,0.45)]',
  danger:
    'bg-gradient-to-b from-rose-400 via-kv-red to-rose-600 text-white shadow-glow-red hover:shadow-[0_8px_32px_rgba(255,71,87,0.45)]',
  ghost:
    'bg-transparent text-kv-gray-700 hover:bg-kv-gray-100 active:bg-kv-gray-200',
  premium:
    'bg-gradient-to-b from-purple-400 via-kv-purple to-purple-700 text-white shadow-glow-purple hover:shadow-[0_8px_32px_rgba(165,94,234,0.45)]',
  rainbow:
    'bg-gradient-to-r from-kv-red via-kv-yellow via-kv-green to-kv-blue text-white shadow-glow-cyan hover:shadow-[0_8px_32px_rgba(0,210,211,0.40)]',
};

/* Inner highlight for 3D depth */
const innerHighlight =
  'shadow-[inset_0_2px_0_rgba(255,255,255,0.30),inset_0_-2px_4px_rgba(0,0,0,0.08)]';

/* ═══════ Size classes — generous touch targets ═══════ */
const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-3.5 py-2 text-xs rounded-xl gap-1',
  sm: 'px-5 py-2.5 text-sm rounded-xl gap-1.5 min-h-[48px]',
  md: 'px-6 py-3 text-base rounded-2xl gap-2 min-h-[52px]',
  lg: 'px-7 py-3.5 text-lg rounded-2xl gap-2.5 min-h-[60px]',
  xl: 'px-9 py-4 text-xl rounded-2xl gap-3 min-h-[68px]',
  toddler: 'px-7 py-6 text-2xl rounded-3xl gap-3 min-h-[84px]',
};

const loaderSizes: Record<Exclude<ButtonSize, 'xs'>, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
  toddler: 'w-8 h-8',
};

/* ═══════ Loading spinner — smooth spinning ring ═══════ */
function LoadingSpinner({ size }: { size: Exclude<ButtonSize, 'xs'> }) {
  return (
    <svg
      className={cn('animate-spin text-current', loaderSizes[size])}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M12 3a9 9 0 019 9h-3a6 6 0 00-6-6V3z"
      />
    </svg>
  );
}

/* ═══════ Ripple effect ═══════ */
function Ripple({ x, y }: { x: number; y: number }) {
  return (
    <span
      className="absolute rounded-full bg-white/30 animate-[ripple_0.7s_ease-out_forwards] pointer-events-none"
      style={{
        left: x,
        top: y,
        width: 200,
        height: 200,
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
}

/* ═══════ Static Button ═══════ */
export interface ButtonProps extends ButtonBaseProps {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className,
      onClick,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isDisabled) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();
        setRipples((prev) => [...prev, { id, x, y }]);
        setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 700);
        onClick?.(e);
      },
      [isDisabled, onClick]
    );

    const isGradientVariant = variant !== 'ghost' && variant !== 'secondary';

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          'kv-button-base relative overflow-hidden',
          variantClasses[variant],
          sizeClasses[size],
          isGradientVariant && innerHighlight,
          !isDisabled && 'hover:brightness-110 active:brightness-95 active:translate-y-0.5',
          isDisabled && 'opacity-50 cursor-not-allowed',
          fullWidth && 'w-full',
          className
        )}
        aria-busy={loading || undefined}
        {...rest}
      >
        {/* Ripple effects */}
        {ripples.map((ripple) => (
          <Ripple key={ripple.id} x={ripple.x} y={ripple.y} />
        ))}

        {loading ? (
          <>
            <LoadingSpinner size={size !== 'xs' ? size : 'sm'} />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="flex-shrink-0 drop-shadow-sm" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            <span className="font-semibold drop-shadow-sm">{children}</span>
            {rightIcon && (
              <span className="flex-shrink-0 drop-shadow-sm" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

/* ═══════ Motion Button (animated with spring physics) ═══════ */
export interface MotionButtonProps extends Omit<
  HTMLMotionProps<'button'>,
  'size' | 'children'
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className,
      whileHover = { scale: 1.05, y: -2 },
      whileTap = { scale: 0.92 },
      transition = { type: 'spring', stiffness: 400, damping: 17, mass: 0.8 },
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const isGradientVariant = variant !== 'ghost' && variant !== 'secondary';

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        whileHover={isDisabled ? undefined : whileHover}
        whileTap={isDisabled ? undefined : whileTap}
        transition={transition}
        className={cn(
          'kv-button-base relative overflow-hidden',
          variantClasses[variant],
          sizeClasses[size],
          isGradientVariant && innerHighlight,
          !isDisabled && 'hover:brightness-110 active:brightness-95',
          isDisabled && 'opacity-50 cursor-not-allowed',
          fullWidth && 'w-full',
          className
        )}
        aria-busy={loading || undefined}
        {...rest}
      >
        {loading ? (
          <>
            <LoadingSpinner size={size !== 'xs' ? size : 'sm'} />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="flex-shrink-0 drop-shadow-sm" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            <span className="font-semibold drop-shadow-sm">{children}</span>
            {rightIcon && (
              <span className="flex-shrink-0 drop-shadow-sm" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </motion.button>
    );
  }
);
MotionButton.displayName = 'MotionButton';
