import { beforeEach, describe, expect, test } from "bun:test";

import type { Database } from "@zius/db";
import { expense, expenseParticipant, group } from "@zius/db/schema/expense";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { createCaller } from "./support/caller";
import { getTestDatabase, resetTestDatabase } from "./support/database";
import { createExpense, createGroup, createPerson } from "./support/fixtures";

let db: Database;

beforeEach(async () => {
  db = await getTestDatabase();
  await resetTestDatabase(db);
});

async function expectCode(operation: Promise<unknown>, code: TRPCError["code"]) {
  const error = await operation.catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe(code);
}

describe("group archive and restore", () => {
  test("is owner-only and exposes active, archived, and all views", async () => {
    const owner = await createPerson(db, { name: "Ana", email: "ana@example.com" });
    const member = await createPerson(db, { name: "Ben", email: "ben@example.com" });
    const outsider = await createPerson(db, { name: "Cara", email: "cara@example.com" });
    const created = await createGroup(db, {
      name: "Flatmates",
      owner,
      members: [{ participantId: member.participantId }],
    });
    const activeGroup = await createGroup(db, {
      name: "Current flatmates",
      owner,
      members: [{ participantId: member.participantId }],
    });

    const ownerCaller = createCaller(db, owner);
    const memberCaller = createCaller(db, member);
    const outsiderCaller = createCaller(db, outsider);

    await expectCode(memberCaller.group.archive({ id: created.id }), "FORBIDDEN");
    await expectCode(outsiderCaller.group.archive({ id: created.id }), "NOT_FOUND");

    const ownerBeforeArchive = await ownerCaller.group.list({});
    expect(ownerBeforeArchive.items.map((item) => item.id)).toEqual(
      expect.arrayContaining([created.id, activeGroup.id]),
    );
    expect(ownerBeforeArchive.items).toHaveLength(2);

    const [beforeArchive] = await db.select().from(group).where(eq(group.id, created.id));
    expect(beforeArchive?.archivedAt).toBeNull();

    const archived = await ownerCaller.group.archive({ id: created.id });
    expect(archived).toMatchObject({ id: created.id, name: "Flatmates" });
    expect(archived.archivedAt).not.toBeNull();

    const ownerActiveGroups = await ownerCaller.group.list({});
    expect(ownerActiveGroups.items.map((item) => item.id)).toEqual([activeGroup.id]);

    const memberActiveGroups = await memberCaller.group.list({});
    expect(memberActiveGroups.items.map((item) => item.id)).toEqual([activeGroup.id]);

    const archivedGroups = await ownerCaller.group.list({ status: "archived" });
    expect(archivedGroups.items).toHaveLength(1);
    expect(archivedGroups.items[0]).toMatchObject({
      id: created.id,
      name: "Flatmates",
    });
    expect(archivedGroups.items[0]?.archivedAt).not.toBeNull();

    const allGroups = await ownerCaller.group.list({ status: "all" });
    expect(allGroups.items.map((item) => item.id)).toEqual(
      expect.arrayContaining([created.id, activeGroup.id]),
    );
    expect(allGroups.items).toHaveLength(2);

    const archivedDetail = await memberCaller.group.get({ id: created.id });
    expect(archivedDetail).toMatchObject({
      id: created.id,
      name: "Flatmates",
    });
    expect(archivedDetail.archivedAt).not.toBeNull();

    await expectCode(memberCaller.group.restore({ id: created.id }), "FORBIDDEN");
    await expectCode(outsiderCaller.group.restore({ id: created.id }), "NOT_FOUND");

    const restored = await ownerCaller.group.restore({ id: created.id });
    expect(restored).toMatchObject({ id: created.id, name: "Flatmates", archivedAt: null });
    const ownerAfterRestore = await ownerCaller.group.list({});
    expect(ownerAfterRestore.items.map((item) => item.id)).toEqual(
      expect.arrayContaining([created.id, activeGroup.id]),
    );
    expect(ownerAfterRestore.items).toHaveLength(2);

    const memberAfterRestore = await memberCaller.group.list({});
    expect(memberAfterRestore.items.map((item) => item.id)).toEqual(
      expect.arrayContaining([created.id, activeGroup.id]),
    );
    expect(memberAfterRestore.items).toHaveLength(2);
  });

  test("rejects rename and expense creation while archived, then permits both after restore", async () => {
    const owner = await createPerson(db, { name: "Ana", email: "ana@example.com" });
    const member = await createPerson(db, { name: "Ben", email: "ben@example.com" });
    const created = await createGroup(db, {
      name: "Flatmates",
      owner,
      members: [{ participantId: member.participantId }],
    });
    const caller = createCaller(db, owner);

    await caller.group.archive({ id: created.id });

    await expectCode(caller.group.update({ id: created.id, name: "Archived name" }), "CONFLICT");
    await expectCode(
      caller.expense.create({
        title: "Dinner",
        totalMinor: 1000,
        splitMethod: "equal",
        payer: owner.email,
        groupId: created.id,
        occurredAt: Date.UTC(2026, 0, 15),
        participants: [
          { name: owner.name, email: owner.email, owedMinor: 0 },
          { name: member.name, email: member.email, owedMinor: 0 },
        ],
      }),
      "CONFLICT",
    );

    expect(await db.select().from(expense).where(eq(expense.groupId, created.id))).toHaveLength(0);

    await caller.group.restore({ id: created.id });

    const renamed = await caller.group.update({ id: created.id, name: "Restored name" });
    expect(renamed).toMatchObject({ id: created.id, name: "Restored name", archivedAt: null });

    const createdExpense = await caller.expense.create({
      title: "Dinner",
      totalMinor: 1000,
      splitMethod: "equal",
      payer: owner.email,
      groupId: created.id,
      occurredAt: Date.UTC(2026, 0, 15),
      participants: [
        { name: owner.name, email: owner.email, owedMinor: 0 },
        { name: member.name, email: member.email, owedMinor: 0 },
      ],
    });
    expect(createdExpense.status).toBe("active");

    const [storedExpense] = await db
      .select()
      .from(expense)
      .where(eq(expense.id, createdExpense.id));
    expect(storedExpense?.groupId).toBe(created.id);
  });
});

