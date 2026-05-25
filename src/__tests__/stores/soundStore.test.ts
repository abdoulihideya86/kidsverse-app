import { describe, it, expect, beforeEach } from 'vitest';
import { useSoundStore } from '@/store/soundStore';

describe('soundStore', () => {
  beforeEach(() => {
    // Reset store to defaults (non-persisted for tests)
    useSoundStore.setState({
      soundEnabled: true,
      musicEnabled: true,
      volume: 0.7,
    });
  });

  it('has correct default state', () => {
    const state = useSoundStore.getState();
    expect(state.soundEnabled).toBe(true);
    expect(state.musicEnabled).toBe(true);
    expect(state.volume).toBe(0.7);
  });

  it('toggleSound flips soundEnabled', () => {
    expect(useSoundStore.getState().soundEnabled).toBe(true);
    useSoundStore.getState().toggleSound();
    expect(useSoundStore.getState().soundEnabled).toBe(false);
    useSoundStore.getState().toggleSound();
    expect(useSoundStore.getState().soundEnabled).toBe(true);
  });

  it('toggleMusic flips musicEnabled', () => {
    expect(useSoundStore.getState().musicEnabled).toBe(true);
    useSoundStore.getState().toggleMusic();
    expect(useSoundStore.getState().musicEnabled).toBe(false);
    useSoundStore.getState().toggleMusic();
    expect(useSoundStore.getState().musicEnabled).toBe(true);
  });

  it('setVolume clamps volume to [0, 1]', () => {
    useSoundStore.getState().setVolume(0.5);
    expect(useSoundStore.getState().volume).toBe(0.5);
  });

  it('setVolume clamps to 0 when negative', () => {
    useSoundStore.getState().setVolume(-0.5);
    expect(useSoundStore.getState().volume).toBe(0);
  });

  it('setVolume clamps to 1 when above 1', () => {
    useSoundStore.getState().setVolume(2.0);
    expect(useSoundStore.getState().volume).toBe(1);
  });

  it('setVolume accepts exact 0 and 1', () => {
    useSoundStore.getState().setVolume(0);
    expect(useSoundStore.getState().volume).toBe(0);
    useSoundStore.getState().setVolume(1);
    expect(useSoundStore.getState().volume).toBe(1);
  });
});
