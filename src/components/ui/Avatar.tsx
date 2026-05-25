// ──────────────────────────────────────────────
// KidsVerse — Avatar Component
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
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-8 h-8 text-base',
  sm: 'w-12 h-12 text-2xl',
  md: 'w-16 h-16 text-3xl',
  lg: 'w-20 h-20 text-4xl',
  xl: 'w-28 h-28 text-5xl',
};

const ageTapClasses: Record<string, string> = {
  toddler: 'min-w-[80px] min-h-[80px]',
  'early-learner': 'min-w-[60px] min-h-[60px]',
  kid: 'min-w-[48px] min-h-[48px]',
};

export function Avatar({
  animal,
  size = 'md',
  name,
  age,
  selected = false,
  onClick,
  showRing = false,
  className,
}: AvatarProps) {
  const config = age ? useAgeAdaptiveConfig(age) : null;
  const tapClass = config ? ageTapClasses[config.segment] : '';
  const emoji = getAvatarEmoji(animal);
  const bgColor = getAvatarColor(animal);

  const Component = onClick ? motion.button : motion.div;
  const motionProps = onClick ? { whileHover: { scale: 1.08 }, whileTap: { scale: 0.95 } } : {};

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'relative rounded-full flex items-center justify-center flex-shrink-0',
        sizeClasses[size],
        tapClass,
        showRing && 'ring-3 ring-kv-blue/30',
        selected && 'ring-4 ring-kv-blue ring-offset-2 ring-offset-kv-cream',
        onClick && 'cursor-pointer',
        className
      )}
      style={{ backgroundColor: bgColor }}
      aria-label={name ? `${name}'s avatar (${animal})` : `Avatar: ${animal}`}
      role={onClick ? 'radio' : undefined}
      aria-checked={selected || undefined}
      aria-selected={selected || undefined}
      {...motionProps}
    >
      <span className="select-none" aria-hidden="true">{emoji}</span>

      {/* Name label */}
      {name && (size === 'lg' || size === 'xl') && (
        <span className="absolute -bottom-5 text-xs font-bold text-kv-gray-600 whitespace-nowrap truncate max-w-[80px]">
          {name}
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
      className={`grid ${gridCols} gap-2`}
      role="radiogroup"
      aria-label="Avatar selection"
    >
      {availableAnimals.map((animal) => {
        const isSelected = selected === animal;
        return (
          <motion.button
            key={animal}
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSelect(animal)}
            className={cn(
              'w-full aspect-square rounded-2xl flex items-center justify-center text-3xl transition-all duration-200',
              isSelected
                ? 'bg-kv-blue ring-4 ring-kv-blue/30 scale-105 shadow-button'
                : 'bg-kv-gray-100 hover:bg-kv-gray-200'
            )}
            role="radio"
            aria-checked={isSelected}
            aria-label={`${animal} avatar`}
          >
            {getAvatarEmoji(animal)}
          </motion.button>
        );
      })}
    </div>
  );
}
