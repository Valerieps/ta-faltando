import type { Env } from './d1';

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

/** The e-mail Cloudflare Access adds to every request it lets through to /api. */
export const accessEmail = (request: Request) => request.headers.get('Cf-Access-Authenticated-User-Email')?.trim() ?? '';

/**
 * Cloudflare Access lets only the owner reach /api and adds her e-mail to the request; checking
 * it here as well keeps the data closed if the Access application is ever misconfigured.
 */
export function isOwner(request: Request, env: Env): boolean {
  const owner = env.OWNER_EMAIL?.trim().toLowerCase();
  return Boolean(owner) && accessEmail(request).toLowerCase() === owner;
}
