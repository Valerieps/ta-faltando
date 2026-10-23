# ADR-011: Separate data per user on the server

**Status:** Accepted
**Date:** 2026-10-23
**Decision:** More than one Google account may use the app, each with its own data
(`spec/sincronizacao.md`).
- **Who gets in:** the Access policy lists the allowed e-mails, and the Pages variable
  `ALLOWED_EMAILS` (comma-separated, replacing `OWNER_EMAIL`) lists the same ones. The function
  answers 403 to any other `Cf-Access-Authenticated-User-Email`, failing closed when the variable
  is missing or empty.
- **Whose data:** D1's `records` gains an `owner` column, the lower-cased e-mail, which leads the
  primary key `(owner, tbl, id)` (`migrations/0002_records_owner.sql`). Push writes under the
  caller's e-mail; pull reads only its rows. `seq` stays one counter for the whole table, so a
  device's cursor still works: it skips other users' numbers.
- **Existing rows:** the migration gives them owner `''`; they are assigned by hand, in the
  console, to the e-mail that wrote them. The e-mail is not in the migration because the
  repository is public.
- **Devices:** nothing changes. A device has one IndexedDB copy and does not know whose it is.

**Why:** The owner wants Cesar to use the app with lists apart from hers. The e-mail is the only
identity the server has, and Access already vouches for it. Putting it first in the key keeps a
record id from one user from ever overwriting another's.
**Alternatives:** A D1 database per user: a binding per user and migrations applied many times.
A separate Pages project per user: two deploys of the same code. Shared lists: not what the owner
asked for (shared lists stay deferred in `ROADMAP.md`).
