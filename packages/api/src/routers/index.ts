import { protectedProcedure, publicProcedure, router } from "../index";
import { expensesRouter } from "./expenses";
import { peopleRouter } from "./people";
import { todoRouter } from "./todo";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  expenses: expensesRouter,
  people: peopleRouter,
  todo: todoRouter,
});
export type AppRouter = typeof appRouter;
