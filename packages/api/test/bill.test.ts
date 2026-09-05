import { beforeEach, describe, expect, test } from "bun:test";

import type { Database } from "@zius/db";
import { bill, billParticipant, participant } from "@zius/db/schema/billing";
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

describe("bill.create", () => {
  test("splits the total evenly and records the payer as paid", async () => {
    const payer = await createPerson(db, { name: "Ana", email: "ana@example.com" });
    const caller = createCaller(db, payer);

    const created = await caller.bill.create({
      title: "Dinner",
      totalMinor: 1000,
      splitMethod: "equal",
      payer: payer.email,
      occurredAt: Date.UTC(2026, 0, 15),
      participants: [
        { name: payer.name, email: payer.email, owedMinor: 0 },
        { name: "Ben", email: "ben@example.com", owedMinor: 0 },
      ],
    });

    expect(created.status).toBe("active");

    const [stored] = await db.select().from(bill).where(eq(bill.id, created.id));

    expect(stored).toMatchObject({
      title: "Dinner",
      totalMinor: 1000,
      currency: "PHP",
      status: "active",
      splitMethod: "equal",
      payerId: payer.participantId,
      groupId: null,
    });
    expect(stored?.settledAt).toBeNull();

    const shares = await db
      .select()
      .from(billParticipant)
      .where(eq(billParticipant.billId, created.id));

    expect(shares).toHaveLength(2);
    expect(shares.map((share) => share.owedMinor).sort()).toEqual([500, 500]);
    expect(shares.find((share) => share.participantId === payer.participantId)?.status).toBe(
      "paid",
    );
  });

  test("creates a participant for an email that has never been seen", async () => {
    const payer = await createPerson(db, { email: "ana@example.com" });
    const caller = createCaller(db, payer);

    await caller.bill.create({
      title: "Taxi",
      totalMinor: 900,
      splitMethod: "equal",
      payer: payer.email,
      occurredAt: Date.UTC(2026, 0, 15),
      participants: [
        { name: "Ana", email: payer.email, owedMinor: 0 },
        { name: "Cara", email: "cara@example.com", owedMinor: 0 },
      ],
    });

    const [cara] = await db
      .select()
      .from(participant)
      .where(eq(participant.email, "cara@example.com"));

    expect(cara).toMatchObject({ name: "Cara", userId: null });
  });

  test("settles immediately when every other participant has already paid", async () => {
    const payer = await createPerson(db, { email: "ana@example.com" });
    const caller = createCaller(db, payer);

    const created = await caller.bill.create({
      title: "Coffee",
      totalMinor: 400,
      splitMethod: "equal",
      payer: payer.email,
      occurredAt: Date.UTC(2026, 0, 15),
      participants: [
        { name: "Ana", email: payer.email, owedMinor: 0 },
        { name: "Ben", email: "ben@example.com", owedMinor: 0, status: "paid" },
      ],
    });

    expect(created.status).toBe("settled");

    const [stored] = await db.select().from(bill).where(eq(bill.id, created.id));

    expect(stored?.settledAt).not.toBeNull();
  });

  test("refuses a group the caller does not belong to", async () => {
    const outsider = await createPerson(db, { email: "ana@example.com" });
    const owner = await createPerson(db, { email: "ben@example.com" });
    const otherGroup = await createGroup(db, { owner });
    const caller = createCaller(db, outsider);

    const error = await caller.bill
      .create({
        title: "Dinner",
        totalMinor: 1000,
        splitMethod: "equal",
        payer: outsider.email,
        groupId: otherGroup.id,
        occurredAt: Date.UTC(2026, 0, 15),
        participants: [{ name: "Ana", email: outsider.email, owedMinor: 0 }],
      })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TRPCError);
    expect((error as TRPCError).code).toBe("FORBIDDEN");
  });

  test("rejects fixed amounts that exceed the total", async () => {
    const payer = await createPerson(db, { email: "ana@example.com" });
    const caller = createCaller(db, payer);

    const error = await caller.bill
      .create({
        title: "Dinner",
        totalMinor: 1000,
        splitMethod: "fixed",
        payer: payer.email,
        occurredAt: Date.UTC(2026, 0, 15),
        participants: [
          { name: "Ana", email: payer.email, owedMinor: 600 },
          { name: "Ben", email: "ben@example.com", owedMinor: 600 },
        ],
      })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TRPCError);
    expect((error as TRPCError).code).toBe("BAD_REQUEST");
  });

  test("refuses a caller with no session", async () => {
    const caller = createCaller(db);

    const error = await caller.bill
      .create({
        title: "Dinner",
        totalMinor: 1000,
        splitMethod: "equal",
        payer: "ana@example.com",
        occurredAt: Date.UTC(2026, 0, 15),
        participants: [{ name: "Ana", email: "ana@example.com", owedMinor: 0 }],
      })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TRPCError);
    expect((error as TRPCError).code).toBe("UNAUTHORIZED");
  });
});

