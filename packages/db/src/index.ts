import { createClient } from "@libsql/client/web";
import { env } from "@zius/env/server";
import { drizzle } from "drizzle-orm/libsql/web";

import * as schema from "./schema";

export function createDb() {
  const client = createClient({
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  });

  return drizzle({ client, schema });
}

export const db = createDb();

export type Database = typeof db;