describe("expense cancellation", () => {
  test("allows the recorder to cancel even when they are not in the split", async () => {
    const payer = await createPerson(db, { name: "Ana", email: "ana@example.com" });
    const debtor = await createPerson(db, { name: "Ben", email: "ben@example.com" });
    const otherDebtor = await createPerson(db, { name: "Cara", email: "cara@example.com" });
    const recorder = await createPerson(db, { name: "Dan", email: "dan@example.com" });
    const outsider = await createPerson(db, { name: "Eli", email: "eli@example.com" });
    const seeded = await createExpense(db, {
      title: "Dinner",
      totalMinor: 1000,
      payer,
      createdBy: recorder,
      occurredAt: new Date(Date.UTC(2026, 0, 15)),
      participants: [
        { participantId: debtor.participantId, owedMinor: 400 },
        { participantId: otherDebtor.participantId, owedMinor: 600 },
      ],
    });
    const activeSibling = await createExpense(db, {
      title: "Open lunch",
      payer,
      occurredAt: new Date(Date.UTC(2026, 0, 13)),
      participants: [{ participantId: debtor.participantId, owedMinor: 300 }],
    });
    const settledSibling = await createExpense(db, {
      title: "Settled lunch",
      payer,
      occurredAt: new Date(Date.UTC(2026, 0, 14)),
      participants: [{ participantId: otherDebtor.participantId, owedMinor: 300, status: "paid" }],
    });

    const payerCaller = createCaller(db, payer);
    const debtorCaller = createCaller(db, debtor);
    const recorderCaller = createCaller(db, recorder);
    const outsiderCaller = createCaller(db, outsider);

    const recorderBeforeCancel = await recorderCaller.expense.get({ id: seeded.id });
    expect(recorderBeforeCancel).toMatchObject({
      id: seeded.id,
      createdByUserId: recorder.userId,
      canCancel: true,
      cancelledAt: null,
      cancelledBy: null,
    });

    await expectCode(payerCaller.expense.cancel({ id: seeded.id }), "FORBIDDEN");
    await expectCode(debtorCaller.expense.cancel({ id: seeded.id }), "FORBIDDEN");
    await expectCode(outsiderCaller.expense.cancel({ id: seeded.id }), "FORBIDDEN");
    await expectCode(outsiderCaller.expense.get({ id: seeded.id }), "NOT_FOUND");

    const cancelled = await recorderCaller.expense.cancel({ id: seeded.id });
    expect(cancelled).toMatchObject({ id: seeded.id, status: "cancelled" });

    const [stored] = await db.select().from(expense).where(eq(expense.id, seeded.id));
    expect(stored).toMatchObject({
      status: "cancelled",
      settledAt: null,
      cancelledByUserId: recorder.userId,
    });
    expect(stored?.cancelledAt).not.toBeNull();

    const detail = await recorderCaller.expense.get({ id: seeded.id });
    expect(detail).toMatchObject({
      id: seeded.id,
      status: "cancelled",
      canCancel: false,
      cancelledBy: { id: recorder.userId, name: recorder.name },
      cancelledByUserId: recorder.userId,
      createdByUserId: recorder.userId,
    });
    expect(detail.cancelledAt).not.toBeNull();

    const listed = await payerCaller.expense.list({ status: "cancelled" });
    expect(listed.items).toHaveLength(1);
    expect(listed.items[0]).toMatchObject({
      id: seeded.id,
      title: "Dinner",
      status: "cancelled",
      settledAt: null,
      cancelledByUserId: recorder.userId,
      createdByUserId: recorder.userId,
    });
    expect(listed.items[0]?.cancelledAt).not.toBeNull();

    const activeOnly = await payerCaller.expense.list({ status: "active" });
    expect(activeOnly.items.map((item) => item.id)).toEqual([activeSibling.id]);

    const settledOnly = await payerCaller.expense.list({ status: "settled" });
    expect(settledOnly.items.map((item) => item.id)).toEqual([settledSibling.id]);

    const all = await payerCaller.expense.list({});
    expect(all.items.map((item) => item.id)).toEqual(
      expect.arrayContaining([activeSibling.id, settledSibling.id, seeded.id]),
    );
    expect(all.items).toHaveLength(3);
  });

  test("rejects settled and repeated cancellation, preserves payments, and blocks resurrection", async () => {
    const payer = await createPerson(db, { name: "Ana", email: "ana@example.com" });
    const paidParticipant = await createPerson(db, { name: "Ben", email: "ben@example.com" });
    const unpaidParticipant = await createPerson(db, { name: "Cara", email: "cara@example.com" });
    const recorder = await createPerson(db, { name: "Dan", email: "dan@example.com" });
    const payerCaller = createCaller(db, payer);
    const recorderCaller = createCaller(db, recorder);

    const settled = await createExpense(db, {
      title: "Settled dinner",
      payer,
      createdBy: recorder,
      participants: [
        { participantId: paidParticipant.participantId, owedMinor: 500, status: "paid" },
      ],
    });
    await expectCode(recorderCaller.expense.cancel({ id: settled.id }), "CONFLICT");

    const active = await createExpense(db, {
      title: "Open dinner",
      payer,
      createdBy: recorder,
      participants: [
        { participantId: paidParticipant.participantId, owedMinor: 250, status: "paid" },
        { participantId: unpaidParticipant.participantId, owedMinor: 250 },
      ],
    });
    const beforeRows = await db
      .select()
      .from(expenseParticipant)
      .where(eq(expenseParticipant.expenseId, active.id));
    const beforePayments = beforeRows.map((row) => ({
      participantId: row.participantId,
      status: row.status,
      paidAt: row.paidAt?.toISOString() ?? null,
    }));

    await recorderCaller.expense.cancel({ id: active.id });
    await expectCode(recorderCaller.expense.cancel({ id: active.id }), "CONFLICT");
    await expectCode(
      payerCaller.expense.update({
        id: active.id,
        participants: [{ id: unpaidParticipant.participantId, status: "paid" }],
      }),
      "CONFLICT",
    );

    const afterRows = await db
      .select()
      .from(expenseParticipant)
      .where(eq(expenseParticipant.expenseId, active.id));
    expect(
      afterRows.map((row) => ({
        participantId: row.participantId,
        status: row.status,
        paidAt: row.paidAt?.toISOString() ?? null,
      })),
    ).toEqual(beforePayments);

    const [stored] = await db.select().from(expense).where(eq(expense.id, active.id));
    expect(stored?.status).toBe("cancelled");
    expect(stored?.settledAt).toBeNull();
    expect(stored?.cancelledAt).not.toBeNull();
    expect(stored?.cancelledByUserId).toBe(recorder.userId);
  });

  test("keeps archived-group payment and cancellation available to the group owner", async () => {
    const owner = await createPerson(db, { name: "Ana", email: "ana@example.com" });
    const member = await createPerson(db, { name: "Ben", email: "ben@example.com" });
    const guest = await createPerson(db, { name: "Cara", email: "cara@example.com" });
    const archivedGroup = await createGroup(db, {
      name: "Trip",
      owner,
      members: [{ participantId: member.participantId }],
    });
    const payment = await createExpense(db, {
      title: "Hotel payment",
      payer: owner,
      groupId: archivedGroup.id,
      participants: [{ participantId: member.participantId, owedMinor: 500 }],
    });
    const ownerOnlyExpense = await createExpense(db, {
      title: "Car rental",
      payer: member,
      groupId: archivedGroup.id,
      createdBy: member,
      participants: [{ participantId: guest.participantId, owedMinor: 500 }],
    });
    const memberForbiddenExpense = await createExpense(db, {
      title: "Member cannot cancel",
      payer: owner,
      groupId: archivedGroup.id,
      createdBy: owner,
      participants: [{ participantId: member.participantId, owedMinor: 500 }],
    });
    const ownerCaller = createCaller(db, owner);
    const memberCaller = createCaller(db, member);

    await ownerCaller.group.archive({ id: archivedGroup.id });

    const archivedDetail = await ownerCaller.expense.get({ id: ownerOnlyExpense.id });
    expect(archivedDetail).toMatchObject({
      id: ownerOnlyExpense.id,
      groupId: archivedGroup.id,
      canCancel: true,
      status: "active",
    });

    await expectCode(memberCaller.expense.cancel({ id: memberForbiddenExpense.id }), "FORBIDDEN");
    const [refused] = await db
      .select()
      .from(expense)
      .where(eq(expense.id, memberForbiddenExpense.id));
    expect(refused?.status).toBe("active");

    const paid = await memberCaller.expense.update({
      id: payment.id,
      participants: [{ id: member.participantId, status: "paid" }],
    });
    expect(paid).toMatchObject({ id: payment.id, status: "settled" });

    const cancelled = await ownerCaller.expense.cancel({ id: ownerOnlyExpense.id });
    expect(cancelled).toMatchObject({ id: ownerOnlyExpense.id, status: "cancelled" });

    const groupDetail = await ownerCaller.group.get({ id: archivedGroup.id });
    expect(groupDetail.archivedAt).not.toBeNull();
    expect(groupDetail.expenses).toContainEqual(
      expect.objectContaining({
        id: ownerOnlyExpense.id,
        status: "cancelled",
        cancelledByUserId: owner.userId,
        createdByUserId: member.userId,
      }),
    );
  });
});

