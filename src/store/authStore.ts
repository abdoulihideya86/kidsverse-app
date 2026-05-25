// ──────────────────────────────────────────────
// KidsVerse — Zustand Store: Auth Slice
// ──────────────────────────────────────────────
import { create } from 'zustand';
import type {
  User,
  ParentProfile,
  ChildProfile,
  Subscription,
} from '@/types';

// ── Auth State ──
interface AuthState {
  user: User | null;
  parentProfile: ParentProfile | null;
  childProfiles: ChildProfile[];
  activeChildProfile: ChildProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setParentProfile: (profile: ParentProfile | null) => void;
  setChildProfiles: (profiles: ChildProfile[]) => void;
  setActiveChildProfile: (profile: ChildProfile | null) => void;
  addChildProfile: (profile: ChildProfile) => void;
  updateChildProfile: (id: string, updates: Partial<ChildProfile>) => void;
  removeChildProfile: (id: string) => void;
  setSubscription: (subscription: Subscription) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: (user: User) => void;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  // State
  user: null,
  parentProfile: null,
  childProfiles: [],
  activeChildProfile: null,
  isLoading: true,
  isAuthenticated: false,

  // Actions
  setUser: (user) =>
    set({ user, isAuthenticated: user !== null }),

  setParentProfile: (parentProfile) =>
    set({ parentProfile }),

  setChildProfiles: (childProfiles) =>
    set({ childProfiles }),

  setActiveChildProfile: (activeChildProfile) =>
    set({ activeChildProfile }),

  addChildProfile: (profile) =>
    set((state) => ({
      childProfiles: [...state.childProfiles, profile],
    })),

  updateChildProfile: (id, updates) =>
    set((state) => ({
      childProfiles: state.childProfiles.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      activeChildProfile:
        state.activeChildProfile?.id === id
          ? { ...state.activeChildProfile, ...updates }
          : state.activeChildProfile,
    })),

  removeChildProfile: (id) =>
    set((state) => ({
      childProfiles: state.childProfiles.filter((p) => p.id !== id),
      activeChildProfile:
        state.activeChildProfile?.id === id
          ? null
          : state.activeChildProfile,
    })),

  setSubscription: (subscription) =>
    set((state) => ({
      parentProfile: state.parentProfile
        ? { ...state.parentProfile, subscription }
        : null,
    })),

  logout: () =>
    set({
      user: null,
      parentProfile: null,
      childProfiles: [],
      activeChildProfile: null,
      isAuthenticated: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  initializeAuth: (user) =>
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    }),
}));
