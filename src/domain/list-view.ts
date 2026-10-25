import type { Context } from './context';
import type { Item } from './item';
import { entryContextIds, isChecked, type ListEntry } from './list-entry';
import { categoryName, findSuggestion } from './suggestion';
import { findItemByName, itemContextIds } from './item';
import { nameKey } from './text';

/** Everything the screens show: the live records of each table. */
export interface Snapshot {
  readonly contexts: readonly Context[];
  readonly items: readonly Item[];
  readonly entries: readonly ListEntry[];
}

export const EMPTY_SNAPSHOT: Snapshot = { contexts: [], items: [], entries: [] };

/** The contexts with a list, in tab order. */
export function activeContexts(contexts: readonly Context[]): Context[] {
  return contexts
    .filter((c) => c.deletedAt === null && c.active)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

/**
 * The pending entries of a list (null = "Sem contexto"). An entry shows on the list of each of
 * its contexts; one whose contexts were all deactivated or deleted falls into "Sem contexto", so
 * it never disappears.
 */
export function listEntries(snapshot: Snapshot, contextId: string | null): ListEntry[] {
  const active = new Set(activeContexts(snapshot.contexts).map((c) => c.id));
  const items = itemsById(snapshot.items);
  return snapshot.entries
    .filter((e) => e.deletedAt === null && e.status === 'pending')
    .filter((e) => {
      const shown = entryContextIds(e, items.get(e.itemId)).filter((id) => active.has(id));
      return contextId === null ? shown.length === 0 : shown.includes(contextId);
    })
    .sort((a, b) => Number(isChecked(a)) - Number(isChecked(b)) || a.addedAt - b.addedAt);
}

/** What is still missing on a list: pending entries not struck yet. */
export const missingCount = (snapshot: Snapshot, contextId: string | null) =>
  listEntries(snapshot, contextId).filter((e) => !isChecked(e)).length;

/** Missing items on every list, for the "Listas" button: an item on several lists counts once. */
export const totalMissing = (snapshot: Snapshot) =>
  new Set(snapshot.entries.filter((e) => e.deletedAt === null && e.status === 'pending' && !isChecked(e)).map((e) => e.itemId)).size;

/**
 * Every list (the active contexts, then "Sem contexto") with its missing count: those with
 * missing items first, then the empty ones, each part in the tabs' order.
 */
export function listsByMissing(snapshot: Snapshot): { contextId: string | null; missing: number }[] {
  const lists = [...activeContexts(snapshot.contexts).map((c) => c.id), null].map((contextId) => ({ contextId, missing: missingCount(snapshot, contextId) }));
  return [...lists.filter((l) => l.missing > 0), ...lists.filter((l) => l.missing === 0)];
}

/** The sections of "Todas as listas": every list as in the menu, "Sem contexto" only when it has items. */
export function allLists(snapshot: Snapshot): { contextId: string | null; missing: number }[] {
  return listsByMissing(snapshot).filter((l) => l.contextId !== null || listEntries(snapshot, null).length > 0);
}

export function itemsById(items: readonly Item[]): Map<string, Item> {
  return new Map(items.map((item) => [item.id, item]));
}

/** The catalog of a context (null = the items with no context): its live items, by name. */
export function catalogOf(items: readonly Item[], contextId: string | null): Item[] {
  return items
    .filter((i) => i.deletedAt === null && (contextId === null ? itemContextIds(i).length === 0 : itemContextIds(i).includes(contextId)))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/** The catalog search: items of every context whose name contains the query, accents ignored. */
export function searchCatalog(items: readonly Item[], query: string): Item[] {
  const key = nameKey(query);
  if (!key) return [];
  return items
    .filter((i) => i.deletedAt === null && nameKey(i.name).includes(key))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/** The item's pending entry, on whichever list it shows. */
export const pendingEntryOf = (snapshot: Snapshot, itemId: string) =>
  snapshot.entries.find((e) => e.deletedAt === null && e.status === 'pending' && e.itemId === itemId);

/** Items with no active context, the "Sem contexto" tab (spec/itens-e-contextos.md). */
export const itemsWithoutContext = (snapshot: Snapshot) => {
  const active = new Set(activeContexts(snapshot.contexts).map((c) => c.id));
  return snapshot.items
    .filter((i) => i.deletedAt === null && !itemContextIds(i).some((id) => active.has(id)))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
};

export interface CategoryGroup {
  /** null is "Outros". */
  readonly categoryId: string | null;
  readonly name: string;
  readonly entries: readonly ListEntry[];
  /** Entries in the group not struck yet. */
  readonly missing: number;
}

/**
 * A list grouped by the context's categories, in their order, with "Outros" last for an item
 * whose category the context does not have; inside each group the struck entries go last
 * (spec/modo-compra.md).
 */
export function groupByCategory(entries: readonly ListEntry[], items: ReadonlyMap<string, Item>, categories: readonly string[]): CategoryGroup[] {
  const groups = new Map<string | null, ListEntry[]>();
  for (const entry of entries) {
    const category = items.get(entry.itemId)?.category ?? null;
    const id = category !== null && categories.includes(category) ? category : null;
    groups.set(id, [...(groups.get(id) ?? []), entry]);
  }
  return [...categories, null]
    .filter((id) => groups.has(id))
    .map((id) => {
      const list = [...groups.get(id)!].sort((a, b) => Number(isChecked(a)) - Number(isChecked(b)));
      return { categoryId: id, name: categoryName(id), entries: list, missing: list.filter((e) => !isChecked(e)).length };
    });
}

/** Where a typed item goes, and with which category (spec/itens-e-contextos.md, "Como o app escolhe"). */
export interface Destination {
  /** The catalog item, when the name is already in it. */
  readonly item: Item | undefined;
  /** The item's first active context; null is "Sem contexto". */
  readonly contextId: string | null;
  readonly category: string | null;
}

/**
 * `openContextId`, given on the phone's catalog, is the context open there: a name not yet in the
 * catalog goes to it, ahead of its setup suggestion.
 */
export function destinationFor(snapshot: Snapshot, name: string, openContextId?: string | null): Destination {
  const active = new Set(activeContexts(snapshot.contexts).map((c) => c.id));
  const item = findItemByName(snapshot.items, name);
  if (item) {
    const contextId = itemContextIds(item).find((id) => active.has(id)) ?? null;
    return { item, contextId, category: item.category };
  }
  const suggestion = findSuggestion(name);
  if (openContextId !== undefined) return { item: undefined, contextId: openContextId, category: suggestion?.category ?? null };
  if (suggestion) {
    return { item: undefined, contextId: active.has(suggestion.contextId) ? suggestion.contextId : null, category: suggestion.category };
  }
  return { item: undefined, contextId: null, category: null };
}

export const contextName = (snapshot: Snapshot, contextId: string | null): string =>
  contextId === null ? 'Sem contexto' : (snapshot.contexts.find((c) => c.id === contextId)?.name ?? 'Sem contexto');
