// ──────────────────────────────────────────────
// KidsVerse — ProgressBar Component
// ──────────────────────────────────────────────
import { type HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type ProgressVariant = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'pink' | 'cyan' | 'yellow';
type ProgressSize = 'sm' | 'md' | 'lg' | 'xl';

interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  showLabel?: boolean;
  labelPosition?: 'top' | 'right' | 'inside';
  animated?: boolean;
  striped?: boolean;
}

const variantClasses: Record<ProgressVariant, string> = {
  blue: 'bg-kv-blue',
  green: 'bg-kv-green',
  orange: 'bg-kv-orange',
  red: 'bg-kv-red',
  purple: 'bg-kv-purple',
  pink: 'bg-kv-pink',
  cyan: 'bg-kv-cyan',
  yellow: 'bg-kv-yellow',
};

const sizeClasses: Record<ProgressSize, string> = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
  xl: 'h-6',
};

const labelSizeClasses: Record<ProgressSize, string> = {
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-sm font-bold',
};

export function ProgressBar({
  value,
  max = 100,
  variant = 'blue',
  size = 'md',
  showLabel = false,
  labelPosition = 'right',
  animated = true,
  striped = false,
  className,
  ...rest
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(value, max));
  const percent = Math.round((clampedValue / max) * 100);

  return (
    <div
      className={cn('w-full', className)}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`${percent}% complete`}
      {...rest}
    >
      {/* Top label */}
      {showLabel && labelPosition === 'top' && (
        <div className="flex justify-between mb-1">
          <span className={cn('text-kv-gray-500', labelSizeClasses[size])}>{clampedValue} / {max}</span>
          <span className={cn('font-bold text-kv-gray-700', labelSizeClasses[size])}>{percent}%</span>
        </div>
      )}

      {/* Bar */}
      <div className={cn(
        'w-full rounded-full bg-kv-gray-100 overflow-hidden',
        sizeClasses[size]
      )}>
        <motion.div
          className={cn(
            'h-full rounded-full',
            variantClasses[variant],
            striped && 'bg-[length:1rem_1rem] bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)]'
          )}
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Inside label (only for xl size) */}
          {showLabel && labelPosition === 'inside' && size === 'xl' && (
            <span className="flex items-center justify-center h-full text-xs text-white font-bold drop-shadow-sm">
              {percent}%
            </span>
          )}
        </motion.div>
      </div>

      {/* Right label */}
      {showLabel && labelPosition === 'right' && (
        <div className="flex justify-between mt-1">
          <span className={cn('text-kv-gray-500', labelSizeClasses[size])}>Progress</span>
          <span className={cn('font-bold text-kv-gray-700', labelSizeClasses[size])}>{percent}%</span>
        </div>
      )}
    </div>
  );
}

/* ═══════ Star Rating Component ═══════ */
interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  label?: string;
}

export function StarRating({
  rating,
  maxRating = 3,
  size = 'md',
  interactive = false,
  onChange,
  label,
}: StarRatingProps) {
  const sizeMap = { sm: 'text-xl', md: 'text-3xl', lg: 'text-5xl' };
  const gapMap = { sm: 'gap-0.5', md: 'gap-1', lg: 'gap-2' };

  return (
    <div
      className={cn('flex items-center', gapMap[size])}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={label ?? `Rating: ${rating} of ${maxRating} stars`}
    >
      {Array.from({ length: maxRating }, (_, i) => {
        const starIndex = i + 1;
        const isFilled = starIndex <= rating;
        return (
          <button
            key={starIndex}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(starIndex)}
            className={cn(
              'transition-transform duration-200',
              interactive && 'hover:scale-125 active:scale-90 cursor-pointer',
              !interactive && 'cursor-default'
            )}
            role={interactive ? 'radio' : undefined}
            aria-checked={interactive ? isFilled : undefined}
            aria-label={interactive ? `${starIndex} star${starIndex > 1 ? 's' : ''}` : undefined}
          >
            <span className={sizeMap[size]} aria-hidden="true">
              {isFilled ? '⭐' : '☆'}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ═══════ Step Indicator (for multi-step flows) ═══════ */
interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2" role="progressbar" aria-valuenow={currentStep} aria-valuemin={0} aria-valuemax={totalSteps} aria-label={`Step ${currentStep} of ${totalSteps}`}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                  isCompleted && 'bg-kv-green text-white shadow-button',
                  isCurrent && 'bg-kv-blue text-white shadow-button ring-4 ring-kv-blue/20 scale-110',
                  !isCompleted && !isCurrent && 'bg-kv-gray-100 text-kv-gray-400'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              {labels && labels[i] && (
                <span className={cn(
                  'text-xs font-bold whitespace-nowrap',
                  isCurrent ? 'text-kv-blue' : isCompleted ? 'text-kv-green' : 'text-kv-gray-400'
                )}>
                  {labels[i]}
                </span>
              )}
            </div>
            {step < totalSteps && (
              <div className={cn(
                'w-8 md:w-16 h-0.5 mx-1 transition-colors duration-300',
                isCompleted ? 'bg-kv-green' : 'bg-kv-gray-200'
              )} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}