describe("bill.get", () => {
  test("returns the bill with the payer first and what the payer is owed", async () => {
    const payer = await createPerson(db, { name: "Ana", email: "ana@example.com" });
    const debtor = await createPerson(db, { name: "Ben", email: "ben@example.com" });
    const seeded = await createBill(db, {
      title: "Dinner",
      totalMinor: 1000,
      payer,
      occurredAt: new Date(Date.UTC(2026, 0, 15)),
      participants: [{ participantId: debtor.participantId, owedMinor: 500 }],
    });

    const found = await createCaller(db, payer).bill.get({ id: seeded.id });

    expect(found).toMatchObject({
      id: seeded.id,
      title: "Dinner",
      totalMinor: 1000,
      isPayer: true,
      amountMinor: 500,
      currency: "PHP",
      status: "active",
      payerId: payer.participantId,
      payerName: "Ana",
      groupId: null,
      groupName: null,
      occurredAt: new Date(Date.UTC(2026, 0, 15)).toISOString(),
      settledAt: null,
    });
    expect(found.participants.map((entry) => entry.name)).toEqual(["Ana", "Ben"]);
  });

  test("reports a participant's own share rather than the total owed", async () => {
    const payer = await createPerson(db, { email: "ana@example.com" });
    const debtor = await createPerson(db, { email: "ben@example.com" });
    const seeded = await createBill(db, {
      totalMinor: 1000,
      payer,
      participants: [{ participantId: debtor.participantId, owedMinor: 500 }],
    });

    const found = await createCaller(db, debtor).bill.get({ id: seeded.id });

    expect(found.isPayer).toBe(false);
    expect(found.amountMinor).toBe(500);
  });

  test("hides a bill the caller is not involved in", async () => {
    const payer = await createPerson(db, { email: "ana@example.com" });
    const debtor = await createPerson(db, { email: "ben@example.com" });
    const stranger = await createPerson(db, { email: "cara@example.com" });
    const seeded = await createBill(db, {
      payer,
      participants: [{ participantId: debtor.participantId, owedMinor: 500 }],
    });

    const error = await createCaller(db, stranger)
      .bill.get({ id: seeded.id })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TRPCError);
    expect((error as TRPCError).code).toBe("NOT_FOUND");
  });
});

