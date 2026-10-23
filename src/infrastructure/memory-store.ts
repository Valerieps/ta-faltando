import type { ChangeOrigin, LocalStore } from '../application/ports';
import { wins } from '../domain/synced-record';
import { TABLE_NAMES, type Change, type SyncedTables, type TableName } from '../domain/tables';

type AnyRecord = SyncedTables[TableName];
const key = (table: TableName, id: string) => `${table}/${id}`;

/** A LocalStore in memory, with the same rules as the IndexedDB one, for the tests. */
export class MemoryStore implements LocalStore {
  private readonly tables = new Map<TableName, Map<string, AnyRecord>>(TABLE_NAMES.map((t) => [t, new Map()]));
  /** Pending changes: the `updatedAt` of the local version the server does not have yet. */
  private readonly pending = new Map<string, { table: TableName; id: string; updatedAt: number }>();
  private readonly listeners = new Set<(origin: ChangeOrigin) => void>();
  private serverCursor = 0;
  private readonly settings = new Map<string, unknown>();

  constructor(private readonly device = 'memory-device') {}

  async deviceId() {
    return this.device;
  }

  async get<T extends TableName>(table: T, id: string) {
    return this.rows(table).get(id) as SyncedTables[T] | undefined;
  }

  async list<T extends TableName>(table: T) {
    return [...this.rows(table).values()].filter((r) => r.deletedAt === null) as SyncedTables[T][];
  }

  async save<T extends TableName>(table: T, record: SyncedTables[T]) {
    this.rows(table).set(record.id, record);
    this.pending.set(key(table, record.id), { table, id: record.id, updatedAt: record.updatedAt });
    this.emit('local');
  }

  async pendingChanges(limit: number) {
    return [...this.pending.values()]
      .slice(0, limit)
      .map(({ table, id }) => ({ table, record: this.rows(table).get(id)! }) as Change);
  }

  async pendingCount() {
    return this.pending.size;
  }

  async markPushed(changes: readonly Change[]) {
    for (const { table, record } of changes) {
      const k = key(table, record.id);
      if (this.pending.get(k)?.updatedAt === record.updatedAt) this.pending.delete(k);
    }
  }

  async applyRemote(changes: readonly Change[]) {
    let applied = false;
    for (const { table, record } of changes) {
      if (!wins(record, this.rows(table).get(record.id))) continue;
      this.rows(table).set(record.id, record);
      // The local change lost to a newer one from the other device: nothing left to push.
      this.pending.delete(key(table, record.id));
      applied = true;
    }
    if (applied) this.emit('remote');
  }

  async cursor() {
    return this.serverCursor;
  }

  async setCursor(cursor: number) {
    this.serverCursor = cursor;
  }

  onChange(listener: (origin: ChangeOrigin) => void) {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }

  async getSetting(key: string) {
    return this.settings.get(key);
  }

  async setSetting(key: string, value: unknown) {
    this.settings.set(key, value);
  }

  private rows(table: TableName) {
    return this.tables.get(table)!;
  }

  private emit(origin: ChangeOrigin) {
    for (const listener of this.listeners) listener(origin);
  }
}
