import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { user } from "./auth";

const nowMs = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const person = sqliteTable(
  "person",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "restrict" }),
    displayName: text("display_name").notNull(),
    emailNormalized: text("email_normalized").notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    claimedAt: integer("claimed_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("person_user_id_uidx").on(table.userId),
    uniqueIndex("person_email_normalized_uidx").on(table.emailNormalized),
    index("person_created_by_user_id_idx").on(table.createdByUserId),
    check(
      "person_email_normalized_check",
      sql`${table.emailNormalized} = lower(trim(${table.emailNormalized}))`,
    ),
    check(
      "person_claim_state_check",
      sql`(${table.userId} is null and ${table.claimedAt} is null)
        or (${table.userId} is not null and ${table.claimedAt} is not null)`,
    ),
  ],
);

export const connection = sqliteTable(
  "connection",
  {
    userAId: text("user_a_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userBId: text("user_b_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    requestedById: text("requested_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["pending", "accepted", "blocked"] })
      .default("pending")
      .notNull(),
    respondedAt: integer("responded_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userAId, table.userBId] }),
    index("connection_user_a_id_idx").on(table.userAId),
    index("connection_user_b_id_idx").on(table.userBId),
    index("connection_status_idx").on(table.status),
    check("connection_users_order_check", sql`${table.userAId} < ${table.userBId}`),
    check(
      "connection_requester_check",
      sql`${table.requestedById} = ${table.userAId} or ${table.requestedById} = ${table.userBId}`,
    ),
    check("connection_status_check", sql`${table.status} in ('pending', 'accepted', 'blocked')`),
  ],
);

export const expenseGroup = sqliteTable(
  "expense_group",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    image: text("image"),
    defaultCurrency: text("default_currency").default("PHP").notNull(),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("expense_group_created_by_id_idx").on(table.createdById),
    index("expense_group_archived_at_idx").on(table.archivedAt),
    check("expense_group_currency_check", sql`length(${table.defaultCurrency}) = 3`),
  ],
);

export const expenseGroupMember = sqliteTable(
  "expense_group_member",
  {
    groupId: text("group_id")
      .notNull()
      .references(() => expenseGroup.id, { onDelete: "cascade" }),
    personId: text("person_id")
      .notNull()
      .references(() => person.id, { onDelete: "restrict" }),
    role: text("role", { enum: ["owner", "member"] })
      .default("member")
      .notNull(),
    joinedAt: integer("joined_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    removedAt: integer("removed_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    primaryKey({ columns: [table.groupId, table.personId] }),
    index("expense_group_member_person_id_idx").on(table.personId, table.removedAt),
    check("expense_group_member_role_check", sql`${table.role} in ('owner', 'member')`),
  ],
);

export const expense = sqliteTable(
  "expense",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id").references(() => expenseGroup.id, { onDelete: "set null" }),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    note: text("note"),
    totalMinor: integer("total_minor").notNull(),
    currency: text("currency").default("PHP").notNull(),
    splitMethod: text("split_method", {
      enum: ["equal", "exact", "percentage", "shares"],
    })
      .default("equal")
      .notNull(),
    status: text("status", { enum: ["active", "settled", "cancelled"] })
      .default("active")
      .notNull(),
    occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    settledAt: integer("settled_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("expense_group_status_occurred_at_idx").on(table.groupId, table.status, table.occurredAt),
    index("expense_created_by_occurred_at_idx").on(table.createdById, table.occurredAt),
    check("expense_total_positive_check", sql`${table.totalMinor} > 0`),
    check("expense_currency_check", sql`length(${table.currency}) = 3`),
    check(
      "expense_split_method_check",
      sql`${table.splitMethod} in ('equal', 'exact', 'percentage', 'shares')`,
    ),
    check("expense_status_check", sql`${table.status} in ('active', 'settled', 'cancelled')`),
  ],
);

export const expenseParticipant = sqliteTable(
  "expense_participant",
  {
    expenseId: text("expense_id")
      .notNull()
      .references(() => expense.id, { onDelete: "cascade" }),
    personId: text("person_id")
      .notNull()
      .references(() => person.id, { onDelete: "restrict" }),
    paidMinor: integer("paid_minor").default(0).notNull(),
    owedMinor: integer("owed_minor").default(0).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.expenseId, table.personId] }),
    index("expense_participant_person_id_idx").on(table.personId, table.expenseId),
    check("expense_participant_paid_check", sql`${table.paidMinor} >= 0`),
    check("expense_participant_owed_check", sql`${table.owedMinor} >= 0`),
    check(
      "expense_participant_amount_check",
      sql`${table.paidMinor} > 0 or ${table.owedMinor} > 0`,
    ),
  ],
);

export const settlement = sqliteTable(
  "settlement",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id").references(() => expenseGroup.id, { onDelete: "set null" }),
    expenseId: text("expense_id").references(() => expense.id, { onDelete: "set null" }),
    fromPersonId: text("from_person_id")
      .notNull()
      .references(() => person.id, { onDelete: "restrict" }),
    toPersonId: text("to_person_id")
      .notNull()
      .references(() => person.id, { onDelete: "restrict" }),
    recordedByUserId: text("recorded_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").default("PHP").notNull(),
    note: text("note"),
    status: text("status", { enum: ["completed", "cancelled"] })
      .default("completed")
      .notNull(),
    occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
  },
  (table) => [
    index("settlement_from_person_occurred_at_idx").on(table.fromPersonId, table.occurredAt),
    index("settlement_to_person_occurred_at_idx").on(table.toPersonId, table.occurredAt),
    index("settlement_group_occurred_at_idx").on(table.groupId, table.occurredAt),
    index("settlement_expense_id_idx").on(table.expenseId),
    check("settlement_people_check", sql`${table.fromPersonId} <> ${table.toPersonId}`),
    check("settlement_amount_check", sql`${table.amountMinor} > 0`),
    check("settlement_currency_check", sql`length(${table.currency}) = 3`),
    check("settlement_status_check", sql`${table.status} in ('completed', 'cancelled')`),
  ],
);

export const notification = sqliteTable(
  "notification",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    groupId: text("group_id").references(() => expenseGroup.id, { onDelete: "set null" }),
    expenseId: text("expense_id").references(() => expense.id, { onDelete: "set null" }),
    settlementId: text("settlement_id").references(() => settlement.id, {
      onDelete: "set null",
    }),
    kind: text("kind", {
      enum: [
        "connection_request",
        "connection_accepted",
        "group_member_added",
        "expense_created",
        "expense_updated",
        "expense_settled",
        "settlement_recorded",
      ],
    }).notNull(),
    title: text("title").notNull(),
    body: text("body"),
    readAt: integer("read_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
  },
  (table) => [
    index("notification_user_read_created_at_idx").on(table.userId, table.readAt, table.createdAt),
    check(
      "notification_kind_check",
      sql`${table.kind} in (
        'connection_request',
        'connection_accepted',
        'group_member_added',
        'expense_created',
        'expense_updated',
        'expense_settled',
        'settlement_recorded'
      )`,
    ),
  ],
);
