import { describe, expect, it } from 'vitest';
import { Lists } from '../src/application/lists';
import type { SyncApi } from '../src/application/ports';
import { Synchronizer } from '../src/application/synchronizer';
import type { Item } from '../src/domain/item';
import type { Change } from '../src/domain/tables';
import { MemoryStore } from '../src/infrastructure/memory-store';
import { parseSyncResponse } from '../src/infrastructure/http-sync-api';
import type { Env } from './d1';
import { sqliteD1 } from './sqlite-d1.test-support';
import { handleSync, MAX_CHANGES, PULL_PAGE } from './sync-handler';

const OWNER = 'dona@example.com';

function call(env: Env, body: unknown, email: string | null = OWNER) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (email) headers.set('Cf-Access-Authenticated-User-Email', email);
  return handleSync(new Request('https://app.test/api/sync', { method: 'POST', headers, body: JSON.stringify(body) }), env);
}

const item = (id: string, updatedAt: number, name: string, updatedBy = 'phone'): { table: 'items'; record: Item } => ({
  table: 'items',
  record: { id, updatedAt, updatedBy, deletedAt: null, name, defaultContextId: null, category: null, createdVia: 'manual' },
});

describe('/api/sync', () => {
  it('only answers to the owner', async () => {
    const env = { DB: sqliteD1(), OWNER_EMAIL: OWNER };
    expect((await call(env, { cursor: 0, changes: [] }, null)).status).toBe(403);
    expect((await call(env, { cursor: 0, changes: [] }, 'outra@example.com')).status).toBe(403);
    expect((await call({ ...env, OWNER_EMAIL: '' }, { cursor: 0, changes: [] }, '')).status).toBe(403);
    expect((await call(env, { cursor: 0, changes: [] }, 'Dona@Example.com')).status).toBe(200);
  });

  it('rejects malformed requests', async () => {
    const env = { DB: sqliteD1(), OWNER_EMAIL: OWNER };
    const bad = [
      {},
      { cursor: -1, changes: [] },
      { cursor: 0, changes: [{ table: 'users', record: item('1', 1, 'x').record }] },
      { cursor: 0, changes: [{ table: 'items', record: { id: '', updatedAt: 1, updatedBy: 'p', deletedAt: null } }] },
      { cursor: 0, changes: [{ table: 'items', record: { id: '1', updatedAt: 1.5, updatedBy: 'p', deletedAt: null } }] },
      { cursor: 0, changes: Array.from({ length: MAX_CHANGES + 1 }, (_, i) => item(String(i), 1, 'x')) },
    ];
    for (const body of bad) expect((await call(env, body)).status).toBe(400);
  });

  it('keeps the version with the larger updatedAt and pulls by sequence', async () => {
    const env = { DB: sqliteD1(), OWNER_EMAIL: OWNER };
    await call(env, { cursor: 0, changes: [item('a', 10, 'leite'), item('b', 10, 'ovos')] });
    // An older version of "a" loses; a newer version of "b" wins and moves to the end.
    const body = await (await call(env, { cursor: 0, changes: [item('a', 5, 'velho'), item('b', 20, 'ovos caipira')] })).json();
    expect(body.changes.map((c: Change) => c.record)).toMatchObject([{ id: 'a', name: 'leite' }, { id: 'b', name: 'ovos caipira' }]);
    expect(body.more).toBe(false);

    const after = await (await call(env, { cursor: body.cursor, changes: [] })).json();
    expect(after).toEqual({ changes: [], cursor: body.cursor, more: false });
  });

  it('pulls in pages', async () => {
    const env = { DB: sqliteD1(), OWNER_EMAIL: OWNER };
    const changes = Array.from({ length: PULL_PAGE + 1 }, (_, i) => item(`i${i}`, 1, 'x'));
    await call(env, { cursor: 0, changes: changes.slice(0, MAX_CHANGES) });
    await call(env, { cursor: 0, changes: changes.slice(MAX_CHANGES) });
    const first = await (await call(env, { cursor: 0, changes: [] })).json();
    expect(first.changes).toHaveLength(PULL_PAGE);
    expect(first.more).toBe(true);
    const second = await (await call(env, { cursor: first.cursor, changes: [] })).json();
    expect(second.changes).toHaveLength(1);
    expect(second.more).toBe(false);
  });
});

describe('sync between two devices', () => {
  function device(name: string, env: Env, clock: { now: number }) {
    const store = new MemoryStore(name);
    const api: SyncApi = {
      exchange: async (request) => parseSyncResponse(await (await call(env, request)).json()),
    };
    const time = { now: () => clock.now++ };
    let n = 0;
    return {
      store,
      sync: new Synchronizer(store, api, time),
      lists: new Lists(store, time, { newId: () => `${name}-${++n}` }),
    };
  }

  it('brings the changes of one device to the other, deletes included', async () => {
    const env = { DB: sqliteD1(), OWNER_EMAIL: OWNER };
    const clock = { now: 1000 };
    const phone = device('phone', env, clock);
    const desktop = device('desktop', env, clock);

    const entry = (await phone.lists.add('leite'))!;
    await phone.sync.sync();
    expect(phone.sync.getState()).toMatchObject({ status: 'idle', pending: 0 });

    await desktop.sync.sync();
    expect((await desktop.store.list('items')).map((i) => i.name)).toEqual(['leite']);
    expect(await desktop.store.pendingCount()).toBe(0);

    await desktop.lists.remove('listEntries', entry.id);
    await desktop.sync.sync();
    await phone.sync.sync();
    expect(await phone.store.list('listEntries')).toEqual([]);
  });

  it('the last change wins when both devices changed the same record', async () => {
    const env = { DB: sqliteD1(), OWNER_EMAIL: OWNER };
    const clock = { now: 1000 };
    const phone = device('phone', env, clock);
    const desktop = device('desktop', env, clock);

    await phone.store.save('items', item('cafe', 10, 'café').record);
    await phone.sync.sync();
    await desktop.sync.sync();

    // Offline, the phone changes it first and the desktop later; the phone syncs last.
    await phone.store.save('items', item('cafe', 20, 'café do celular').record);
    await desktop.store.save('items', item('cafe', 30, 'café do computador', 'desktop').record);
    await desktop.sync.sync();
    await phone.sync.sync();
    await desktop.sync.sync();

    for (const d of [phone, desktop]) {
      expect((await d.store.get('items', 'cafe'))?.name).toBe('café do computador');
      expect(await d.store.pendingCount()).toBe(0);
    }
  });

  it('a new device downloads everything on its first sync', async () => {
    const env = { DB: sqliteD1(), OWNER_EMAIL: OWNER };
    const clock = { now: 1000 };
    const phone = device('phone', env, clock);
    for (const name of ['arroz', 'feijão', 'café']) await phone.lists.add(name);
    await phone.sync.sync();

    const desktop = device('desktop', env, clock);
    await desktop.sync.sync();
    expect(await desktop.store.list('items')).toHaveLength(3);
    expect(await desktop.store.list('listEntries')).toHaveLength(3);
  });
});
