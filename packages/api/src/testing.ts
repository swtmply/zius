import { user } from "@zius/db/schema/auth";
import { createTestDb } from "@zius/db/testing";

import type { Context } from "./context";
import { appRouter } from "./routers/index";

type TestDatabase = Awaited<ReturnType<typeof createTestDb>>;

export type TestCaller = ReturnType<typeof appRouter.createCaller>;

const databases: TestDatabase[] = [];

export function sessionFor(id: string, name: string, email: string) {
  const now = new Date();

  return {
    session: {
      id: `session-${id}`,
      createdAt: now,
      updatedAt: now,
      userId: id,
      expiresAt: new Date(now.getTime() + 60_000),
      token: `token-${id}`,
      ipAddress: null,
      userAgent: null,
    },
    user: {
      id,
      name,
      email,
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    },
  } satisfies NonNullable<Context["session"]>;
}

export async function addCaller(
  db: TestDatabase["db"],
  id: string,
  name: string,
  email: string,
): Promise<TestCaller> {
  await db.insert(user).values({ id, name, email, emailVerified: true });

  return appRouter.createCaller({
    auth: null,
    db,
    session: sessionFor(id, name, email),
  });
}

export async function createCaller(
  id: string,
  name: string,
  email: string,
): Promise<{ caller: TestCaller; db: TestDatabase["db"] }> {
  const testDatabase = await createTestDb();
  databases.push(testDatabase);

  return {
    caller: await addCaller(testDatabase.db, id, name, email),
    db: testDatabase.db,
  };
}

export async function createAnonymousCaller(): Promise<TestCaller> {
  const testDatabase = await createTestDb();
  databases.push(testDatabase);

  return appRouter.createCaller({ auth: null, db: testDatabase.db, session: null });
}

export async function closeTestDatabases() {
  await Promise.all(databases.splice(0).map(({ close }) => close()));
}
