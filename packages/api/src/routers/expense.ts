import { user } from "@zius/db/schema/auth";
import {
  expense,
  expenseParticipant,
  group,
  groupMember,
  participant,
} from "@zius/db/schema/expense";
import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  desc,
  eq,
  exists,
  gt,
  inArray,
  lt,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const FULL_PERCENTAGE_BASIS_POINTS = 10_000;

const createParticipantSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1),
  email: z.email().transform((email) => email.toLowerCase()),
  owedMinor: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  status: z.enum(["paid", "unpaid"]).default("unpaid"),
});

const createSchema = z
  .object({
    title: z.string().trim().min(1),
    totalMinor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    currency: z
      .string()
      .trim()
      .length(3)
      .transform((currency) => currency.toUpperCase())
      .refine(
        (currency) => /^[A-Z]{3}$/.test(currency),
        "Invalid currency code",
      )
      .default("PHP"),
    splitMethod: z.enum(["equal", "fixed", "percentage"]),
    payer: z.email().transform((email) => email.toLowerCase()),
    groupId: z.string().optional(),
    createGroup: z.boolean().default(false),
    occurredAt: z.number().int().nonnegative().max(8_640_000_000_000_000),
    participants: z.array(createParticipantSchema),
  })
  .superRefine((input, ctx) => {
    const emails = new Set<string>();

    for (const [index, participant] of input.participants.entries()) {
      if (emails.has(participant.email)) {
        ctx.addIssue({
          code: "custom",
          message: "Each participant can only appear once",
          path: ["participants", index, "email"],
        });
      }

      emails.add(participant.email);
    }

    if (!emails.has(input.payer)) {
      ctx.addIssue({
        code: "custom",
        message: "Payer must be included in participants",
        path: ["payer"],
      });
    }

    if (input.groupId !== undefined && input.createGroup) {
      ctx.addIssue({
        code: "custom",
        message: "An expense cannot be assigned to a group and create a new group",
        path: ["createGroup"],
      });
    }
  });

function formatEmailList(emails: string[]) {
  if (emails.length <= 1) {
    return emails[0] ?? "";
  }

  return `${emails.slice(0, -1).join(", ")} and ${emails.at(-1)}`;
}

function divideEvenly(total: number, count: number) {
  if (count === 0) {
    return [];
  }

  const baseAmount = Math.floor(total / count);
  const remainder = total % count;

  return Array.from(
    { length: count },
    (_, index) => baseAmount + (index < remainder ? 1 : 0),
  );
}

function percentageOf(totalMinor: number, basisPoints: number) {
  const numerator = BigInt(totalMinor) * BigInt(basisPoints);
  const roundingOffset = BigInt(FULL_PERCENTAGE_BASIS_POINTS / 2);
  return Number(
    (numerator + roundingOffset) / BigInt(FULL_PERCENTAGE_BASIS_POINTS),
  );
}

