import { afterEach, describe, expect, test } from "bun:test";
import { expense, expenseParticipant } from "@zius/db/schema/expenses";

import { addCaller, closeTestDatabases, createAnonymousCaller, createCaller } from "../testing";

afterEach(closeTestDatabases);

describe("groups membership management", () => {
  test("owner can add a resolved person as an active member", async () => {
    const { caller } = await createCaller("owner", "Owner", "owner@example.com");
    const guest = await caller.people.resolve({
      displayName: "Member",
      email: "member@example.com",
    });
    const group = await caller.groups.create({ name: "Trip", defaultCurrency: "PHP" });

    const membership = await caller.groups.addMember({ groupId: group.id, personId: guest.id });

    expect(membership).toMatchObject({
      groupId: group.id,
      personId: guest.id,
      role: "member",
      removedAt: null,
    });
    expect((await caller.groups.get({ id: group.id })).members).toContainEqual(
      expect.objectContaining({ id: guest.id, role: "member" }),
    );
  });

  test("removing a member retains their existing expense participation", async () => {
    const { caller, db } = await createCaller("owner", "Owner", "owner@example.com");
    const guest = await caller.people.resolve({
      displayName: "Member",
      email: "member@example.com",
    });
    const group = await caller.groups.create({ name: "Trip", defaultCurrency: "PHP" });
    await caller.groups.addMember({ groupId: group.id, personId: guest.id });
    const owner = (await caller.groups.get({ id: group.id })).members.find(
      ({ role }) => role === "owner",
    );

    if (!owner) {
      throw new Error("Expected the group owner membership");
    }

    const expenseId = "hotel-expense";
    await db.insert(expense).values({
      id: expenseId,
      groupId: group.id,
      createdById: "owner",
      title: "Hotel",
      totalMinor: 10_000,
      currency: "PHP",
      splitMethod: "exact",
    });
    await db.insert(expenseParticipant).values([
      { expenseId, personId: owner.id, paidMinor: 10_000, owedMinor: 0 },
      { expenseId, personId: guest.id, paidMinor: 0, owedMinor: 10_000 },
    ]);

    const removed = await caller.groups.removeMember({
      groupId: group.id,
      personId: guest.id,
    });

    expect(removed.removedAt).toBeInstanceOf(Date);
    expect((await caller.groups.get({ id: group.id })).members).not.toContainEqual(
      expect.objectContaining({ id: guest.id }),
    );
    expect(await db.select().from(expenseParticipant)).toContainEqual(
      expect.objectContaining({ expenseId, personId: guest.id, owedMinor: 10_000 }),
    );
  });

  test("adding an active member is idempotent", async () => {
    const { caller } = await createCaller("owner", "Owner", "owner@example.com");
    const guest = await caller.people.resolve({
      displayName: "Member",
      email: "member@example.com",
    });
    const group = await caller.groups.create({ name: "Trip", defaultCurrency: "PHP" });

    const firstMembership = await caller.groups.addMember({
      groupId: group.id,
      personId: guest.id,
    });
    const secondMembership = await caller.groups.addMember({
      groupId: group.id,
      personId: guest.id,
    });
    const matchingMembers = (await caller.groups.get({ id: group.id })).members.filter(
      ({ id }) => id === guest.id,
    );

    expect(secondMembership.joinedAt).toEqual(firstMembership.joinedAt);
    expect(matchingMembers).toHaveLength(1);
  });

  test("adding a removed member restores the existing membership", async () => {
    const { caller } = await createCaller("owner", "Owner", "owner@example.com");
    const guest = await caller.people.resolve({
      displayName: "Member",
      email: "member@example.com",
    });
    const group = await caller.groups.create({ name: "Trip", defaultCurrency: "PHP" });
    const originalMembership = await caller.groups.addMember({
      groupId: group.id,
      personId: guest.id,
    });
    await caller.groups.removeMember({ groupId: group.id, personId: guest.id });

    const restoredMembership = await caller.groups.addMember({
      groupId: group.id,
      personId: guest.id,
    });

    expect(restoredMembership).toMatchObject({
      groupId: group.id,
      personId: guest.id,
      role: "member",
      removedAt: null,
    });
    expect(restoredMembership.joinedAt).toEqual(originalMembership.joinedAt);
  });

  test("regular members and outsiders cannot manage memberships", async () => {
    const { caller: ownerCaller, db } = await createCaller("owner", "Owner", "owner@example.com");
    const memberCaller = await addCaller(db, "member", "Member", "member@example.com");
    const outsiderCaller = await addCaller(db, "outsider", "Outsider", "outsider@example.com");
    const member = await memberCaller.people.resolve({
      displayName: "Member",
      email: "member@example.com",
    });
    const outsider = await outsiderCaller.people.resolve({
      displayName: "Outsider",
      email: "outsider@example.com",
    });
    const group = await ownerCaller.groups.create({ name: "Trip", defaultCurrency: "PHP" });
    await ownerCaller.groups.addMember({ groupId: group.id, personId: member.id });

    await expect(
      memberCaller.groups.addMember({ groupId: group.id, personId: outsider.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      memberCaller.groups.removeMember({ groupId: group.id, personId: member.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      outsiderCaller.groups.addMember({ groupId: group.id, personId: outsider.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      outsiderCaller.groups.removeMember({ groupId: group.id, personId: member.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("missing groups and people return typed errors", async () => {
    const { caller } = await createCaller("owner", "Owner", "owner@example.com");
    const guest = await caller.people.resolve({
      displayName: "Member",
      email: "member@example.com",
    });
    const group = await caller.groups.create({ name: "Trip", defaultCurrency: "PHP" });

    await expect(
      caller.groups.addMember({ groupId: "missing-group", personId: guest.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      caller.groups.removeMember({ groupId: "missing-group", personId: guest.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      caller.groups.addMember({ groupId: group.id, personId: "missing-person" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      caller.groups.removeMember({ groupId: group.id, personId: "missing-person" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("the owner cannot remove their owner membership", async () => {
    const { caller } = await createCaller("owner", "Owner", "owner@example.com");
    const group = await caller.groups.create({ name: "Trip", defaultCurrency: "PHP" });
    const owner = (await caller.groups.get({ id: group.id })).members.find(
      ({ role }) => role === "owner",
    );

    if (!owner) {
      throw new Error("Expected the group owner membership");
    }

    await expect(
      caller.groups.removeMember({ groupId: group.id, personId: owner.id }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect((await caller.groups.get({ id: group.id })).members).toContainEqual(
      expect.objectContaining({ id: owner.id, role: "owner" }),
    );
  });

  test("membership management requires authentication", async () => {
    const caller = await createAnonymousCaller();

    await expect(
      caller.groups.addMember({ groupId: "group", personId: "person" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller.groups.removeMember({ groupId: "group", personId: "person" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
