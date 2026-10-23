/**
 * The one place that says which servers the app may talk to (docs/SEGURANCA.md).
 *
 * Empty means local-only: the production CSP gets `connect-src 'none'` and
 * src/security.test.ts forbids every network API in the app source.
 * Listing origins (e.g. 'https://api.example.com') opens the CSP to exactly those origins and
 * lets src/infrastructure/ (and only it) make requests to them.
 *
 * Phase 1a is local-only. Phase 1b adds the app's own server functions under /api for the receipt
 * reading (ADR-004); that change opens `connect-src` to the app's own origin.
 */
export const ALLOWED_ORIGINS: readonly string[] = [];

export const LOCAL_ONLY = ALLOWED_ORIGINS.length === 0;
