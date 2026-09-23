CREATE TABLE `receipt_scan` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`image_hash` text NOT NULL,
	`status` text NOT NULL,
	`source` text,
	`result` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `user` ADD `free_ai_scans_used` integer DEFAULT 0 NOT NULL;