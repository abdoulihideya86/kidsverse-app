// ──────────────────────────────────────────────
// KidsVerse — Sound Effects Hook
// ──────────────────────────────────────────────
import { useCallback, useRef } from 'react';
import { useSoundStore } from '@/store';

const AUDIO_CACHE = new Map<string, HTMLAudioElement>();

async function getAudio(src: string): Promise<HTMLAudioElement | null> {
  if (AUDIO_CACHE.has(src)) {
    return AUDIO_CACHE.get(src)!;
  }

  try {
    const audio = new Audio(src);
    audio.preload = 'auto';
    AUDIO_CACHE.set(src, audio);
    return audio;
  } catch {
    console.warn(`KidsVerse: Failed to load audio: ${src}`);
    return null;
  }
}

export function useSoundEffects() {
  const volumeRef = useRef(useSoundStore.getState().volume);
  const soundEnabledRef = useRef(useSoundStore.getState().soundEnabled);

  // Keep refs in sync
  useSoundStore.subscribe((state) => {
    volumeRef.current = state.volume;
    soundEnabledRef.current = state.soundEnabled;
  });

  const playSound = useCallback(async (src: string) => {
    if (!soundEnabledRef.current) return;

    const audio = await getAudio(src);
    if (!audio) return;

    audio.volume = volumeRef.current;
    audio.currentTime = 0;

    try {
      await audio.play();
    } catch {
      // Autoplay may be blocked by browser — that's okay
    }
  }, []);

  const playClick = useCallback(() => playSound('/sounds/click.mp3'), [playSound]);
  const playSuccess = useCallback(() => playSound('/sounds/success.mp3'), [playSound]);
  const playError = useCallback(() => playSound('/sounds/error.mp3'), [playSound]);
  const playPop = useCallback(() => playSound('/sounds/pop.mp3'), [playSound]);

  return {
    playSound,
    playClick,
    playSuccess,
    playError,
    playPop,
  };
}
