import type { SyncedRecord } from './synced-record';

export type EntryStatus = 'pending' | 'bought';

/** An item on a context's list. Its context may differ from the item's default, "só daquela vez". */
export interface ListEntry extends SyncedRecord {
  readonly itemId: string;
  /** null means the "Sem contexto" list. */
  readonly contextId: string | null;
  readonly quantity: number | null;
  readonly note: string | null;
  readonly status: EntryStatus;
  readonly addedAt: number;
  readonly boughtAt: number | null;
}

/** An item is pending at most once on the list of a context (docs/ARQUITETURA.md). */
export function pendingEntryFor(
  entries: readonly ListEntry[],
  itemId: string,
  contextId: string | null,
): ListEntry | undefined {
  return entries.find(
    (entry) =>
      entry.deletedAt === null && entry.status === 'pending' && entry.itemId === itemId && entry.contextId === contextId,
  );
}
