import { changed, type SyncedRecord } from '../domain/synced-record';
import { TABLE_NAMES, type SyncedTables, type TableName } from '../domain/tables';
import type { Clock, LocalStore } from './ports';

/** The backup file (docs/ARQUITETURA.md, "Migrações"). */
export interface BackupFile {
  readonly formato: 'ta-faltando';
  readonly versao: number;
  readonly exportadoEm: string;
  readonly tabelas: { readonly [T in TableName]: readonly SyncedTables[T][] };
}

export const BACKUP_VERSION = 1;

/** The owner is reminded to export once a month (spec/backup.md). */
export const BACKUP_REMINDER_MS = 30 * 24 * 60 * 60 * 1000;

export function backupDue(lastBackupAt: number | null, firstUseAt: number | null, now: number): boolean {
  const since = lastBackupAt ?? firstUseAt;
  return since !== null && now - since >= BACKUP_REMINDER_MS;
}

export type ParsedBackup =
  | { readonly ok: true; readonly backup: BackupFile; readonly counts: { readonly [T in TableName]: number } }
  | { readonly ok: false; readonly error: string };

const isRecord = (value: unknown): value is SyncedRecord => {
  const r = value as Partial<SyncedRecord> | null;
  return typeof r === 'object' && r !== null && typeof r.id === 'string' && r.id.length > 0 && typeof r.updatedAt === 'number';
};

/**
 * Reads a backup file and says what it holds, so the owner confirms before importing. Accepts
 * every version up to this one (a newer file comes from a newer app).
 */
export function parseBackup(text: string): ParsedBackup {
  let body: Partial<BackupFile>;
  try {
    body = JSON.parse(text) as Partial<BackupFile>;
  } catch {
    return { ok: false, error: 'Este arquivo não é um backup do Tá faltando.' };
  }
  if (body?.formato !== 'ta-faltando' || typeof body.versao !== 'number' || typeof body.tabelas !== 'object' || body.tabelas === null) {
    return { ok: false, error: 'Este arquivo não é um backup do Tá faltando.' };
  }
  if (body.versao > BACKUP_VERSION) {
    return { ok: false, error: 'Este backup veio de uma versão mais nova do app. Atualize o app e tente de novo.' };
  }
  const tabelas = {} as Record<TableName, SyncedRecord[]>;
  for (const table of TABLE_NAMES) {
    const rows: unknown = (body.tabelas as Record<string, unknown>)[table] ?? [];
    if (!Array.isArray(rows) || !rows.every(isRecord)) return { ok: false, error: 'O backup está com defeito e não pode ser importado.' };
    tabelas[table] = rows.filter((r) => r.deletedAt == null);
  }
  const backup = { ...(body as BackupFile), tabelas: tabelas as unknown as BackupFile['tabelas'] };
  const counts = Object.fromEntries(TABLE_NAMES.map((t) => [t, tabelas[t].length])) as { [T in TableName]: number };
  return { ok: true, backup, counts };
}

/** Exporting and importing all the data (spec/backup.md). */
export class Backup {
  constructor(
    private readonly store: LocalStore,
    private readonly clock: Clock,
  ) {}

  async exportFile(): Promise<BackupFile> {
    const tabelas = Object.fromEntries(await Promise.all(TABLE_NAMES.map(async (t) => [t, await this.store.list(t)] as const)));
    return {
      formato: 'ta-faltando',
      versao: BACKUP_VERSION,
      exportadoEm: new Date(this.clock.now()).toISOString(),
      tabelas: tabelas as unknown as BackupFile['tabelas'],
    };
  }

  /**
   * Replaces everything with the backup: what is not in it is deleted, and what is in it is saved
   * again as a new change, so it wins over the current data here, on the server and on the other
   * device (last write wins, ADR-007).
   */
  async importReplacing(backup: BackupFile): Promise<void> {
    const author = { deviceId: await this.store.deviceId(), now: this.clock.now() };
    for (const table of TABLE_NAMES) {
      const incoming = backup.tabelas[table] as readonly SyncedRecord[];
      const keep = new Set(incoming.map((r) => r.id));
      for (const current of (await this.store.list(table)) as SyncedRecord[]) {
        if (!keep.has(current.id)) {
          const next = changed(current, {}, author);
          await this.save(table, { ...next, deletedAt: next.updatedAt });
        }
      }
      for (const record of incoming) {
        const current = await this.store.get(table, record.id);
        const base = current && current.updatedAt > record.updatedAt ? { ...record, updatedAt: current.updatedAt } : record;
        await this.save(table, { ...changed(base, {}, author), deletedAt: null });
      }
    }
  }

  private save(table: TableName, record: SyncedRecord): Promise<void> {
    return this.store.save(table, record as SyncedTables[typeof table]);
  }
}
