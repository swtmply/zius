import { user } from "@zius/db/schema/auth";
import {
  expense,
  expenseParticipant,
  group,
  groupMember,
  participant,
} from "@zius/db/schema/expense";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gt, inArray, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { z } from "zod";

import { participantProcedure, requireParticipant, router } from "../index";
import { assertGroupIsActive } from "./helpers";

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
  status: z.enum(["active", "archived", "all"]).default("active"),
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
  archivedAt: z.iso.datetime().nullable(),
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

const expenseParticipantSchema = z.object({
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
      archivedAt: z.iso.datetime().nullable(),
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
  archivedAt: z.iso.datetime().nullable(),
  participants: z.array(groupParticipantSchema),
  expenses: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      totalMinor: z.number().int().positive(),
      currency: z.string(),
      status: z.enum(["active", "settled", "cancelled"]),
      occurredAt: z.iso.datetime(),
      settledAt: z.iso.datetime().nullable(),
      cancelledAt: z.iso.datetime().nullable(),
      cancelledByUserId: z.string().nullable(),
      createdByUserId: z.string(),
      participants: z.array(expenseParticipantSchema),
    }),
  ),
});

export const groupRouter = router({
  create: participantProcedure
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
      const currentParticipant = requireParticipant(ctx.participant);

      return ctx.db.transaction(async (tx) => {
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

        return { id, name: input.name, archivedAt: null };
      });
    }),

  list: participantProcedure
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
      if (!ctx.participant) {
        return { items: [], nextCursor: null };
      }

      const currentParticipant = ctx.participant;

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
      const statusFilter =
        input.status === "active"
          ? isNull(group.archivedAt)
          : input.status === "archived"
            ? isNotNull(group.archivedAt)
            : undefined;
      const orderBy =
        input.sort === "newest"
          ? [desc(group.createdAt), desc(group.id)]
          : [asc(group.createdAt), asc(group.id)];

      const rows = await ctx.db
        .select({
          id: group.id,
          name: group.name,
          type: groupMember.role,
          createdAt: group.createdAt,
          archivedAt: group.archivedAt,
        })
        .from(groupMember)
        .innerJoin(group, eq(group.id, groupMember.groupId))
        .where(
          and(
            eq(groupMember.participantId, currentParticipant.id),
            typeFilter,
            statusFilter,
            cursorFilter,
          ),
        )
        .orderBy(...orderBy)
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const pageRows = rows.slice(0, input.limit);
      const lastItem = pageRows.at(-1);
      const groupIds = pageRows.map((row) => row.id);
      const groupParticipantRows =
        groupIds.length === 0
          ? []
          : await ctx.db
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
      const participantsByGroupId = new Map<string, z.infer<typeof groupListParticipantSchema>[]>();

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
          archivedAt: row.archivedAt?.toISOString() ?? null,
          participants: participantsByGroupId.get(row.id) ?? [],
        })),
        nextCursor:
          hasMore && lastItem
            ? { id: lastItem.id, createdAt: lastItem.createdAt.toISOString() }
            : null,
      };
    }),

  get: participantProcedure
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
      const currentParticipant = requireParticipant(ctx.participant);

      const [currentGroup] = await ctx.db
        .select({
          id: group.id,
          name: group.name,
          createdAt: group.createdAt,
          archivedAt: group.archivedAt,
        })
        .from(group)
        .innerJoin(groupMember, eq(groupMember.groupId, group.id))
        .where(and(eq(group.id, input.id), eq(groupMember.participantId, currentParticipant.id)))
        .limit(1);

      if (!currentGroup) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }

      const participantRows = await ctx.db
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

      const expenses = await ctx.db
        .select({
          id: expense.id,
          title: expense.title,
          totalMinor: expense.totalMinor,
          currency: expense.currency,
          status: expense.status,
          occurredAt: expense.occurredAt,
          settledAt: expense.settledAt,
          payerId: expense.payerId,
          payerName: participant.name,
          payerEmail: participant.email,
          payerImage: user.image,
          cancelledAt: expense.cancelledAt,
          cancelledByUserId: expense.cancelledByUserId,
          createdByUserId: expense.createdByUserId,
        })
        .from(expense)
        .innerJoin(participant, eq(participant.id, expense.payerId))
        .leftJoin(user, eq(user.id, participant.userId))
        .where(eq(expense.groupId, currentGroup.id))
        .orderBy(desc(expense.occurredAt), desc(expense.id));

      const expenseIds = expenses.map((expenseRow) => expenseRow.id);
      const expenseParticipantRows =
        expenseIds.length === 0
          ? []
          : await ctx.db
              .select({
                expenseId: expenseParticipant.expenseId,
                id: participant.id,
                name: participant.name,
                email: participant.email,
                image: user.image,
                owedMinor: expenseParticipant.owedMinor,
                status: expenseParticipant.status,
              })
              .from(expenseParticipant)
              .innerJoin(participant, eq(participant.id, expenseParticipant.participantId))
              .leftJoin(user, eq(user.id, participant.userId))
              .where(inArray(expenseParticipant.expenseId, expenseIds));

      const participantsByExpenseId = new Map<string, z.infer<typeof expenseParticipantSchema>[]>();
      for (const row of expenseParticipantRows) {
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

      return {
        id: currentGroup.id,
        name: currentGroup.name,
        createdAt: currentGroup.createdAt.toISOString(),
        archivedAt: currentGroup.archivedAt?.toISOString() ?? null,
        participants: participantRows,
        expenses: expenses.map((expenseRow) => {
          const expenseParticipants = participantsByExpenseId.get(expenseRow.id) ?? [];
          const storedPayer = expenseParticipants.find((entry) => entry.id === expenseRow.payerId);
          const payer =
            storedPayer ??
            ({
              id: expenseRow.payerId,
              name: expenseRow.payerName,
              email: expenseRow.payerEmail,
              image: expenseRow.payerImage,
              owedMinor: 0,
              status: "paid",
            } satisfies z.infer<typeof expenseParticipantSchema>);

          return {
            id: expenseRow.id,
            title: expenseRow.title,
            totalMinor: expenseRow.totalMinor,
            currency: expenseRow.currency,
            status: expenseRow.status,
            occurredAt: expenseRow.occurredAt.toISOString(),
            settledAt: expenseRow.settledAt?.toISOString() ?? null,
            cancelledAt: expenseRow.cancelledAt?.toISOString() ?? null,
            cancelledByUserId: expenseRow.cancelledByUserId,
            createdByUserId: expenseRow.createdByUserId,
            participants: [payer, ...expenseParticipants.filter((entry) => entry.id !== payer.id)],
          };
        }),
      };
    }),

  update: participantProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/groups/{id}",
        protect: true,
        tags: ["Groups"],
        summary: "Update a group name",
        errorResponses: [400, 401, 403, 404, 409, 500],
      },
    })
    .input(updateSchema)
    .output(groupMutationOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const currentParticipant = requireParticipant(ctx.participant);

      return ctx.db.transaction(async (tx) => {
        const [membership] = await tx
          .select({ id: group.id, role: groupMember.role })
          .from(group)
          .innerJoin(groupMember, eq(groupMember.groupId, group.id))
          .where(and(eq(group.id, input.id), eq(groupMember.participantId, currentParticipant.id)))
          .limit(1);

        if (!membership) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
        }

        if (membership.role !== "owner") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the group owner can update it",
          });
        }

        await assertGroupIsActive(tx, membership.id);
        await tx
          .update(group)
          .set({ name: input.name })
          .where(and(eq(group.id, membership.id), isNull(group.archivedAt)));

        const [updatedGroup] = await tx
          .select({ id: group.id, name: group.name, archivedAt: group.archivedAt })
          .from(group)
          .where(eq(group.id, membership.id))
          .limit(1);

        if (!updatedGroup || updatedGroup.archivedAt) {
          throw new TRPCError({ code: "CONFLICT", message: "Group is archived" });
        }

        return {
          id: updatedGroup.id,
          name: updatedGroup.name,
          archivedAt: null,
        };
      });
    }),

  archive: participantProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/groups/{id}/archive",
        protect: true,
        tags: ["Groups"],
        summary: "Archive a group",
        errorResponses: [400, 401, 403, 404, 500],
      },
    })
    .input(groupIdInputSchema)
    .output(groupMutationOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const currentParticipant = requireParticipant(ctx.participant);

      return ctx.db.transaction(async (tx) => {
        const [membership] = await tx
          .select({ id: group.id, name: group.name, role: groupMember.role })
          .from(group)
          .innerJoin(groupMember, eq(groupMember.groupId, group.id))
          .where(and(eq(group.id, input.id), eq(groupMember.participantId, currentParticipant.id)))
          .limit(1);

        if (!membership) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
        }

        if (membership.role !== "owner") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the group owner can archive it",
          });
        }

        await tx
          .update(group)
          .set({ archivedAt: new Date() })
          .where(and(eq(group.id, membership.id), isNull(group.archivedAt)));

        const [archivedGroup] = await tx
          .select({ id: group.id, name: group.name, archivedAt: group.archivedAt })
          .from(group)
          .where(eq(group.id, membership.id))
          .limit(1);

        if (!archivedGroup) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
        }

        return {
          id: archivedGroup.id,
          name: archivedGroup.name,
          archivedAt: archivedGroup.archivedAt?.toISOString() ?? null,
        };
      });
    }),

  restore: participantProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/groups/{id}/restore",
        protect: true,
        tags: ["Groups"],
        summary: "Restore a group",
        errorResponses: [400, 401, 403, 404, 500],
      },
    })
    .input(groupIdInputSchema)
    .output(groupMutationOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const currentParticipant = requireParticipant(ctx.participant);

      return ctx.db.transaction(async (tx) => {
        const [membership] = await tx
          .select({ id: group.id, name: group.name, role: groupMember.role })
          .from(group)
          .innerJoin(groupMember, eq(groupMember.groupId, group.id))
          .where(and(eq(group.id, input.id), eq(groupMember.participantId, currentParticipant.id)))
          .limit(1);

        if (!membership) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
        }

        if (membership.role !== "owner") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the group owner can restore it",
          });
        }

        await tx
          .update(group)
          .set({ archivedAt: null })
          .where(and(eq(group.id, membership.id), isNotNull(group.archivedAt)));

        const [restoredGroup] = await tx
          .select({ id: group.id, name: group.name, archivedAt: group.archivedAt })
          .from(group)
          .where(eq(group.id, membership.id))
          .limit(1);

        if (!restoredGroup) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
        }

        return {
          id: restoredGroup.id,
          name: restoredGroup.name,
          archivedAt: restoredGroup.archivedAt?.toISOString() ?? null,
        };
      });
    }),
});
