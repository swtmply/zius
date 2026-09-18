import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import * as schema from "@zius/db/schema/index";
import { expense, expenseParticipant, participant } from "@zius/db/schema/expense";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { expect, test } from "bun:test";

import type { Context } from "../context";
import { createCallerFactory } from "../index";
import { groupRouter } from "./group";

const migrationsFolder = new URL("../../../db/src/migrations", import.meta.url).pathname;

// The libsql client reopens its connection per statement, which wipes ":memory:".
async function seed() {
  const file = join(tmpdir(), `zius-group-test-${crypto.randomUUID()}.db`);
  const db = drizzle({ client: createClient({ url: `file:${file}` }), schema });
  await migrate(db, { migrationsFolder });

  await db.insert(schema.user).values([
    { id: "user_owner", name: "Owner", email: "owner@example.com" },
    { id: "user_member", name: "Member", email: "member@example.com" },
  ]);
  await db.insert(participant).values([
    { id: "p_owner", userId: "user_owner", name: "Owner", email: "owner@example.com" },
    { id: "p_member", userId: "user_member", name: "Member", email: "member@example.com" },
  ]);

  const caller = (userId: string) =>
    createCallerFactory(groupRouter)({
      db,
      session: { user: { id: userId } },
    } as unknown as Context);

  return { db, caller, cleanup: () => rmSync(file, { force: true }) };
}

test("only the owner manages members, and open expenses pin a member in place", async () => {
  const { db, caller, cleanup } = await seed();
  const owner = caller("user_owner");
  const member = caller("user_member");

  const group = await owner.create({
    name: "Weekend trip",
    participants: [{ name: "Member", email: "member@example.com" }],
  });

  await expect(
    member.addMembers({
      id: group.id,
      participants: [{ name: "Guest", email: "guest@example.com" }],
    }),
  ).rejects.toThrow(/owner/);

  const added = await owner.addMembers({
    id: group.id,
    participants: [{ name: "Guest", email: "GUEST@example.com" }],
  });
  const guest = added.participants.find((person) => person.email === "guest@example.com");
  expect(added.participants).toHaveLength(3);
  expect(guest?.role).toBe("member");

  // Adding someone twice is a no-op rather than a duplicate membership.
  const readded = await owner.addMembers({
    id: group.id,
    participants: [{ name: "Guest", email: "guest@example.com" }],
  });
  expect(readded.participants).toHaveLength(3);

  await expect(owner.removeMember({ id: group.id, participantId: "p_owner" })).rejects.toThrow(
    /owner cannot be removed/,
  );

  await db.insert(expense).values({
    id: "e1",
    title: "Dinner",
    totalMinor: 1000,
    payerId: "p_owner",
    groupId: group.id,
    splitMethod: "equal",
    occurredAt: new Date(),
    createdByUserId: "user_owner",
  });
  await db
    .insert(expenseParticipant)
    .values({ expenseId: "e1", participantId: "p_member", owedMinor: 500 });

  await expect(owner.removeMember({ id: group.id, participantId: "p_member" })).rejects.toThrow(
    /Settle or cancel/,
  );

  const removed = await owner.removeMember({ id: group.id, participantId: guest!.id });
  expect(removed.participants.map((person) => person.id).sort()).toEqual(["p_member", "p_owner"]);

  cleanup();
});

test("paying for an active expense pins a member in place too", async () => {
  const { db, caller, cleanup } = await seed();
  const owner = caller("user_owner");

  const group = await owner.create({
    name: "Weekend trip",
    participants: [{ name: "Member", email: "member@example.com" }],
  });

  await db.insert(expense).values({
    id: "e1",
    title: "Dinner",
    totalMinor: 1000,
    payerId: "p_member",
    groupId: group.id,
    splitMethod: "equal",
    occurredAt: new Date(),
    createdByUserId: "user_owner",
  });

  await expect(owner.removeMember({ id: group.id, participantId: "p_member" })).rejects.toThrow(
    /Settle or cancel/,
  );

  // A cancelled expense is history, not an open debt, so it stops blocking.
  await db
    .update(expense)
    .set({ status: "cancelled", cancelledAt: new Date(), cancelledByUserId: "user_owner" })
    .where(eq(expense.id, "e1"));

  const removed = await owner.removeMember({ id: group.id, participantId: "p_member" });
  expect(removed.participants.map((person) => person.id)).toEqual(["p_owner"]);

  cleanup();
});

test("an archived group refuses membership changes", async () => {
  const { caller, cleanup } = await seed();
  const owner = caller("user_owner");

  const group = await owner.create({
    name: "Weekend trip",
    participants: [{ name: "Member", email: "member@example.com" }],
  });
  await owner.archive({ id: group.id });

  await expect(
    owner.addMembers({
      id: group.id,
      participants: [{ name: "Guest", email: "guest@example.com" }],
    }),
  ).rejects.toThrow(/archived/);
  await expect(owner.removeMember({ id: group.id, participantId: "p_member" })).rejects.toThrow(
    /archived/,
  );

  cleanup();
});
