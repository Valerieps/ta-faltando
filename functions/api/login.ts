// GET /api/login: Cloudflare Access asks for the Google login before this runs; once it has, the
// owner goes back to the app, now with a session for /api (ADR-008).
export const onRequestGet = ({ request }: { request: Request }) =>
  Response.redirect(new URL('/', request.url).toString(), 302);
