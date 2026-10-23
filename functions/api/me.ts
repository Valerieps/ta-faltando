import type { Env } from '../../server/d1';
import { handleMe } from '../../server/me-handler';

// Cloudflare Pages Function for GET /api/me; the logic lives in server/.
export const onRequestGet = ({ request, env }: { request: Request; env: Env }) => handleMe(request, env);
