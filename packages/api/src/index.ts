import { initTRPC, TRPCError } from "@trpc/server";
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
