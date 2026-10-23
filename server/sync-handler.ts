import { isTableName, type Change } from '../src/domain/tables';
import type { D1Database, Env } from './d1';

/** Limits on what one request may carry; the app sends at most PUSH_BATCH changes. */
export const MAX_BODY_BYTES = 2_000_000;
export const MAX_CHANGES = 500;
export const MAX_RECORD_BYTES = 16_000;
/** Records pulled per response; the app asks again while `more` is true. */
export const PULL_PAGE = 500;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

/**
 * POST /api/sync (ADR-007): stores the pushed changes where they win (last write wins, ties by
 * device id) with a new server sequence, then returns the records after the device's cursor.
 */
export async function handleSync(request: Request, env: Env): Promise<Response> {
  if (!isOwner(request, env)) return json({ error: 'forbidden' }, 403);

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return json({ error: 'too large' }, 413);
  const parsed = parseRequest(text);
  if (!parsed) return json({ error: 'bad request' }, 400);

  await push(env.DB, parsed.changes);
  return json(await pull(env.DB, parsed.cursor));
}

/**
 * Cloudflare Access lets only the owner reach /api and adds her e-mail to the request; checking
 * it here as well keeps the data closed if the Access application is ever misconfigured.
 */
function isOwner(request: Request, env: Env): boolean {
  const email = request.headers.get('Cf-Access-Authenticated-User-Email');
  const owner = env.OWNER_EMAIL?.trim().toLowerCase();
  return Boolean(owner) && email?.trim().toLowerCase() === owner;
}

interface ParsedRequest {
  cursor: number;
  changes: Change[];
}

export function parseRequest(text: string): ParsedRequest | null {
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return null;
  }
  const { cursor, changes } = (body ?? {}) as { cursor?: unknown; changes?: unknown };
  if (!Number.isSafeInteger(cursor) || (cursor as number) < 0) return null;
  if (!Array.isArray(changes) || changes.length > MAX_CHANGES) return null;
  if (!changes.every(isValidChange)) return null;
  return { cursor: cursor as number, changes };
}

const isId = (value: unknown) => typeof value === 'string' && value.length > 0 && value.length <= 64;
const isTime = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0;

function isValidChange(change: unknown): change is Change {
  const { table, record } = (change ?? {}) as { table?: unknown; record?: Record<string, unknown> };
  if (!isTableName(table) || typeof record !== 'object' || record === null) return false;
  return (
    isId(record.id) &&
    isTime(record.updatedAt) &&
    isId(record.updatedBy) &&
    (record.deletedAt === null || isTime(record.deletedAt)) &&
    JSON.stringify(record).length <= MAX_RECORD_BYTES
  );
}

// Inserts or replaces a record only when the pushed version wins; each write takes the next sequence.
const UPSERT = `
INSERT INTO records (tbl, id, updated_at, updated_by, deleted_at, data, seq)
VALUES (?1, ?2, ?3, ?4, ?5, ?6, (SELECT COALESCE(MAX(seq), 0) + 1 FROM records))
ON CONFLICT (tbl, id) DO UPDATE SET
  updated_at = excluded.updated_at,
  updated_by = excluded.updated_by,
  deleted_at = excluded.deleted_at,
  data = excluded.data,
  seq = excluded.seq
WHERE excluded.updated_at > records.updated_at
   OR (excluded.updated_at = records.updated_at AND excluded.updated_by > records.updated_by)`;

async function push(db: D1Database, changes: readonly Change[]): Promise<void> {
  if (changes.length === 0) return;
  const upsert = db.prepare(UPSERT);
  await db.batch(
    changes.map(({ table, record }) =>
      upsert.bind(table, record.id, record.updatedAt, record.updatedBy, record.deletedAt, JSON.stringify(record)),
    ),
  );
}

async function pull(db: D1Database, cursor: number) {
  const { results } = await db
    .prepare('SELECT tbl, data, seq FROM records WHERE seq > ?1 ORDER BY seq LIMIT ?2')
    .bind(cursor, PULL_PAGE)
    .all<{ tbl: string; data: string; seq: number }>();
  return {
    changes: results.map((row) => ({ table: row.tbl, record: JSON.parse(row.data) })),
    cursor: results.length > 0 ? results[results.length - 1].seq : cursor,
    more: results.length === PULL_PAGE,
  };
}
