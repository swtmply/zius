import { expenseGroup, expenseGroupMember, person } from "@zius/db/schema/expenses";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import type { Context } from "../context";
import { protectedProcedure, router } from "../index";
import { getOrCreateCurrentPerson } from "./people";
import { expenseGroupDetailSchema, expenseGroupSchema, membershipSchema } from "./schemas";

const groupFields = {
  id: expenseGroup.id,
  name: expenseGroup.name,
  image: expenseGroup.image,
  defaultCurrency: expenseGroup.defaultCurrency,
  createdById: expenseGroup.createdById,
  archivedAt: expenseGroup.archivedAt,
  createdAt: expenseGroup.createdAt,
  updatedAt: expenseGroup.updatedAt,
};

const groupIdInput = z.object({
  id: z.string().min(1),
});

const membershipInput = z.object({
  groupId: z.string().min(1),
  personId: z.string().min(1),
});

type AuthenticatedContext = Context & { session: NonNullable<Context["session"]> };

async function requireGroupOwner(ctx: AuthenticatedContext, groupId: string) {
  const [group] = await ctx.db
    .select({ id: expenseGroup.id })
    .from(expenseGroup)
    .where(eq(expenseGroup.id, groupId))
    .limit(1);

  if (!group) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
  }

  const currentPerson = await getOrCreateCurrentPerson(ctx.db, ctx.session);
  const [ownerMembership] = await ctx.db
    .select({ personId: expenseGroupMember.personId })
    .from(expenseGroupMember)
    .where(
      and(
        eq(expenseGroupMember.groupId, groupId),
        eq(expenseGroupMember.personId, currentPerson.id),
        eq(expenseGroupMember.role, "owner"),
        isNull(expenseGroupMember.removedAt),
      ),
    )
    .limit(1);

  if (!ownerMembership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only the group owner can manage members" });
  }
}

async function requirePerson(ctx: AuthenticatedContext, personId: string) {
  const [resolvedPerson] = await ctx.db
    .select({ id: person.id })
    .from(person)
    .where(eq(person.id, personId))
    .limit(1);

  if (!resolvedPerson) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Person not found" });
  }
}

