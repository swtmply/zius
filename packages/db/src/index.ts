import { createClient } from "@libsql/client/web";
import { env } from "@zius/env/server";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { drizzle } from "drizzle-orm/libsql/web";

import * as schema from "./schema";

/**
 * A Drizzle handle over the application schema. Both the web client used in
 * production and the node client used by tests satisfy this type, so anything
 * that receives a `Database` can be pointed at either.
 */
export type Database = LibSQLDatabase<typeof schema>;

export function createDb() {
  const client = createClient({
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  });

  return drizzle({ client, schema });
}

export const db = createDb();
