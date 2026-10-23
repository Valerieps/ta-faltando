import { describe, expect, it } from 'vitest';
import type { SyncState } from '../application/synchronizer';
import { welcomeGate } from './welcome-gate';

const state = (status: SyncState['status'], lastSyncedAt: number | null = null): SyncState => ({ status, pending: 0, lastSyncedAt });

describe('welcomeGate', () => {
  it('waits for the first sync', () => {
    expect(welcomeGate(state('idle'), false)).toBe('wait');
    expect(welcomeGate(state('syncing'), false)).toBe('wait');
  });

  it('sends to the login when there is no session', () => {
    expect(welcomeGate(state('signed-out'), false)).toBe('login');
  });

  it('opens after the login even if still signed out, so it never loops', () => {
    expect(welcomeGate(state('signed-out'), true)).toBe('show');
  });

  it('opens once synced, offline or on an error', () => {
    expect(welcomeGate(state('idle', 5), false)).toBe('show');
    expect(welcomeGate(state('offline'), false)).toBe('show');
    expect(welcomeGate(state('error'), false)).toBe('show');
  });
});
