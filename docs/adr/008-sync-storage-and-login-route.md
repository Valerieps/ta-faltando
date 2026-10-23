# ADR-008: Sync storage layout, own-origin network policy and the login route

**Status:** Accepted
**Date:** 2026-10-23
**Decision:** How ADR-007 is built in phase 1a.
- **Device:** Dexie schema version 1 (`src/infrastructure/dexie-store.ts`) has one table per
  synced entity (`contexts`, `items`, `listEntries`), a `pending` table keyed by `[table+id]` that
  holds the `updatedAt` of each local change not yet on the server, and a `meta` table with the
  device id and the pull cursor. A pushed change is unmarked only if the record did not change
  again while the request was on its way; a remote change that wins drops the local marker.
  Records carry `updatedBy` (the device id) for the tie-break.
- **Server:** D1 keeps every synced record in one generic table, `records (tbl, id, updated_at,
  updated_by, deleted_at, data, seq)`, with the whole record as JSON in `data`
  (`migrations/0001_records.sql`). One `POST /api/sync` both pushes (`{cursor, changes}`) and
  pulls (`{changes, cursor, more}`, 500 per page). The logic lives in `server/` and is tested over
  `node:sqlite`; `functions/api/` only holds the thin Pages Function entry points.
- **Auth:** besides Cloudflare Access in front of `/api/*`, the function compares the
  `Cf-Access-Authenticated-User-Email` header with the `OWNER_EMAIL` variable and answers 403
  otherwise, failing closed when the variable is missing.
- **Login:** `fetch` uses `redirect: 'manual'`, so an expired Access session reads as "signed out"
  and the sync indicator shows "Entrar", a link to `GET /api/login`. Access asks for the Google
  login on that navigation; the function then redirects to `/`.
- **Network policy:** `network-policy.ts` has `USES_OWN_API = true`, which gives the CSP
  `connect-src 'self'`; `ALLOWED_ORIGINS` stays for other servers and is empty.
  `src/security.test.ts` checks that requests to the own origin go only to `/api/`.

**Why:** A generic server table follows the backup rule "a version only adds optional fields"
without a D1 migration per field, and phase 1b tables need none either; the server never reads
the fields, only the sync columns. Keeping the server logic outside `functions/` lets it be tested
with real SQL and keeps test files out of Pages' route discovery. The own origin is not an
`https://` origin known at build time (production and each branch preview differ), so `'self'`
is the honest CSP. The e-mail check costs one line and keeps the data closed if the Access
application is ever misconfigured.
**Alternatives:** One D1 table per entity, mirroring Dexie: typed columns nobody queries, and two
schemas to migrate together. Push and pull as separate endpoints: two round trips on a weak
signal. Validating the Access JWT in the function: stronger than the header check, left as an
issue. `@cloudflare/workers-types`: a dependency for the four D1 methods used, typed in
`server/d1.ts`.
