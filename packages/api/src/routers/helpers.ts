import type { Database } from "@zius/db";
import { group, groupMember, participant } from "@zius/db/schema/expense";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray, sql } from "drizzle-orm";

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

/** Loads the caller's membership and refuses anyone but the owner. */
export async function requireGroupOwner(
  db: Pick<Database, "select">,
  { groupId, participantId, action }: { groupId: string; participantId: string; action: string },
) {
  const [membership] = await db
    .select({
      id: group.id,
      name: group.name,
      archivedAt: group.archivedAt,
      role: groupMember.role,
    })
    .from(group)
    .innerJoin(groupMember, eq(groupMember.groupId, group.id))
    .where(and(eq(group.id, groupId), eq(groupMember.participantId, participantId)))
    .limit(1);

  if (!membership) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
  }

  if (membership.role !== "owner") {
    throw new TRPCError({ code: "FORBIDDEN", message: `Only the group owner can ${action}` });
  }

  return membership;
}

/** Finds or creates participants by email, keyed by lowercased email. */
export async function resolveParticipantIdsByEmail(
  db: Pick<Database, "select" | "insert">,
  entries: { name: string; email: string }[],
) {
  const idsByEmail = new Map<string, string>();
  const emails = entries.map((entry) => entry.email.toLowerCase());

  if (emails.length === 0) {
    return idsByEmail;
  }

  const load = async () => {
    const rows = await db
      .select({ id: participant.id, email: participant.email })
      .from(participant)
      .where(inArray(sql<string>`lower(${participant.email})`, emails));

    for (const row of rows) {
      idsByEmail.set(row.email.toLowerCase(), row.id);
    }
  };

  await load();

  const missing = entries.filter((entry) => !idsByEmail.has(entry.email.toLowerCase()));

  if (missing.length > 0) {
    await db
      .insert(participant)
      .values(missing.map((entry) => ({ name: entry.name, email: entry.email.toLowerCase() })))
      .onConflictDoNothing({ target: participant.email });

    await load();
  }

  return idsByEmail;
}
