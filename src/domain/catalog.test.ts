import { describe, expect, it } from 'vitest';
import { findItemByName, itemContextIds, withContexts, type Item } from './item';
import { pendingEntryFor, type ListEntry } from './list-entry';
import { created } from './synced-record';
import { cleanName, nameKey } from './text';

const author = { deviceId: 'd', now: 1 };
const item = (id: string, name: string, deletedAt: number | null = null): Item => ({
  ...created(id, author),
  deletedAt,
  name,
  defaultContextId: null,
  category: null,
  createdVia: 'manual',
});
const entry = (id: string, changes: Partial<ListEntry>): ListEntry => ({
  ...created(id, author),
  itemId: 'i1',
  contextId: 'mercado',
  quantity: null,
  note: null,
  status: 'pending',
  addedAt: 1,
  boughtAt: null,
  ...changes,
});

describe('names', () => {
  it('cleans spaces for display', () => {
    expect(cleanName('  pão   de forma ')).toBe('pão de forma');
  });

  it('compares without case or accents', () => {
    expect(nameKey('Água  Sanitária')).toBe(nameKey('agua sanitaria'));
    expect(nameKey('Pão')).not.toBe(nameKey('Pao de queijo'));
  });
});

describe('catalog', () => {
  it('finds an item by name, ignoring accents and deleted items', () => {
    const items = [item('1', 'Café', 5), item('2', 'café')];
    expect(findItemByName(items, 'CAFE')?.id).toBe('2');
    expect(findItemByName([item('1', 'Café', 5)], 'cafe')).toBeUndefined();
  });

  it('finds the pending entry of an item in a context', () => {
    const entries = [
      entry('bought', { status: 'bought' }),
      entry('deleted', { deletedAt: 3 }),
      entry('other context', { contextId: 'farmacia' }),
      entry('pending', {}),
    ];
    expect(pendingEntryFor(entries, item('i1', 'Leite'), 'mercado')?.id).toBe('pending');
    expect(pendingEntryFor(entries, item('i1', 'Leite'), null)).toBeUndefined();
  });

  it('an entry added through one of the item contexts is pending on all of them', () => {
    const shampoo = { ...item('i1', 'Shampoo'), ...withContexts(['farmacia', 'mercado']) };
    expect(pendingEntryFor([entry('e', { contextId: 'farmacia' })], shampoo, 'mercado')?.id).toBe('e');
    // "Só daquela vez" in a context that is not the item's: only there.
    expect(pendingEntryFor([entry('e', { contextId: 'pet' })], shampoo, 'mercado')).toBeUndefined();
  });

  it('reads the contexts of items saved before an item could have several', () => {
    expect(itemContextIds({ defaultContextId: 'mercado' })).toEqual(['mercado']);
    expect(itemContextIds({ defaultContextId: null })).toEqual([]);
    expect(itemContextIds(withContexts(['farmacia', 'mercado', 'farmacia']))).toEqual(['farmacia', 'mercado']);
    // An older version changed only the default: it wins.
    expect(itemContextIds({ defaultContextId: 'pet', contextIds: ['farmacia', 'mercado'] })).toEqual(['pet']);
  });
});
