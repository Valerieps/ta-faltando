# ADR-006: Browser APIs for voice and QR code, no libraries

**Status:** Accepted, updated by ADR-007
**Date:** 2026-10-22
**Decision:** Voice input uses the Web Speech API (`SpeechRecognition`, `lang: 'pt-BR'`), started
only by a tap on the microphone button. QR codes are decoded with the `BarcodeDetector` API, from
the camera or from the receipt photo. The target is Chrome on Android, the owner's phone; where an
API is missing, its button is hidden. `public/_headers` allows camera and microphone for the app's
own origin only.
**Why:** Both APIs ship with Chrome on Android, so no dependency is added (ADR-001). Chrome's speech
recognition sends the audio to Google's servers, outside the CSP: this is accepted because the
microphone only listens after a tap and the text is a shopping list.
**Alternatives:** A QR library (e.g. a ZXing port): needed only for browsers without
`BarcodeDetector`, which the owner does not use. On-device speech models: too heavy for a PWA.

**Update (2026-10-23):** The app is also used in a desktop browser (ADR-007). Voice and QR code are
not required there; the rule "where an API is missing, its button is hidden" covers it.
