// ──────────────────────────────────────────────
// KidsVerse — Avatar Component (Duolingo-grade polish)
// ──────────────────────────────────────────────
import { motion } from 'framer-motion';
import { cn, getAvatarEmoji, getAvatarColor } from '@/lib/utils';
import type { AvatarAnimal, AgeRange } from '@/types';
import { useAgeAdaptiveConfig } from '@/hooks/useAgeAdaptiveConfig';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  animal: AvatarAnimal;
  size?: AvatarSize;
  name?: string;
  age?: AgeRange;
  selected?: boolean;
  onClick?: () => void;
  showRing?: boolean;
  className?: string;
  /** Show a small notification badge dot */
  badge?: boolean;
  /** Enable the idle floating animation */
  floating?: boolean;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-9 h-9 text-lg',
  sm: 'w-[52px] h-[52px] text-2xl',
  md: 'w-[68px] h-[68px] text-3xl',
  lg: 'w-[88px] h-[88px] text-4xl',
  xl: 'w-[120px] h-[120px] text-5xl',
};

const ageTapClasses: Record<string, string> = {
  toddler: 'min-w-[80px] min-h-[80px]',
  'early-learner': 'min-w-[60px] min-h-[60px]',
  kid: 'min-w-[48px] min-h-[48px]',
};

/* ═══════ Colored shadow per animal ═══════ */
function getColoredShadow(color: string): string {
  return `0 4px 16px ${color}55, 0 0 0 2px ${color}20`;
}

function getGlowShadow(color: string): string {
  return `0 6px 28px ${color}70, 0 0 0 3px ${color}40`;
}

/* ═══════ Avatar ═══════ */
export function Avatar({
  animal,
  size = 'md',
  name,
  age,
  selected = false,
  onClick,
  showRing = false,
  className,
  badge = false,
  floating = false,
}: AvatarProps) {
  const config = age ? useAgeAdaptiveConfig(age) : null;
  const tapClass = config ? ageTapClasses[config.segment] : '';
  const emoji = getAvatarEmoji(animal);
  const bgColor = getAvatarColor(animal);

  const Component = onClick ? motion.button : motion.div;
  const motionProps = onClick
    ? {
        whileHover: { scale: 1.1, y: -3 },
        whileTap: { scale: 0.88 },
        transition: { type: 'spring', stiffness: 400, damping: 17 },
      }
    : {};

  const floatAnimation = floating
    ? {
        y: [0, -6, 0],
        transition: {
          y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        },
      }
    : {};

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      animate={floatAnimation}
      className={cn(
        'relative rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300',
        sizeClasses[size],
        tapClass,
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        backgroundColor: bgColor,
        boxShadow: selected
          ? getGlowShadow(bgColor)
          : showRing
            ? `0 2px 12px ${bgColor}40, 0 0 0 2px ${bgColor}30`
            : getColoredShadow(bgColor),
        ...(selected && {
          outline: `3px solid ${bgColor}`,
          outlineOffset: '4px',
        }),
      }}
      aria-label={name ? `${name}'s avatar (${animal})` : `Avatar: ${animal}`}
      role={onClick ? 'radio' : undefined}
      aria-checked={selected || undefined}
      aria-selected={selected || undefined}
      {...motionProps}
    >
      {/* Inner highlight for 3D depth */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0.10) 40%, transparent 60%)',
        }}
      />

      <span className="relative z-10 select-none" aria-hidden="true">
        {emoji}
      </span>

      {/* Name label */}
      {name && (size === 'lg' || size === 'xl') && (
        <span className="absolute -bottom-5 text-xs font-bold text-kv-gray-600 whitespace-nowrap truncate max-w-[100px] drop-shadow-sm">
          {name}
        </span>
      )}

      {/* Notification badge */}
      {badge && (
        <span className="absolute -top-0.5 -right-0.5 z-20 flex h-4 w-4 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-kv-red opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-kv-red ring-2 ring-white" />
        </span>
      )}
    </Component>
  );
}

/* ═══════ Avatar Selector Grid (for profile creation) ═══════ */
interface AvatarSelectorProps {
  selected: AvatarAnimal;
  onSelect: (animal: AvatarAnimal) => void;
  availableAnimals?: AvatarAnimal[];
  columns?: number;
}

const ALL_ANIMALS: AvatarAnimal[] = [
  'bear', 'bunny', 'cat', 'dog', 'elephant', 'fox',
  'giraffe', 'koala', 'lion', 'monkey', 'panda', 'penguin',
];

/* Stagger delay for bounce-in animation */
const staggerDelay = (index: number) => ({
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 15,
      delay: index * 0.05,
    },
  },
});

export function AvatarSelector({
  selected,
  onSelect,
  availableAnimals = ALL_ANIMALS,
  columns = 6,
}: AvatarSelectorProps) {
  const gridCols = columns === 4
    ? 'grid-cols-4'
    : columns === 6
    ? 'grid-cols-6'
    : 'grid-cols-4 sm:grid-cols-6';

  return (
    <div
      className={`grid ${gridCols} gap-3`}
      role="radiogroup"
      aria-label="Avatar selection"
    >
      {availableAnimals.map((animal, index) => {
        const isSelected = selected === animal;
        const bgColor = getAvatarColor(animal);
        return (
          <motion.button
            key={animal}
            type="button"
            {...staggerDelay(index)}
            whileHover={{
              scale: 1.12,
              y: -4,
              boxShadow: `0 8px 24px ${bgColor}50`,
            }}
            whileTap={{ scale: 0.85 }}
            onClick={() => onSelect(animal)}
            className={cn(
              'w-full aspect-square rounded-2xl flex items-center justify-center text-3xl relative overflow-hidden',
              'transition-all duration-300',
              isSelected
                ? 'ring-0 scale-110 z-10'
                : 'bg-kv-gray-100 hover:bg-kv-gray-200'
            )}
            style={
              isSelected
                ? {
                    backgroundColor: bgColor,
                    boxShadow: `0 6px 28px ${bgColor}60, 0 0 0 3px ${bgColor}40`,
                  }
                : undefined
            }
            role="radio"
            aria-checked={isSelected}
            aria-label={`${animal} avatar`}
          >
            {/* Inner highlight for selected items */}
            {isSelected && (
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 50%)',
                }}
              />
            )}
            <span className="relative z-10 select-none">{getAvatarEmoji(animal)}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
