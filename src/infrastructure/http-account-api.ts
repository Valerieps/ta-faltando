import type { AccountApi } from '../application/ports';

/** `/api/me` on the app's own origin; like /api/sync, a redirect to the login reads as signed out. */
export class HttpAccountApi implements AccountApi {
  async email(): Promise<string | null | undefined> {
    let response: Response;
    try {
      response = await fetch('/api/me', { credentials: 'same-origin', redirect: 'manual', cache: 'no-store' });
    } catch {
      return undefined;
    }
    if (response.type === 'opaqueredirect' || response.status === 401 || response.status === 403) return null;
    if (!response.ok) return undefined;
    try {
      const { email } = (await response.json()) as { email?: unknown };
      return typeof email === 'string' && email ? email : null;
    } catch {
      // A login page served with 200 instead of a redirect is not JSON.
      return null;
    }
  }
}
