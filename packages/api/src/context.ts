import { auth } from "@zius/auth";
import { db as appDatabase, type Database } from "@zius/db";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
  db?: Database;
};

export async function createContext({ context, db = appDatabase }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
  return {
    auth: null,
    db,
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
