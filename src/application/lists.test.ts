import { describe, expect, it } from 'vitest';
import { MemoryStore } from '../infrastructure/memory-store';
import { Lists } from './lists';

function setup() {
  const store = new MemoryStore('phone');
  let n = 0;
  let now = 100;
  const lists = new Lists(store, { now: () => now++ }, { newId: () => `id-${++n}` });
  return { store, lists };
}

describe('Lists', () => {
  it('puts a new item in the catalog and on the "Sem contexto" list', async () => {
    const { store, lists } = setup();
    const entry = await lists.add('  Leite  ');
    const [item] = await store.list('items');
    expect(item).toMatchObject({ name: 'Leite', defaultContextId: null, createdVia: 'manual', updatedBy: 'phone' });
    expect(entry).toMatchObject({ itemId: item.id, contextId: null, status: 'pending' });
    expect(await store.pendingCount()).toBe(2);
  });

  it('uses the default context of an item already in the catalog', async () => {
    const { store, lists } = setup();
    await store.save('items', {
      id: 'leite',
      updatedAt: 1,
      updatedBy: 'phone',
      deletedAt: null,
      name: 'Leite',
      defaultContextId: 'mercado',
      category: 'laticínios',
      createdVia: 'setup',
    });
    expect(await lists.add('leite')).toMatchObject({ itemId: 'leite', contextId: 'mercado' });
    expect(await store.list('items')).toHaveLength(1);
  });

  it('does not put the same item on a list twice', async () => {
    const { store, lists } = setup();
    const first = await lists.add('ovos');
    expect(await lists.add('Ovos')).toEqual(first);
    expect(await store.list('listEntries')).toHaveLength(1);
  });

  it('ignores an empty name', async () => {
    expect(await setup().lists.add('   ')).toBeNull();
  });

  it('deletes with a tombstone that stays pending until it syncs', async () => {
    const { store, lists } = setup();
    const entry = (await lists.add('pão'))!;
    await lists.remove('listEntries', entry.id);
    expect(await store.list('listEntries')).toEqual([]);
    expect((await store.get('listEntries', entry.id))?.deletedAt).not.toBeNull();
    const pending = await store.pendingChanges(10);
    expect(pending.find((c) => c.record.id === entry.id)?.record.deletedAt).not.toBeNull();
  });
});
