import type { Database } from "@zius/db";
import { group } from "@zius/db/schema/expense";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

/** Refuses writes that would add or change data in an archived group. */
export async function assertGroupIsActive(db: Pick<Database, "select">, groupId: string) {
  const [currentGroup] = await db
    .select({ archivedAt: group.archivedAt })
    .from(group)
    .where(eq(group.id, groupId))
    .limit(1);

  if (!currentGroup) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
  }

  if (currentGroup.archivedAt) {
    throw new TRPCError({ code: "CONFLICT", message: "Group is archived" });
  }
}
