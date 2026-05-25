import { describe, it, expect } from 'vitest';
import {
  cn,
  generateId,
  formatDate,
  formatNumber,
  clamp,
  shuffle,
  getAgeLabel,
  getAvatarEmoji,
  getAvatarColor,
  calcProgress,
  pickRandom,
  delay,
} from '@/lib/utils';
import { getAgeSegment } from '@/types';

// ── cn() ──
describe('cn', () => {
  it('joins class strings with spaces', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out falsy values (null, undefined, false)', () => {
    expect(cn('a', null, 'b', undefined, false, 'c')).toBe('a b c');
  });

  it('filters out empty strings', () => {
    expect(cn('a', '', 'b')).toBe('a b');
  });

  it('returns empty string for all-falsy input', () => {
    expect(cn(null, undefined, false, '')).toBe('');
  });

  it('handles single class', () => {
    expect(cn('text-red-500')).toBe('text-red-500');
  });
});

// ── generateId() ──
describe('generateId', () => {
  it('returns a string with the given prefix', () => {
    const id = generateId('test');
    expect(id).toMatch(/^test-/);
  });

  it('uses "kv" as default prefix', () => {
    const id = generateId();
    expect(id).toMatch(/^kv-/);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId('u')));
    expect(ids.size).toBe(100);
  });

  it('contains timestamp and random string', () => {
    const id = generateId('p');
    // format: p-<timestamp>-<random7>
    const parts = id.split('-');
    expect(parts.length).toBe(3);
    expect(parts[0]).toBe('p');
    expect(Number(parts[1])).toBeGreaterThan(0);
    expect(parts[2]).toHaveLength(7);
  });
});

// ── formatDate() ──
describe('formatDate', () => {
  it('formats a Date object into a readable string', () => {
    const date = new Date(2026, 0, 15); // Jan 15, 2026
    const formatted = formatDate(date);
    expect(formatted).toContain('January');
    expect(formatted).toContain('15');
  });
});

// ── formatNumber() ──
describe('formatNumber', () => {
  it('formats numbers with commas', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(12345)).toBe('12,345');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(42)).toBe('42');
  });
});

// ── clamp() ──
describe('clamp', () => {
  it('returns the value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to min when below range', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it('clamps to max when above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('returns min when value equals min', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('returns max when value equals max', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

// ── shuffle() ──
describe('shuffle', () => {
  it('returns a new array (does not mutate original)', () => {
    const original = [1, 2, 3, 4, 5];
    const result = shuffle(original);
    expect(result).not.toBe(original);
    expect(original).toEqual([1, 2, 3, 4, 5]);
  });

  it('contains all original elements', () => {
    const original = [1, 2, 3, 4, 5];
    const result = shuffle(original);
    expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('handles empty array', () => {
    expect(shuffle([])).toEqual([]);
  });

  it('handles single-element array', () => {
    expect(shuffle([42])).toEqual([42]);
  });
});

// ── getAgeSegment() ──
describe('getAgeSegment', () => {
  it('returns "toddler" for ages 2-4', () => {
    expect(getAgeSegment(2)).toBe('toddler');
    expect(getAgeSegment(3)).toBe('toddler');
    expect(getAgeSegment(4)).toBe('toddler');
  });

  it('returns "early-learner" for ages 5-7', () => {
    expect(getAgeSegment(5)).toBe('early-learner');
    expect(getAgeSegment(6)).toBe('early-learner');
    expect(getAgeSegment(7)).toBe('early-learner');
  });

  it('returns "kid" for ages 8-10', () => {
    expect(getAgeSegment(8)).toBe('kid');
    expect(getAgeSegment(9)).toBe('kid');
    expect(getAgeSegment(10)).toBe('kid');
  });
});

// ── getAgeLabel() ──
describe('getAgeLabel', () => {
  it('returns correct label for toddlers', () => {
    expect(getAgeLabel(2)).toBe('Ages 2-4');
    expect(getAgeLabel(4)).toBe('Ages 2-4');
  });

  it('returns correct label for early learners', () => {
    expect(getAgeLabel(5)).toBe('Ages 5-7');
    expect(getAgeLabel(7)).toBe('Ages 5-7');
  });

  it('returns correct label for kids', () => {
    expect(getAgeLabel(8)).toBe('Ages 8-10');
    expect(getAgeLabel(10)).toBe('Ages 8-10');
  });
});

// ── getAvatarEmoji() ──
describe('getAvatarEmoji', () => {
  it('returns the correct emoji for each animal', () => {
    expect(getAvatarEmoji('cat')).toBe('🐱');
    expect(getAvatarEmoji('dog')).toBe('🐶');
    expect(getAvatarEmoji('bear')).toBe('🐻');
    expect(getAvatarEmoji('panda')).toBe('🐼');
  });

  it('returns an emoji for all 12 avatar animals', () => {
    const animals = ['bear', 'bunny', 'cat', 'dog', 'elephant', 'fox', 'giraffe', 'koala', 'lion', 'monkey', 'panda', 'penguin'] as const;
    for (const animal of animals) {
      const emoji = getAvatarEmoji(animal);
      expect(emoji).toBeTruthy();
      expect(typeof emoji).toBe('string');
    }
  });
});

// ── getAvatarColor() ──
describe('getAvatarColor', () => {
  it('returns a hex color string', () => {
    const color = getAvatarColor('cat');
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('returns different colors for different animals', () => {
    expect(getAvatarColor('cat')).not.toBe(getAvatarColor('dog'));
  });
});

// ── calcProgress() ──
describe('calcProgress', () => {
  it('returns 0 for zero total', () => {
    expect(calcProgress(0, 0)).toBe(0);
  });

  it('returns 100 for full completion', () => {
    expect(calcProgress(10, 10)).toBe(100);
  });

  it('returns correct percentage for partial progress', () => {
    expect(calcProgress(5, 10)).toBe(50);
    expect(calcProgress(3, 10)).toBe(30);
    expect(calcProgress(1, 3)).toBe(33);
  });
});

// ── pickRandom() ──
describe('pickRandom', () => {
  it('returns the requested number of items', () => {
    const arr = [1, 2, 3, 4, 5];
    const picked = pickRandom(arr, 3);
    expect(picked).toHaveLength(3);
  });

  it('returns fewer items if count exceeds array length', () => {
    const arr = [1, 2];
    const picked = pickRandom(arr, 5);
    expect(picked).toHaveLength(2);
  });

  it('returns empty array for count 0', () => {
    expect(pickRandom([1, 2, 3], 0)).toEqual([]);
  });

  it('all picked items exist in the original array', () => {
    const arr = ['a', 'b', 'c', 'd', 'e'];
    const picked = pickRandom(arr, 3);
    for (const item of picked) {
      expect(arr).toContain(item);
    }
  });
});

// ── delay() ──
describe('delay', () => {
  it('resolves after the specified time', async () => {
    const start = Date.now();
    await delay(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40);
    expect(elapsed).toBeLessThan(200);
  });
});
