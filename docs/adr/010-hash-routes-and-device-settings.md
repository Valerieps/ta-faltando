# ADR-010: Hash routes without a router library, and device settings in the Dexie meta table

**Status:** Accepted
**Date:** 2026-10-23
**Decision:** The screens live in the URL hash (`#/listas/mercado`, `#/compra/mercado`, `#/ajustes`…),
parsed and written by `src/ui/router.ts` with `history.pushState` and `popstate`; no router
dependency. The phone and the computer share the routes and pick their layout at 1024 px
(`useIsDesktop`). This device's settings (hand, setup done, last backup, first use) are rows
`setting:<key>` in the existing Dexie `meta` table, behind `LocalStore.getSetting`/`setSetting`,
read once by `src/application/settings.ts`; they never sync. A struck entry is the optional field
`ListEntry.checkedAt`, so the schema stays at version 1.
**Why:** The Android back gesture has to move between screens (identity draft), which needs real
history entries. A hash works from the relative `base: './'` build on Cloudflare Pages without
rewrite rules, and ADR-001 keeps dependencies to a minimum. The rule "data lives in IndexedDB"
(docs/SEGURANCA.md) rules out `localStorage` for settings; the `meta` table's primary key is the
only index, so new keys need no new schema version.
**Alternatives:** React Router or TanStack Router (a dependency for nine screens); path routes
(need a Pages `_redirects` rule and break the relative base); syncing the settings (the computer
has no hand, and the setup flag is per device).
