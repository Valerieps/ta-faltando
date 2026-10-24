import { itemContextIds, type Item } from './item';
import type { SyncedRecord } from './synced-record';

export type EntryStatus = 'pending' | 'bought';

/**
 * An item on the lists. Added through one of the item's contexts, it shows on the lists of all of
 * them; its context may also be another one, "só daquela vez", and then it shows only there.
 */
export interface ListEntry extends SyncedRecord {
  readonly itemId: string;
  /** null means the "Sem contexto" list. */
  readonly contextId: string | null;
  readonly quantity: number | null;
  readonly note: string | null;
  readonly status: EntryStatus;
  readonly addedAt: number;
  readonly boughtAt: number | null;
  /**
   * When it was struck ("riscado") in shopping mode or on the desktop lists; it leaves the list when
   * the purchase is finished. Optional: entries saved before this field existed have none.
   */
  readonly checkedAt?: number | null;
}

export const isChecked = (entry: ListEntry) => entry.checkedAt != null;

/** The contexts whose lists show this entry, active or not; empty is "Sem contexto". */
export function entryContextIds(entry: ListEntry, item: Pick<Item, 'defaultContextId' | 'contextIds'> | undefined): readonly string[] {
  if (entry.contextId === null) return [];
  const linked = item ? itemContextIds(item) : [];
  return linked.includes(entry.contextId) ? linked : [entry.contextId];
}

/** An item is pending at most once on the list of a context (docs/ARQUITETURA.md). */
export function pendingEntryFor(entries: readonly ListEntry[], item: Item, contextId: string | null): ListEntry | undefined {
  return entries.find(
    (entry) =>
      entry.deletedAt === null &&
      entry.status === 'pending' &&
      entry.itemId === item.id &&
      (contextId === null ? entry.contextId === null : entryContextIds(entry, item).includes(contextId)),
  );
}
