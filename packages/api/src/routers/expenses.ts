import {
  expense,
  expenseGroup,
  expenseGroupMember,
  expenseParticipant,
  person,
} from "@zius/db/schema/expenses";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, exists, inArray, isNull, or } from "drizzle-orm";
import { z } from "zod";

import type { Context } from "../context";
import { protectedProcedure, router } from "../index";

const participantInput = z.object({
  personId: z.string().min(1),
  paidMinor: z.number().int().nonnegative(),
  owedMinor: z.number().int().nonnegative(),
});

const expenseWriteFields = z.object({
  groupId: z.string().min(1).nullable(),
  title: z.string().trim().min(1),
  note: z.string().trim().nullable().optional(),
  totalMinor: z.number().int().positive(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/)
    .optional(),
  splitMethod: z.enum(["equal", "exact", "percentage", "shares"]).default("exact"),
  occurredAt: z.coerce.date().default(() => new Date()),
  participants: z.array(participantInput).min(1),
});

type ExpenseWrite = z.infer<typeof expenseWriteFields>;

function validateExpenseWrite(input: ExpenseWrite, context: z.core.$RefinementCtx<ExpenseWrite>) {
  const personIds = new Set(input.participants.map(({ personId }) => personId));
  if (personIds.size !== input.participants.length) {
    context.addIssue({
      code: "custom",
      message: "Each participant must appear once",
      path: ["participants"],
      input,
    });
  }

  if (input.participants.some(({ paidMinor, owedMinor }) => paidMinor === 0 && owedMinor === 0)) {
    context.addIssue({
      code: "custom",
      message: "A participant must have a paid or owed amount",
      path: ["participants"],
      input,
    });
  }

  const paidTotal = input.participants.reduce((sum, participant) => sum + participant.paidMinor, 0);
  if (paidTotal !== input.totalMinor) {
    context.addIssue({
      code: "custom",
      message: "Participant paid amounts must equal the expense total",
      path: ["participants"],
      input,
    });
  }

  const owedTotal = input.participants.reduce((sum, participant) => sum + participant.owedMinor, 0);
  if (owedTotal !== input.totalMinor) {
    context.addIssue({
      code: "custom",
      message: "Participant owed amounts must equal the expense total",
      path: ["participants"],
      input,
    });
  }
}

const expenseWriteInput = expenseWriteFields.superRefine(validateExpenseWrite);
const expenseUpdateInput = expenseWriteFields
  .extend({ id: z.string().min(1) })
  .superRefine(validateExpenseWrite);
const expenseIdInput = z.object({ id: z.string().min(1) });
const expenseListInput = z
  .object({ groupId: z.string().min(1).optional() })
  .optional()
  .default({});

type ExpenseRow = typeof expense.$inferSelect;

async function withParticipants(db: Context["db"], expenses: ExpenseRow[]) {
  if (expenses.length === 0) {
    return [];
  }

  const participants = await db
    .select({
      expenseId: expenseParticipant.expenseId,
      personId: expenseParticipant.personId,
      paidMinor: expenseParticipant.paidMinor,
      owedMinor: expenseParticipant.owedMinor,
    })
    .from(expenseParticipant)
    .where(
      inArray(
        expenseParticipant.expenseId,
        expenses.map(({ id }) => id),
      ),
    )
    .orderBy(asc(expenseParticipant.personId));

  return expenses.map((expenseRow) => ({
    ...expenseRow,
    participants: participants
      .filter(({ expenseId }) => expenseId === expenseRow.id)
      .map(({ expenseId: _expenseId, ...participant }) => participant),
  }));
}

function requiredResult<T>(value: T | undefined, message: string): T {
  if (!value) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
  }
  return value;
}

function visibleToUser(db: Context["db"], userId: string) {
  return or(
    eq(expense.createdById, userId),
    exists(
      db
        .select({ personId: expenseParticipant.personId })
        .from(expenseParticipant)
        .innerJoin(person, eq(person.id, expenseParticipant.personId))
        .where(and(eq(expenseParticipant.expenseId, expense.id), eq(person.userId, userId))),
    ),
    exists(
      db
        .select({ groupId: expenseGroupMember.groupId })
        .from(expenseGroupMember)
        .innerJoin(person, eq(person.id, expenseGroupMember.personId))
        .where(
          and(
            eq(expenseGroupMember.groupId, expense.groupId),
            eq(person.userId, userId),
            isNull(expenseGroupMember.removedAt),
          ),
        ),
    ),
  );
}

async function visibleExpense(db: Context["db"], userId: string, id: string) {
  const [match] = await db
    .select()
    .from(expense)
    .where(and(eq(expense.id, id), visibleToUser(db, userId)))
    .limit(1);

  if (!match) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found" });
  }

  const [result] = await withParticipants(db, [match]);
  return requiredResult(result, "Could not load the expense");
}

async function requireGroup(db: Context["db"], groupId: string) {
  const [group] = await db
    .select({ id: expenseGroup.id, defaultCurrency: expenseGroup.defaultCurrency })
    .from(expenseGroup)
    .where(eq(expenseGroup.id, groupId))
    .limit(1);

  if (!group) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
  }

  return group;
}

async function findActiveMembership(db: Context["db"], groupId: string, userId: string) {
  const [membership] = await db
    .select({ role: expenseGroupMember.role })
    .from(expenseGroupMember)
    .innerJoin(person, eq(person.id, expenseGroupMember.personId))
    .where(
      and(
        eq(expenseGroupMember.groupId, groupId),
        eq(person.userId, userId),
        isNull(expenseGroupMember.removedAt),
      ),
    )
    .limit(1);

  return membership;
}

