# ADR-009: Bundle the Nunito font from @fontsource

**Status:** Accepted
**Date:** 2026-10-23
**Decision:** The display face of the visual identity (questions, screen titles, Tatá's voice) is
Nunito, weights 700 and 800, latin subset only, from `@fontsource/nunito` pinned at `5.3.0`.
`src/main.tsx` imports `latin-700.css` and `latin-800.css`; Vite copies the woff2 files (about
16 KB each) into `dist/`, so they load from `'self'` under the existing CSP. Everything else keeps
the system font (`--font-sans`).
**Why:** `docs/SEGURANCA.md` forbids loading anything from a CDN, so Google Fonts is out. The
package has no code, only CSS and font files under the OFL, and pinning it keeps the files
reproducible.
**Alternatives:** Copying the woff2 files into the repository by hand: same result, but without a
version to pin or a license file next to them. The system font in weight 800: no extra bytes, but
loses the rounded shape that matches Tatá; it stays the fallback.
