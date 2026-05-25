// ──────────────────────────────────────────────
// KidsVerse — Icon Components (SVG)
// ──────────────────────────────────────────────
import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
  size?: number;
  label?: string;
}

/* ═══════ Navigation Icons ═══════ */
export function IconArrowLeft({ className, size = 24, label = 'Go back' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn('text-kv-gray-600', className)} aria-label={label} role="img">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export function IconArrowRight({ className, size = 24, label = 'Go forward' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn('text-kv-gray-600', className)} aria-label={label} role="img">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export function IconClose({ className, size = 24, label = 'Close' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={cn('text-kv-gray-500', className)} aria-label={label} role="img">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function IconMenu({ className, size = 24, label = 'Menu' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={cn('text-kv-gray-700', className)} aria-label={label} role="img">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function IconHome({ className, size = 24, label = 'Home' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn('text-kv-gray-700', className)} aria-label={label} role="img">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-5H9v5H4a1 1 0 01-1-1V9.5z" />
    </svg>
  );
}

/* ═══════ Status Icons ═══════ */
export function IconCheck({ className, size = 24, label = 'Check' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn('text-kv-green', className)} aria-label={label} role="img">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function IconAlert({ className, size = 24, label = 'Alert' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={cn('text-kv-orange', className)} aria-label={label} role="img">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}

export function IconError({ className, size = 24, label = 'Error' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={cn('text-kv-red', className)} aria-label={label} role="img">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}

export function IconInfo({ className, size = 24, label = 'Information' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={cn('text-kv-blue', className)} aria-label={label} role="img">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  );
}

/* ═══════ Action Icons ═══════ */
export function IconDelete({ className, size = 24, label = 'Delete' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn('text-kv-red', className)} aria-label={label} role="img">
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
    </svg>
  );
}

export function IconEdit({ className, size = 24, label = 'Edit' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn('text-kv-gray-500', className)} aria-label={label} role="img">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function IconAdd({ className, size = 24, label = 'Add' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={cn('text-kv-gray-700', className)} aria-label={label} role="img">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/* ═══════ Content Icons ═══════ */
export function IconStar({ className, size = 24, label = 'Star', filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className={cn(filled ? 'text-kv-yellow' : 'text-kv-gray-300', className)} aria-label={label} role="img">
      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

export function IconClock({ className, size = 24, label = 'Clock' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn('text-kv-gray-600', className)} aria-label={label} role="img">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function IconVolume({ className, size = 24, label = 'Volume', on = false }: IconProps & { on?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn(on ? 'text-kv-blue' : 'text-kv-gray-400', className)} aria-label={label} role="img">
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      {on && (
        <>
          <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
        </>
      )}
    </svg>
  );
}

/* ═══════ Animated Spinner ═══════ */
export function Spinner({ className, size = 24, label = 'Loading' }: IconProps) {
  return (
    <svg
      className={cn('animate-spin', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label={label}
      role="img"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
