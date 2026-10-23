# ADR-005: IndexedDB with Dexie, and backup to a JSON file

**Status:** Accepted, updated by ADR-007
**Date:** 2026-10-22
**Decision:** All data (catalog, lists, stores, purchases, prices) lives in IndexedDB, accessed
through Dexie, pinned to an exact version when the first storage code is written. Only
`src/infrastructure/` imports Dexie; use cases see repository ports. On first run the app calls
`navigator.storage.persist()`. Backup is a versioned JSON file the owner exports and imports
(`docs/ARQUITETURA.md`, "Migrações"). Receipt photos are never stored.
**Why:** The spec keeps everything on the phone, with no account. IndexedDB holds structured data
and indexes (purchase lines by product and date) that localStorage cannot. Dexie gives schema
versions and migrations in a few kilobytes, which raw IndexedDB makes error-prone. Clearing the
browser data or changing phones erases IndexedDB, hence the file backup.
**Alternatives:** Raw IndexedDB or `idb`: no dependency or a smaller one, but hand-written
migrations. localStorage: synchronous, 5 MB, no indexes.

**Update (2026-10-23):** IndexedDB is now the working copy on each device (phone and desktop
browser), and a D1 database holds the shared copy (ADR-007). Records carry `id`, `updatedAt` and
`deletedAt` for sync. The file backup stays, as the copy that a bad import or a sync bug cannot
reach.
