import { describe, expect, it } from 'vitest';
import { MemoryStore } from '../infrastructure/memory-store';
import type { SyncApi, SyncResponse } from './ports';
import { Synchronizer } from './synchronizer';

const clock = { now: () => 42 };
const answering = (response: SyncResponse): SyncApi => ({ exchange: async () => response });

async function withPendingChange() {
  const store = new MemoryStore('phone');
  await store.save('contexts', {
    id: 'mercado',
    updatedAt: 1,
    updatedBy: 'phone',
    deletedAt: null,
    name: 'Mercado',
    icon: null,
    order: 0,
    active: true,
    groupByCategory: true,
    categoryOrder: [],
  });
  return store;
}

describe('Synchronizer', () => {
  it.each(['offline', 'signed-out', 'error'] as const)('keeps the changes pending when %s', async (kind) => {
    const store = await withPendingChange();
    const sync = new Synchronizer(store, answering({ kind }), clock);
    await sync.sync();
    expect(sync.getState()).toEqual({ status: kind, pending: 1, lastSyncedAt: null });
  });

  it('marks the changes as pushed and moves the cursor', async () => {
    const store = await withPendingChange();
    const sync = new Synchronizer(store, answering({ kind: 'ok', changes: [], cursor: 7, more: false }), clock);
    await sync.sync();
    expect(sync.getState()).toEqual({ status: 'idle', pending: 0, lastSyncedAt: 42 });
    expect(await store.cursor()).toBe(7);
  });

  it('keeps a change made while the request was on its way', async () => {
    const store = await withPendingChange();
    const api: SyncApi = {
      exchange: async () => {
        const context = (await store.get('contexts', 'mercado'))!;
        await store.save('contexts', { ...context, name: 'Supermercado', updatedAt: 2 });
        return { kind: 'ok', changes: [], cursor: 1, more: false };
      },
    };
    const sync = new Synchronizer(store, api, clock);
    await sync.sync();
    expect(await store.pendingCount()).toBe(1);
  });

  it('reports an error when the request throws', async () => {
    const store = await withPendingChange();
    const sync = new Synchronizer(store, { exchange: () => Promise.reject(new Error('boom')) }, clock);
    await sync.sync();
    expect(sync.getState().status).toBe('error');
  });

  it('skips tables this version does not know', async () => {
    const store = new MemoryStore();
    const unknown = { table: 'purchases', record: { id: 'p', updatedAt: 1, updatedBy: 'x', deletedAt: null } };
    const sync = new Synchronizer(
      store,
      answering({ kind: 'ok', changes: [unknown as never], cursor: 1, more: false }),
      clock,
    );
    await sync.sync();
    expect(sync.getState().status).toBe('idle');
  });
});