export const groupsRouter = router({
  create: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/groups",
        tags: ["Expense groups"],
        summary: "Create an expense group",
        description: "The caller becomes the owner of the new group.",
      },
    })
    .input(
      z.object({
        name: z.string().trim().min(1),
        defaultCurrency: z
          .string()
          .trim()
          .toUpperCase()
          .regex(/^[A-Z]{3}$/)
          .default("PHP"),
      }),
    )
    .output(expenseGroupSchema)
    .mutation(async ({ ctx, input }) => {
      const currentPerson = await getOrCreateCurrentPerson(ctx.db, ctx.session);
      const groupId = crypto.randomUUID();

      const [createdGroupRows] = await ctx.db.batch([
        ctx.db
          .insert(expenseGroup)
          .values({
            id: groupId,
            name: input.name,
            defaultCurrency: input.defaultCurrency,
            createdById: ctx.session.user.id,
          })
          .returning(),
        ctx.db.insert(expenseGroupMember).values({
          groupId,
          personId: currentPerson.id,
          role: "owner",
        }),
      ]);

      const [createdGroup] = createdGroupRows;

      if (!createdGroup) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create group" });
      }

      return createdGroup;
    }),

  list: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/groups",
        tags: ["Expense groups"],
        summary: "List the caller's active expense groups",
      },
    })
    .output(z.array(expenseGroupSchema))
    .query(async ({ ctx }) => {
      const currentPerson = await getOrCreateCurrentPerson(ctx.db, ctx.session);

      return ctx.db
        .select(groupFields)
        .from(expenseGroup)
        .innerJoin(expenseGroupMember, eq(expenseGroupMember.groupId, expenseGroup.id))
        .where(
          and(
            eq(expenseGroupMember.personId, currentPerson.id),
            isNull(expenseGroupMember.removedAt),
            isNull(expenseGroup.archivedAt),
          ),
        )
        .orderBy(asc(expenseGroup.name), asc(expenseGroup.id));
    }),

  get: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/groups/{id}",
        tags: ["Expense groups"],
        summary: "Read an expense group and its active members",
      },
    })
    .input(groupIdInput)
    .output(expenseGroupDetailSchema)
    .query(async ({ ctx, input }) => {
      const [group] = await ctx.db
        .select(groupFields)
        .from(expenseGroup)
        .where(eq(expenseGroup.id, input.id))
        .limit(1);

      if (!group) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }

      const currentPerson = await getOrCreateCurrentPerson(ctx.db, ctx.session);
      const [membership] = await ctx.db
        .select({ groupId: expenseGroupMember.groupId })
        .from(expenseGroupMember)
        .where(
          and(
            eq(expenseGroupMember.groupId, group.id),
            eq(expenseGroupMember.personId, currentPerson.id),
            isNull(expenseGroupMember.removedAt),
          ),
        )
        .limit(1);

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Active group membership required" });
      }

      const members = await ctx.db
        .select({
          id: person.id,
          displayName: person.displayName,
          email: person.emailNormalized,
          role: expenseGroupMember.role,
          joinedAt: expenseGroupMember.joinedAt,
        })
        .from(expenseGroupMember)
        .innerJoin(person, eq(person.id, expenseGroupMember.personId))
        .where(and(eq(expenseGroupMember.groupId, group.id), isNull(expenseGroupMember.removedAt)))
        .orderBy(
          desc(expenseGroupMember.role),
          asc(expenseGroupMember.joinedAt),
          asc(expenseGroupMember.personId),
        );

      return { ...group, members };
    }),

  addMember: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/groups/{groupId}/members",
        tags: ["Expense groups"],
        summary: "Add a person to an expense group",
        description:
          "Only the group owner can add members. Re-adding a removed person reactivates their membership.",
      },
    })
    .input(membershipInput)
    .output(membershipSchema)
    .mutation(async ({ ctx, input }) => {
      await requireGroupOwner(ctx, input.groupId);
      await requirePerson(ctx, input.personId);

      const [membership] = await ctx.db
        .insert(expenseGroupMember)
        .values({
          groupId: input.groupId,
          personId: input.personId,
          role: "member",
        })
        .onConflictDoUpdate({
          target: [expenseGroupMember.groupId, expenseGroupMember.personId],
          set: { removedAt: null },
        })
        .returning();

      if (!membership) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not add group member",
        });
      }

      return membership;
    }),

  removeMember: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/groups/{groupId}/members/{personId}",
        tags: ["Expense groups"],
        summary: "Remove a person from an expense group",
        description:
          "Only the group owner can remove members, and the owner membership cannot be removed.",
      },
    })
    .input(membershipInput)
    .output(membershipSchema)
    .mutation(async ({ ctx, input }) => {
      await requireGroupOwner(ctx, input.groupId);
      await requirePerson(ctx, input.personId);

      const [membership] = await ctx.db
        .select()
        .from(expenseGroupMember)
        .where(
          and(
            eq(expenseGroupMember.groupId, input.groupId),
            eq(expenseGroupMember.personId, input.personId),
          ),
        )
        .limit(1);

      if (!membership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Membership not found" });
      }

      if (membership.role === "owner") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The group owner cannot remove their owner membership",
        });
      }

      if (membership.removedAt) {
        return membership;
      }

      const [removedMembership] = await ctx.db
        .update(expenseGroupMember)
        .set({ removedAt: new Date() })
        .where(
          and(
            eq(expenseGroupMember.groupId, input.groupId),
            eq(expenseGroupMember.personId, input.personId),
          ),
        )
        .returning();

      if (!removedMembership) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not remove group member",
        });
      }

      return removedMembership;
    }),
});
