import { nameKey } from './text';
import type { SyncedRecord } from './synced-record';

export type ItemOrigin = 'setup' | 'manual' | 'voice' | 'batch' | 'receipt';

/** Something the owner buys, at a generic level ("leite"). The catalog is the set of items. */
export interface Item extends SyncedRecord {
  readonly name: string;
  /** The item's first context (`contextIds[0]`); null means "Sem contexto". */
  readonly defaultContextId: string | null;
  /**
   * Every context the item belongs to, its default first. Optional: items saved before an item
   * could have several contexts have only `defaultContextId` (docs/ARQUITETURA.md "Migrações").
   */
  readonly contextIds?: readonly string[];
  /** One of the app's categories, or null ("Outros" in shopping mode). The same in every context. */
  readonly category: string | null;
  readonly createdVia: ItemOrigin;
}

/**
 * The item's contexts, its default first; empty is "Sem contexto". When `defaultContextId` does
 * not match `contextIds` (changed by a device on an older version), `defaultContextId` wins.
 */
export function itemContextIds(item: Pick<Item, 'defaultContextId' | 'contextIds'>): readonly string[] {
  if (item.contextIds && (item.contextIds[0] ?? null) === item.defaultContextId) return item.contextIds;
  return item.defaultContextId === null ? [] : [item.defaultContextId];
}

/** The fields that give an item these contexts; both are kept so older versions still read it. */
export function withContexts(contextIds: readonly (string | null)[]): Pick<Item, 'defaultContextId' | 'contextIds'> {
  const ids = [...new Set(contextIds.filter((id): id is string => id !== null))];
  return { defaultContextId: ids[0] ?? null, contextIds: ids };
}

/** The catalog item with this name, ignoring case and accents. */
export function findItemByName(items: readonly Item[], name: string): Item | undefined {
  const key = nameKey(name);
  return items.find((item) => item.deletedAt === null && nameKey(item.name) === key);
}
