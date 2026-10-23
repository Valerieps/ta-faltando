import type { Context } from './context';
import type { Item } from './item';
import type { ListEntry } from './list-entry';

/** The record types that sync between devices, by table name. Phase 1b adds its tables here. */
export interface SyncedTables {
  contexts: Context;
  items: Item;
  listEntries: ListEntry;
}

export type TableName = keyof SyncedTables;

export const TABLE_NAMES: readonly TableName[] = ['contexts', 'items', 'listEntries'];

export const isTableName = (name: unknown): name is TableName => TABLE_NAMES.includes(name as TableName);

/** One record of one table, as it travels between a device and the server. */
export type Change = { [T in TableName]: { readonly table: T; readonly record: SyncedTables[T] } }[TableName];
