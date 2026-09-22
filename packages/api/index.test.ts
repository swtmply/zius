import { expect, test } from "bun:test";

import type { Context } from "./src/context";
import { createCallerFactory, protectedProcedure, router } from "./src/index";

const testRouter = router({
  privateData: protectedProcedure.query(() => true),
});

test("rejects an authenticated user whose email is not verified", async () => {
  const caller = createCallerFactory(testRouter)({
    session: { user: { emailVerified: false } },
  } as unknown as Context);

  await expect(caller.privateData()).rejects.toMatchObject({ code: "FORBIDDEN" });
});
