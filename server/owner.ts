import type { Env } from './d1';

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

/** The e-mail Cloudflare Access adds to every request it lets through to /api. */
export const accessEmail = (request: Request) => request.headers.get('Cf-Access-Authenticated-User-Email')?.trim() ?? '';

/**
 * Cloudflare Access lets only the allowed users reach /api and adds the e-mail to the request;
 * checking it here as well keeps the data closed if the Access application is ever misconfigured.
 * The e-mail, lower-cased, owns the records the request reads and writes (ADR-011).
 */
export function allowedUser(request: Request, env: Env): string | null {
  const email = accessEmail(request).toLowerCase();
  const allowed = (env.ALLOWED_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase());
  return email && allowed.includes(email) ? email : null;
}
