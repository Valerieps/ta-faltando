import { describe, expect, it } from 'vitest';
import { MemoryStore } from '../infrastructure/memory-store';
import { Settings } from './settings';

describe('Settings', () => {
  it('starts with the right hand, records the first use, and keeps what was set', async () => {
    const store = new MemoryStore();
    const settings = new Settings(store, { now: () => 42 });
    await settings.ready;
    expect(settings.getState()).toEqual({ hand: 'right', setupDone: false, lastBackupAt: null, firstUseAt: 42 });

    let calls = 0;
    settings.subscribe(() => calls++);
    await settings.set('hand', 'left');
    expect(calls).toBe(1);

    const again = new Settings(store, { now: () => 99 });
    await again.ready;
    expect(again.getState()).toMatchObject({ hand: 'left', firstUseAt: 42 });
  });
});
