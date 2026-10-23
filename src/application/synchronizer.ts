import { isTableName } from '../domain/tables';
import type { Clock, LocalStore, SyncApi } from './ports';

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'signed-out' | 'error';

export interface SyncState {
  readonly status: SyncStatus;
  /** Local changes the server does not have yet (spec/sincronizacao.md). */
  readonly pending: number;
  readonly lastSyncedAt: number | null;
}

/** Changes sent per request. */
export const PUSH_BATCH = 200;

/**
 * Keeps the device's copy and the server's in step (ADR-007): pushes the pending changes, pulls
 * the server's changes after the cursor, and repeats until neither side has more.
 */
export class Synchronizer {
  private state: SyncState = { status: 'idle', pending: 0, lastSyncedAt: null };
  private readonly listeners = new Set<() => void>();
  private running: Promise<void> | null = null;
  private requestedAgain = false;

  constructor(
    private readonly store: LocalStore,
    private readonly api: SyncApi,
    private readonly clock: Clock,
  ) {
    store.onChange(() => void this.refreshPending());
    void this.refreshPending();
  }

  getState = (): SyncState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Runs a sync; if one is already running, runs another right after it. */
  sync(): Promise<void> {
    if (this.running) {
      this.requestedAgain = true;
      return this.running;
    }
    this.running = (async () => {
      do {
        this.requestedAgain = false;
        await this.runOnce();
      } while (this.requestedAgain && this.state.status === 'idle');
      this.running = null;
    })();
    return this.running;
  }

  private async runOnce(): Promise<void> {
    this.update({ status: 'syncing' });
    try {
      for (;;) {
        const changes = await this.store.pendingChanges(PUSH_BATCH);
        const response = await this.api.exchange({ cursor: await this.store.cursor(), changes });
        if (response.kind !== 'ok') {
          this.update({ status: response.kind });
          return;
        }
        await this.store.markPushed(changes);
        // A newer app version may sync tables this one does not know yet; it skips them.
        await this.store.applyRemote(response.changes.filter((change) => isTableName(change.table)));
        await this.store.setCursor(response.cursor);
        if (!response.more && changes.length < PUSH_BATCH) break;
      }
      this.update({ status: 'idle', lastSyncedAt: this.clock.now() });
    } catch {
      this.update({ status: 'error' });
    } finally {
      await this.refreshPending();
    }
  }

  private async refreshPending(): Promise<void> {
    const pending = await this.store.pendingCount();
    if (pending !== this.state.pending) this.update({ pending });
  }

  private update(changes: Partial<SyncState>): void {
    this.state = { ...this.state, ...changes };
    for (const listener of this.listeners) listener();
  }
}
