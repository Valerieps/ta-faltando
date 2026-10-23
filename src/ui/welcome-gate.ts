import type { SyncState } from '../application/synchronizer';

/** The query `/api/login` adds when it sends the owner back to the app (ADR-008). */
const BACK_FROM_LOGIN = 'login';

let cameBack = false;

/**
 * Reads the query once, at startup, and takes it out of the address bar, so it does not stay on
 * every screen; the hash route is kept.
 */
export function takeBackFromLogin(location: Location, history: History): void {
  const query = new URLSearchParams(location.search);
  if (!query.has(BACK_FROM_LOGIN)) return;
  cameBack = true;
  query.delete(BACK_FROM_LOGIN);
  const search = query.toString();
  history.replaceState(history.state, '', `${location.pathname}${search ? `?${search}` : ''}${location.hash}`);
}

export function backFromLogin(): boolean {
  return cameBack;
}

/**
 * What the first-use welcome does with the first sync (spec/setup.md): it waits for it, sends the
 * owner to the Google login when there is no session, and opens once the sync is done or cannot
 * run (offline, error). Coming back from the login and still signed out, it opens anyway, so a
 * login that does not take never loops.
 */
export function welcomeGate({ status, lastSyncedAt }: SyncState, backFromLogin: boolean): 'wait' | 'login' | 'show' {
  if (status === 'syncing' || (status === 'idle' && lastSyncedAt === null)) return 'wait';
  if (status === 'signed-out' && !backFromLogin) return 'login';
  return 'show';
}
