import type { SyncApi, SyncRequest, SyncResponse } from '../application/ports';
import type { Change } from '../domain/tables';

/** Where the app opens the Cloudflare Access login; it comes back to the app after (ADR-008). */
export const LOGIN_PATH = '/api/login';

/**
 * `/api/sync` on the app's own origin (ADR-007). Behind Cloudflare Access, an expired session
 * answers with a redirect to the login page: the request does not follow it, so it reads as
 * "signed out" instead of a CORS failure.
 */
export class HttpSyncApi implements SyncApi {
  async exchange(request: SyncRequest): Promise<SyncResponse> {
    let response: Response;
    try {
      response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        credentials: 'same-origin',
        redirect: 'manual',
        cache: 'no-store',
      });
    } catch {
      return { kind: navigator.onLine ? 'error' : 'offline' };
    }
    if (response.type === 'opaqueredirect' || response.status === 401 || response.status === 403) {
      return { kind: 'signed-out' };
    }
    if (!response.ok) return { kind: 'error' };
    try {
      return parseSyncResponse(await response.json());
    } catch {
      // A login page served with 200 instead of a redirect is not JSON.
      return { kind: 'signed-out' };
    }
  }
}

export function parseSyncResponse(body: unknown): SyncResponse {
  const { changes, cursor, more } = (body ?? {}) as { changes?: unknown; cursor?: unknown; more?: unknown };
  if (!Array.isArray(changes) || typeof cursor !== 'number' || typeof more !== 'boolean') return { kind: 'error' };
  return { kind: 'ok', changes: changes as Change[], cursor, more };
}
