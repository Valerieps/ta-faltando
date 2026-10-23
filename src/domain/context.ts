import type { SyncedRecord } from './synced-record';

/** A place where the owner shops (Mercado, Farmácia…); each context has its own list. */
export interface Context extends SyncedRecord {
  readonly name: string;
  readonly icon: string | null;
  /** Position among the tabs, ascending. */
  readonly order: number;
  readonly active: boolean;
  /** Shopping mode groups the list by category (spec/modo-compra.md). */
  readonly groupByCategory: boolean;
  /** Category ids in the order of the store's aisles. */
  readonly categoryOrder: readonly string[];
}
