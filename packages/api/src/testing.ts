import { user } from "@zius/db/schema/auth";
import { createTestDb } from "@zius/db/testing";

import type { Context } from "./context";
import { handleOpenApiRequest, OPENAPI_ENDPOINT } from "./openapi";
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

export type RestResponse<T = unknown> = { status: number; body: T };

export type RestClient = <T = unknown>(
  method: string,
  path: string,
  body?: unknown,
) => Promise<RestResponse<T>>;

/**
 * Drives the REST surface through the same handler the Hono server mounts, so
 * the tests cover the adapter's routing, path parameters and serialization
 * rather than only the procedures underneath it.
 */
export function restClientFor(context: Context): RestClient {
  return async <T>(method: string, path: string, body?: unknown) => {
    const request = new Request(`http://localhost${OPENAPI_ENDPOINT}${path}`, {
      method,
      ...(body === undefined
        ? {}
        : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    });
    const response = await handleOpenApiRequest(request, () => context);

    return { status: response.status, body: (await response.json()) as T };
  };
}

export async function createRestClient(
  id: string,
  name: string,
  email: string,
): Promise<{ rest: RestClient; caller: TestCaller; db: TestDatabase["db"] }> {
  const testDatabase = await createTestDb();
  databases.push(testDatabase);

  await testDatabase.db.insert(user).values({ id, name, email, emailVerified: true });

  const context: Context = {
    auth: null,
    db: testDatabase.db,
    session: sessionFor(id, name, email),
  };

  return {
    rest: restClientFor(context),
    caller: appRouter.createCaller(context),
    db: testDatabase.db,
  };
}

export function createAnonymousRestClient(db: TestDatabase["db"]): RestClient {
  return restClientFor({ auth: null, db, session: null });
}

export async function closeTestDatabases() {
  await Promise.all(databases.splice(0).map(({ close }) => close()));
}
