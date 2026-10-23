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
  /**
   * The order dragged before categories belonged to each context; read only while `categories`
   * is absent (docs/ARQUITETURA.md "Migrações").
   */
  readonly categoryOrder: readonly string[];
  /**
   * The context's own categories, in the order of the store's aisles. Absent until she edits
   * them: then they come from its suggestions and items (`contextCategories`).
   */
  readonly categories?: readonly string[];
}
