import Dexie, { type Table } from 'dexie';
import type { ChangeOrigin, LocalStore } from '../application/ports';
import { wins } from '../domain/synced-record';
import { TABLE_NAMES, type Change, type SyncedTables, type TableName } from '../domain/tables';

type AnyRecord = SyncedTables[TableName];

interface PendingRow {
  table: TableName;
  id: string;
  /** The `updatedAt` of the local version the server does not have yet. */
  updatedAt: number;
}

interface MetaRow {
  key: 'deviceId' | 'cursor';
  value: string | number;
}

/**
 * The IndexedDB schema (ADR-005, docs/ARQUITETURA.md "Migrações"). A new version only adds
 * tables, indexes or optional fields; never edit a version that has shipped, add the next one.
 */
class Database extends Dexie {
  pending!: Table<PendingRow, [TableName, string]>;
  meta!: Table<MetaRow, MetaRow['key']>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      contexts: 'id, order',
      items: 'id, defaultContextId',
      listEntries: 'id, itemId, contextId, status',
      pending: '[table+id]',
      meta: 'key',
    });
  }

  records(table: TableName): Table<AnyRecord, string> {
    return this.table(table);
  }
}

/** The device's working copy in IndexedDB, through Dexie. Only this file imports Dexie. */
export class DexieStore implements LocalStore {
  private readonly db: Database;
  private readonly listeners = new Set<(origin: ChangeOrigin) => void>();

  constructor(name = 'ta-faltando') {
    this.db = new Database(name);
  }

  async deviceId() {
    return this.db.transaction('rw', this.db.meta, async () => {
      const row = await this.db.meta.get('deviceId');
      if (row) return String(row.value);
      const id = crypto.randomUUID();
      await this.db.meta.put({ key: 'deviceId', value: id });
      return id;
    });
  }

  async get<T extends TableName>(table: T, id: string) {
    return (await this.db.records(table).get(id)) as SyncedTables[T] | undefined;
  }

  async list<T extends TableName>(table: T) {
    return (await this.db.records(table).filter((r) => r.deletedAt === null).toArray()) as SyncedTables[T][];
  }

  async save<T extends TableName>(table: T, record: SyncedTables[T]) {
    await this.db.transaction('rw', this.db.records(table), this.db.pending, async () => {
      await this.db.records(table).put(record);
      await this.db.pending.put({ table, id: record.id, updatedAt: record.updatedAt });
    });
    this.emit('local');
  }

  async pendingChanges(limit: number) {
    return this.db.transaction('r', [this.db.pending, ...TABLE_NAMES.map((t) => this.db.records(t))], async () => {
      const rows = await this.db.pending.limit(limit).toArray();
      const changes: Change[] = [];
      for (const { table, id } of rows) {
        const record = await this.db.records(table).get(id);
        if (record) changes.push({ table, record } as Change);
      }
      return changes;
    });
  }

  async pendingCount() {
    return this.db.pending.count();
  }

  async markPushed(changes: readonly Change[]) {
    await this.db.transaction('rw', this.db.pending, async () => {
      for (const { table, record } of changes) {
        const row = await this.db.pending.get([table, record.id]);
        if (row?.updatedAt === record.updatedAt) await this.db.pending.delete([table, record.id]);
      }
    });
  }

  async applyRemote(changes: readonly Change[]) {
    if (changes.length === 0) return;
    let applied = false;
    await this.db.transaction('rw', [this.db.pending, ...TABLE_NAMES.map((t) => this.db.records(t))], async () => {
      for (const { table, record } of changes) {
        if (!wins(record, await this.db.records(table).get(record.id))) continue;
        await this.db.records(table).put(record);
        // The local change lost to a newer one from the other device: nothing left to push.
        await this.db.pending.delete([table, record.id]);
        applied = true;
      }
    });
    if (applied) this.emit('remote');
  }

  async cursor() {
    return Number((await this.db.meta.get('cursor'))?.value ?? 0);
  }

  async setCursor(cursor: number) {
    await this.db.meta.put({ key: 'cursor', value: cursor });
  }

  onChange(listener: (origin: ChangeOrigin) => void) {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }

  private emit(origin: ChangeOrigin) {
    for (const listener of this.listeners) listener(origin);
  }
}
