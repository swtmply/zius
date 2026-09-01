import { afterEach, describe, expect, test } from "bun:test";
import { expenseParticipant } from "@zius/db/schema/expenses";
import { eq } from "drizzle-orm";

import { addCaller, closeTestDatabases, createCaller, type TestCaller } from "../testing";

afterEach(closeTestDatabases);

async function currentPerson(caller: TestCaller, displayName: string, email: string) {
  return caller.people.resolve({ displayName, email });
}

async function groupFixture() {
  const { caller: ownerCaller, db } = await createCaller("owner", "Owner", "owner@example.com");
  const memberCaller = await addCaller(db, "member", "Member", "member@example.com");
  const outsiderCaller = await addCaller(db, "outsider", "Outsider", "outsider@example.com");

  const group = await ownerCaller.groups.create({ name: "Trip", defaultCurrency: "PHP" });
  const owner = await currentPerson(ownerCaller, "Owner", "owner@example.com");
  const member = await currentPerson(memberCaller, "Member", "member@example.com");
  const outsider = await currentPerson(outsiderCaller, "Outsider", "outsider@example.com");
  const guest = await ownerCaller.people.resolve({
    displayName: "Guest",
    email: "guest@example.com",
  });

  await ownerCaller.groups.addMember({ groupId: group.id, personId: member.id });
  await ownerCaller.groups.addMember({ groupId: group.id, personId: guest.id });

  return { db, group, ownerCaller, memberCaller, outsiderCaller, owner, member, outsider, guest };
}

type ExpenseInputOverrides = {
  groupId?: string | null;
  title?: string;
  currency?: string;
  participants?: { personId: string; paidMinor: number; owedMinor: number }[];
};

function expenseInput(overrides: ExpenseInputOverrides = {}) {
  return {
    groupId: null,
    title: "Dinner",
    totalMinor: 10_000,
    currency: "PHP",
    splitMethod: "exact" as const,
    participants: [],
    ...overrides,
  };
}

function evenSplit(payerPersonId: string, otherPersonId: string) {
  return [
    { personId: payerPersonId, paidMinor: 10_000, owedMinor: 5_000 },
    { personId: otherPersonId, paidMinor: 0, owedMinor: 5_000 },
  ];
}

