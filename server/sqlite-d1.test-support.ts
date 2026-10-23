import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type { D1Database, D1PreparedStatement } from './d1';

/** A D1Database over node:sqlite with the repository's migrations applied, for the tests. */
export function sqliteD1(): D1Database {
  const db = new DatabaseSync(':memory:');
  const migrations = join(__dirname, '..', 'migrations');
  for (const file of readdirSync(migrations).filter((f) => f.endsWith('.sql')).sort()) {
    db.exec(readFileSync(join(migrations, file), 'utf8'));
  }

  const statement = (sql: string, values: unknown[] = []): D1PreparedStatement & { exec(): void } => ({
    bind: (...next) => statement(sql, next),
    all: async <T>() => ({ results: db.prepare(sql).all(...(values as SQLInputValue[])) as T[] }),
    run: async () => db.prepare(sql).run(...(values as SQLInputValue[])),
    exec: () => void db.prepare(sql).run(...(values as SQLInputValue[])),
  });

  return {
    prepare: (sql) => statement(sql),
    batch: async (statements) => {
      db.exec('BEGIN');
      try {
        for (const s of statements) (s as ReturnType<typeof statement>).exec();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      return [];
    },
  };
}
