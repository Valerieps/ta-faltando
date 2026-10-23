import type { Change, SyncedTables, TableName } from '../domain/tables';

/** Where a change to the local copy came from: this device, or the server through sync. */
export type ChangeOrigin = 'local' | 'remote';

/**
 * The device's working copy (IndexedDB, ADR-005). Every local save is also marked as pending,
 * until the server has it.
 */
export interface LocalStore {
  /** This device's id, made on first use and kept. */
  deviceId(): Promise<string>;
  get<T extends TableName>(table: T, id: string): Promise<SyncedTables[T] | undefined>;
  /** The live records of a table (without tombstones). */
  list<T extends TableName>(table: T): Promise<SyncedTables[T][]>;
  /** Saves a change made on this device and marks it as pending. */
  save<T extends TableName>(table: T, record: SyncedTables[T]): Promise<void>;

  /** Up to `limit` pending changes, oldest first. */
  pendingChanges(limit: number): Promise<Change[]>;
  pendingCount(): Promise<number>;
  /** The server has these versions: unmark them, unless the record changed again since. */
  markPushed(changes: readonly Change[]): Promise<void>;
  /** Applies changes from the server where they win (last write wins); never marks them as pending. */
  applyRemote(changes: readonly Change[]): Promise<void>;
  /** The server sequence this device has pulled up to. */
  cursor(): Promise<number>;
  setCursor(cursor: number): Promise<void>;

  /** Calls `listener` after each change to the records; returns the unsubscribe function. */
  onChange(listener: (origin: ChangeOrigin) => void): () => void;

  /** A setting of this device only (hand, setup done…); settings never sync. */
  getSetting(key: string): Promise<unknown>;
  setSetting(key: string, value: unknown): Promise<void>;
}

export interface SyncRequest {
  readonly cursor: number;
  readonly changes: readonly Change[];
}

/** What the server answered to one exchange of changes. */
export type SyncResponse =
  | { readonly kind: 'ok'; readonly changes: readonly Change[]; readonly cursor: number; readonly more: boolean }
  | { readonly kind: 'offline' }
  /** The Cloudflare Access session is missing or expired (ADR-004). */
  | { readonly kind: 'signed-out' }
  | { readonly kind: 'error' };

/** The app's `/api/sync` (ADR-007): pushes the pending changes and pulls those after the cursor. */
export interface SyncApi {
  exchange(request: SyncRequest): Promise<SyncResponse>;
}

export interface Clock {
  now(): number;
}

export interface IdGenerator {
  newId(): string;
}

/** Who is signed in to /api (Cloudflare Access, ADR-008). */
export interface AccountApi {
  /** The owner's e-mail; null when signed out; undefined when the server could not be reached. */
  email(): Promise<string | null | undefined>;
}

/** Saving and opening the backup file where the owner chooses (spec/backup.md). */
export interface FileAccess {
  /** false when the owner cancelled. */
  save(fileName: string, text: string): Promise<boolean>;
  /** The text of the chosen file, or null when the owner cancelled. */
  open(): Promise<string | null>;
}
