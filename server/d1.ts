/**
 * The part of Cloudflare's D1 binding the server uses, typed here instead of adding
 * @cloudflare/workers-types. The tests give the same shape over node:sqlite.
 */
export interface D1Result<T> {
  results: T[];
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<unknown>;
}

export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  /** Runs the statements in one transaction. */
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

/** The bindings and variables of the Pages project (set in the Cloudflare dashboard). */
export interface Env {
  DB: D1Database;
  /** The only Google account allowed in, the same one as the Access policy (ADR-004). */
  OWNER_EMAIL: string;
}
