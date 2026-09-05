import { participant } from "@zius/db/schema/expense";
import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type { OpenApiMeta } from "trpc-to-openapi";

import type { Context } from "./context";

export const t = initTRPC.context<Context>().meta<OpenApiMeta>().create();

export const router = t.router;

/**
 * Builds a caller over a context you supply, so a procedure can be run against
 * a database and a session of your choosing. This is the seam the tests use.
 */
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

/** The signed-in user's row in the participant table. */
export type CurrentParticipant = {
  id: string;
  name: string;
  email: string;
};

/**
 * Resolves the signed-in user's participant row onto `ctx.participant`, leaving
 * it null when they have none.
 *
 * The procedures that need the row disagree about what a missing one means:
 * most treat it as NOT_FOUND, while the two list reads and the dashboard treat
 * it as "nothing to show yet". So this middleware only performs the lookup and
 * leaves the judgement to each procedure — `requireParticipant` covers the
 * NOT_FOUND case.
 */
export const participantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const [currentParticipant] = await ctx.db
    .select({
      id: participant.id,
      name: participant.name,
      email: participant.email,
    })
    .from(participant)
    .where(eq(participant.userId, ctx.session.user.id))
    .limit(1);

  return next({
    ctx: {
      ...ctx,
      participant: currentParticipant ?? null,
    },
  });
});

/**
 * Narrows a resolved participant for the procedures that require one, throwing
 * the same NOT_FOUND they each threw before.
 *
 * Deliberately called from inside the resolver rather than from a middleware of
 * its own: a middleware registered on the builder runs ahead of the one that
 * `.input()` installs, which would let a missing participant mask an input
 * validation error that callers currently see first.
 */
export function requireParticipant(
  currentParticipant: CurrentParticipant | null,
): CurrentParticipant {
  if (!currentParticipant) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Current participant not found",
    });
  }
  return currentParticipant;
}
