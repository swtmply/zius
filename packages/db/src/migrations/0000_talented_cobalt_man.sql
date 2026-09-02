CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`issuer` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_issuer_accountId_uidx` ON `account` (`issuer`,`account_id`);--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`deleted_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `bill` (
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
	`created_by_user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`payer_id`) REFERENCES `participant`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "bill_total_positive_check" CHECK("bill"."total_minor" > 0),
	CONSTRAINT "bill_currency_check" CHECK("bill"."currency" glob '[A-Z][A-Z][A-Z]'),
	CONSTRAINT "bill_status_check" CHECK("bill"."status" in ('active', 'settled')),
	CONSTRAINT "bill_split_method_check" CHECK("bill"."split_method" in ('equal', 'fixed', 'percentage')),
	CONSTRAINT "bill_settlement_check" CHECK(("bill"."status" = 'active' and "bill"."settled_at" is null) or ("bill"."status" = 'settled' and "bill"."settled_at" is not null))
);
--> statement-breakpoint
CREATE INDEX `bill_group_id_idx` ON `bill` (`group_id`);--> statement-breakpoint
CREATE INDEX `bill_payer_id_idx` ON `bill` (`payer_id`);--> statement-breakpoint
CREATE INDEX `bill_status_idx` ON `bill` (`status`);--> statement-breakpoint
CREATE TABLE `bill_participant` (
	`bill_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`owed_minor` integer NOT NULL,
	`status` text DEFAULT 'unpaid' NOT NULL,
	`paid_at` integer,
	PRIMARY KEY(`bill_id`, `participant_id`),
	FOREIGN KEY (`bill_id`) REFERENCES `bill`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`participant_id`) REFERENCES `participant`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "bill_participant_owed_check" CHECK("bill_participant"."owed_minor" >= 0),
	CONSTRAINT "bill_participant_status_check" CHECK("bill_participant"."status" in ('paid', 'unpaid')),
	CONSTRAINT "bill_participant_payment_check" CHECK(("bill_participant"."status" = 'unpaid' and "bill_participant"."paid_at" is null) or ("bill_participant"."status" = 'paid' and "bill_participant"."paid_at" is not null))
);
--> statement-breakpoint
CREATE INDEX `bill_participant_participant_id_idx` ON `bill_participant` (`participant_id`);--> statement-breakpoint
CREATE INDEX `bill_participant_status_idx` ON `bill_participant` (`status`);--> statement-breakpoint
CREATE TABLE `group` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_by_user_id` text NOT NULL,
	`archived_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `group_member` (
	`group_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`joined_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`group_id`, `participant_id`),
	FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`participant_id`) REFERENCES `participant`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "group_member_role_check" CHECK("group_member"."role" in ('owner', 'member'))
);
--> statement-breakpoint
CREATE INDEX `group_member_participant_id_idx` ON `group_member` (`participant_id`);--> statement-breakpoint
CREATE TABLE `participant` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`claimed_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participant_email_uidx` ON `participant` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `participant_user_id_uidx` ON `participant` (`user_id`);--> statement-breakpoint
CREATE TABLE `todo` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`text` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL
);
