import { beforeEach, describe, expect, test } from "bun:test";

import type { Database } from "@zius/db";
import { participant } from "@zius/db/schema/expense";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { createCaller } from "./support/caller";
import { getTestDatabase, resetTestDatabase } from "./support/database";
import { createPerson } from "./support/fixtures";

let db: Database;

beforeEach(async () => {
  db = await getTestDatabase();
  await resetTestDatabase(db);
});

describe("participant.current", () => {
  test("returns the participant claimed by the caller's account", async () => {
    const ana = await createPerson(db, { name: "Ana", email: "ana@example.com" });

    const current = await createCaller(db, ana).participant.current();

    expect(current).toEqual({
      id: ana.participantId,
      name: "Ana",
      email: "ana@example.com",
      userId: ana.userId,
    });
  });

  test("refuses a caller whose account claims no participant", async () => {
    const stranger = await createPerson(db, { email: "cara@example.com" });
    await db.delete(participant).where(eq(participant.id, stranger.participantId));

    const error = await createCaller(db, stranger)
      .participant.current()
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TRPCError);
    expect((error as TRPCError).code).toBe("NOT_FOUND");
  });
});