function calculateParticipantAmounts(
  participants: z.infer<typeof createParticipantSchema>[],
  totalMinor: number,
  splitMethod: z.infer<typeof createSchema>["splitMethod"],
) {
  const providedTotal = participants.reduce(
    (total, entry) => total + entry.owedMinor,
    0,
  );

  if (splitMethod === "equal") {
    const amounts = divideEvenly(totalMinor, participants.length);

    return participants.map((entry, index) => ({
      ...entry,
      owedMinor: amounts[index] ?? 0,
    }));
  }

  const maximumTotal =
    splitMethod === "percentage" ? FULL_PERCENTAGE_BASIS_POINTS : totalMinor;

  if (providedTotal > maximumTotal) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        splitMethod === "percentage"
          ? "Participant percentages cannot exceed 100%"
          : "Participant amounts cannot exceed the expense total",
    });
  }

  const hasAutomaticParticipants = participants.some(
    (entry) => entry.owedMinor === 0,
  );

  if (providedTotal < maximumTotal && !hasAutomaticParticipants) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        splitMethod === "percentage"
          ? "Participant percentages must equal 100% when no participant has a zero percentage"
          : "Participant amounts must equal the expense total when no participant has a zero amount",
    });
  }

  let allocatedMinor = 0;
  let allocatedPercentage = 0;
  const calculatedAmounts = participants.map((entry) => {
    if (entry.owedMinor === 0) {
      return 0;
    }

    if (splitMethod === "fixed") {
      allocatedMinor += entry.owedMinor;
      return entry.owedMinor;
    }

    allocatedPercentage += entry.owedMinor;
    const cumulativeAmount = percentageOf(totalMinor, allocatedPercentage);
    const owedMinor = cumulativeAmount - allocatedMinor;
    allocatedMinor = cumulativeAmount;
    return owedMinor;
  });
  const automaticParticipantIndexes = participants
    .map((entry, index) => (entry.owedMinor === 0 ? index : -1))
    .filter((index) => index !== -1);
  const automaticAmounts = divideEvenly(
    totalMinor - allocatedMinor,
    automaticParticipantIndexes.length,
  );
  const automaticAmountsByIndex = new Map(
    automaticParticipantIndexes.map((participantIndex, index) => [
      participantIndex,
      automaticAmounts[index] ?? 0,
    ]),
  );

  return participants.map((entry, index) => ({
    ...entry,
    owedMinor:
      entry.owedMinor === 0
        ? (automaticAmountsByIndex.get(index) ?? 0)
        : (calculatedAmounts[index] ?? 0),
  }));
}

const listSchema = z.object({
  status: z.enum(["all", "active", "settled"]).default("all"),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z
    .object({
      occurredAt: z.iso.datetime(),
      id: z.string(),
    })
    .nullish(),
});

const expenseCreateOutputSchema = z.object({
  id: z.string(),
  status: z.enum(["active", "settled"]),
});

const expenseGetInputSchema = z.object({
  id: z.string().min(1),
});

const updateParticipantSchema = z
  .object({
    id: z.string().min(1),
    status: z.enum(["paid", "unpaid"]),
  })
  .strict();

const updateSchema = z
  .object({
    id: z.string().min(1),
    participants: z.array(updateParticipantSchema).min(1),
  })
  .strict()
  .superRefine((input, ctx) => {
    const participantIds = new Set<string>();

    for (const [index, entry] of input.participants.entries()) {
      if (participantIds.has(entry.id)) {
        ctx.addIssue({
          code: "custom",
          message: "Each participant can only be updated once",
          path: ["participants", index, "id"],
        });
      }

      participantIds.add(entry.id);
    }
  });

type ExpenseParticipant = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  owedMinor: number;
  status: "paid" | "unpaid";
};

const expenseParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  image: z.string().nullable(),
  owedMinor: z.number().int().nonnegative(),
  status: z.enum(["paid", "unpaid"]),
});

const expenseListOutputSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      totalMinor: z.number().int().positive(),
      currency: z.string(),
      status: z.enum(["active", "settled"]),
      occurredAt: z.iso.datetime(),
      participants: z.array(expenseParticipantSchema),
    }),
  ),
  nextCursor: z
    .object({
      id: z.string(),
      occurredAt: z.iso.datetime(),
    })
    .nullable(),
});

const expenseGetOutputSchema = z.object({
  id: z.string(),
  title: z.string(),
  totalMinor: z.number().int().positive(),
  isPayer: z.boolean(),
  amountMinor: z
    .number()
    .int()
    .nonnegative()
    .describe(
      "Unpaid shares owed to the current payer, or the current participant's owedMinor",
    ),
  currency: z.string(),
  status: z.enum(["active", "settled"]),
  splitMethod: z.enum(["equal", "fixed", "percentage"]),
  payerId: z.string(),
  payerName: z.string(),
  groupId: z.string().nullable(),
  groupName: z.string().nullable(),
  occurredAt: z.iso.datetime(),
  settledAt: z.iso.datetime().nullable(),
  participants: z.array(expenseParticipantSchema),
});

