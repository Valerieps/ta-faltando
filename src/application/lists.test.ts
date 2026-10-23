import { describe, expect, it } from 'vitest';
import { MemoryStore } from '../infrastructure/memory-store';
import type { Context } from '../domain/context';
import { Lists } from './lists';

const context = (id: string, changes: Partial<Context> = {}): Context => ({
  id,
  updatedAt: 1,
  updatedBy: 'phone',
  deletedAt: null,
  name: id.charAt(0).toUpperCase() + id.slice(1),
  icon: null,
  order: 0,
  active: true,
  groupByCategory: false,
  categoryOrder: [],
  ...changes,
});

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
    const entry = (await lists.add('  leite  '))?.entry;
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
    await store.save('contexts', context('mercado'));
    expect((await lists.add('leite'))?.entry).toMatchObject({ itemId: 'leite', contextId: 'mercado' });
    expect(await store.list('items')).toHaveLength(1);
  });

  it('a context picked in the batch check becomes the default context, new item or not', async () => {
    const { store, lists } = setup();
    await store.save('contexts', context('mercado'));
    await store.save('contexts', context('pet'));
    await store.save('items', {
      id: 'leite',
      updatedAt: 1,
      updatedBy: 'phone',
      deletedAt: null,
      name: 'Leite',
      defaultContextId: 'mercado',
      category: null,
      createdVia: 'setup',
    });
    const results = await lists.addMany(
      [
        { name: 'Areia de gato', quantity: null, note: null },
        { name: 'Leite', quantity: null, note: null },
        { name: 'Pão', quantity: null, note: null },
      ],
      'batch',
      ['pet', null],
    );
    expect(results.map((r) => [r.item.name, r.entry.contextId, r.item.defaultContextId])).toEqual([
      ['Areia de gato', 'pet', 'pet'],
      ['Leite', null, null],
      ['Pão', null, null],
    ]);
    expect((await store.get('items', 'leite'))?.defaultContextId).toBeNull();
  });

  it('does not put the same item on a list twice', async () => {
    const { store, lists } = setup();
    const first = await lists.add('ovos');
    expect(await lists.add('Ovos')).toEqual({ ...first, outcome: 'already' });
    expect(await store.list('listEntries')).toHaveLength(1);
  });

  it('ignores an empty name', async () => {
    expect(await setup().lists.add('   ')).toBeNull();
  });

  it('deletes with a tombstone that stays pending until it syncs', async () => {
    const { store, lists } = setup();
    const { entry } = (await lists.add('pão'))!;
    await lists.remove('listEntries', entry.id);
    expect(await store.list('listEntries')).toEqual([]);
    expect((await store.get('listEntries', entry.id))?.deletedAt).not.toBeNull();
    const pending = await store.pendingChanges(10);
    expect(pending.find((c) => c.record.id === entry.id)?.record.deletedAt).not.toBeNull();
  });

  it('sends a new item from the setup queues to the context of its suggestion, with its category', async () => {
    const { store, lists } = setup();
    await store.save('contexts', context('farmacia'));
    const result = await lists.add('Shampoo');
    expect(result?.entry.contextId).toBe('farmacia');
    expect(result?.item).toMatchObject({ name: 'Shampoo', defaultContextId: 'farmacia', category: 'higiene' });
  });

  it('reads the quantity and the note from the text', async () => {
    const { lists } = setup();
    expect((await lists.add('2 leite: sem lactose'))?.entry).toMatchObject({ quantity: 2, note: 'sem lactose' });
  });

  it('keeps an item already on the list, or takes the new quantity typed with it', async () => {
    const { lists } = setup();
    await lists.add('café');
    expect((await lists.add('cafe'))?.outcome).toBe('already');
    const updated = await lists.add('3 café');
    expect(updated).toMatchObject({ outcome: 'updated', entry: { quantity: 3 } });
  });

  it('strikes, buys and restores an entry', async () => {
    const { store, lists } = setup();
    const { entry } = (await lists.add('ovos'))!;
    await lists.setChecked(entry.id, true);
    const struck = (await store.get('listEntries', entry.id))!;
    expect(struck.checkedAt).not.toBeNull();
    await lists.markBought(entry.id);
    expect(await store.get('listEntries', entry.id)).toMatchObject({ status: 'bought' });
    await lists.restoreEntry(struck);
    expect(await store.get('listEntries', entry.id)).toMatchObject({ status: 'pending', boughtAt: null, checkedAt: struck.checkedAt });
  });

  it('brings back an entry taken off by the trash', async () => {
    const { store, lists } = setup();
    const { entry } = (await lists.add('ovos'))!;
    await lists.removeEntry(entry.id);
    expect(await store.list('listEntries')).toEqual([]);
    await lists.restoreEntry(entry);
    expect(await store.list('listEntries')).toHaveLength(1);
  });

  it('finishing the purchase takes only the struck entries off the list', async () => {
    const { store, lists } = setup();
    await store.save('contexts', context('mercado'));
    const leite = (await lists.add('leite'))!.entry;
    const arroz = (await lists.add('arroz'))!.entry;
    const pilha = (await lists.add('pilha'))!.entry;
    await lists.setChecked(leite.id, true);
    await lists.setChecked(pilha.id, true);
    expect(await lists.finishPurchase(['mercado', null])).toBe(2);
    expect(await store.get('listEntries', leite.id)).toMatchObject({ status: 'bought' });
    expect(await store.get('listEntries', pilha.id)).toMatchObject({ status: 'bought' });
    expect(await store.get('listEntries', arroz.id)).toMatchObject({ status: 'pending' });
  });

  it('moves an entry just this once or as the new default', async () => {
    const { store, lists } = setup();
    await store.save('contexts', context('mercado'));
    await store.save('contexts', context('farmacia'));
    const { entry, item } = (await lists.add('shampoo'))!;
    await lists.moveEntry(entry.id, 'mercado', false);
    expect(await store.get('listEntries', entry.id)).toMatchObject({ contextId: 'mercado' });
    expect((await store.get('items', item.id))?.defaultContextId).toBe('farmacia');
    await lists.moveEntry(entry.id, 'mercado', true);
    expect((await store.get('items', item.id))?.defaultContextId).toBe('mercado');
  });

  it('moving onto a list where the item is already pending leaves one entry', async () => {
    const { store, lists } = setup();
    await store.save('contexts', context('mercado'));
    const first = (await lists.add('leite'))!;
    await lists.moveEntry(first.entry.id, null, false);
    await lists.add('leite');
    const pending = await store.list('listEntries');
    expect(pending).toHaveLength(2);
    await lists.moveEntry(first.entry.id, 'mercado', false);
    expect(await store.list('listEntries')).toHaveLength(1);
  });

  it('links items without context and moves them to the list of the context', async () => {
    const { store, lists } = setup();
    await store.save('contexts', context('lojas'));
    const { entry, item } = (await lists.add('fita dupla-face'))!;
    expect(entry.contextId).toBeNull();
    await lists.linkItems([item.id], 'lojas');
    expect((await store.get('items', item.id))?.defaultContextId).toBe('lojas');
    expect((await store.get('listEntries', entry.id))?.contextId).toBe('lojas');
  });

  it('adds from the catalog and takes an item out of the catalog and the lists', async () => {
    const { store, lists } = setup();
    const item = (await lists.addToCatalog('pão de queijo', null))!;
    expect(await store.list('listEntries')).toEqual([]);
    expect((await lists.addItem(item.id))?.outcome).toBe('added');
    await lists.removeItem(item.id);
    expect(await store.list('items')).toEqual([]);
    expect(await store.list('listEntries')).toEqual([]);
  });

  it('changing the default context in the catalog moves the pending entry along', async () => {
    const { store, lists } = setup();
    await store.save('contexts', context('mercado'));
    const { entry, item } = (await lists.add('pilha'))!;
    await lists.setDefaultContext(item.id, 'mercado');
    expect((await store.get('listEntries', entry.id))?.contextId).toBe('mercado');
  });
});
