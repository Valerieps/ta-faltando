// GET /api/login: Cloudflare Access asks for the Google login before this runs; once it has, the
// owner goes back to the app, now with a session for /api (ADR-008). The query tells the
// first-use welcome not to send her to the login again (src/ui/welcome-gate.ts).
export const onRequestGet = ({ request }: { request: Request }) =>
  Response.redirect(new URL('/?login', request.url).toString(), 302);
