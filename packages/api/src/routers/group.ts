import { db } from "@zius/db";
import { user } from "@zius/db/schema/auth";
import { bill, billParticipant, group, groupMember, participant } from "@zius/db/schema/billing";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gt, inArray, lt, or, sql } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const groupParticipantInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1),
  email: z.email().transform((email) => email.toLowerCase()),
});

const createSchema = z
  .object({
    name: z.string().trim().min(1),
    participants: z.array(groupParticipantInputSchema),
  })
  .superRefine((input, ctx) => {
    const emails = new Set<string>();

    for (const [index, entry] of input.participants.entries()) {
      if (emails.has(entry.email)) {
        ctx.addIssue({
          code: "custom",
          message: "Each participant can only appear once",
          path: ["participants", index, "email"],
        });
      }

      emails.add(entry.email);
    }
  });

const listSchema = z.object({
  type: z.enum(["owner", "member"]).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z
    .object({
      createdAt: z.iso.datetime(),
      id: z.string(),
    })
    .nullish(),
});

const groupIdInputSchema = z.object({
  id: z.string().min(1),
});

const updateSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1),
  })
  .strict();

const groupMutationOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const groupParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  image: z.string().nullable(),
  userId: z.string().nullable(),
  role: z.enum(["owner", "member"]),
});

const groupListParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().nullable(),
});

const transactionParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  image: z.string().nullable(),
  owedMinor: z.number().int().nonnegative(),
  status: z.enum(["paid", "unpaid"]),
});

const groupListOutputSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(["owner", "member"]),
      createdAt: z.iso.datetime(),
      participants: z.array(groupListParticipantSchema),
    }),
  ),
  nextCursor: z
    .object({
      id: z.string(),
      createdAt: z.iso.datetime(),
    })
    .nullable(),
});

const groupGetOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  participants: z.array(groupParticipantSchema),
  transactions: z.array(
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
});

