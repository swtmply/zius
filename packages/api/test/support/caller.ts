import type { Database } from "@zius/db";

import { createCallerFactory } from "../../src/index";
import { appRouter } from "../../src/routers/index";
import type { Person } from "./fixtures";

const createAppCaller = createCallerFactory(appRouter);

/** A caller for the given person, or an anonymous one when no person is given. */
export function createCaller(db: Database, person?: Person) {
  return createAppCaller({ db, session: person?.session ?? null });
}
