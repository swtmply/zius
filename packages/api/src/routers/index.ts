import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";
import { dashboardRouter } from "./dashboard";
import { todoRouter } from "./todo";
import { expenseRouter } from "./expense";
import { participantRouter } from "./participant";
import { groupRouter } from "./group";
import { receiptRouter } from "./receipt";

export const v1Router = router({
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
  expense: expenseRouter,
  participant: participantRouter,
  group: groupRouter,
  receipt: receiptRouter,
  todo: todoRouter,
});
export type AppRouter = typeof v1Router;
