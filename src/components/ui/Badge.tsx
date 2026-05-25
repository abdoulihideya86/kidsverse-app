// ──────────────────────────────────────────────
// KidsVerse — Badge Component
// ──────────────────────────────────────────────
import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'premium' | 'achievement';
type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  removable?: boolean;
  onRemove?: () => void;
  pulse?: boolean;
  children: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-kv-gray-100 text-kv-gray-700',
  primary: 'bg-kv-blue/15 text-kv-blue',
  success: 'bg-kv-green/15 text-kv-green',
  warning: 'bg-kv-orange/15 text-kv-orange',
  danger: 'bg-kv-red/15 text-kv-red',
  info: 'bg-kv-cyan/15 text-kv-cyan',
  premium: 'bg-kv-purple/15 text-kv-purple',
  achievement: 'bg-kv-yellow/15 text-kv-yellow',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1 text-sm gap-1.5',
  lg: 'px-4 py-1.5 text-base gap-2',
};

export function Badge({
  variant = 'default',
  size = 'md',
  icon,
  removable = false,
  onRemove,
  pulse = false,
  children,
  className,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-bold select-none',
        variantClasses[variant],
        sizeClasses[size],
        pulse && 'animate-pulse',
        className
      )}
      {...rest}
    >
      {icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
          aria-label={`Remove ${children}`}
        >
          <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>
      )}
    </span>
  );
}

/* ═══════ Achievement Badge (larger, for gamification) ═══════ */
interface AchievementBadgeProps {
  name: string;
  description: string;
  emoji: string;
  earned?: boolean;
  earnedDate?: string;
  size?: 'md' | 'lg';
  onClick?: () => void;
}

export function AchievementBadge({ name, description, emoji, earned = true, earnedDate, size = 'md', onClick }: AchievementBadgeProps) {
  const sizeClasses = size === 'lg' ? 'w-24 h-24 text-5xl' : 'w-16 h-16 text-3xl';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'kv-card-interactive flex flex-col items-center gap-2 py-4 px-3 text-center min-w-[120px]',
        !earned && 'opacity-40 grayscale'
      )}
      aria-label={`${name} badge${earned ? ', earned' : ', not yet earned'}${earnedDate ? `, earned on ${earnedDate}` : ''}`}
    >
      <div className={cn(
        'rounded-full flex items-center justify-center shadow-button',
        sizeClasses,
        earned ? 'bg-kv-yellow/20 ring-2 ring-kv-yellow/50' : 'bg-kv-gray-100'
      )}>
        <span aria-hidden="true">{emoji}</span>
      </div>
      <p className="font-bold text-sm text-kv-gray-800 leading-tight">{name}</p>
      <p className="text-xs text-kv-gray-500 leading-tight">{description}</p>
      {earnedDate && (
        <p className="text-xs text-kv-gray-400">{earnedDate}</p>
      )}
      {!earned && (
        <span className="text-xs font-bold text-kv-gray-400 uppercase tracking-wider">Locked</span>
      )}
    </button>
  );
}

/* ═══════ Category Badge (for filtering) ═══════ */
interface CategoryBadgeProps {
  label: string;
  emoji?: string;
  active: boolean;
  onClick: () => void;
}

export function CategoryBadge({ label, emoji, active, onClick }: CategoryBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'kv-button-base px-4 py-2 text-sm flex items-center gap-1.5',
        active
          ? 'bg-kv-blue text-white shadow-button'
          : 'bg-white text-kv-gray-600 border-2 border-kv-gray-200 hover:border-kv-blue/30 hover:bg-kv-blue/5'
      )}
      aria-pressed={active}
      aria-label={`Filter by ${label}`}
    >
      {emoji && <span aria-hidden="true">{emoji}</span>}
      <span className="font-bold">{label}</span>
    </button>
  );
}