export const expenseRouter = router({
  create: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/expenses",
        protect: true,
        tags: ["Expenses"],
        summary: "Create an expense",
        errorResponses: [400, 401, 403, 404, 500],
      },
    })
    .input(createSchema)
    .output(expenseCreateOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const [currentParticipant] = await ctx.db
        .select({
          id: participant.id,
        })
        .from(participant)
        .where(eq(participant.userId, ctx.session.user.id))
        .limit(1);

      if (!currentParticipant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Current participant not found",
        });
      }

      const participants = calculateParticipantAmounts(
        input.participants,
        input.totalMinor,
        input.splitMethod,
      );
      const payerEntry = participants.find(
        (entry) => entry.email === input.payer,
      );

      if (!payerEntry) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payer must be included in participants",
        });
      }

      const otherParticipants = participants.filter(
        (entry) => entry.email !== input.payer,
      );

      return ctx.db.transaction(async (tx) => {
        if (input.groupId) {
          const [membership] = await tx
            .select({ groupId: groupMember.groupId })
            .from(groupMember)
            .where(
              and(
                eq(groupMember.groupId, input.groupId),
                eq(groupMember.participantId, currentParticipant.id),
              ),
            )
            .limit(1);

          if (!membership) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You are not a member of this group",
            });
          }
        }

        const emails = [
          ...new Set([
            ...input.participants.map((entry) => entry.email),
            input.payer,
          ]),
        ];
        const existingParticipants = await tx
          .select({
            id: participant.id,
            email: participant.email,
          })
          .from(participant)
          .where(inArray(sql<string>`lower(${participant.email})`, emails));
        const participantIdsByEmail = new Map(
          existingParticipants.map((entry) => [
            entry.email.toLowerCase(),
            entry.id,
          ]),
        );

        if (input.groupId) {
          const knownParticipantIds = [...participantIdsByEmail.values()];
          const memberships =
            knownParticipantIds.length > 0
              ? await tx
                  .select({ participantId: groupMember.participantId })
                  .from(groupMember)
                  .where(
                    and(
                      eq(groupMember.groupId, input.groupId),
                      inArray(groupMember.participantId, knownParticipantIds),
                    ),
                  )
              : [];
          const memberParticipantIds = new Set(
            memberships.map((entry) => entry.participantId),
          );
          const outsiders = emails.filter((email) => {
            const participantId = participantIdsByEmail.get(email);
            return (
              participantId === undefined ||
              !memberParticipantIds.has(participantId)
            );
          });

          if (outsiders.length > 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `${formatEmailList(outsiders)} ${
                outsiders.length === 1 ? "is not a member" : "are not members"
              } of this group. Create a new group with these participants, or save this as a standalone expense.`,
            });
          }
        }

        const newParticipants = input.participants.filter(
          (entry) => !participantIdsByEmail.has(entry.email),
        );

        if (newParticipants.length > 0) {
          await tx
            .insert(participant)
            .values(
              newParticipants.map((entry) => ({
                id: crypto.randomUUID(),
                name: entry.name,
                email: entry.email,
              })),
            )
            .onConflictDoNothing({ target: participant.email });

          const createdParticipants = await tx
            .select({
              id: participant.id,
              email: participant.email,
            })
            .from(participant)
            .where(inArray(sql<string>`lower(${participant.email})`, emails));

          for (const entry of createdParticipants) {
            participantIdsByEmail.set(entry.email.toLowerCase(), entry.id);
          }
        }

        const payerId = participantIdsByEmail.get(input.payer);

        if (!payerId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Payer could not be resolved",
          });
        }

        const createdGroupId = input.createGroup
          ? crypto.randomUUID()
          : undefined;

        if (createdGroupId) {
          await tx.insert(group).values({
            id: createdGroupId,
            name: input.title,
            createdByUserId: ctx.session.user.id,
          });

          const memberIds = new Set([
            currentParticipant.id,
            ...participantIdsByEmail.values(),
          ]);

          await tx.insert(groupMember).values(
            [...memberIds].map((participantId) => ({
              groupId: createdGroupId,
              participantId,
              role:
                participantId === currentParticipant.id
                  ? ("owner" as const)
                  : ("member" as const),
            })),
          );
        }

        const now = new Date();
        const id = crypto.randomUUID();
        const isSettled = otherParticipants.every(
          (entry) => entry.status === "paid",
        );

        await tx.insert(expense).values({
          id,
          title: input.title,
          totalMinor: input.totalMinor,
          currency: input.currency,
          payerId,
          groupId: createdGroupId ?? input.groupId ?? null,
          status: isSettled ? "settled" : "active",
          splitMethod: input.splitMethod,
          occurredAt: new Date(input.occurredAt),
          settledAt: isSettled ? now : null,
          createdByUserId: ctx.session.user.id,
        });

        const participantValues = otherParticipants.map((entry) => {
          const participantId = participantIdsByEmail.get(entry.email);

          if (!participantId) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Participant could not be resolved",
            });
          }

          return {
            expenseId: id,
            participantId,
            owedMinor: entry.owedMinor,
            status: entry.status,
            paidAt: entry.status === "paid" ? now : null,
          };
        });

        await tx.insert(expenseParticipant).values([
          {
            expenseId: id,
            participantId: payerId,
            owedMinor: payerEntry.owedMinor,
            status: "paid",
            paidAt: now,
          },
          ...participantValues,
        ]);

        return {
          id,
          status: isSettled ? ("settled" as const) : ("active" as const),
        };
      });
    }),

  update: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/expenses/{id}",
        protect: true,
        tags: ["Expenses"],
        summary: "Update expense participant payment statuses",
        errorResponses: [400, 401, 404, 500],
      },
    })
    .input(updateSchema)
    .output(expenseCreateOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const [currentParticipant] = await ctx.db
        .select({ id: participant.id })
        .from(participant)
        .where(eq(participant.userId, ctx.session.user.id))
        .limit(1);

      if (!currentParticipant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Current participant not found",
        });
      }

      return ctx.db.transaction(async (tx) => {
        const involvementFilter = or(
          eq(expense.payerId, currentParticipant.id),
          exists(
            tx
              .select({ expenseId: expenseParticipant.expenseId })
              .from(expenseParticipant)
              .where(
                and(
                  eq(expenseParticipant.expenseId, expense.id),
                  eq(expenseParticipant.participantId, currentParticipant.id),
                ),
              ),
          ),
        );
        const [currentExpense] = await tx
          .select({
            id: expense.id,
            payerId: expense.payerId,
          })
          .from(expense)
          .where(and(eq(expense.id, input.id), involvementFilter))
          .limit(1);

        if (!currentExpense) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Expense not found",
          });
        }

        const persistedParticipants = await tx
          .select({
            participantId: expenseParticipant.participantId,
          })
          .from(expenseParticipant)
          .where(eq(expenseParticipant.expenseId, currentExpense.id));
        const persistedParticipantIds = new Set(
          persistedParticipants.map((entry) => entry.participantId),
        );
        const hasStoredPayer = persistedParticipantIds.has(currentExpense.payerId);
        const now = new Date();

        for (const entry of input.participants) {
          if (!persistedParticipantIds.has(entry.id)) {
<<<<<<< HEAD:packages/api/src/routers/bill.ts
            if (
              entry.id === currentBill.payerId &&
              !hasStoredPayer &&
              entry.status === "paid"
            ) {
=======
            if (entry.id === currentExpense.payerId && !hasStoredPayer && entry.status === "paid") {
>>>>>>> a7a398d (refactor: rename Bill to Expense across the stack):packages/api/src/routers/expense.ts
              continue;
            }

            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Participant does not belong to this expense",
            });
          }

          await tx
            .update(expenseParticipant)
            .set({
              status: entry.status,
              paidAt: entry.status === "paid" ? now : null,
            })
            .where(
              and(
                eq(expenseParticipant.expenseId, currentExpense.id),
                eq(expenseParticipant.participantId, entry.id),
              ),
            );
        }

        const updatedParticipants = await tx
