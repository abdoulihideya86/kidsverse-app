// ──────────────────────────────────────────────
// KidsVerse — Zustand Store: Screen Time Slice
// ──────────────────────────────────────────────
import { create } from 'zustand';
import type { ChildProfile, ScreenTimeSession } from '@/types';

interface ScreenTimeState {
  activeSession: ScreenTimeSession | null;
  todayMinutesUsed: number;
  limitMinutes: number;
  isTimeUp: boolean;
}

interface ScreenTimeActions {
  startSession: (childId: string) => void;
  endSession: () => void;
  tickMinute: () => void;
  setLimit: (minutes: number) => void;
  loadTodayUsage: (minutes: number) => void;
  resetForNewChild: (profile: ChildProfile) => void;
  isBlocked: () => boolean;
}

export type ScreenTimeStore = ScreenTimeState & ScreenTimeActions;

export const useScreenTimeStore = create<ScreenTimeStore>((set, get) => ({
  activeSession: null,
  todayMinutesUsed: 0,
  limitMinutes: 30,
  isTimeUp: false,

  startSession: (childId) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    set({
      activeSession: {
        id: `session-${childId}-${now.getTime()}`,
        childId,
        date: dateStr,
        minutesUsed: 0,
        startedAt: now,
        endedAt: null,
      },
    });
  },

  endSession: () => set({ activeSession: null }),

  tickMinute: () => {
    const { todayMinutesUsed, limitMinutes } = get();
    const newMinutes = todayMinutesUsed + 1;
    set({
      todayMinutesUsed: newMinutes,
      isTimeUp: newMinutes >= limitMinutes,
    });
  },

  setLimit: (minutes) =>
    set({ limitMinutes: minutes }),

  loadTodayUsage: (minutes) =>
    set({
      todayMinutesUsed: minutes,
      isTimeUp: minutes >= get().limitMinutes,
    }),

  resetForNewChild: (profile) =>
    set({
      activeSession: null,
      todayMinutesUsed: 0,
      limitMinutes: profile.screenTimeLimitMinutes,
      isTimeUp: false,
    }),

  isBlocked: () => get().isTimeUp,
}));
