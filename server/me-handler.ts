import type { Env } from './d1';
import { accessEmail, allowedUser, json } from './owner';

/** GET /api/me: the signed-in user's e-mail, for the initials in the profile menu. */
export function handleMe(request: Request, env: Env): Response {
  if (!allowedUser(request, env)) return json({ error: 'forbidden' }, 403);
  return json({ email: accessEmail(request) });
}
