import { relations, sql } from "drizzle-orm";
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

const timestamps = () => ({
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const participant = sqliteTable(
  "participant",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    claimedAt: integer("claimed_at", { mode: "timestamp_ms" }),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("participant_email_uidx").on(table.email),
    uniqueIndex("participant_user_id_uidx").on(table.userId),
  ],
);

export const group = sqliteTable("group", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => user.id),
  archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  ...timestamps(),
});

export const groupMember = sqliteTable(
  "group_member",
  {
    groupId: text("group_id")
      .notNull()
      .references(() => group.id, { onDelete: "cascade" }),
    participantId: text("participant_id")
      .notNull()
      .references(() => participant.id),
    role: text("role", { enum: ["owner", "member"] })
      .default("member")
      .notNull(),
    joinedAt: integer("joined_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.groupId, table.participantId] }),
    check("group_member_role_check", sql`${table.role} in ('owner', 'member')`),
    index("group_member_participant_id_idx").on(table.participantId),
  ],
);

export const bill = sqliteTable(
  "bill",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    totalMinor: integer("total_minor").notNull(),
    currency: text("currency").default("PHP").notNull(),
    payerId: text("payer_id")
      .notNull()
      .references(() => participant.id),
    groupId: text("group_id").references(() => group.id),
    status: text("status", { enum: ["active", "settled"] })
      .default("active")
      .notNull(),
    splitMethod: text("split_method", {
      enum: ["equal", "fixed", "percentage"],
    }).notNull(),
    occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
    settledAt: integer("settled_at", { mode: "timestamp_ms" }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id),
    ...timestamps(),
  },
  (table) => [
    check("bill_total_positive_check", sql`${table.totalMinor} > 0`),
    check("bill_currency_check", sql`${table.currency} glob '[A-Z][A-Z][A-Z]'`),
    check("bill_status_check", sql`${table.status} in ('active', 'settled')`),
    check("bill_split_method_check", sql`${table.splitMethod} in ('equal', 'fixed', 'percentage')`),
    check(
      "bill_settlement_check",
      sql`(${table.status} = 'active' and ${table.settledAt} is null) or (${table.status} = 'settled' and ${table.settledAt} is not null)`,
    ),
    index("bill_group_id_idx").on(table.groupId),
    index("bill_payer_id_idx").on(table.payerId),
    index("bill_status_idx").on(table.status),
  ],
);

export const billParticipant = sqliteTable(
  "bill_participant",
  {
    billId: text("bill_id")
      .notNull()
      .references(() => bill.id, { onDelete: "cascade" }),
    participantId: text("participant_id")
      .notNull()
      .references(() => participant.id),
    owedMinor: integer("owed_minor").notNull(),
    status: text("status", { enum: ["paid", "unpaid"] })
      .default("unpaid")
      .notNull(),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    primaryKey({ columns: [table.billId, table.participantId] }),
    check("bill_participant_owed_check", sql`${table.owedMinor} >= 0`),
    check("bill_participant_status_check", sql`${table.status} in ('paid', 'unpaid')`),
    check(
      "bill_participant_payment_check",
      sql`(${table.status} = 'unpaid' and ${table.paidAt} is null) or (${table.status} = 'paid' and ${table.paidAt} is not null)`,
    ),
    index("bill_participant_participant_id_idx").on(table.participantId),
    index("bill_participant_status_idx").on(table.status),
  ],
);

export const participantRelations = relations(participant, ({ one, many }) => ({
  user: one(user, {
    fields: [participant.userId],
    references: [user.id],
  }),
  groupMemberships: many(groupMember),
  paidBills: many(bill),
  billParticipants: many(billParticipant),
}));

export const groupRelations = relations(group, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [group.createdByUserId],
    references: [user.id],
  }),
  members: many(groupMember),
  bills: many(bill),
}));

export const groupMemberRelations = relations(groupMember, ({ one }) => ({
  group: one(group, {
    fields: [groupMember.groupId],
    references: [group.id],
  }),
  participant: one(participant, {
    fields: [groupMember.participantId],
    references: [participant.id],
  }),
}));

export const billRelations = relations(bill, ({ one, many }) => ({
  payer: one(participant, {
    fields: [bill.payerId],
    references: [participant.id],
  }),
  group: one(group, {
    fields: [bill.groupId],
    references: [group.id],
  }),
  createdBy: one(user, {
    fields: [bill.createdByUserId],
    references: [user.id],
  }),
  participants: many(billParticipant),
}));

export const billParticipantRelations = relations(billParticipant, ({ one }) => ({
  bill: one(bill, {
    fields: [billParticipant.billId],
    references: [bill.id],
  }),
  participant: one(participant, {
    fields: [billParticipant.participantId],
    references: [participant.id],
  }),
}));
