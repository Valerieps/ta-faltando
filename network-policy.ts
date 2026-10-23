/**
 * The one place that says which servers the app may talk to (docs/SEGURANCA.md).
 *
 * Empty means local-only: the production CSP gets `connect-src 'none'` and
 * src/security.test.ts forbids every network API in the app source.
 * Listing origins (e.g. 'https://api.example.com') opens the CSP to exactly those origins and
 * lets src/infrastructure/ (and only it) make requests to them.
 *
 * Phase 1a adds the app's own server functions under /api to sync data between devices (ADR-007),
 * and phase 1b uses them for the receipt reading (ADR-004): the sync work opens `connect-src` to
 * the app's own origin. Until that code exists, the list stays empty.
 */
export const ALLOWED_ORIGINS: readonly string[] = [];

export const LOCAL_ONLY = ALLOWED_ORIGINS.length === 0;