describe("bill.list", () => {
  test("returns the caller's bills newest first", async () => {
    const payer = await createPerson(db, { email: "ana@example.com" });
    const debtor = await createPerson(db, { email: "ben@example.com" });
    await createBill(db, {
      title: "Older",
      payer,
      occurredAt: new Date(Date.UTC(2026, 0, 1)),
      participants: [{ participantId: debtor.participantId, owedMinor: 500 }],
    });
    await createBill(db, {
      title: "Newer",
      payer,
      occurredAt: new Date(Date.UTC(2026, 0, 20)),
      participants: [{ participantId: debtor.participantId, owedMinor: 500 }],
    });

    const listed = await createCaller(db, payer).bill.list({});

    expect(listed.items.map((item) => item.title)).toEqual(["Newer", "Older"]);
    expect(listed.nextCursor).toBeNull();
    expect(listed.items[0]?.participants[0]?.id).toBe(payer.participantId);
  });

  test("filters by status", async () => {
    const payer = await createPerson(db, { email: "ana@example.com" });
    const debtor = await createPerson(db, { email: "ben@example.com" });
    await createBill(db, {
      title: "Open",
      payer,
      participants: [{ participantId: debtor.participantId, owedMinor: 500 }],
    });
    await createBill(db, {
      title: "Closed",
      payer,
      participants: [{ participantId: debtor.participantId, owedMinor: 500, status: "paid" }],
    });

    const listed = await createCaller(db, payer).bill.list({ status: "settled" });

    expect(listed.items.map((item) => item.title)).toEqual(["Closed"]);
  });

  test("hands back a cursor when there is another page", async () => {
    const payer = await createPerson(db, { email: "ana@example.com" });
    const debtor = await createPerson(db, { email: "ben@example.com" });
    await createBill(db, {
      title: "First",
      payer,
      occurredAt: new Date(Date.UTC(2026, 0, 1)),
      participants: [{ participantId: debtor.participantId, owedMinor: 500 }],
    });
    await createBill(db, {
      title: "Second",
      payer,
      occurredAt: new Date(Date.UTC(2026, 0, 2)),
      participants: [{ participantId: debtor.participantId, owedMinor: 500 }],
    });

    const caller = createCaller(db, payer);
    const firstPage = await caller.bill.list({ limit: 1 });

    expect(firstPage.items.map((item) => item.title)).toEqual(["Second"]);
    expect(firstPage.nextCursor).not.toBeNull();

    const secondPage = await caller.bill.list({ limit: 1, cursor: firstPage.nextCursor });

    expect(secondPage.items.map((item) => item.title)).toEqual(["First"]);
    expect(secondPage.nextCursor).toBeNull();
  });

  test("returns nothing for a caller with no participant record", async () => {
    const payer = await createPerson(db, { email: "ana@example.com" });
    await createBill(db, { payer, participants: [] });

    const stranger = await createPerson(db, { email: "cara@example.com" });
    await db.delete(participant).where(eq(participant.id, stranger.participantId));

    const listed = await createCaller(db, stranger).bill.list({});

    expect(listed).toEqual({ items: [], nextCursor: null });
  });
});

describe("bill.update", () => {
  test("settles the bill once every share is paid", async () => {
    const payer = await createPerson(db, { email: "ana@example.com" });
    const debtor = await createPerson(db, { email: "ben@example.com" });
    const seeded = await createBill(db, {
      payer,
      participants: [{ participantId: debtor.participantId, owedMinor: 500 }],
    });

    const updated = await createCaller(db, payer).bill.update({
      id: seeded.id,
      participants: [{ id: debtor.participantId, status: "paid" }],
    });

    expect(updated.status).toBe("settled");

    const [stored] = await db.select().from(bill).where(eq(bill.id, seeded.id));

    expect(stored?.status).toBe("settled");
    expect(stored?.settledAt).not.toBeNull();
  });

  test("rejects a participant who is not on the bill", async () => {
    const payer = await createPerson(db, { email: "ana@example.com" });
    const debtor = await createPerson(db, { email: "ben@example.com" });
    const stranger = await createPerson(db, { email: "cara@example.com" });
    const seeded = await createBill(db, {
      payer,
      participants: [{ participantId: debtor.participantId, owedMinor: 500 }],
    });

    const error = await createCaller(db, payer)
      .bill.update({
        id: seeded.id,
        participants: [{ id: stranger.participantId, status: "paid" }],
      })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TRPCError);
    expect((error as TRPCError).code).toBe("BAD_REQUEST");
  });
});