describe("group expense creation", () => {
  test("an active member records a group expense in the group currency", async () => {
    const { group, memberCaller, owner, member } = await groupFixture();

    const created = await memberCaller.expenses.create(
      expenseInput({ groupId: group.id, participants: evenSplit(member.id, owner.id) }),
    );

    expect(created).toMatchObject({
      groupId: group.id,
      currency: "PHP",
      status: "active",
      createdById: "member",
    });
    expect(created.participants).toHaveLength(2);
  });

  test("a person without an active membership cannot record a group expense", async () => {
    const { group, ownerCaller, memberCaller, outsiderCaller, owner, member } =
      await groupFixture();

    await expect(
      outsiderCaller.expenses.create(
        expenseInput({ groupId: group.id, participants: evenSplit(owner.id, member.id) }),
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    await ownerCaller.groups.removeMember({ groupId: group.id, personId: member.id });

    await expect(
      memberCaller.expenses.create(
        expenseInput({ groupId: group.id, participants: evenSplit(owner.id, member.id) }),
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("every participant must hold an active membership", async () => {
    const { group, ownerCaller, owner, member, outsider } = await groupFixture();

    await expect(
      ownerCaller.expenses.create(
        expenseInput({ groupId: group.id, participants: evenSplit(owner.id, outsider.id) }),
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    await ownerCaller.groups.removeMember({ groupId: group.id, personId: member.id });

    await expect(
      ownerCaller.expenses.create(
        expenseInput({ groupId: group.id, participants: evenSplit(owner.id, member.id) }),
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("a group expense must use the group default currency", async () => {
    const { group, ownerCaller, owner, member } = await groupFixture();

    await expect(
      ownerCaller.expenses.create(
        expenseInput({
          groupId: group.id,
          currency: "USD",
          participants: evenSplit(owner.id, member.id),
        }),
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("a missing group returns a typed error", async () => {
    const { ownerCaller, owner, member } = await groupFixture();

    await expect(
      ownerCaller.expenses.create(
        expenseInput({ groupId: "missing-group", participants: evenSplit(owner.id, member.id) }),
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(ownerCaller.expenses.list({ groupId: "missing-group" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("group expense visibility", () => {
  test("active members list and view every expense in the group", async () => {
    const { group, ownerCaller, memberCaller, owner, guest } = await groupFixture();

    const created = await ownerCaller.expenses.create(
      expenseInput({ groupId: group.id, participants: evenSplit(owner.id, guest.id) }),
    );

    expect(await memberCaller.expenses.get({ id: created.id })).toMatchObject({ id: created.id });
    expect(await memberCaller.expenses.list()).toContainEqual(
      expect.objectContaining({ id: created.id }),
    );
  });

  test("an outsider cannot view a group expense", async () => {
    const { group, ownerCaller, outsiderCaller, owner, guest } = await groupFixture();

    const created = await ownerCaller.expenses.create(
      expenseInput({ groupId: group.id, participants: evenSplit(owner.id, guest.id) }),
    );

    await expect(outsiderCaller.expenses.get({ id: created.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(await outsiderCaller.expenses.list()).toHaveLength(0);
  });

  test("a removed member keeps access only to their claimed participation", async () => {
    const { group, ownerCaller, memberCaller, owner, member, guest } = await groupFixture();

    const participating = await ownerCaller.expenses.create(
      expenseInput({
        groupId: group.id,
        title: "Hotel",
        participants: evenSplit(owner.id, member.id),
      }),
    );
    const groupWide = await ownerCaller.expenses.create(
      expenseInput({
        groupId: group.id,
        title: "Taxi",
        participants: evenSplit(owner.id, guest.id),
      }),
    );

    await ownerCaller.groups.removeMember({ groupId: group.id, personId: member.id });

    expect(await memberCaller.expenses.get({ id: participating.id })).toMatchObject({
      id: participating.id,
    });
    await expect(memberCaller.expenses.get({ id: groupWide.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(await memberCaller.expenses.list()).toEqual([
      expect.objectContaining({ id: participating.id }),
    ]);
  });

  test("the expense creator keeps access to what they recorded", async () => {
    const { group, ownerCaller, memberCaller, owner, guest, member } = await groupFixture();

    const recorded = await memberCaller.expenses.create(
      expenseInput({ groupId: group.id, participants: evenSplit(owner.id, guest.id) }),
    );

    await ownerCaller.groups.removeMember({ groupId: group.id, personId: member.id });

    expect(await memberCaller.expenses.get({ id: recorded.id })).toMatchObject({ id: recorded.id });
    expect(await memberCaller.expenses.list()).toContainEqual(
      expect.objectContaining({ id: recorded.id }),
    );
  });

  test("list filters by group identifier", async () => {
    const { group, ownerCaller, owner, member } = await groupFixture();

    const groupExpense = await ownerCaller.expenses.create(
      expenseInput({
        groupId: group.id,
        title: "Hotel",
        participants: evenSplit(owner.id, member.id),
      }),
    );
    const soloExpense = await ownerCaller.expenses.create(
      expenseInput({ title: "Coffee", participants: evenSplit(owner.id, member.id) }),
    );

    expect(await ownerCaller.expenses.list({ groupId: group.id })).toEqual([
      expect.objectContaining({ id: groupExpense.id }),
    ]);
    expect(await ownerCaller.expenses.list()).toHaveLength(2);
    expect(await ownerCaller.expenses.list()).toContainEqual(
      expect.objectContaining({ id: soloExpense.id }),
    );
  });

  test("a removed member can still filter to their claimed group expenses", async () => {
    const { group, ownerCaller, memberCaller, owner, member, guest } = await groupFixture();

    const participating = await ownerCaller.expenses.create(
      expenseInput({
        groupId: group.id,
        title: "Hotel",
        participants: evenSplit(owner.id, member.id),
      }),
    );
    await ownerCaller.expenses.create(
      expenseInput({
        groupId: group.id,
        title: "Taxi",
        participants: evenSplit(owner.id, guest.id),
      }),
    );

    await ownerCaller.groups.removeMember({ groupId: group.id, personId: member.id });

    expect(await memberCaller.expenses.list({ groupId: group.id })).toEqual([
      expect.objectContaining({ id: participating.id }),
    ]);
  });
});

describe("group expense updates", () => {
  test("the creator replaces participants atomically", async () => {
    const { db, group, memberCaller, owner, member, guest } = await groupFixture();

    const created = await memberCaller.expenses.create(
      expenseInput({ groupId: group.id, participants: evenSplit(member.id, owner.id) }),
    );

    const updated = await memberCaller.expenses.update({
      ...expenseInput({
        groupId: group.id,
        title: "Dinner and drinks",
        participants: evenSplit(member.id, guest.id),
      }),
      id: created.id,
    });

    expect(updated).toMatchObject({ id: created.id, title: "Dinner and drinks" });
    expect(updated.participants.map(({ personId }) => personId).sort()).toEqual(
      [member.id, guest.id].sort(),
    );
    expect(
      await db
        .select()
        .from(expenseParticipant)
        .where(eq(expenseParticipant.expenseId, created.id)),
    ).toHaveLength(2);
  });

  test("the group owner updates and cancels a member's expense", async () => {
    const { group, ownerCaller, memberCaller, owner, member } = await groupFixture();

    const created = await memberCaller.expenses.create(
      expenseInput({ groupId: group.id, participants: evenSplit(member.id, owner.id) }),
    );

    const updated = await ownerCaller.expenses.update({
      ...expenseInput({
        groupId: group.id,
        title: "Corrected dinner",
        participants: evenSplit(owner.id, member.id),
      }),
      id: created.id,
    });
    expect(updated).toMatchObject({ title: "Corrected dinner" });

    const cancelled = await ownerCaller.expenses.cancel({ id: created.id });
    expect(cancelled).toMatchObject({ status: "cancelled" });
  });

  test("a regular member cannot change another person's expense", async () => {
    const { db, group, ownerCaller, memberCaller, owner, member } = await groupFixture();
    const otherCaller = await addCaller(db, "other", "Other", "other@example.com");
    const other = await otherCaller.people.resolve({
      displayName: "Other",
      email: "other@example.com",
    });
    await ownerCaller.groups.addMember({ groupId: group.id, personId: other.id });

    const created = await memberCaller.expenses.create(
      expenseInput({ groupId: group.id, participants: evenSplit(member.id, owner.id) }),
    );

    await expect(
      otherCaller.expenses.update({
        ...expenseInput({ groupId: group.id, participants: evenSplit(other.id, owner.id) }),
        id: created.id,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(otherCaller.expenses.cancel({ id: created.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  test("updates enforce the group currency and participant memberships", async () => {
    const { group, ownerCaller, owner, member, outsider } = await groupFixture();

    const created = await ownerCaller.expenses.create(
      expenseInput({ groupId: group.id, participants: evenSplit(owner.id, member.id) }),
    );

    await expect(
      ownerCaller.expenses.update({
        ...expenseInput({
          groupId: group.id,
          currency: "USD",
          participants: evenSplit(owner.id, member.id),
        }),
        id: created.id,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      ownerCaller.expenses.update({
        ...expenseInput({ groupId: group.id, participants: evenSplit(owner.id, outsider.id) }),
        id: created.id,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect((await ownerCaller.expenses.get({ id: created.id })).participants).toHaveLength(2);
  });

  test("updates keep the paid and owed invariants", async () => {
    const { group, ownerCaller, owner, member } = await groupFixture();

    const created = await ownerCaller.expenses.create(
      expenseInput({ groupId: group.id, participants: evenSplit(owner.id, member.id) }),
    );

    await expect(
      ownerCaller.expenses.update({
        ...expenseInput({
          groupId: group.id,
          participants: [
            { personId: owner.id, paidMinor: 9_000, owedMinor: 5_000 },
            { personId: member.id, paidMinor: 0, owedMinor: 5_000 },
          ],
        }),
        id: created.id,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await ownerCaller.expenses.get({ id: created.id })).toMatchObject({
      totalMinor: 10_000,
    });
  });

  test("an outsider cannot change a group expense", async () => {
    const { group, ownerCaller, outsiderCaller, owner, member } = await groupFixture();

    const created = await ownerCaller.expenses.create(
      expenseInput({ groupId: group.id, participants: evenSplit(owner.id, member.id) }),
    );

    await expect(outsiderCaller.expenses.cancel({ id: created.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  test("an expense cannot move between groups", async () => {
    const { group, ownerCaller, owner, member } = await groupFixture();
    const otherGroup = await ownerCaller.groups.create({ name: "Office", defaultCurrency: "PHP" });

    const groupExpense = await ownerCaller.expenses.create(
      expenseInput({ groupId: group.id, participants: evenSplit(owner.id, member.id) }),
    );
    const soloExpense = await ownerCaller.expenses.create(
      expenseInput({ participants: evenSplit(owner.id, member.id) }),
    );

    await expect(
      ownerCaller.expenses.update({
        ...expenseInput({ groupId: otherGroup.id, participants: evenSplit(owner.id, member.id) }),
        id: groupExpense.id,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      ownerCaller.expenses.update({
        ...expenseInput({ groupId: null, participants: evenSplit(owner.id, member.id) }),
        id: groupExpense.id,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      ownerCaller.expenses.update({
        ...expenseInput({ groupId: group.id, participants: evenSplit(owner.id, member.id) }),
        id: soloExpense.id,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("group expense cancellation", () => {
  test("cancellation preserves the expense and participant history", async () => {
    const { db, group, ownerCaller, memberCaller, owner, member } = await groupFixture();

    const created = await memberCaller.expenses.create(
      expenseInput({ groupId: group.id, participants: evenSplit(member.id, owner.id) }),
    );

    const cancelled = await memberCaller.expenses.cancel({ id: created.id });

    expect(cancelled).toMatchObject({ id: created.id, status: "cancelled" });
    expect(cancelled.participants).toHaveLength(2);
    expect(
      await db
        .select()
        .from(expenseParticipant)
        .where(eq(expenseParticipant.expenseId, created.id)),
    ).toHaveLength(2);
    expect(await ownerCaller.expenses.list({ groupId: group.id })).toEqual([
      expect.objectContaining({ id: created.id, status: "cancelled" }),
    ]);
  });
});

describe("expenses without a group", () => {
  test("only the creator can update or cancel", async () => {
    const { ownerCaller, memberCaller, owner, member } = await groupFixture();

    const created = await ownerCaller.expenses.create(
      expenseInput({ participants: evenSplit(owner.id, member.id) }),
    );

    await expect(
      memberCaller.expenses.update({
        ...expenseInput({ participants: evenSplit(owner.id, member.id) }),
        id: created.id,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(memberCaller.expenses.cancel({ id: created.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  test("participants of any group can join an expense without a group", async () => {
    const { ownerCaller, outsiderCaller, owner, outsider } = await groupFixture();

    const created = await ownerCaller.expenses.create(
      expenseInput({ participants: evenSplit(owner.id, outsider.id) }),
    );

    expect(await outsiderCaller.expenses.get({ id: created.id })).toMatchObject({ id: created.id });
  });
});
