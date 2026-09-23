import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const receiptScan = sqliteTable(
  "receipt_scan",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    imageHash: text("image_hash").notNull(),
    status: text("status", { enum: ["pending", "succeeded", "failed"] }).notNull(),
    source: text("source", { enum: ["free", "credits"] }),
    result: text("result"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("receipt_scan_user_id_idx").on(table.userId)],
);