<<<<<<< HEAD:packages/api/src/routers/bill.ts
          .select({ status: billParticipant.status })
          .from(billParticipant)
          .where(eq(billParticipant.billId, currentBill.id));
        const isSettled = updatedParticipants.every(
          (entry) => entry.status === "paid",
        );
=======
          .select({ status: expenseParticipant.status })
          .from(expenseParticipant)
          .where(eq(expenseParticipant.expenseId, currentExpense.id));
        const isSettled = updatedParticipants.every((entry) => entry.status === "paid");
>>>>>>> a7a398d (refactor: rename Bill to Expense across the stack):packages/api/src/routers/expense.ts
        const status = isSettled ? ("settled" as const) : ("active" as const);

        await tx
          .update(expense)
          .set({
            status,
            settledAt: isSettled ? now : null,
          })
          .where(eq(expense.id, currentExpense.id));

        return {
          id: currentExpense.id,
          status,
        };
      });
    }),

  get: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/expenses/{id}",
        protect: true,
        tags: ["Expenses"],
        summary: "Get an expense visible to the current participant",
        errorResponses: [400, 401, 404, 500],
      },
    })
    .input(expenseGetInputSchema)
    .output(expenseGetOutputSchema)
    .query(async ({ ctx, input }) => {
      const [currentParticipant] = await ctx.db
        .select({ id: participant.id })
        .from(participant)
        .where(eq(participant.userId, ctx.session.user.id))
        .limit(1);

      if (!currentParticipant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Current participant not found",
        });
      }

      const involvementFilter = or(
        eq(expense.payerId, currentParticipant.id),
        exists(
          ctx.db
            .select({ expenseId: expenseParticipant.expenseId })
            .from(expenseParticipant)
            .where(
              and(
                eq(expenseParticipant.expenseId, expense.id),
                eq(expenseParticipant.participantId, currentParticipant.id),
              ),
            ),
        ),
      );
      const [expenseRow] = await ctx.db
        .select({
          id: expense.id,
          title: expense.title,
          totalMinor: expense.totalMinor,
          currency: expense.currency,
          status: expense.status,
          splitMethod: expense.splitMethod,
          payerId: expense.payerId,
          groupId: expense.groupId,
          groupName: group.name,
          occurredAt: expense.occurredAt,
          settledAt: expense.settledAt,
          payerName: participant.name,
          payerEmail: participant.email,
          payerImage: user.image,
        })
        .from(expense)
        .innerJoin(participant, eq(participant.id, expense.payerId))
        .leftJoin(group, eq(group.id, expense.groupId))
        .leftJoin(user, eq(user.id, participant.userId))
        .where(and(eq(expense.id, input.id), involvementFilter))
        .limit(1);

      if (!expenseRow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense not found",
        });
      }

      const expenseParticipants = await ctx.db
        .select({
          id: participant.id,
          name: participant.name,
          email: participant.email,
          image: user.image,
          owedMinor: expenseParticipant.owedMinor,
          status: expenseParticipant.status,
        })