async function requireActiveMembership(db: Context["db"], groupId: string, userId: string) {
  const membership = await findActiveMembership(db, groupId, userId);

  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Active group membership required" });
  }

  return membership;
}

function groupCurrency(group: { defaultCurrency: string }, requested: string | undefined) {
  if (requested && requested !== group.defaultCurrency) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A group expense must use the group default currency",
    });
  }

  return group.defaultCurrency;
}

async function requireExpenseWriteAccess(db: Context["db"], userId: string, id: string) {
  const [match] = await db
    .select({ id: expense.id, groupId: expense.groupId, createdById: expense.createdById })
    .from(expense)
    .where(and(eq(expense.id, id), visibleToUser(db, userId)))
    .limit(1);

  if (!match) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found" });
  }

  const deniedError = new TRPCError({
    code: "FORBIDDEN",
    message: "Only the expense creator or the group owner can change this expense",
  });

  if (!match.groupId) {
    if (match.createdById !== userId) {
      throw deniedError;
    }

    return match;
  }

  const membership = await requireActiveMembership(db, match.groupId, userId);

  if (match.createdById !== userId && membership.role !== "owner") {
    throw deniedError;
  }

  return match;
}

// Participant person ids are unique by the time this runs, so a count comparison is enough.
async function requireEligibleParticipants(
  db: Context["db"],
  groupId: string | null,
  participants: ExpenseWrite["participants"],
) {
  const personIds = participants.map(({ personId }) => personId);

  if (groupId) {
    const memberships = await db
      .select({ personId: expenseGroupMember.personId })
      .from(expenseGroupMember)
      .where(
        and(
          eq(expenseGroupMember.groupId, groupId),
          inArray(expenseGroupMember.personId, personIds),
          isNull(expenseGroupMember.removedAt),
        ),
      );

    if (memberships.length !== personIds.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Every participant must be an active group member",
      });
    }

    return;
  }

  const resolvedPeople = await db
    .select({ id: person.id })
    .from(person)
    .where(inArray(person.id, personIds));

  if (resolvedPeople.length !== personIds.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Every participant must be a resolved person",
    });
  }
}

function participantRows(expenseId: string, participants: ExpenseWrite["participants"]) {
  return participants.map((participant) => ({ expenseId, ...participant }));
}

export const expensesRouter = router({
  create: protectedProcedure.input(expenseWriteInput).mutation(async ({ ctx, input }) => {
    let currency = input.currency ?? "PHP";

    if (input.groupId) {
      const group = await requireGroup(ctx.db, input.groupId);
      await requireActiveMembership(ctx.db, group.id, ctx.session.user.id);
      currency = groupCurrency(group, input.currency);
    }

    await requireEligibleParticipants(ctx.db, input.groupId, input.participants);

    const expenseId = crypto.randomUUID();
    const [createdExpenseRows] = await ctx.db.batch([
      ctx.db
        .insert(expense)
        .values({
          id: expenseId,
          groupId: input.groupId,
          createdById: ctx.session.user.id,
          title: input.title,
          note: input.note ?? null,
          totalMinor: input.totalMinor,
          currency,
          splitMethod: input.splitMethod,
          occurredAt: input.occurredAt,
        })
        .returning(),
      ctx.db.insert(expenseParticipant).values(participantRows(expenseId, input.participants)),
    ]);

    const createdExpense = requiredResult(createdExpenseRows[0], "Could not create the expense");
    const [result] = await withParticipants(ctx.db, [createdExpense]);
    return requiredResult(result, "Could not load the created expense");
  }),

  list: protectedProcedure.input(expenseListInput).query(async ({ ctx, input }) => {
    if (input.groupId) {
      await requireGroup(ctx.db, input.groupId);
    }

    const expenses = await ctx.db
      .select()
      .from(expense)
      .where(
        and(
          input.groupId ? eq(expense.groupId, input.groupId) : undefined,
          visibleToUser(ctx.db, ctx.session.user.id),
        ),
      )
      .orderBy(desc(expense.occurredAt), desc(expense.id));

    return withParticipants(ctx.db, expenses);
  }),

  get: protectedProcedure.input(expenseIdInput).query(({ ctx, input }) => {
    return visibleExpense(ctx.db, ctx.session.user.id, input.id);
  }),

  update: protectedProcedure.input(expenseUpdateInput).mutation(async ({ ctx, input }) => {
    const existing = await requireExpenseWriteAccess(ctx.db, ctx.session.user.id, input.id);

    if (input.groupId !== existing.groupId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "An expense cannot move between groups",
      });
    }

    const currency = existing.groupId
      ? groupCurrency(await requireGroup(ctx.db, existing.groupId), input.currency)
      : (input.currency ?? "PHP");

    await requireEligibleParticipants(ctx.db, existing.groupId, input.participants);

    await ctx.db.batch([
      ctx.db
        .update(expense)
        .set({
          title: input.title,
          note: input.note ?? null,
          totalMinor: input.totalMinor,
          currency,
          splitMethod: input.splitMethod,
          occurredAt: input.occurredAt,
        })
        .where(eq(expense.id, input.id)),
      ctx.db.delete(expenseParticipant).where(eq(expenseParticipant.expenseId, input.id)),
      ctx.db.insert(expenseParticipant).values(participantRows(input.id, input.participants)),
    ]);

    return visibleExpense(ctx.db, ctx.session.user.id, input.id);
  }),

  cancel: protectedProcedure.input(expenseIdInput).mutation(async ({ ctx, input }) => {
    await requireExpenseWriteAccess(ctx.db, ctx.session.user.id, input.id);
    await ctx.db.update(expense).set({ status: "cancelled" }).where(eq(expense.id, input.id));

    return visibleExpense(ctx.db, ctx.session.user.id, input.id);
  }),
});
