import type { Database } from "@zius/db";
import { user } from "@zius/db/schema/auth";
import {
  expense,
  expenseParticipant,
  group,
  groupMember,
  participant,
} from "@zius/db/schema/expense";

import type { Session } from "../../src/context";

export type Person = {
  userId: string;
  participantId: string;
  name: string;
  email: string;
  session: NonNullable<Session>;
};

export type PersonOptions = {
  name?: string;
  email?: string;
};

/**
 * A registered person: a user row, the participant row that claims it, and the
 * session a caller would arrive with. Sessions are plain data here — the auth
 * library is never exercised.
 */
export async function createPerson(db: Database, options: PersonOptions = {}): Promise<Person> {
  const userId = crypto.randomUUID();
  const name = options.name ?? `Person ${userId.slice(0, 8)}`;
  const email = options.email ?? `${userId}@example.com`;
  const now = new Date();

  await db.insert(user).values({
    id: userId,
    name,
    email,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  });

  const participantId = crypto.randomUUID();

  await db.insert(participant).values({
    id: participantId,
    userId,
    name,
    email,
    claimedAt: now,
  });

  return {
    userId,
    participantId,
    name,
    email,
    session: {
      session: {
        id: crypto.randomUUID(),
        token: crypto.randomUUID(),
        userId,
        expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
        createdAt: now,
        updatedAt: now,
        ipAddress: null,
        userAgent: null,
      },
      user: {
        id: userId,
        name,
        email,
        emailVerified: true,
        image: null,
        createdAt: now,
        updatedAt: now,
      },
    },
  };
}

/** A person with no account yet — the guest case. */
export async function createGuest(db: Database, options: PersonOptions = {}) {
  const participantId = crypto.randomUUID();
  const name = options.name ?? `Guest ${participantId.slice(0, 8)}`;
  const email = options.email ?? `${participantId}@example.com`;

  await db.insert(participant).values({ id: participantId, name, email });

  return { participantId, name, email };
}

export type GroupOptions = {
  name?: string;
  owner: Person;
  members?: Array<{ participantId: string }>;
};

export async function createGroup(db: Database, options: GroupOptions) {
  const id = crypto.randomUUID();
  const name = options.name ?? `Group ${id.slice(0, 8)}`;

  await db.insert(group).values({
    id,
    name,
    createdByUserId: options.owner.userId,
  });

  await db.insert(groupMember).values([
    { groupId: id, participantId: options.owner.participantId, role: "owner" },
    ...(options.members ?? []).map((member) => ({
      groupId: id,
      participantId: member.participantId,
      role: "member" as const,
    })),
  ]);

  return { id, name };
}

export type ExpenseOptions = {
  title?: string;
  totalMinor?: number;
  currency?: string;
  payer: Person;
  groupId?: string;
  splitMethod?: "equal" | "fixed" | "percentage";
  occurredAt?: Date;
  createdBy?: Person;
  participants: Array<{
    participantId: string;
    owedMinor: number;
    status?: "paid" | "unpaid";
  }>;
};

/** An expense with its participant rows, seeded directly rather than through a procedure. */
export async function createExpense(db: Database, options: ExpenseOptions) {
  const id = crypto.randomUUID();
  const title = options.title ?? `Expense ${id.slice(0, 8)}`;
  const totalMinor = options.totalMinor ?? 1000;
  const occurredAt = options.occurredAt ?? new Date();
  const now = new Date();
  const entries = [
    { participantId: options.payer.participantId, owedMinor: 0, status: "paid" as const },
    ...options.participants.map((entry) => ({
      participantId: entry.participantId,
      owedMinor: entry.owedMinor,
      status: entry.status ?? ("unpaid" as const),
    })),
  ];
  const isSettled = entries.every((entry) => entry.status === "paid");

  await db.insert(expense).values({
    id,
    title,
    totalMinor,
    currency: options.currency ?? "PHP",
    payerId: options.payer.participantId,
    groupId: options.groupId ?? null,
    status: isSettled ? "settled" : "active",
    splitMethod: options.splitMethod ?? "equal",
    occurredAt,
    settledAt: isSettled ? now : null,
    createdByUserId: (options.createdBy ?? options.payer).userId,
  });

  await db.insert(expenseParticipant).values(
    entries.map((entry) => ({
      expenseId: id,
      participantId: entry.participantId,
      owedMinor: entry.owedMinor,
      status: entry.status,
      paidAt: entry.status === "paid" ? now : null,
    })),
  );

  return { id, title, totalMinor, occurredAt };
}
