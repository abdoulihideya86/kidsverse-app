// ──────────────────────────────────────────────
// KidsVerse — Button Component
// ──────────────────────────────────────────────
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'premium' | 'rainbow';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'toddler';

interface ButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-kv-blue text-white hover:bg-blue-500 active:bg-blue-600',
  secondary: 'bg-kv-gray-200 text-kv-gray-700 hover:bg-kv-gray-300 active:bg-kv-gray-400',
  success: 'bg-kv-green text-white hover:bg-emerald-500 active:bg-emerald-600',
  warning: 'bg-kv-orange text-white hover:bg-amber-500 active:bg-amber-600',
  danger: 'bg-kv-red text-white hover:bg-red-500 active:bg-red-600',
  ghost: 'bg-transparent text-kv-gray-700 hover:bg-kv-gray-100 active:bg-kv-gray-200',
  premium: 'bg-gradient-to-r from-kv-purple to-violet-500 text-white hover:from-purple-600 hover:to-violet-600',
  rainbow: 'bg-gradient-to-r from-kv-red via-kv-yellow via-kv-green to-kv-blue text-white',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-3 py-1.5 text-xs rounded-xl gap-1',
  sm: 'px-4 py-2 text-sm rounded-xl gap-1.5 min-h-[44px]',
  md: 'px-5 py-2.5 text-base rounded-2xl gap-2 min-h-[48px]',
  lg: 'px-6 py-3 text-lg rounded-2xl gap-2.5 min-h-[56px]',
  xl: 'px-8 py-4 text-xl rounded-2xl gap-3 min-h-[64px]',
  toddler: 'px-6 py-5 text-xl rounded-2xl gap-3 min-h-[80px]',
};

const loaderSizes: Record<Exclude<ButtonSize, 'xs'>, string> = {
  sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6', xl: 'w-7 h-7', toddler: 'w-8 h-8',
};

/* ═══════ Static Button ═══════ */
export interface ButtonProps extends ButtonBaseProps {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, loading = false, leftIcon, rightIcon, children, disabled, className, ...rest }, ref) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn('kv-button-base', variantClasses[variant], sizeClasses[size], fullWidth && 'w-full', className)}
        aria-busy={loading || undefined}
        {...rest}
      >
        {loading ? (
          <>
            <svg className={cn('animate-spin text-current', loaderSizes[size !== 'xs' ? size : 'sm'])} viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

/* ═══════ Motion Button (animated) ═══════ */
export interface MotionButtonProps extends Omit<HTMLMotionProps<'button'>, 'size' | 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, loading = false, leftIcon, rightIcon, children, disabled, className, whileHover = { scale: 1.03 }, whileTap = { scale: 0.97 }, ...rest }, ref) => {
    const isDisabled = disabled || loading;
    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        whileHover={isDisabled ? undefined : whileHover}
        whileTap={isDisabled ? undefined : whileTap}
        className={cn('kv-button-base', variantClasses[variant], sizeClasses[size], fullWidth && 'w-full', className)}
        aria-busy={loading || undefined}
        {...rest}
      >
        {loading ? (
          <>
            <svg className={cn('animate-spin text-current', loaderSizes[size !== 'xs' ? size : 'sm'])} viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);
MotionButton.displayName = 'MotionButton';
