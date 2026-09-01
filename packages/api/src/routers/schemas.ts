import { z } from "zod";

/**
 * Drizzle hands back `Date` objects, so the tRPC output parsers validate dates.
 * JSON Schema has no date type, so the OpenAPI document describes them as
 * date-time strings, which is what both transports actually put on the wire.
 */
const timestamp = z.date().meta({ type: "string", format: "date-time" });

const groupRole = z.enum(["owner", "member"]);

export const personSchema = z
  .object({
    id: z.string(),
    displayName: z.string(),
    email: z.string(),
  })
  .meta({ id: "Person" });

export const expenseGroupSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    image: z.string().nullable(),
    defaultCurrency: z.string(),
    createdById: z.string(),
    archivedAt: timestamp.nullable(),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .meta({ id: "ExpenseGroup" });

export const groupMemberSchema = z
  .object({
    id: z.string(),
    displayName: z.string(),
    email: z.string(),
    role: groupRole,
    joinedAt: timestamp,
  })
  .meta({ id: "GroupMember" });

export const expenseGroupDetailSchema = z
  .object({
    ...expenseGroupSchema.shape,
    members: z.array(groupMemberSchema),
  })
  .meta({ id: "ExpenseGroupDetail" });

export const membershipSchema = z
  .object({
    groupId: z.string(),
    personId: z.string(),
    role: groupRole,
    joinedAt: timestamp,
    removedAt: timestamp.nullable(),
  })
  .meta({ id: "Membership" });

export const expenseParticipantSchema = z
  .object({
    personId: z.string(),
    paidMinor: z.number().int(),
    owedMinor: z.number().int(),
  })
  .meta({ id: "ExpenseParticipant" });

export const expenseSchema = z
  .object({
    id: z.string(),
    groupId: z.string().nullable(),
    createdById: z.string(),
    title: z.string(),
    note: z.string().nullable(),
    totalMinor: z.number().int(),
    currency: z.string(),
    splitMethod: z.enum(["equal", "exact", "percentage", "shares"]),
    status: z.enum(["active", "settled", "cancelled"]),
    occurredAt: timestamp,
    settledAt: timestamp.nullable(),
    createdAt: timestamp,
    updatedAt: timestamp,
    participants: z.array(expenseParticipantSchema),
  })
  .meta({ id: "Expense" });
