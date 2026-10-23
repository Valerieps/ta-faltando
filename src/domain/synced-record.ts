/**
 * Every record that syncs between devices (ADR-007): an id made on the device, the time of its
 * last change, which device made it, and a tombstone instead of a hard delete.
 */
export interface SyncedRecord {
  readonly id: string;
  /** Device clock, in ms. Always grows for the same record, even if the clock goes back. */
  readonly updatedAt: number;
  /** The device that made the last change; breaks ties between equal `updatedAt`. */
  readonly updatedBy: string;
  /** When the record was deleted, or null. Deleted records are kept so the delete syncs. */
  readonly deletedAt: number | null;
}

/** Who changes a record and when: the device and its clock. */
export interface Author {
  readonly deviceId: string;
  readonly now: number;
}

/** Last write wins: true when `candidate` replaces `current`. */
export function wins(candidate: SyncedRecord, current: SyncedRecord | undefined): boolean {
  if (!current) return true;
  if (candidate.updatedAt !== current.updatedAt) return candidate.updatedAt > current.updatedAt;
  return candidate.updatedBy > current.updatedBy;
}

/** The sync fields of a new record. */
export function created(id: string, author: Author): SyncedRecord {
  return { id, updatedAt: author.now, updatedBy: author.deviceId, deletedAt: null };
}

/**
 * A changed copy of a record. `updatedAt` moves past the previous one even when the device
 * clock is behind it, so a change made on this device always wins over the version it replaced.
 */
export function changed<T extends SyncedRecord>(record: T, changes: Partial<Omit<T, keyof SyncedRecord>>, author: Author): T {
  return {
    ...record,
    ...changes,
    updatedAt: Math.max(author.now, record.updatedAt + 1),
    updatedBy: author.deviceId,
  };
}

/** A deleted copy of a record (a tombstone). */
export function deleted<T extends SyncedRecord>(record: T, author: Author): T {
  const next = changed(record, {}, author);
  return { ...next, deletedAt: next.updatedAt };
}

export const isLive = (record: SyncedRecord) => record.deletedAt === null;
