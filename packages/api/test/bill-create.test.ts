import { beforeEach, describe, expect, it, mock } from "bun:test";

import { createTestDb } from "./db";

const { db, sqlite } = createTestDb();

mock.module("@zius/db", () => ({ db, createDb: () => db }));

const { user } = await import("@zius/db/schema/auth");
const { group, groupMember, participant } = await import("@zius/db/schema/billing");
const { appRouter } = await import("../src/routers/index");

const OWNER_USER_ID = "user_owner";
const OWNER_PARTICIPANT_ID = "participant_owner";
const MEMBER_PARTICIPANT_ID = "participant_member";
const GROUP_ID = "group_trip";

const caller = appRouter.createCaller({
  auth: null,
  session: { user: { id: OWNER_USER_ID } },
} as never);

function createTransaction(overrides: Record<string, unknown>) {
  return caller.bill.create({
    title: "Dinner",
    totalMinor: 3000,
    currency: "PHP",
    splitMethod: "equal",
    payer: "owner@example.com",
    createGroup: false,
    occurredAt: Date.now(),
    participants: [{ name: "Owner", email: "owner@example.com", owedMinor: 0, status: "unpaid" }],
    ...overrides,
  } as never);
}

beforeEach(async () => {
  for (const table of [
    "bill_participant",
    "bill",
    "group_member",
    "group",
    "participant",
    "user",
  ]) {
    sqlite.exec(`delete from \`${table}\``);
  }

  const now = new Date();

  await db.insert(user).values({
    id: OWNER_USER_ID,
    name: "Owner",
    email: "owner@example.com",
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(participant).values([
    { id: OWNER_PARTICIPANT_ID, userId: OWNER_USER_ID, name: "Owner", email: "owner@example.com" },
    { id: MEMBER_PARTICIPANT_ID, name: "Member", email: "member@example.com" },
  ]);

  await db.insert(group).values({
    id: GROUP_ID,
    name: "Trip",
    createdByUserId: OWNER_USER_ID,
  });

  await db.insert(groupMember).values([
    { groupId: GROUP_ID, participantId: OWNER_PARTICIPANT_ID, role: "owner" },
    { groupId: GROUP_ID, participantId: MEMBER_PARTICIPANT_ID, role: "member" },
  ]);
});

function billCount() {
  return (sqlite.query("select count(*) as count from bill").get() as { count: number }).count;
}

describe("bill.create with a selected group", () => {
  it("rejects a guest who is not a member of the selected group", async () => {
    const promise = createTransaction({
      groupId: GROUP_ID,
      participants: [
        { name: "Owner", email: "owner@example.com", owedMinor: 0, status: "unpaid" },
        { name: "Member", email: "member@example.com", owedMinor: 0, status: "unpaid" },
        { name: "Guest", email: "guest@example.com", owedMinor: 0, status: "unpaid" },
      ],
    });

    await expect(promise).rejects.toThrow(/not (a member|members) of this group/i);
    expect(billCount()).toBe(0);
  });

  it("rejects an existing participant who is not a member of the selected group", async () => {
    await db.insert(participant).values({
      id: "participant_outsider",
      name: "Outsider",
      email: "outsider@example.com",
    });

    const promise = createTransaction({
      groupId: GROUP_ID,
      participants: [
        { name: "Owner", email: "owner@example.com", owedMinor: 0, status: "unpaid" },
        { name: "Outsider", email: "outsider@example.com", owedMinor: 0, status: "unpaid" },
      ],
    });

    await expect(promise).rejects.toThrow(/not (a member|members) of this group/i);
    expect(billCount()).toBe(0);
  });

  it("accepts a transaction whose participants are all group members", async () => {
    const result = await createTransaction({
      groupId: GROUP_ID,
      participants: [
        { name: "Owner", email: "owner@example.com", owedMinor: 0, status: "unpaid" },
        { name: "Member", email: "member@example.com", owedMinor: 0, status: "unpaid" },
      ],
    });

    expect(result.id).toBeString();
    expect(billCount()).toBe(1);
  });

  it("still accepts a guest on a standalone transaction", async () => {
    const result = await createTransaction({
      participants: [
        { name: "Owner", email: "owner@example.com", owedMinor: 0, status: "unpaid" },
        { name: "Guest", email: "guest@example.com", owedMinor: 0, status: "unpaid" },
      ],
    });

    expect(result.id).toBeString();
    expect(billCount()).toBe(1);
  });

  it("still accepts a guest when creating a new group", async () => {
    const result = await createTransaction({
      createGroup: true,
      participants: [
        { name: "Owner", email: "owner@example.com", owedMinor: 0, status: "unpaid" },
        { name: "Guest", email: "guest@example.com", owedMinor: 0, status: "unpaid" },
      ],
    });

    expect(result.id).toBeString();
    expect(billCount()).toBe(1);

    const members = sqlite
      .query(
        "select p.email from group_member gm join participant p on p.id = gm.participant_id where gm.group_id != ?",
      )
      .all(GROUP_ID) as { email: string }[];
    expect(members.map((entry) => entry.email).sort()).toEqual([
      "guest@example.com",
      "owner@example.com",
    ]);
  });
});
