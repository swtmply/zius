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

/** Children first, so the deletes hold whether or not foreign keys are enforced. */
const TABLES_IN_DELETION_ORDER = [
  "bill_participant",
  "bill",
  "group_member",
  "group",
  "participant",
  "todo",
  "account",
  "session",
  "verification",
  "user",
];

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

/** Empties every table, so each test starts from nothing. */
export async function resetTestDatabase(db: Database) {
  for (const table of TABLES_IN_DELETION_ORDER) {
    await db.run(sql.raw(`delete from \`${table}\``));
  }
}

/** Releases the keep-alive connection, discarding the database with it. */
export function closeTestDatabase() {
  keepAlive?.close();
  keepAlive = undefined;
  database = undefined;
}
