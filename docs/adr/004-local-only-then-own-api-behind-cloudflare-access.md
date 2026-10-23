# ADR-004: Local-only in phase 1a; own API behind Cloudflare Access in phase 1b

**Status:** Accepted
**Date:** 2026-10-22
**Decision:** Phase 1a makes no network calls: `network-policy.ts` stays empty and the CSP keeps
`connect-src 'none'`. Phase 1b adds Cloudflare Pages Functions under `/api` on the app's own
origin, with no database. They receive a receipt photo, call the Claude API (vision) and return
structured data; they also suggest the catalog item for each new product. The Claude API key is a
Cloudflare secret. `/api/*` is protected by a Cloudflare Access application with Google as the
identity provider and a policy that allows only the owner's e-mail. The app's data stays in
IndexedDB on the phone: the login only unlocks `/api`. When the Access session has expired, a
request to `/api` is redirected to the login page; the app detects it and navigates to a login
route instead of failing silently. The functions drop any CPF before answering.
**Why:** The spec wants receipt reading without exposing the API key in the browser, and without
a login, anyone who found `/api` could spend the owner's Claude credits. Access adds the Google
login with no code and no new origin in the CSP (the login is a navigation, not a fetch).
The SEFAZ-MG public consultation (`portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml`)
requires a reCAPTCHA before showing the receipt (checked on 2026-10-22), so the server does not
scrape it: the photo is the main path, and the QR code, decoded on the phone, gives the access key
and the store's CNPJ.
**Alternatives:** Next.js on Vercel (the first draft of the spec): a second platform for two
functions, against the template's Cloudflare Pages. Google Identity Services in the app: adds
`accounts.google.com` to the CSP and token checks in the functions. A shared secret typed once on
the phone: simpler, but leaks with the phone's storage and has no revocation. The
`claude-web-app-cloudflare-template` (server data and Google login): the data here stays local,
so a server database is not needed.
