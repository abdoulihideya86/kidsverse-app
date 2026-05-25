import { describe, it, expect, beforeEach } from 'vitest';
import { useScreenTimeStore } from '@/store/screenTimeStore';
import type { ChildProfile } from '@/types';

const mockProfile: ChildProfile = {
  id: 'child-1',
  parentId: 'parent-1',
  name: 'Test Child',
  age: 5,
  avatar: 'cat',
  screenTimeLimitMinutes: 60,
  contentFilters: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('screenTimeStore', () => {
  beforeEach(() => {
    useScreenTimeStore.setState({
      activeSession: null,
      todayMinutesUsed: 0,
      limitMinutes: 30,
      isTimeUp: false,
    });
  });

  it('has correct initial state', () => {
    const state = useScreenTimeStore.getState();
    expect(state.activeSession).toBeNull();
    expect(state.todayMinutesUsed).toBe(0);
    expect(state.limitMinutes).toBe(30);
    expect(state.isTimeUp).toBe(false);
  });

  it('startSession creates an active session with childId', () => {
    useScreenTimeStore.getState().startSession('child-1');
    const state = useScreenTimeStore.getState();
    expect(state.activeSession).not.toBeNull();
    expect(state.activeSession?.childId).toBe('child-1');
    expect(state.activeSession?.date).toBeTruthy();
    expect(state.activeSession?.startedAt).toBeInstanceOf(Date);
    expect(state.activeSession?.endedAt).toBeNull();
  });

  it('endSession clears the active session', () => {
    useScreenTimeStore.getState().startSession('child-1');
    useScreenTimeStore.getState().endSession();
    expect(useScreenTimeStore.getState().activeSession).toBeNull();
  });

  it('tickMinute increments todayMinutesUsed by 1', () => {
    useScreenTimeStore.getState().tickMinute();
    expect(useScreenTimeStore.getState().todayMinutesUsed).toBe(1);
    useScreenTimeStore.getState().tickMinute();
    expect(useScreenTimeStore.getState().todayMinutesUsed).toBe(2);
  });

  it('tickMinute sets isTimeUp when minutes exceed limit', () => {
    useScreenTimeStore.getState().setLimit(3);
    useScreenTimeStore.getState().tickMinute(); // 1
    useScreenTimeStore.getState().tickMinute(); // 2
    useScreenTimeStore.getState().tickMinute(); // 3 = limit
    expect(useScreenTimeStore.getState().isTimeUp).toBe(true);
  });

  it('tickMinute does not set isTimeUp when under limit', () => {
    useScreenTimeStore.getState().setLimit(10);
    useScreenTimeStore.getState().tickMinute();
    useScreenTimeStore.getState().tickMinute();
    expect(useScreenTimeStore.getState().isTimeUp).toBe(false);
  });

  it('setLimit updates limitMinutes', () => {
    useScreenTimeStore.getState().setLimit(120);
    expect(useScreenTimeStore.getState().limitMinutes).toBe(120);
  });

  it('loadTodayUsage sets todayMinutesUsed and checks isTimeUp', () => {
    useScreenTimeStore.getState().setLimit(60);
    useScreenTimeStore.getState().loadTodayUsage(55);
    expect(useScreenTimeStore.getState().todayMinutesUsed).toBe(55);
    expect(useScreenTimeStore.getState().isTimeUp).toBe(false);
  });

  it('loadTodayUsage sets isTimeUp when at or above limit', () => {
    useScreenTimeStore.getState().setLimit(60);
    useScreenTimeStore.getState().loadTodayUsage(60);
    expect(useScreenTimeStore.getState().isTimeUp).toBe(true);
    useScreenTimeStore.getState().loadTodayUsage(90);
    expect(useScreenTimeStore.getState().isTimeUp).toBe(true);
  });

  it('resetForNewChild clears session and sets limit from profile', () => {
    useScreenTimeStore.getState().startSession('child-1');
    useScreenTimeStore.getState().tickMinute();
    useScreenTimeStore.getState().resetForNewChild(mockProfile);

    const state = useScreenTimeStore.getState();
    expect(state.activeSession).toBeNull();
    expect(state.todayMinutesUsed).toBe(0);
    expect(state.limitMinutes).toBe(60);
    expect(state.isTimeUp).toBe(false);
  });

  it('isBlocked returns true when isTimeUp is true', () => {
    useScreenTimeStore.getState().setLimit(1);
    useScreenTimeStore.getState().tickMinute();
    expect(useScreenTimeStore.getState().isBlocked()).toBe(true);
  });

  it('isBlocked returns false when isTimeUp is false', () => {
    expect(useScreenTimeStore.getState().isBlocked()).toBe(false);
  });
});
