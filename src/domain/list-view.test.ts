import { describe, expect, it } from 'vitest';
import type { Context } from './context';
import type { Item } from './item';
import type { ListEntry } from './list-entry';
import { activeContexts, destinationFor, groupByCategory, itemsById, itemsWithoutContext, listEntries, listsByMissing, missingCount, pendingEntryOf, searchCatalog, type Snapshot } from './list-view';

const base = { updatedAt: 1, updatedBy: 'd', deletedAt: null };
const context = (id: string, changes: Partial<Context> = {}): Context => ({
  ...base,
  id,
  name: id,
  icon: null,
  order: 0,
  active: true,
  groupByCategory: false,
  categoryOrder: [],
  ...changes,
});
const item = (id: string, defaultContextId: string | null, category: string | null = null): Item => ({
  ...base,
  id,
  name: id,
  defaultContextId,
  category,
  createdVia: 'manual',
});
const entry = (id: string, itemId: string, contextId: string | null, changes: Partial<ListEntry> = {}): ListEntry => ({
  ...base,
  id,
  itemId,
  contextId,
  quantity: null,
  note: null,
  status: 'pending',
  addedAt: Number(id.replace(/\D/g, '')) || 0,
  boughtAt: null,
  ...changes,
});

const snapshot: Snapshot = {
  contexts: [context('farmacia', { order: 1 }), context('mercado', { order: 0 }), context('velho', { active: false })],
  items: [item('leite', 'mercado', 'laticinios'), item('detergente', 'mercado', 'limpeza'), item('pilha', null), item('bala', 'velho')],
  entries: [
    entry('e1', 'leite', 'mercado', { checkedAt: 5 }),
    entry('e2', 'detergente', 'mercado'),
    entry('e3', 'pilha', null),
    entry('e4', 'bala', 'velho'),
    entry('e5', 'leite', 'mercado', { status: 'bought' }),
  ],
};

describe('list views', () => {
  it('orders the active contexts as tabs', () => {
    expect(activeContexts(snapshot.contexts).map((c) => c.id)).toEqual(['mercado', 'farmacia']);
  });

  it('lists the pending entries, struck last, and counts only what is missing', () => {
    expect(listEntries(snapshot, 'mercado').map((e) => e.id)).toEqual(['e2', 'e1']);
    expect(missingCount(snapshot, 'mercado')).toBe(1);
  });

  it('puts the lists with missing items first, then the empty ones', () => {
    expect(listsByMissing(snapshot)).toEqual([
      { contextId: 'mercado', missing: 1 },
      { contextId: null, missing: 2 },
      { contextId: 'farmacia', missing: 0 },
    ]);
  });

  it('a deactivated context falls into "Sem contexto", so nothing disappears', () => {
    expect(listEntries(snapshot, null).map((e) => e.id)).toEqual(['e3', 'e4']);
    expect(itemsWithoutContext(snapshot).map((i) => i.id)).toEqual(['bala', 'pilha']);
  });

  it('groups by the context categories, in their order, with the others in "Outros" last', () => {
    const items = itemsById([...snapshot.items, item('x', 'mercado', 'inventada'), item('y', 'mercado', 'propria:Festa')]);
    const entries = [...listEntries(snapshot, 'mercado'), entry('e9', 'x', 'mercado'), entry('e10', 'y', 'mercado')];
    expect(groupByCategory(entries, items, ['propria:Festa', 'limpeza', 'laticinios']).map((g) => [g.name, g.missing])).toEqual([
      ['Festa', 1],
      ['Limpeza', 1],
      ['Laticínios', 0],
      ['Outros', 1],
    ]);
    // A category the context does not have goes to "Outros".
    expect(groupByCategory(entries, items, ['limpeza']).map((g) => g.name)).toEqual(['Limpeza', 'Outros']);
  });

  it('chooses the context: the catalog first, then the setup suggestions, else none', () => {
    expect(destinationFor(snapshot, 'Leite').contextId).toBe('mercado');
    expect(destinationFor(snapshot, 'dipirona')).toMatchObject({ contextId: 'farmacia', category: 'saude' });
    // Pet shop was not chosen: the suggestion keeps its category, but there is no list for it.
    expect(destinationFor(snapshot, 'ração')).toMatchObject({ contextId: null, category: 'pet' });
    expect(destinationFor(snapshot, 'fita dupla-face')).toMatchObject({ item: undefined, contextId: null, category: null });
  });

  it('searches the catalog of every context, and finds the pending entry of an item', () => {
    expect(searchCatalog(snapshot.items, 'L').map((i) => i.id)).toEqual(['bala', 'leite', 'pilha']);
    expect(searchCatalog(snapshot.items, '  ')).toEqual([]);
    expect(pendingEntryOf(snapshot, 'leite')?.id).toBe('e1');
    expect(pendingEntryOf(snapshot, 'nada')).toBeUndefined();
  });
});
