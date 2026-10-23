# ADR-007: Sync between devices through the app's own API and Cloudflare D1

**Status:** Accepted
**Date:** 2026-10-23
**Decision:** From phase 1a the owner uses the app on her Android phone and in a desktop browser,
with the same data (`docs/spec/sincronizacao.md`). IndexedDB (ADR-005) stays the working copy on
each device, so the app keeps working offline; a Cloudflare D1 database is the shared copy. A
Cloudflare Pages Function at `/api/sync`, on the app's own origin, is the only way in: the
browser never talks to D1 directly. `/api/*` stays behind the Cloudflare Access application of
ADR-004 (Google login, only the owner's e-mail), now created in phase 1a; the app shell stays
public, since it holds no data, so the installed app opens offline and without a session.
Every synced record carries an `id` (UUID made on the device), `updatedAt` (device clock, ms) and
`deletedAt` (a tombstone instead of a hard delete). The device pushes the records changed since
its last push; the server keeps, per record, the one with the larger `updatedAt` (last write wins,
ties broken by device id) and stamps a server sequence number. The device pulls the records whose
sequence is above its cursor, applies the same rule and moves the cursor. Sync runs on start, on
`visibilitychange` to visible, on `online`, and a few seconds after a local change.
`network-policy.ts` lists the app's own origin in phase 1a, opening `connect-src` to it only.
**Why:** The owner chose synced data on both devices, last write wins, from phase 1a. Keeping
IndexedDB as the working copy preserves the offline shopping mode. D1 and Pages Functions keep
everything on the platform and origin the app already uses, and Access gives the login with no
code. Per-record last write wins with tombstones is the simplest rule that lets deletes reach the
other device; a server sequence avoids relying on device clocks to know what to pull.
**Alternatives:** Sync service or CRDT library (e.g. a hosted sync engine, Yjs): a new dependency
and often a new origin, for a single user. Server as the only copy (no IndexedDB): breaks the
shopping mode without signal. Field-level merge: more code for conflicts that are rare with one
user. Putting the whole app behind Access: the installed app would not open offline after the
session expires.