<<<<<<< HEAD:packages/api/src/routers/bill.ts
        .from(billParticipant)
        .innerJoin(
          participant,
          eq(billParticipant.participantId, participant.id),
        )
=======
        .from(expenseParticipant)
        .innerJoin(participant, eq(expenseParticipant.participantId, participant.id))
>>>>>>> a7a398d (refactor: rename Bill to Expense across the stack):packages/api/src/routers/expense.ts
        .leftJoin(user, eq(user.id, participant.userId))
        .where(eq(expenseParticipant.expenseId, expenseRow.id));

      const storedPayer = expenseParticipants.find(
        (expenseParticipant) => expenseParticipant.id === expenseRow.payerId,
      );
      const isPayer = expenseRow.payerId === currentParticipant.id;
      const amountMinor = isPayer
        ? expenseParticipants.reduce(
            (total, entry) =>
              entry.id !== expenseRow.payerId && entry.status === "unpaid"
                ? total + entry.owedMinor
                : total,
            0,
          )
<<<<<<< HEAD:packages/api/src/routers/bill.ts
        : (billParticipants.find((entry) => entry.id === currentParticipant.id)
            ?.owedMinor ?? 0);
=======
        : (expenseParticipants.find((entry) => entry.id === currentParticipant.id)?.owedMinor ?? 0);