describe("dashboard archive and cancellation behavior", () => {
  test("includes archived debts in both balances while removing archived and cancelled activity", async () => {
    const ana = await createPerson(db, { name: "Ana", email: "ana@example.com" });
    const ben = await createPerson(db, { name: "Ben", email: "ben@example.com" });
    const activeGroup = await createGroup(db, {
      name: "Active group",
      owner: ana,
      members: [{ participantId: ben.participantId }],
    });
    const archivedGroup = await createGroup(db, {
      name: "Archived group",
      owner: ana,
      members: [{ participantId: ben.participantId }],
    });
    const caller = createCaller(db, ana);

    await createExpense(db, {
      title: "Active group debt",
      totalMinor: 1000,
      payer: ana,
      groupId: activeGroup.id,
      occurredAt: new Date(Date.UTC(2026, 0, 1)),
      participants: [{ participantId: ben.participantId, owedMinor: 300 }],
    });
    await createExpense(db, {
      title: "Settled active group",
      totalMinor: 500,
      payer: ana,
      groupId: activeGroup.id,
      occurredAt: new Date(Date.UTC(2026, 0, 2)),
      participants: [{ participantId: ben.participantId, owedMinor: 500, status: "paid" }],
    });
    await createExpense(db, {
      title: "Archived debt to Ana",
      totalMinor: 600,
      payer: ana,
      groupId: archivedGroup.id,
      occurredAt: new Date(Date.UTC(2026, 0, 3)),
      participants: [{ participantId: ben.participantId, owedMinor: 500 }],
    });
    await createExpense(db, {
      title: "Archived debt from Ana",
      totalMinor: 500,
      payer: ben,
      groupId: archivedGroup.id,
      occurredAt: new Date(Date.UTC(2026, 0, 4)),
      participants: [{ participantId: ana.participantId, owedMinor: 200 }],
    });
    await createExpense(db, {
      title: "Settled non-group",
      totalMinor: 400,
      payer: ana,
      occurredAt: new Date(Date.UTC(2026, 0, 5)),
      participants: [{ participantId: ben.participantId, owedMinor: 400, status: "paid" }],
    });
    const cancelled = await createExpense(db, {
      title: "Cancelled non-group",
      totalMinor: 700,
      payer: ana,
      occurredAt: new Date(Date.UTC(2026, 0, 6)),
      participants: [{ participantId: ben.participantId, owedMinor: 700 }],
    });
    const cancelledPayable = await createExpense(db, {
      title: "Cancelled payable",
      totalMinor: 350,
      payer: ben,
      createdBy: ana,
      occurredAt: new Date(Date.UTC(2026, 0, 7)),
      participants: [{ participantId: ana.participantId, owedMinor: 350 }],
    });

    await caller.expense.cancel({ id: cancelled.id });
    await caller.expense.cancel({ id: cancelledPayable.id });
    await caller.group.archive({ id: archivedGroup.id });

    const dashboard = await caller.dashboard.get();

    expect(dashboard.balance).toEqual({
      owedToYouMinor: 800,
      youOweMinor: 200,
      netMinor: 600,
      currency: "PHP",
    });

    expect(dashboard.activeExpenses.map((entry) => entry.title)).toEqual(["Active group debt"]);
    expect(dashboard.recentExpenses.map((entry) => entry.title)).toEqual([
      "Settled non-group",
      "Settled active group",
      "Active group debt",
    ]);
    expect(dashboard.recentExpenses.every((entry) => entry.status !== "cancelled")).toBe(true);
  });
});
