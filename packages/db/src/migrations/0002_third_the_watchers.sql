ALTER TABLE `expense` ADD `category` text DEFAULT 'others' NOT NULL;--> statement-breakpoint
ALTER TABLE `expense` ADD `icon_name` text DEFAULT 'ReceiptTextIcon' NOT NULL;