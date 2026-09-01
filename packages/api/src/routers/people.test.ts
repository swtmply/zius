import { afterEach, describe, expect, test } from "bun:test";
import { createTestDb } from "@zius/db/testing";
import { person, user } from "@zius/db/schema/index";

import type { Context } from "../context";
import { appRouter } from ".";

const databases: Array<Awaited<ReturnType<typeof createTestDb>>> = [];

async function createDatabase() {
  const database = await createTestDb();
  databases.push(database);
  return database;
}

async function createCaller(session: Context["session"] = null) {
  const database = await createDatabase();

  return appRouter.createCaller({
    auth: null,
    db: database.db,
    session,
  });
}

type Session = NonNullable<Context["session"]>;

const allenSession = {
  session: {
    id: "session-allen",
    token: "token-allen",
    userId: "user-allen",
    expiresAt: new Date("2030-01-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ipAddress: null,
    userAgent: null,
  },
  user: {
    id: "user-allen",
    name: "Allen",
    email: "  ALLEN@EXAMPLE.COM ",
    emailVerified: true,
    image: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
} satisfies Session;

async function createAuthenticatedCaller(session: Session = allenSession) {
  const database = await createDatabase();
  await database.db.insert(user).values(session.user);

  return {
    caller: appRouter.createCaller({ auth: null, db: database.db, session }),
    db: database.db,
  };
}

afterEach(() => {
  for (const database of databases.splice(0)) {
    database.close();
  }
});

describe("people.resolve", () => {
  test("rejects an unauthenticated request", async () => {
    const caller = await createCaller();

    expect(
      caller.people.resolve({ email: "guest@example.com", displayName: "Guest" }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("creates the current person and an unknown guest with server-generated identifiers", async () => {
    const { caller, db } = await createAuthenticatedCaller();

    const resolved = await caller.people.resolve({
      email: "  GUEST@Example.com ",
      displayName: "Guest Person",
    });

    expect(resolved).toEqual({
      id: expect.any(String),
      displayName: "Guest Person",
      email: "guest@example.com",
    });
    expect(Object.keys(resolved).sort()).toEqual(["displayName", "email", "id"]);

    const people = await db.select().from(person);
    expect(people).toHaveLength(2);
    expect(people).toContainEqual(
      expect.objectContaining({
        id: expect.any(String),
        userId: "user-allen",
        displayName: "Allen",
        emailNormalized: "allen@example.com",
        claimedAt: expect.any(Date),
      }),
    );
    expect(people).toContainEqual(
      expect.objectContaining({
        id: resolved.id,
        userId: null,
        displayName: "Guest Person",
        emailNormalized: "guest@example.com",
        claimedAt: null,
        createdByUserId: "user-allen",
      }),
    );
  });

  test("reuses the person already linked to the current account", async () => {
    const { caller, db } = await createAuthenticatedCaller();
    await db.insert(person).values({
      id: "person-allen",
      userId: allenSession.user.id,
      displayName: "Existing Allen",
      emailNormalized: "allen@example.com",
      createdByUserId: allenSession.user.id,
      claimedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const resolved = await caller.people.resolve({
      email: "ALLEN@example.com",
      displayName: "Replacement Name",
    });

    expect(resolved).toEqual({
      id: "person-allen",
      displayName: "Existing Allen",
      email: "allen@example.com",
    });
    expect(await db.select().from(person)).toHaveLength(1);
  });

  test("reuses a normalized guest without overwriting its display name", async () => {
    const { caller } = await createAuthenticatedCaller();

    const first = await caller.people.resolve({
      email: " guest@example.com ",
      displayName: "Original Guest",
    });
    const second = await caller.people.resolve({
      email: "GUEST@EXAMPLE.COM",
      displayName: "Replacement Name",
    });

    expect(second).toEqual(first);
    expect(second.displayName).toBe("Original Guest");
  });

  test("returns one stable person when normalized guest resolution races", async () => {
    const { caller } = await createAuthenticatedCaller();

    const [first, second] = await Promise.all([
      caller.people.resolve({ email: "guest@example.com", displayName: "First Name" }),
      caller.people.resolve({ email: " GUEST@EXAMPLE.COM ", displayName: "Second Name" }),
    ]);

    expect(second).toEqual(first);
  });

  test("returns BAD_REQUEST for an invalid email", async () => {
    const { caller } = await createAuthenticatedCaller();

    expect(
      caller.people.resolve({ email: "not-an-email", displayName: "Guest" }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  test("refuses to claim a guest matching the current account email", async () => {
    const { caller, db } = await createAuthenticatedCaller();
    await db.insert(person).values({
      id: "existing-guest",
      displayName: "Existing Guest",
      emailNormalized: "allen@example.com",
      createdByUserId: allenSession.user.id,
    });

    expect(
      caller.people.resolve({ email: "another@example.com", displayName: "Another Person" }),
    ).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
    expect(await db.select().from(person)).toHaveLength(1);
  });

  test("returns CONFLICT when another claimed person uses the account email", async () => {
    const { caller, db } = await createAuthenticatedCaller();
    await db.insert(user).values({
      id: "user-other",
      name: "Other Account",
      email: "other@example.com",
      emailVerified: true,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    await db.insert(person).values({
      id: "person-other",
      userId: "user-other",
      displayName: "Other Person",
      emailNormalized: "allen@example.com",
      createdByUserId: "user-other",
      claimedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(
      caller.people.resolve({ email: "another@example.com", displayName: "Another Person" }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});
