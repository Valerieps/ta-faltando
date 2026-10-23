/**
 * The one place that says which servers the app may talk to (docs/SEGURANCA.md).
 *
 * USES_OWN_API opens `connect-src 'self'` for the app's own server functions under /api: sync
 * between devices from phase 1a (ADR-007) and the receipt reading in phase 1b (ADR-004).
 * ALLOWED_ORIGINS lists other servers (e.g. 'https://api.example.com'); it stays empty.
 * With neither, the app is local-only: the production CSP gets `connect-src 'none'`.
 * src/security.test.ts lets only src/infrastructure/ make requests, and only to these places.
 */
export const USES_OWN_API = true;

export const ALLOWED_ORIGINS: readonly string[] = [];

export const LOCAL_ONLY = !USES_OWN_API && ALLOWED_ORIGINS.length === 0;

/** The sources of the production CSP's `connect-src`. */
export const CONNECT_SOURCES: readonly string[] = LOCAL_ONLY
  ? ["'none'"]
  : [...(USES_OWN_API ? ["'self'"] : []), ...ALLOWED_ORIGINS];
