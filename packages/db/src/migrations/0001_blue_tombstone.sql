PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_expense` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`total_minor` integer NOT NULL,
	`currency` text DEFAULT 'PHP' NOT NULL,
	`payer_id` text NOT NULL,
	`group_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`split_method` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`settled_at` integer,
	`cancelled_at` integer,
	`cancelled_by_user_id` text,
	`created_by_user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`payer_id`) REFERENCES `participant`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cancelled_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "expense_total_positive_check" CHECK("__new_expense"."total_minor" > 0),
	CONSTRAINT "expense_currency_check" CHECK("__new_expense"."currency" glob '[A-Z][A-Z][A-Z]'),
	CONSTRAINT "expense_status_check" CHECK("__new_expense"."status" in ('active', 'settled', 'cancelled')),
	CONSTRAINT "expense_split_method_check" CHECK("__new_expense"."split_method" in ('equal', 'fixed', 'percentage')),
	CONSTRAINT "expense_state_metadata_check" CHECK(("__new_expense"."status" = 'active' and "__new_expense"."settled_at" is null and "__new_expense"."cancelled_at" is null and "__new_expense"."cancelled_by_user_id" is null) or ("__new_expense"."status" = 'settled' and "__new_expense"."settled_at" is not null and "__new_expense"."cancelled_at" is null and "__new_expense"."cancelled_by_user_id" is null) or ("__new_expense"."status" = 'cancelled' and "__new_expense"."settled_at" is null and "__new_expense"."cancelled_at" is not null and "__new_expense"."cancelled_by_user_id" is not null))
);
--> statement-breakpoint
INSERT INTO `__new_expense`("id", "title", "total_minor", "currency", "payer_id", "group_id", "status", "split_method", "occurred_at", "settled_at", "cancelled_at", "cancelled_by_user_id", "created_by_user_id", "created_at", "updated_at") SELECT "id", "title", "total_minor", "currency", "payer_id", "group_id", "status", "split_method", "occurred_at", "settled_at", NULL, NULL, "created_by_user_id", "created_at", "updated_at" FROM `expense`;--> statement-breakpoint
DROP TABLE `expense`;--> statement-breakpoint
ALTER TABLE `__new_expense` RENAME TO `expense`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `expense_group_id_idx` ON `expense` (`group_id`);--> statement-breakpoint
CREATE INDEX `expense_payer_id_idx` ON `expense` (`payer_id`);--> statement-breakpoint
CREATE INDEX `expense_status_idx` ON `expense` (`status`);--> statement-breakpoint
CREATE INDEX `expense_occurred_at_idx` ON `expense` (`occurred_at`);