>>>>>>> a7a398d (refactor: rename Bill to Expense across the stack):packages/api/src/routers/expense.ts
      const payer =
        storedPayer ??
        ({
          id: expenseRow.payerId,
          name: expenseRow.payerName,
          email: expenseRow.payerEmail,
          image: expenseRow.payerImage,
          owedMinor: 0,
          status: "paid",
        } satisfies ExpenseParticipant);

      return {
        id: expenseRow.id,
        title: expenseRow.title,
        totalMinor: expenseRow.totalMinor,
        isPayer,
        amountMinor,
        currency: expenseRow.currency,
        status: expenseRow.status,
        splitMethod: expenseRow.splitMethod,
        payerId: expenseRow.payerId,
        payerName: expenseRow.payerName,
        groupId: expenseRow.groupId,
        groupName: expenseRow.groupName,
        occurredAt: expenseRow.occurredAt.toISOString(),
        settledAt: expenseRow.settledAt?.toISOString() ?? null,
        participants: [
          payer,
<<<<<<< HEAD:packages/api/src/routers/bill.ts
          ...billParticipants.filter(
            (billParticipant) => billParticipant.id !== payer.id,
          ),
=======
          ...expenseParticipants.filter((expenseParticipant) => expenseParticipant.id !== payer.id),
>>>>>>> a7a398d (refactor: rename Bill to Expense across the stack):packages/api/src/routers/expense.ts
        ],
      };
    }),

  list: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/expenses/search",
        protect: true,
        tags: ["Expenses"],
        summary: "List expenses visible to the current participant",
        errorResponses: [400, 401, 403, 500],
      },
    })
    .input(listSchema)
    .output(expenseListOutputSchema)
    .query(async ({ ctx, input }) => {
      const [currentParticipant] = await ctx.db
        .select({ id: participant.id })
        .from(participant)
        .where(eq(participant.userId, ctx.session.user.id))
        .limit(1);

      if (!currentParticipant) {
        return { items: [], nextCursor: null };
      }

      const involvementFilter = or(
        eq(expense.payerId, currentParticipant.id),
        exists(
          ctx.db
            .select({ expenseId: expenseParticipant.expenseId })
            .from(expenseParticipant)
            .where(
              and(
                eq(expenseParticipant.expenseId, expense.id),
                eq(expenseParticipant.participantId, currentParticipant.id),
              ),
            ),
        ),
      );
<<<<<<< HEAD:packages/api/src/routers/bill.ts
      const statusFilter =
        input.status === "all" ? undefined : eq(bill.status, input.status);
      const cursorDate = input.cursor
        ? new Date(input.cursor.occurredAt)
        : undefined;
=======
      const statusFilter = input.status === "all" ? undefined : eq(expense.status, input.status);
      const cursorDate = input.cursor ? new Date(input.cursor.occurredAt) : undefined;
>>>>>>> a7a398d (refactor: rename Bill to Expense across the stack):packages/api/src/routers/expense.ts
      const cursorFilter =
        input.cursor && cursorDate
          ? input.sort === "newest"
            ? or(
<<<<<<< HEAD:packages/api/src/routers/bill.ts
                lt(bill.occurredAt, cursorDate),
                and(
                  eq(bill.occurredAt, cursorDate),
                  lt(bill.id, input.cursor.id),
                ),
              )
            : or(
                gt(bill.occurredAt, cursorDate),
                and(
                  eq(bill.occurredAt, cursorDate),
                  gt(bill.id, input.cursor.id),
                ),
=======
                lt(expense.occurredAt, cursorDate),
                and(eq(expense.occurredAt, cursorDate), lt(expense.id, input.cursor.id)),
              )
            : or(
                gt(expense.occurredAt, cursorDate),
                and(eq(expense.occurredAt, cursorDate), gt(expense.id, input.cursor.id)),
>>>>>>> a7a398d (refactor: rename Bill to Expense across the stack):packages/api/src/routers/expense.ts
              )
          : undefined;
      const orderBy =
        input.sort === "newest"
          ? [desc(expense.occurredAt), desc(expense.id)]
          : [asc(expense.occurredAt), asc(expense.id)];

      const rows = await ctx.db
        .select({
          id: expense.id,
          title: expense.title,
          totalMinor: expense.totalMinor,
          currency: expense.currency,
          occurredAt: expense.occurredAt,
          status: expense.status,
          payerId: expense.payerId,
        })
        .from(expense)
        .where(and(involvementFilter, statusFilter, cursorFilter))
        .orderBy(...orderBy)
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const pageRows = rows.slice(0, input.limit);

      if (pageRows.length === 0) {
        return { items: [], nextCursor: null };
      }

<<<<<<< HEAD:packages/api/src/routers/bill.ts
      const billIds = pageRows.map((transaction) => transaction.id);
      const payerIds = [
        ...new Set(pageRows.map((transaction) => transaction.payerId)),
      ];
=======
      const expenseIds = pageRows.map((expenseRow) => expenseRow.id);
      const payerIds = [...new Set(pageRows.map((expenseRow) => expenseRow.payerId))];
>>>>>>> a7a398d (refactor: rename Bill to Expense across the stack):packages/api/src/routers/expense.ts

      const participantRows = await ctx.db
        .select({
          expenseId: expenseParticipant.expenseId,
          id: participant.id,
          name: participant.name,
          email: participant.email,
          image: user.image,
          owedMinor: expenseParticipant.owedMinor,
          status: expenseParticipant.status,
        })
<<<<<<< HEAD:packages/api/src/routers/bill.ts
        .from(billParticipant)
        .innerJoin(
          participant,
          eq(billParticipant.participantId, participant.id),
        )
=======
        .from(expenseParticipant)
        .innerJoin(participant, eq(expenseParticipant.participantId, participant.id))
>>>>>>> a7a398d (refactor: rename Bill to Expense across the stack):packages/api/src/routers/expense.ts
        .leftJoin(user, eq(user.id, participant.userId))
        .where(inArray(expenseParticipant.expenseId, expenseIds));

      const payerRows = await ctx.db
        .select({
          id: participant.id,
          name: participant.name,
          email: participant.email,
          image: user.image,
        })
        .from(participant)
        .leftJoin(user, eq(user.id, participant.userId))
        .where(inArray(participant.id, payerIds));

      const participantsByExpenseId = new Map<string, ExpenseParticipant[]>();

      for (const row of participantRows) {
        const current = participantsByExpenseId.get(row.expenseId) ?? [];
        current.push({
          id: row.id,
          name: row.name,
          email: row.email,
          image: row.image,
          owedMinor: row.owedMinor,
          status: row.status,
        });
        participantsByExpenseId.set(row.expenseId, current);
      }

      const payersById = new Map(
        payerRows.map((payer) => [
          payer.id,
          {
            ...payer,
            owedMinor: 0,
            status: "paid",
          } satisfies ExpenseParticipant,
        ]),
      );

      const items = pageRows.map((expenseRow) => {
        const expenseParticipants = participantsByExpenseId.get(expenseRow.id) ?? [];
        const storedPayer = expenseParticipants.find(
          (participant) => participant.id === expenseRow.payerId,
        );
        const payer = storedPayer ?? payersById.get(expenseRow.payerId);
        const participants = expenseParticipants.filter(
          (participant) => participant.id !== expenseRow.payerId,
        );

        return {
          id: expenseRow.id,
          title: expenseRow.title,
          totalMinor: expenseRow.totalMinor,
          currency: expenseRow.currency,
          status: expenseRow.status,
          occurredAt: expenseRow.occurredAt.toISOString(),
          participants: payer ? [payer, ...participants] : participants,
        };
      });

      const lastItem = pageRows.at(-1);

      return {
        items,
        nextCursor:
          hasMore && lastItem
            ? {
                id: lastItem.id,
                occurredAt: lastItem.occurredAt.toISOString(),
              }
            : null,
      };
    }),
});
