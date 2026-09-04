import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";
import { dashboardRouter } from "./dashboard";
import { todoRouter } from "./todo";
import { billRouter } from "./bill";
import { participantRouter } from "./participant";
import { groupRouter } from "./group";

export const appRouter = router({
  healthCheck: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/health",
        tags: ["Health"],
        summary: "Check API health",
      },
    })
    .input(z.void())
    .output(z.literal("OK"))
    .query(() => "OK" as const),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  dashboard: dashboardRouter,
  bill: billRouter,
  participant: participantRouter,
  group: groupRouter,
  todo: todoRouter,
});
export type AppRouter = typeof appRouter;
