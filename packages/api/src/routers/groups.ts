import { expenseGroup, expenseGroupMember, person } from "@zius/db/schema/expenses";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { getOrCreateCurrentPerson } from "./people";

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

export const groupsRouter = router({
  create: protectedProcedure
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

  list: protectedProcedure.query(async ({ ctx }) => {
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

  get: protectedProcedure.input(groupIdInput).query(async ({ ctx, input }) => {
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
});
