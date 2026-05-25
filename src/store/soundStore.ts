// ──────────────────────────────────────────────
// KidsVerse — Zustand Store: Sound Settings Slice
// ──────────────────────────────────────────────
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SoundState {
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number; // 0 to 1
}

interface SoundActions {
  toggleSound: () => void;
  toggleMusic: () => void;
  setVolume: (volume: number) => void;
}

export type SoundStore = SoundState & SoundActions;

export const useSoundStore = create<SoundStore>()(
  persist(
    (set) => ({
      soundEnabled: true,
      musicEnabled: true,
      volume: 0.7,

      toggleSound: () =>
        set((state) => ({ soundEnabled: !state.soundEnabled })),

      toggleMusic: () =>
        set((state) => ({ musicEnabled: !state.musicEnabled })),

      setVolume: (volume) =>
        set({ volume: Math.max(0, Math.min(1, volume)) }),
    }),
    {
      name: 'kidsverse-sound-settings',
    }
  )
);
