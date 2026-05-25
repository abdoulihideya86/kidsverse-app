// ──────────────────────────────────────────────
// KidsVerse — Utility Functions
// ──────────────────────────────────────────────
import type { AgeRange, AvatarAnimal } from '@/types';

/**
 * Generate a random ID for local use.
 * Firestore documents use auto-generated IDs,
 * but this is useful for optimistic UI updates.
 */
export function generateId(prefix: string = 'kv'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Format a date for display in the child-friendly UI.
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a number with commas (e.g., 1,234).
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Shuffle an array (returns a new array).
 */
export function shuffle<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i]!, newArr[j]!] = [newArr[j]!, newArr[i]!];
  }
  return newArr;
}

/**
 * Delay helper for animations.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get a friendly label for the age range.
 */
export function getAgeLabel(age: AgeRange): string {
  if (age <= 4) return 'Ages 2-4';
  if (age <= 7) return 'Ages 5-7';
  return 'Ages 8-10';
}

/**
 * Get the SVG path data for avatar animals.
 * These are simple, child-friendly animal icons.
 */
export function getAvatarEmoji(animal: AvatarAnimal): string {
  const emojis: Record<AvatarAnimal, string> = {
    bear: '🐻',
    bunny: '🐰',
    cat: '🐱',
    dog: '🐶',
    elephant: '🐘',
    fox: '🦊',
    giraffe: '🦒',
    koala: '🐨',
    lion: '🦁',
    monkey: '🐵',
    panda: '🐼',
    penguin: '🐧',
  };
  return emojis[animal];
}

/**
 * Get a display color for avatar animals.
 */
export function getAvatarColor(animal: AvatarAnimal): string {
  const colorMap: Record<AvatarAnimal, string> = {
    bear: '#FFA94D',
    bunny: '#FF69B4',
    cat: '#FFD93D',
    dog: '#6BCB77',
    elephant: '#4D96FF',
    fox: '#FF6B6B',
    giraffe: '#FFD93D',
    koala: '#9CA3AF',
    lion: '#FFA94D',
    monkey: '#9B59B6',
    panda: '#E5E7EB',
    penguin: '#4D96FF',
  };
  return colorMap[animal];
}

/**
 * Classnames utility — merge class strings, filtering out falsy values.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Calculate percentage for progress bars.
 */
export function calcProgress(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}

/**
 * Pick random items from an array.
 */
export function pickRandom<T>(arr: T[], count: number): T[] {
  return shuffle(arr).slice(0, count);
}
