import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAgeAdaptiveConfig } from '@/hooks/useAgeAdaptiveConfig';
import type { AgeRange } from '@/types';

describe('useAgeAdaptiveConfig', () => {
  it('returns toddler config for age 2', () => {
    const { result } = renderHook(() => useAgeAdaptiveConfig(2 as AgeRange));
    expect(result.current.segment).toBe('toddler');
  });

  it('returns toddler config for age 4', () => {
    const { result } = renderHook(() => useAgeAdaptiveConfig(4 as AgeRange));
    expect(result.current.segment).toBe('toddler');
  });

  it('returns early-learner config for age 5', () => {
    const { result } = renderHook(() => useAgeAdaptiveConfig(5 as AgeRange));
    expect(result.current.segment).toBe('early-learner');
  });

  it('returns early-learner config for age 7', () => {
    const { result } = renderHook(() => useAgeAdaptiveConfig(7 as AgeRange));
    expect(result.current.segment).toBe('early-learner');
  });

  it('returns kid config for age 8', () => {
    const { result } = renderHook(() => useAgeAdaptiveConfig(8 as AgeRange));
    expect(result.current.segment).toBe('kid');
  });

  it('returns kid config for age 10', () => {
    const { result } = renderHook(() => useAgeAdaptiveConfig(10 as AgeRange));
    expect(result.current.segment).toBe('kid');
  });

  // ── Toddler-specific behavior ──
  it('toddler config has showTextLabels=false', () => {
    const { result } = renderHook(() => useAgeAdaptiveConfig(3 as AgeRange));
    expect(result.current.showTextLabels).toBe(false);
  });

  it('toddler config has showAudioLabels=true', () => {
    const { result } = renderHook(() => useAgeAdaptiveConfig(3 as AgeRange));
    expect(result.current.showAudioLabels).toBe(true);
  });

  it('toddler config has enableTimedChallenges=false', () => {
    const { result } = renderHook(() => useAgeAdaptiveConfig(3 as AgeRange));
    expect(result.current.enableTimedChallenges).toBe(false);
  });

  it('toddler config has enableReading=false', () => {
    const { result } = renderHook(() => useAgeAdaptiveConfig(3 as AgeRange));
    expect(result.current.enableReading).toBe(false);
  });

  it('toddler config has minTapTargetPx >= 64', () => {
    const { result } = renderHook(() => useAgeAdaptiveConfig(3 as AgeRange));
    expect(result.current.minTapTargetPx).toBeGreaterThanOrEqual(64);
  });

  // ── Early-learner-specific behavior ──
  it('early-learner config has showTextLabels=true', () => {
    const { result } = renderHook(() => useAgeAdaptiveConfig(6 as AgeRange));
    expect(result.current.showTextLabels).toBe(true);
  });

  it('early-learner config has enableTimedChallenges=false', () => {
    const { result } = renderHook(() => useAgeAdaptiveConfig(6 as AgeRange));
    expect(result.current.enableTimedChallenges).toBe(false);
  });

  // ── Kid-specific behavior ──
  it('kid config has showTextLabels=true', () => {
    const { result } = renderHook(() => useAgeAdaptiveConfig(9 as AgeRange));
    expect(result.current.showTextLabels).toBe(true);
  });

  it('kid config has showAudioLabels=false', () => {
    const { result } = renderHook(() => useAgeAdaptiveConfig(9 as AgeRange));
    expect(result.current.showAudioLabels).toBe(false);
  });

  it('kid config has enableTimedChallenges=true', () => {
    const { result } = renderHook(() => useAgeAdaptiveConfig(9 as AgeRange));
    expect(result.current.enableTimedChallenges).toBe(true);
  });

  it('kid config has enableReading=true', () => {
    const { result } = renderHook(() => useAgeAdaptiveConfig(9 as AgeRange));
    expect(result.current.enableReading).toBe(true);
  });

  // ── Tap target sizes ──
  it('toddler tap targets are larger than kid tap targets', () => {
    const toddler = renderHook(() => useAgeAdaptiveConfig(3 as AgeRange));
    const kid = renderHook(() => useAgeAdaptiveConfig(9 as AgeRange));
    expect(toddler.result.current.minTapTargetPx).toBeGreaterThan(
      kid.result.current.minTapTargetPx,
    );
  });

  // ── Color counts ──
  it('toddler maxColorsPerScreen <= early-learner maxColorsPerScreen', () => {
    const toddler = renderHook(() => useAgeAdaptiveConfig(3 as AgeRange));
    const learner = renderHook(() => useAgeAdaptiveConfig(6 as AgeRange));
    expect(toddler.result.current.maxColorsPerScreen).toBeLessThanOrEqual(
      learner.result.current.maxColorsPerScreen,
    );
  });
});
