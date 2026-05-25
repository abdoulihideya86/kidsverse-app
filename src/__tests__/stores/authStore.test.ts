import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/authStore';
import type { User, ChildProfile, ParentProfile } from '@/types';

const mockUser: User = {
  uid: 'user-123',
  email: 'parent@test.com',
  displayName: 'Test Parent',
  photoURL: null,
  createdAt: new Date(),
};

const mockParentProfile: ParentProfile = {
  uid: 'user-123',
  email: 'parent@test.com',
  displayName: 'Test Parent',
  photoURL: null,
  childProfileIds: ['child-1'],
  subscription: {
    tier: 'free',
    status: 'active',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockChildProfile: ChildProfile = {
  id: 'child-1',
  parentId: 'user-123',
  name: 'Test Child',
  age: 5,
  avatar: 'cat',
  screenTimeLimitMinutes: 60,
  contentFilters: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      parentProfile: null,
      childProfiles: [],
      activeChildProfile: null,
      isLoading: true,
      isAuthenticated: false,
    });
  });

  it('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.parentProfile).toBeNull();
    expect(state.childProfiles).toEqual([]);
    expect(state.activeChildProfile).toBeNull();
    expect(state.isLoading).toBe(true);
    expect(state.isAuthenticated).toBe(false);
  });

  it('initializeAuth sets user and marks as authenticated', () => {
    useAuthStore.getState().initializeAuth(mockUser);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('setUser with null sets isAuthenticated to false', () => {
    useAuthStore.getState().initializeAuth(mockUser);
    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('setParentProfile sets the parent profile', () => {
    useAuthStore.getState().setParentProfile(mockParentProfile);
    expect(useAuthStore.getState().parentProfile).toEqual(mockParentProfile);
  });

  it('setChildProfiles sets child profiles array', () => {
    useAuthStore.getState().setChildProfiles([mockChildProfile]);
    expect(useAuthStore.getState().childProfiles).toHaveLength(1);
  });

  it('setActiveChildProfile sets the active child', () => {
    useAuthStore.getState().setActiveChildProfile(mockChildProfile);
    expect(useAuthStore.getState().activeChildProfile).toEqual(mockChildProfile);
  });

  it('addChildProfile adds a child to the list', () => {
    useAuthStore.getState().addChildProfile(mockChildProfile);
    expect(useAuthStore.getState().childProfiles).toHaveLength(1);
  });

  it('addChildProfile preserves existing children', () => {
    const secondChild: ChildProfile = { ...mockChildProfile, id: 'child-2', name: 'Second' };
    useAuthStore.getState().addChildProfile(mockChildProfile);
    useAuthStore.getState().addChildProfile(secondChild);
    expect(useAuthStore.getState().childProfiles).toHaveLength(2);
  });

  it('updateChildProfile updates the matching child', () => {
    useAuthStore.getState().addChildProfile(mockChildProfile);
    useAuthStore.getState().updateChildProfile('child-1', { name: 'Updated' });
    expect(useAuthStore.getState().childProfiles[0]?.name).toBe('Updated');
    expect(useAuthStore.getState().childProfiles[0]?.id).toBe('child-1');
  });

  it('updateChildProfile also updates activeChildProfile if matching', () => {
    useAuthStore.getState().setActiveChildProfile(mockChildProfile);
    useAuthStore.getState().updateChildProfile('child-1', { age: 7 });
    expect(useAuthStore.getState().activeChildProfile?.age).toBe(7);
  });

  it('removeChildProfile removes the child from list', () => {
    useAuthStore.getState().addChildProfile(mockChildProfile);
    useAuthStore.getState().removeChildProfile('child-1');
    expect(useAuthStore.getState().childProfiles).toHaveLength(0);
  });

  it('removeChildProfile clears activeChildProfile if matching', () => {
    useAuthStore.getState().setActiveChildProfile(mockChildProfile);
    useAuthStore.getState().removeChildProfile('child-1');
    expect(useAuthStore.getState().activeChildProfile).toBeNull();
  });

  it('setSubscription updates parent profile subscription', () => {
    useAuthStore.getState().setParentProfile(mockParentProfile);
    useAuthStore.getState().setSubscription({
      tier: 'premium',
      status: 'active',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
    expect(useAuthStore.getState().parentProfile?.subscription.tier).toBe('premium');
  });

  it('logout clears all state', () => {
    useAuthStore.getState().initializeAuth(mockUser);
    useAuthStore.getState().setParentProfile(mockParentProfile);
    useAuthStore.getState().setChildProfiles([mockChildProfile]);
    useAuthStore.getState().setActiveChildProfile(mockChildProfile);
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.parentProfile).toBeNull();
    expect(state.childProfiles).toEqual([]);
    expect(state.activeChildProfile).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('setLoading sets the loading flag', () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });
});
