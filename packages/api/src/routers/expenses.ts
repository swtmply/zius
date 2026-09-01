import { expense, expenseParticipant, person } from "@zius/db/schema/expenses";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, exists, inArray, or } from "drizzle-orm";
import { z } from "zod";

import type { Context } from "../context";
import { protectedProcedure, router } from "../index";

const participantInput = z.object({
  personId: z.string().min(1),
  paidMinor: z.number().int().nonnegative(),
  owedMinor: z.number().int().nonnegative(),
});

const expenseWriteFields = z.object({
  groupId: z.null(),
  title: z.string().trim().min(1),
  note: z.string().trim().nullable().optional(),
  totalMinor: z.number().int().positive(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/)
    .default("PHP"),
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

async function requireCreator(db: Context["db"], userId: string, id: string) {
  const [match] = await db
    .select({ createdById: expense.createdById })
    .from(expense)
    .where(eq(expense.id, id))
    .limit(1);

  if (!match) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found" });
  }

  if (match.createdById !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only the creator can change this expense" });
  }
}

type ExpenseTransaction = Parameters<Parameters<Context["db"]["transaction"]>[0]>[0];

async function requireResolvedParticipants(
  tx: ExpenseTransaction,
  participants: ExpenseWrite["participants"],
) {
  const personIds = participants.map(({ personId }) => personId);
  const resolvedPeople = await tx
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
    const createdExpense = await ctx.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(expense)
        .values({
          id: crypto.randomUUID(),
          groupId: null,
          createdById: ctx.session.user.id,
          title: input.title,
          note: input.note ?? null,
          totalMinor: input.totalMinor,
          currency: input.currency,
          splitMethod: input.splitMethod,
          occurredAt: input.occurredAt,
        })
        .returning();

      const result = requiredResult(created, "Could not create the expense");
      await requireResolvedParticipants(tx, input.participants);
      await tx.insert(expenseParticipant).values(participantRows(result.id, input.participants));
      return result;
    });

    const [result] = await withParticipants(ctx.db, [createdExpense]);
    return requiredResult(result, "Could not load the created expense");
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const expenses = await ctx.db
      .select()
      .from(expense)
      .where(visibleToUser(ctx.db, ctx.session.user.id))
      .orderBy(desc(expense.occurredAt), desc(expense.id));

    return withParticipants(ctx.db, expenses);
  }),

  get: protectedProcedure.input(expenseIdInput).query(({ ctx, input }) => {
    return visibleExpense(ctx.db, ctx.session.user.id, input.id);
  }),

  update: protectedProcedure.input(expenseUpdateInput).mutation(async ({ ctx, input }) => {
    await requireCreator(ctx.db, ctx.session.user.id, input.id);

    await ctx.db.transaction(async (tx) => {
      await tx
        .update(expense)
        .set({
          groupId: null,
          title: input.title,
          note: input.note ?? null,
          totalMinor: input.totalMinor,
          currency: input.currency,
          splitMethod: input.splitMethod,
          occurredAt: input.occurredAt,
        })
        .where(eq(expense.id, input.id));
      await requireResolvedParticipants(tx, input.participants);
      await tx.delete(expenseParticipant).where(eq(expenseParticipant.expenseId, input.id));
      await tx.insert(expenseParticipant).values(participantRows(input.id, input.participants));
    });

    return visibleExpense(ctx.db, ctx.session.user.id, input.id);
  }),

  cancel: protectedProcedure.input(expenseIdInput).mutation(async ({ ctx, input }) => {
    await requireCreator(ctx.db, ctx.session.user.id, input.id);
    await ctx.db.update(expense).set({ status: "cancelled" }).where(eq(expense.id, input.id));

    return visibleExpense(ctx.db, ctx.session.user.id, input.id);
  }),
});
