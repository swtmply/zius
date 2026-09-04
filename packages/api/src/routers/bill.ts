import { db } from "@zius/db";
import { user } from "@zius/db/schema/auth";
import { bill, billParticipant, group, groupMember, participant } from "@zius/db/schema/billing";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, exists, gt, inArray, lt, or, sql } from "drizzle-orm";
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
      .refine((currency) => /^[A-Z]{3}$/.test(currency), "Invalid currency code")
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
        message: "A bill cannot be assigned to a group and create a new group",
        path: ["createGroup"],
      });
    }
  });

function divideEvenly(total: number, count: number) {
  if (count === 0) {
    return [];
  }

  const baseAmount = Math.floor(total / count);
  const remainder = total % count;

  return Array.from({ length: count }, (_, index) => baseAmount + (index < remainder ? 1 : 0));
}

function percentageOf(totalMinor: number, basisPoints: number) {
  const numerator = BigInt(totalMinor) * BigInt(basisPoints);
  const roundingOffset = BigInt(FULL_PERCENTAGE_BASIS_POINTS / 2);
  return Number((numerator + roundingOffset) / BigInt(FULL_PERCENTAGE_BASIS_POINTS));
}

function calculateParticipantAmounts(
  participants: z.infer<typeof createParticipantSchema>[],
  totalMinor: number,
  splitMethod: z.infer<typeof createSchema>["splitMethod"],
) {
  const providedTotal = participants.reduce((total, entry) => total + entry.owedMinor, 0);

  if (splitMethod === "equal") {
    const amounts = divideEvenly(totalMinor, participants.length);

    return participants.map((entry, index) => ({
      ...entry,
      owedMinor: amounts[index] ?? 0,
    }));
  }

  const maximumTotal = splitMethod === "percentage" ? FULL_PERCENTAGE_BASIS_POINTS : totalMinor;

  if (providedTotal > maximumTotal) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        splitMethod === "percentage"
          ? "Participant percentages cannot exceed 100%"
          : "Participant amounts cannot exceed the transaction total",
    });
  }

  const hasAutomaticParticipants = participants.some((entry) => entry.owedMinor === 0);

  if (providedTotal < maximumTotal && !hasAutomaticParticipants) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        splitMethod === "percentage"
          ? "Participant percentages must equal 100% when no participant has a zero percentage"
          : "Participant amounts must equal the transaction total when no participant has a zero amount",
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

const billCreateOutputSchema = z.object({
  id: z.string(),
  status: z.enum(["active", "settled"]),
});

const billGetInputSchema = z.object({
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

type TransactionParticipant = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  owedMinor: number;
  status: "paid" | "unpaid";
};

const transactionParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  image: z.string().nullable(),
  owedMinor: z.number().int().nonnegative(),
  status: z.enum(["paid", "unpaid"]),
});

const billListOutputSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      totalMinor: z.number().int().positive(),
      currency: z.string(),
      status: z.enum(["active", "settled"]),
      occurredAt: z.iso.datetime(),
      participants: z.array(transactionParticipantSchema),
    }),
  ),
  nextCursor: z
    .object({
      id: z.string(),
      occurredAt: z.iso.datetime(),
    })
    .nullable(),
});

const billGetOutputSchema = z.object({
  id: z.string(),
  title: z.string(),
  totalMinor: z.number().int().positive(),
  isPayer: z.boolean(),
  amountMinor: z
    .number()
    .int()
    .nonnegative()
    .describe("Unpaid shares owed to the current payer, or the current participant's owedMinor"),
  currency: z.string(),
  status: z.enum(["active", "settled"]),
  splitMethod: z.enum(["equal", "fixed", "percentage"]),
  payerId: z.string(),
  payerName: z.string(),
  groupId: z.string().nullable(),
  groupName: z.string().nullable(),
  occurredAt: z.iso.datetime(),
  settledAt: z.iso.datetime().nullable(),
  participants: z.array(transactionParticipantSchema),
});

