import { auth } from "@zius/auth";
import { db, type Database } from "@zius/db";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
};

export type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

export type Context = {
  db: Database;
  session: Session;
};

export async function createContext({ context }: CreateContextOptions): Promise<Context> {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });

  return {
    db,
    session,
  };
}
