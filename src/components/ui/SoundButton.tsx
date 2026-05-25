// ──────────────────────────────────────────────
// KidsVerse — SoundButton Component
// ──────────────────────────────────────────────
import { motion } from 'framer-motion';
import { useSoundStore } from '@/store';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { cn } from '@/lib/utils';

type SoundButtonType = 'sound' | 'music';
type SoundButtonSize = 'sm' | 'md' | 'lg';

interface SoundButtonProps {
  type?: SoundButtonType;
  size?: SoundButtonSize;
  className?: string;
  label?: string;
}

const sizeClasses: Record<SoundButtonSize, string> = {
  sm: 'w-9 h-9 text-base',
  md: 'w-12 h-12 text-xl',
  lg: 'w-16 h-16 text-2xl',
};

export function SoundButton({ type = 'sound', size = 'md', className, label }: SoundButtonProps) {
  const soundEnabled = useSoundStore((s) => s.soundEnabled);
  const musicEnabled = useSoundStore((s) => s.musicEnabled);
  const toggleSound = useSoundStore((s) => s.toggleSound);
  const toggleMusic = useSoundStore((s) => s.toggleMusic);
  const { playClick } = useSoundEffects();

  const isEnabled = type === 'sound' ? soundEnabled : musicEnabled;
  const toggle = type === 'sound' ? toggleSound : toggleMusic;

  const handleClick = () => {
    playClick();
    toggle();
  };

  const icon = type === 'sound'
    ? (isEnabled ? '🔊' : '🔇')
    : (isEnabled ? '🎵' : '🔇');

  const accessibleLabel = label ?? (type === 'sound'
    ? `Sound effects ${isEnabled ? 'on' : 'off'}`
    : `Music ${isEnabled ? 'on' : 'off'}`
  );

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className={cn(
        'kv-button-base rounded-full bg-white border-2 flex items-center justify-center',
        isEnabled ? 'border-kv-blue text-kv-blue' : 'border-kv-gray-200 text-kv-gray-400',
        sizeClasses[size],
        className
      )}
      aria-label={accessibleLabel}
      aria-pressed={isEnabled}
      title={accessibleLabel}
    >
      <span aria-hidden="true">{icon}</span>
    </motion.button>
  );
}

/* ═══════ Sound Toggle Bar (for child screens) ═══════ */
interface SoundToggleBarProps {
  className?: string;
}

export function SoundToggleBar({ className }: SoundToggleBarProps) {
  return (
    <div className={cn('flex items-center gap-2', className)} role="group" aria-label="Audio controls">
      <SoundButton type="sound" size="sm" />
      <SoundButton type="music" size="sm" />
    </div>
  );
}