export const billRouter = router({
  create: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/bills",
        protect: true,
        tags: ["Bills"],
        summary: "Create a bill",
        errorResponses: [400, 401, 403, 404, 500],
      },
    })
    .input(createSchema)
    .output(billCreateOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const [currentParticipant] = await db
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
      const payerEntry = participants.find((entry) => entry.email === input.payer);

      if (!payerEntry) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payer must be included in participants",
        });
      }

      const otherParticipants = participants.filter((entry) => entry.email !== input.payer);

      return db.transaction(async (tx) => {
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
          ...new Set([...input.participants.map((entry) => entry.email), input.payer]),
        ];
        const existingParticipants = await tx
          .select({
            id: participant.id,
            email: participant.email,
          })
          .from(participant)
          .where(inArray(sql<string>`lower(${participant.email})`, emails));
        const participantIdsByEmail = new Map(
          existingParticipants.map((entry) => [entry.email.toLowerCase(), entry.id]),
        );
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

        const createdGroupId = input.createGroup ? crypto.randomUUID() : undefined;

        if (createdGroupId) {
          await tx.insert(group).values({
            id: createdGroupId,
            name: input.title,
            createdByUserId: ctx.session.user.id,
          });

          const memberIds = new Set([currentParticipant.id, ...participantIdsByEmail.values()]);

          await tx.insert(groupMember).values(
            [...memberIds].map((participantId) => ({
              groupId: createdGroupId,
              participantId,
              role:
                participantId === currentParticipant.id ? ("owner" as const) : ("member" as const),
            })),
          );
        }

        const now = new Date();
        const id = crypto.randomUUID();
        const isSettled = otherParticipants.every((entry) => entry.status === "paid");

        await tx.insert(bill).values({
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
            billId: id,
            participantId,
            owedMinor: entry.owedMinor,
            status: entry.status,
            paidAt: entry.status === "paid" ? now : null,
          };
        });

        await tx.insert(billParticipant).values([
          {
            billId: id,
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
        path: "/bills/{id}",
        protect: true,
        tags: ["Bills"],
        summary: "Update bill participant payment statuses",
        errorResponses: [400, 401, 404, 500],
      },
    })
    .input(updateSchema)
    .output(billCreateOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const [currentParticipant] = await db
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

      return db.transaction(async (tx) => {
        const involvementFilter = or(
          eq(bill.payerId, currentParticipant.id),
          exists(
            tx
              .select({ billId: billParticipant.billId })
              .from(billParticipant)
              .where(
                and(
                  eq(billParticipant.billId, bill.id),
                  eq(billParticipant.participantId, currentParticipant.id),
                ),
              ),
          ),
        );
        const [currentBill] = await tx
          .select({
            id: bill.id,
            payerId: bill.payerId,
          })
          .from(bill)
          .where(and(eq(bill.id, input.id), involvementFilter))
          .limit(1);

        if (!currentBill) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Bill not found",
          });
        }

        const persistedParticipants = await tx
          .select({
            participantId: billParticipant.participantId,
          })
          .from(billParticipant)
          .where(eq(billParticipant.billId, currentBill.id));
        const persistedParticipantIds = new Set(
          persistedParticipants.map((entry) => entry.participantId),
        );
        const hasStoredPayer = persistedParticipantIds.has(currentBill.payerId);
        const now = new Date();

        for (const entry of input.participants) {
          if (!persistedParticipantIds.has(entry.id)) {
            if (entry.id === currentBill.payerId && !hasStoredPayer && entry.status === "paid") {
              continue;
            }

            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Participant does not belong to this bill",
            });
          }

          await tx
            .update(billParticipant)
            .set({
              status: entry.status,
              paidAt: entry.status === "paid" ? now : null,
            })
            .where(
              and(
                eq(billParticipant.billId, currentBill.id),
                eq(billParticipant.participantId, entry.id),
              ),
            );
        }

        const updatedParticipants = await tx
          .select({ status: billParticipant.status })
          .from(billParticipant)
          .where(eq(billParticipant.billId, currentBill.id));
        const isSettled = updatedParticipants.every((entry) => entry.status === "paid");
        const status = isSettled ? ("settled" as const) : ("active" as const);

        await tx
          .update(bill)
          .set({
            status,
            settledAt: isSettled ? now : null,
          })
          .where(eq(bill.id, currentBill.id));

        return {
          id: currentBill.id,
          status,
        };
      });
    }),

  get: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/bills/{id}",
        protect: true,
        tags: ["Bills"],
        summary: "Get a bill visible to the current participant",
        errorResponses: [400, 401, 404, 500],
      },
    })
    .input(billGetInputSchema)
    .output(billGetOutputSchema)
    .query(async ({ ctx, input }) => {
      const [currentParticipant] = await db
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
        eq(bill.payerId, currentParticipant.id),
        exists(
          db
            .select({ billId: billParticipant.billId })
            .from(billParticipant)
            .where(
              and(
                eq(billParticipant.billId, bill.id),
                eq(billParticipant.participantId, currentParticipant.id),
              ),
            ),
        ),
      );
      const [transaction] = await db
        .select({
          id: bill.id,
          title: bill.title,
          totalMinor: bill.totalMinor,
          currency: bill.currency,
          status: bill.status,
          splitMethod: bill.splitMethod,
          payerId: bill.payerId,
          groupId: bill.groupId,
          groupName: group.name,
          occurredAt: bill.occurredAt,
          settledAt: bill.settledAt,
          payerName: participant.name,
          payerEmail: participant.email,
          payerImage: user.image,
        })
        .from(bill)
        .innerJoin(participant, eq(participant.id, bill.payerId))
        .leftJoin(group, eq(group.id, bill.groupId))
        .leftJoin(user, eq(user.id, participant.userId))
        .where(and(eq(bill.id, input.id), involvementFilter))
        .limit(1);

      if (!transaction) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bill not found",
        });
      }

      const billParticipants = await db
        .select({
          id: participant.id,
          name: participant.name,
          email: participant.email,
          image: user.image,
          owedMinor: billParticipant.owedMinor,
          status: billParticipant.status,
        })
        .from(billParticipant)
        .innerJoin(participant, eq(billParticipant.participantId, participant.id))
        .leftJoin(user, eq(user.id, participant.userId))
        .where(eq(billParticipant.billId, transaction.id));

      const storedPayer = billParticipants.find(
        (billParticipant) => billParticipant.id === transaction.payerId,
      );
      const isPayer = transaction.payerId === currentParticipant.id;
      const amountMinor = isPayer
        ? billParticipants.reduce(
            (total, entry) =>
              entry.id !== transaction.payerId && entry.status === "unpaid"
                ? total + entry.owedMinor
                : total,
            0,
          )
        : (billParticipants.find((entry) => entry.id === currentParticipant.id)?.owedMinor ?? 0);
      const payer =
        storedPayer ??
        ({
          id: transaction.payerId,
          name: transaction.payerName,
          email: transaction.payerEmail,
          image: transaction.payerImage,
          owedMinor: 0,
          status: "paid",
        } satisfies TransactionParticipant);

      return {
        id: transaction.id,
        title: transaction.title,
        totalMinor: transaction.totalMinor,
        isPayer,
        amountMinor,
        currency: transaction.currency,
        status: transaction.status,
        splitMethod: transaction.splitMethod,
        payerId: transaction.payerId,
        payerName: transaction.payerName,
        groupId: transaction.groupId,
        groupName: transaction.groupName,
        occurredAt: transaction.occurredAt.toISOString(),
        settledAt: transaction.settledAt?.toISOString() ?? null,
        participants: [
          payer,
          ...billParticipants.filter((billParticipant) => billParticipant.id !== payer.id),
        ],
      };
    }),

  list: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/bills/search",
        protect: true,
        tags: ["Bills"],
        summary: "List bills visible to the current participant",
        errorResponses: [400, 401, 403, 500],
      },
    })
    .input(listSchema)
    .output(billListOutputSchema)
    .query(async ({ ctx, input }) => {
      const [currentParticipant] = await db
        .select({ id: participant.id })
        .from(participant)
        .where(eq(participant.userId, ctx.session.user.id))
        .limit(1);

      if (!currentParticipant) {
        return { items: [], nextCursor: null };
      }

      const involvementFilter = or(
        eq(bill.payerId, currentParticipant.id),
        exists(
          db
            .select({ billId: billParticipant.billId })
            .from(billParticipant)
            .where(
              and(
                eq(billParticipant.billId, bill.id),
                eq(billParticipant.participantId, currentParticipant.id),
              ),
            ),
        ),
      );
      const statusFilter = input.status === "all" ? undefined : eq(bill.status, input.status);
      const cursorDate = input.cursor ? new Date(input.cursor.occurredAt) : undefined;
      const cursorFilter =
        input.cursor && cursorDate
          ? input.sort === "newest"
            ? or(
                lt(bill.occurredAt, cursorDate),
                and(eq(bill.occurredAt, cursorDate), lt(bill.id, input.cursor.id)),
              )
            : or(
                gt(bill.occurredAt, cursorDate),
                and(eq(bill.occurredAt, cursorDate), gt(bill.id, input.cursor.id)),
              )
          : undefined;
      const orderBy =
        input.sort === "newest"
          ? [desc(bill.occurredAt), desc(bill.id)]
          : [asc(bill.occurredAt), asc(bill.id)];

      const rows = await db
        .select({
          id: bill.id,
          title: bill.title,
          totalMinor: bill.totalMinor,
          currency: bill.currency,
          occurredAt: bill.occurredAt,
          status: bill.status,
          payerId: bill.payerId,
        })
        .from(bill)
        .where(and(involvementFilter, statusFilter, cursorFilter))
        .orderBy(...orderBy)
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const pageRows = rows.slice(0, input.limit);

      if (pageRows.length === 0) {
        return { items: [], nextCursor: null };
      }

      const billIds = pageRows.map((transaction) => transaction.id);
      const payerIds = [...new Set(pageRows.map((transaction) => transaction.payerId))];

      const participantRows = await db
        .select({
          billId: billParticipant.billId,
          id: participant.id,
          name: participant.name,
          email: participant.email,
          image: user.image,
          owedMinor: billParticipant.owedMinor,
          status: billParticipant.status,
        })
        .from(billParticipant)
        .innerJoin(participant, eq(billParticipant.participantId, participant.id))
        .leftJoin(user, eq(user.id, participant.userId))
        .where(inArray(billParticipant.billId, billIds));

      const payerRows = await db
        .select({
          id: participant.id,
          name: participant.name,
          email: participant.email,
          image: user.image,
        })
        .from(participant)
        .leftJoin(user, eq(user.id, participant.userId))
        .where(inArray(participant.id, payerIds));

      const participantsByBillId = new Map<string, TransactionParticipant[]>();

      for (const row of participantRows) {
        const current = participantsByBillId.get(row.billId) ?? [];
        current.push({
          id: row.id,
          name: row.name,
          email: row.email,
          image: row.image,
          owedMinor: row.owedMinor,
          status: row.status,
        });
        participantsByBillId.set(row.billId, current);
      }

      const payersById = new Map(
        payerRows.map((payer) => [
          payer.id,
          {
            ...payer,
            owedMinor: 0,
            status: "paid",
          } satisfies TransactionParticipant,
        ]),
      );

      const items = pageRows.map((transaction) => {
        const billParticipants = participantsByBillId.get(transaction.id) ?? [];
        const storedPayer = billParticipants.find(
          (participant) => participant.id === transaction.payerId,
        );
        const payer = storedPayer ?? payersById.get(transaction.payerId);
        const participants = billParticipants.filter(
          (participant) => participant.id !== transaction.payerId,
        );

        return {
          id: transaction.id,
          title: transaction.title,
          totalMinor: transaction.totalMinor,
          currency: transaction.currency,
          status: transaction.status,
          occurredAt: transaction.occurredAt.toISOString(),
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