export const groupRouter = router({
  create: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/groups",
        protect: true,
        tags: ["Groups"],
        summary: "Create a group",
        errorResponses: [400, 401, 404, 500],
      },
    })
    .input(createSchema)
    .output(groupMutationOutputSchema)
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
        const emails = input.participants.map((entry) => entry.email);
        const existingParticipants =
          emails.length === 0
            ? []
            : await tx
                .select({ id: participant.id, email: participant.email })
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
            .select({ id: participant.id, email: participant.email })
            .from(participant)
            .where(inArray(sql<string>`lower(${participant.email})`, emails));

          for (const entry of createdParticipants) {
            participantIdsByEmail.set(entry.email.toLowerCase(), entry.id);
          }
        }

        const id = crypto.randomUUID();
        await tx.insert(group).values({
          id,
          name: input.name,
          createdByUserId: ctx.session.user.id,
        });

        const memberIds = new Set([currentParticipant.id, ...participantIdsByEmail.values()]);
        await tx.insert(groupMember).values(
          [...memberIds].map((participantId) => ({
            groupId: id,
            participantId,
            role:
              participantId === currentParticipant.id ? ("owner" as const) : ("member" as const),
          })),
        );

        return { id, name: input.name };
      });
    }),

  list: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/groups/search",
        protect: true,
        tags: ["Groups"],
        summary: "List groups visible to the current participant",
        errorResponses: [400, 401, 500],
      },
    })
    .input(listSchema)
    .output(groupListOutputSchema)
    .query(async ({ ctx, input }) => {
      const [currentParticipant] = await db
        .select({ id: participant.id })
        .from(participant)
        .where(eq(participant.userId, ctx.session.user.id))
        .limit(1);

      if (!currentParticipant) {
        return { items: [], nextCursor: null };
      }

      const cursorDate = input.cursor ? new Date(input.cursor.createdAt) : undefined;
      const cursorFilter =
        input.cursor && cursorDate
          ? input.sort === "newest"
            ? or(
                lt(group.createdAt, cursorDate),
                and(eq(group.createdAt, cursorDate), lt(group.id, input.cursor.id)),
              )
            : or(
                gt(group.createdAt, cursorDate),
                and(eq(group.createdAt, cursorDate), gt(group.id, input.cursor.id)),
              )
          : undefined;
      const typeFilter = input.type ? eq(groupMember.role, input.type) : undefined;
      const orderBy =
        input.sort === "newest"
          ? [desc(group.createdAt), desc(group.id)]
          : [asc(group.createdAt), asc(group.id)];

      const rows = await db
        .select({
          id: group.id,
          name: group.name,
          type: groupMember.role,
          createdAt: group.createdAt,
        })
        .from(groupMember)
        .innerJoin(group, eq(group.id, groupMember.groupId))
        .where(and(eq(groupMember.participantId, currentParticipant.id), typeFilter, cursorFilter))
        .orderBy(...orderBy)
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const pageRows = rows.slice(0, input.limit);
      const lastItem = pageRows.at(-1);
      const groupIds = pageRows.map((row) => row.id);
      const groupParticipantRows =
        groupIds.length === 0
          ? []
          : await db
              .select({
                groupId: groupMember.groupId,
                id: participant.id,
                name: participant.name,
                image: user.image,
              })
              .from(groupMember)
              .innerJoin(participant, eq(participant.id, groupMember.participantId))
              .leftJoin(user, eq(user.id, participant.userId))
              .where(inArray(groupMember.groupId, groupIds));
      const participantsByGroupId = new Map<
        string,
        z.infer<typeof groupListParticipantSchema>[]
      >();

      for (const row of groupParticipantRows) {
        const current = participantsByGroupId.get(row.groupId) ?? [];
        current.push({ id: row.id, name: row.name, image: row.image });
        participantsByGroupId.set(row.groupId, current);
      }

      return {
        items: pageRows.map((row) => ({
          id: row.id,
          name: row.name,
          type: row.type,
          createdAt: row.createdAt.toISOString(),
          participants: participantsByGroupId.get(row.id) ?? [],
        })),
        nextCursor:
          hasMore && lastItem
            ? { id: lastItem.id, createdAt: lastItem.createdAt.toISOString() }
            : null,
      };
    }),

  get: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/groups/{id}",
        protect: true,
        tags: ["Groups"],
        summary: "Get a group visible to the current participant",
        errorResponses: [400, 401, 404, 500],
      },
    })
    .input(groupIdInputSchema)
    .output(groupGetOutputSchema)
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

      const [currentGroup] = await db
        .select({ id: group.id, name: group.name, createdAt: group.createdAt })
        .from(group)
        .innerJoin(groupMember, eq(groupMember.groupId, group.id))
        .where(and(eq(group.id, input.id), eq(groupMember.participantId, currentParticipant.id)))
        .limit(1);

      if (!currentGroup) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }

      const participantRows = await db
        .select({
          id: participant.id,
          name: participant.name,
          email: participant.email,
          image: user.image,
          userId: participant.userId,
          role: groupMember.role,
        })
        .from(groupMember)
        .innerJoin(participant, eq(participant.id, groupMember.participantId))
        .leftJoin(user, eq(user.id, participant.userId))
        .where(eq(groupMember.groupId, currentGroup.id));

      const transactions = await db
        .select({
          id: bill.id,
          title: bill.title,
          totalMinor: bill.totalMinor,
          currency: bill.currency,
          status: bill.status,
          occurredAt: bill.occurredAt,
          payerId: bill.payerId,
          payerName: participant.name,
          payerEmail: participant.email,
          payerImage: user.image,
        })
        .from(bill)
        .innerJoin(participant, eq(participant.id, bill.payerId))
        .leftJoin(user, eq(user.id, participant.userId))
        .where(eq(bill.groupId, currentGroup.id))
        .orderBy(desc(bill.occurredAt), desc(bill.id));

      const transactionIds = transactions.map((transaction) => transaction.id);
      const transactionParticipantRows =
        transactionIds.length === 0
          ? []
          : await db
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
              .innerJoin(participant, eq(participant.id, billParticipant.participantId))
              .leftJoin(user, eq(user.id, participant.userId))
              .where(inArray(billParticipant.billId, transactionIds));

      const participantsByTransactionId = new Map<
        string,
        z.infer<typeof transactionParticipantSchema>[]
      >();
      for (const row of transactionParticipantRows) {
        const current = participantsByTransactionId.get(row.billId) ?? [];
        current.push({
          id: row.id,
          name: row.name,
          email: row.email,
          image: row.image,
          owedMinor: row.owedMinor,
          status: row.status,
        });
        participantsByTransactionId.set(row.billId, current);
      }

      return {
        id: currentGroup.id,
        name: currentGroup.name,
        createdAt: currentGroup.createdAt.toISOString(),
        participants: participantRows,
        transactions: transactions.map((transaction) => {
          const transactionParticipants = participantsByTransactionId.get(transaction.id) ?? [];
          const storedPayer = transactionParticipants.find(
            (entry) => entry.id === transaction.payerId,
          );
          const payer =
            storedPayer ??
            ({
              id: transaction.payerId,
              name: transaction.payerName,
              email: transaction.payerEmail,
              image: transaction.payerImage,
              owedMinor: 0,
              status: "paid",
            } satisfies z.infer<typeof transactionParticipantSchema>);

          return {
            id: transaction.id,
            title: transaction.title,
            totalMinor: transaction.totalMinor,
            currency: transaction.currency,
            status: transaction.status,
            occurredAt: transaction.occurredAt.toISOString(),
            participants: [
              payer,
              ...transactionParticipants.filter((entry) => entry.id !== payer.id),
            ],
          };
        }),
      };
    }),

  update: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/groups/{id}",
        protect: true,
        tags: ["Groups"],
        summary: "Update a group name",
        errorResponses: [400, 401, 403, 404, 500],
      },
    })
    .input(updateSchema)
    .output(groupMutationOutputSchema)
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

      const [membership] = await db
        .select({ id: group.id, role: groupMember.role })
        .from(group)
        .innerJoin(groupMember, eq(groupMember.groupId, group.id))
        .where(and(eq(group.id, input.id), eq(groupMember.participantId, currentParticipant.id)))
        .limit(1);

      if (!membership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }

      if (membership.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the group owner can update it" });
      }

      await db.update(group).set({ name: input.name }).where(eq(group.id, membership.id));

      return { id: membership.id, name: input.name };
    }),
});
