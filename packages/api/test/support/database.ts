import { fileURLToPath } from "node:url";

import { createClient, type Client } from "@libsql/client/node";
import type { Database } from "@zius/db";
import * as schema from "@zius/db/schema/index";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/libsql/migrator";
import { drizzle } from "drizzle-orm/libsql/node";

/**
 * libSQL recognises exactly one in-memory database name, so every connection in
 * a process opens the same database. Isolation therefore comes from emptying it
 * between tests rather than from opening a fresh one.
 */
const IN_MEMORY_URL = "file::memory:?cache=shared";

const MIGRATIONS_FOLDER = fileURLToPath(new URL("../../../db/src/migrations", import.meta.url));

/** Drizzle's migration ledger. Bookkeeping, not test data. */
const MIGRATIONS_TABLE = "__drizzle_migrations";

/**
 * A shared-cache in-memory database is discarded once its last connection
 * closes, and the libSQL client drops its own connection whenever a transaction
 * begins. This connection is never used and never closed; it exists so the
 * database survives between statements.
 */
let keepAlive: Client | undefined;
let database: Database | undefined;

/** Opens the in-memory database and applies the schema. Safe to call repeatedly. */
export async function getTestDatabase(): Promise<Database> {
  if (database) return database;

  keepAlive = createClient({ url: IN_MEMORY_URL });
  await keepAlive.execute("select 1");

  const client = createClient({ url: IN_MEMORY_URL });
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

  database = db;
  return database;
}

/**
 * Every table holding test data, read from the database itself so that a table
 * added to the schema later is emptied without anyone having to remember this
 * file. Excludes the migration ledger and SQLite's own `sqlite_` tables.
 */
async function listDataTables(db: Database): Promise<string[]> {
  const rows = await db.all<{ name: string }>(sql`
    select name from sqlite_master
    where type = 'table'
      and name <> ${MIGRATIONS_TABLE}
      and substr(name, 1, 7) <> 'sqlite_'
  `);

  return rows.map((row) => row.name);
}

/**
 * Empties every table, so each test starts from nothing.
 *
 * Foreign keys are enforced by default and the libSQL client turns them back on
 * in some code paths, so they are switched off for the duration of the reset and
 * restored to whatever they were. The deletes then need no particular order.
 */
export async function resetTestDatabase(db: Database) {
  const tables = await listDataTables(db);
  const enforced = await db.get<{ foreign_keys: number }>(sql`pragma foreign_keys`);

  await db.run(sql`pragma foreign_keys = off`);

  try {
    for (const table of tables) {
      await db.run(sql.raw(`delete from \`${table}\``));
    }
  } finally {
    if (enforced?.foreign_keys) await db.run(sql`pragma foreign_keys = on`);
  }
}
