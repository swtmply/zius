import { beforeEach, describe, expect, test } from "bun:test";

import type { Database } from "@zius/db";
import { group, groupMember, participant } from "@zius/db/schema/billing";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { createCaller } from "./support/caller";
import { getTestDatabase, resetTestDatabase } from "./support/database";
import { createBill, createGroup, createPerson } from "./support/fixtures";

let db: Database;

beforeEach(async () => {
  db = await getTestDatabase();
  await resetTestDatabase(db);
});

describe("group.create", () => {
  test("makes the caller the owner and everyone else a member", async () => {
    const owner = await createPerson(db, { name: "Ana", email: "ana@example.com" });

    const created = await createCaller(db, owner).group.create({
      name: "Flatmates",
      participants: [{ name: "Ben", email: "ben@example.com" }],
    });

    expect(created).toMatchObject({ name: "Flatmates" });

    const [stored] = await db.select().from(group).where(eq(group.id, created.id));

    expect(stored).toMatchObject({ name: "Flatmates", createdByUserId: owner.userId });

    const members = await db.select().from(groupMember).where(eq(groupMember.groupId, created.id));

    expect(members).toHaveLength(2);
    expect(members.find((member) => member.participantId === owner.participantId)?.role).toBe(
      "owner",
    );

    const [ben] = await db
      .select()
      .from(participant)
      .where(eq(participant.email, "ben@example.com"));

    expect(ben?.userId).toBeNull();
  });
});

describe("group.list", () => {
  test("returns the caller's groups newest first with their participants", async () => {
    const owner = await createPerson(db, { name: "Ana", email: "ana@example.com" });
    const member = await createPerson(db, { name: "Ben", email: "ben@example.com" });
    const caller = createCaller(db, owner);

    await caller.group.create({ name: "Older", participants: [] });
    await caller.group.create({
      name: "Newer",
      participants: [{ name: member.name, email: member.email }],
    });

    const listed = await caller.group.list({});
    const names = listed.items.map((item) => item.name);

    expect(names).toContain("Older");
    expect(names).toContain("Newer");
    expect(listed.items.every((item) => item.type === "owner")).toBe(true);

    const newer = listed.items.find((item) => item.name === "Newer");

    expect(newer?.participants).toHaveLength(2);
  });

  test("filters to the groups the caller only belongs to", async () => {
    const owner = await createPerson(db, { email: "ana@example.com" });
    const member = await createPerson(db, { email: "ben@example.com" });
    await createGroup(db, { name: "Owned by Ana", owner, members: [member] });

    const listed = await createCaller(db, member).group.list({ type: "member" });

    expect(listed.items.map((item) => item.name)).toEqual(["Owned by Ana"]);
  });

  test("returns nothing for a caller with no participant record", async () => {
    const stranger = await createPerson(db, { email: "cara@example.com" });
    await db.delete(participant).where(eq(participant.id, stranger.participantId));

    const listed = await createCaller(db, stranger).group.list({});

    expect(listed).toEqual({ items: [], nextCursor: null });
  });
});

describe("group.get", () => {
  test("returns the group with its members and its transactions", async () => {
    const owner = await createPerson(db, { name: "Ana", email: "ana@example.com" });
    const member = await createPerson(db, { name: "Ben", email: "ben@example.com" });
    const created = await createGroup(db, { name: "Flatmates", owner, members: [member] });
    await createBill(db, {
      title: "Rent",
      totalMinor: 2000,
      payer: owner,
      groupId: created.id,
      occurredAt: new Date(Date.UTC(2026, 0, 1)),
      participants: [{ participantId: member.participantId, owedMinor: 1000 }],
    });
    await createBill(db, {
      title: "Wifi",
      totalMinor: 500,
      payer: owner,
      groupId: created.id,
      occurredAt: new Date(Date.UTC(2026, 0, 10)),
      participants: [{ participantId: member.participantId, owedMinor: 250 }],
    });

    const found = await createCaller(db, member).group.get({ id: created.id });

    expect(found).toMatchObject({ id: created.id, name: "Flatmates" });
    expect(found.participants.map((entry) => entry.role).sort()).toEqual(["member", "owner"]);
    expect(found.transactions.map((entry) => entry.title)).toEqual(["Wifi", "Rent"]);
    expect(found.transactions[0]).toMatchObject({
      totalMinor: 500,
      currency: "PHP",
      status: "active",
      occurredAt: new Date(Date.UTC(2026, 0, 10)).toISOString(),
    });
    expect(found.transactions[0]?.participants[0]?.id).toBe(owner.participantId);
  });

  test("hides a group the caller does not belong to", async () => {
    const owner = await createPerson(db, { email: "ana@example.com" });
    const stranger = await createPerson(db, { email: "cara@example.com" });
    const created = await createGroup(db, { owner });

    const error = await createCaller(db, stranger)
      .group.get({ id: created.id })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TRPCError);
    expect((error as TRPCError).code).toBe("NOT_FOUND");
  });
});

describe("group.update", () => {
  test("renames a group for its owner", async () => {
    const owner = await createPerson(db, { email: "ana@example.com" });
    const created = await createGroup(db, { name: "Old name", owner });

    const updated = await createCaller(db, owner).group.update({
      id: created.id,
      name: "New name",
    });

    expect(updated).toEqual({ id: created.id, name: "New name" });

    const [stored] = await db.select().from(group).where(eq(group.id, created.id));

    expect(stored?.name).toBe("New name");
  });

  test("refuses a member who is not the owner", async () => {
    const owner = await createPerson(db, { email: "ana@example.com" });
    const member = await createPerson(db, { email: "ben@example.com" });
    const created = await createGroup(db, { name: "Old name", owner, members: [member] });

    const error = await createCaller(db, member)
      .group.update({ id: created.id, name: "New name" })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TRPCError);
    expect((error as TRPCError).code).toBe("FORBIDDEN");

    const [stored] = await db.select().from(group).where(eq(group.id, created.id));

    expect(stored?.name).toBe("Old name");
  });
});
