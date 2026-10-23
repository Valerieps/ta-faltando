import { nameKey } from './text';
import type { SyncedRecord } from './synced-record';

export type ItemOrigin = 'setup' | 'manual' | 'voice' | 'batch' | 'receipt';

/** Something the owner buys, at a generic level ("leite"). The catalog is the set of items. */
export interface Item extends SyncedRecord {
  readonly name: string;
  /** The item's only default context; null means "Sem contexto". */
  readonly defaultContextId: string | null;
  /** One of the app's categories, or null ("Outros" in shopping mode). */
  readonly category: string | null;
  readonly createdVia: ItemOrigin;
}

/** The catalog item with this name, ignoring case and accents. */
export function findItemByName(items: readonly Item[], name: string): Item | undefined {
  const key = nameKey(name);
  return items.find((item) => item.deletedAt === null && nameKey(item.name) === key);
}
