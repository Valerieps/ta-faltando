import type { ChangeOrigin, Clock, IdGenerator } from '../application/ports';

export const systemClock: Clock = { now: () => Date.now() };

export const randomIds: IdGenerator = { newId: () => crypto.randomUUID() };

/** Asks the browser not to evict the data when space runs low (spec/backup.md). */
export async function requestPersistentStorage(): Promise<void> {
  if (!navigator.storage?.persist || (await navigator.storage.persisted())) return;
  await navigator.storage.persist();
}

/** How long after a local change the app waits before syncing, so a burst of taps goes in one request. */
export const LOCAL_CHANGE_DELAY_MS = 3000;

/**
 * Runs `sync` when the app opens, comes back to the screen, gets the internet back, and a few
 * seconds after a local change (ADR-007).
 */
export function startSyncTriggers(
  sync: () => void,
  onChange: (listener: (origin: ChangeOrigin) => void) => () => void,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const whenVisible = () => {
    if (document.visibilityState === 'visible') sync();
  };
  const stopChanges = onChange((origin) => {
    if (origin !== 'local') return;
    clearTimeout(timer);
    timer = setTimeout(sync, LOCAL_CHANGE_DELAY_MS);
  });
  document.addEventListener('visibilitychange', whenVisible);
  window.addEventListener('online', sync);
  sync();
  return () => {
    clearTimeout(timer);
    stopChanges();
    document.removeEventListener('visibilitychange', whenVisible);
    window.removeEventListener('online', sync);
  };
}
