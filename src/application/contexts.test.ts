import { describe, expect, it } from 'vitest';
import { MemoryStore } from '../infrastructure/memory-store';
import { Contexts } from './contexts';
import { Lists } from './lists';

function setup() {
  const store = new MemoryStore('phone');
  let n = 0;
  let now = 100;
  const clock = { now: () => now++ };
  const ids = { newId: () => `id-${++n}` };
  return { store, contexts: new Contexts(store, clock, ids), lists: new Lists(store, clock, ids) };
}

describe('Contexts', () => {
  it('the setup creates the suggested contexts under their fixed ids, with the selected items', async () => {
    const { store, contexts } = setup();
    const summary = await contexts.applySetup([
      { suggestedId: 'mercado', name: 'Mercado', selected: [{ name: 'Arroz', category: 'mercearia', fromQueue: true }] },
      { suggestedId: null, name: 'papelaria', selected: [{ name: 'Caneta', category: null, fromQueue: false }] },
    ]);
    expect(summary).toEqual([
      { name: 'Mercado', count: 1 },
      { name: 'Papelaria', count: 1 },
    ]);
    const all = await store.list('contexts');
    expect(all.map((c) => [c.id, c.order])).toEqual([
      ['mercado', 0],
      ['id-2', 1],
    ]);
    expect(await store.list('items')).toEqual([
      expect.objectContaining({ name: 'Arroz', defaultContextId: 'mercado', category: 'mercearia', createdVia: 'setup' }),
      expect.objectContaining({ name: 'Caneta', defaultContextId: 'id-2', createdVia: 'manual' }),
    ]);
  });

  it('redoing the setup keeps the context an item already has', async () => {
    const { store, contexts } = setup();
    await contexts.applySetup([{ suggestedId: 'mercado', name: 'Mercado', selected: [{ name: 'Café', category: 'mercearia', fromQueue: true }] }]);
    const summary = await contexts.applySetup([{ suggestedId: 'padaria', name: 'Padaria', selected: [{ name: 'café', category: null, fromQueue: false }] }]);
    expect(summary).toEqual([{ name: 'Padaria', count: 0 }]);
    expect((await store.list('items')).map((i) => i.defaultContextId)).toEqual(['mercado']);
  });

  it('gives a context to an item that had none', async () => {
    const { store, contexts, lists } = setup();
    await lists.add('pilha');
    await contexts.applySetup([{ suggestedId: 'lojas-online', name: 'Lojas online', selected: [{ name: 'Pilha', category: 'casa', fromQueue: false }] }]);
    expect(await store.list('items')).toEqual([expect.objectContaining({ defaultContextId: 'lojas-online', category: 'casa' })]);
  });

  it('a context with the name of a deactivated one brings it back', async () => {
    const { store, contexts } = setup();
    const created = (await contexts.create('Açougue'))!;
    await contexts.setActive(created.id, false);
    const back = await contexts.create('acougue');
    expect(back?.id).toBe(created.id);
    expect((await store.get('contexts', created.id))?.active).toBe(true);
  });

  it('a suggested context deleted before comes back past its tombstone', async () => {
    const { store, contexts, lists } = setup();
    await contexts.create('Mercado', 'mercado');
    await lists.remove('contexts', 'mercado');
    const tombstone = (await store.get('contexts', 'mercado'))!;
    const back = (await contexts.create('Mercado', 'mercado'))!;
    expect(back.updatedAt).toBeGreaterThan(tombstone.updatedAt);
    expect(back.deletedAt).toBeNull();
  });

  it('moves a context among the tabs and saves the order of the groups', async () => {
    const { store, contexts } = setup();
    await contexts.create('Mercado', 'mercado');
    await contexts.create('Farmácia', 'farmacia');
    await contexts.move('farmacia', -1);
    expect((await store.list('contexts')).sort((a, b) => a.order - b.order).map((c) => c.id)).toEqual(['farmacia', 'mercado']);
    await contexts.setCategoryOrder('mercado', ['limpeza', null, 'hortifruti']);
    expect((await store.get('contexts', 'mercado'))?.categoryOrder).toEqual(['limpeza', 'hortifruti']);
  });
});
