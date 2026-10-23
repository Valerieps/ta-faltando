import type { Env } from '../../server/d1';
import { handleSync } from '../../server/sync-handler';

// Cloudflare Pages Function for POST /api/sync; the logic lives in server/ (ADR-007).
export const onRequestPost = ({ request, env }: { request: Request; env: Env }) => handleSync(request, env);
