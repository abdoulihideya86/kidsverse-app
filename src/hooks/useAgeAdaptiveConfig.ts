// ──────────────────────────────────────────────
// KidsVerse — Age-Adaptive Config Hook
// ──────────────────────────────────────────────
import { useMemo } from 'react';
import type { AgeRange, AgeSegment, AgeAdaptiveConfig } from '@/types';
import { getAgeSegment } from '@/types';
import { tapTargetSize } from '@/styles/tokens';

export function useAgeAdaptiveConfig(age: AgeRange): AgeAdaptiveConfig {
  return useMemo(() => {
    const segment = getAgeSegment(age);

    const configs: Record<AgeSegment, AgeAdaptiveConfig> = {
      toddler: {
        segment,
        showTextLabels: false,
        showAudioLabels: true,
        minTapTargetPx: tapTargetSize.toddler,
        maxColorsPerScreen: 3,
        enableReading: false,
        enableTimedChallenges: false,
      },
      'early-learner': {
        segment,
        showTextLabels: true,
        showAudioLabels: true,
        minTapTargetPx: tapTargetSize['early-learner'],
        maxColorsPerScreen: 4,
        enableReading: true,
        enableTimedChallenges: false,
      },
      kid: {
        segment,
        showTextLabels: true,
        showAudioLabels: false,
        minTapTargetPx: tapTargetSize.kid,
        maxColorsPerScreen: 6,
        enableReading: true,
        enableTimedChallenges: true,
      },
    };

    return configs[segment];
  }, [age]);
}
