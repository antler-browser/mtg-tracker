CREATE TABLE `decks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_did` text NOT NULL,
	`name` text NOT NULL,
	`commander_name` text,
	`mana_colors` text,
	`image_url` text,
	`type_line` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_decks_user_did` ON `decks` (`user_did`);--> statement-breakpoint
CREATE TABLE `match_placements` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`deck_id` text,
	`deck_name` text NOT NULL,
	`placement` integer NOT NULL,
	`is_owner` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_placements_match_id` ON `match_placements` (`match_id`);--> statement-breakpoint
CREATE INDEX `idx_placements_deck_id` ON `match_placements` (`deck_id`);--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`created_by_did` text NOT NULL,
	`player_count` integer NOT NULL,
	`played_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_matches_created_by` ON `matches` (`created_by_did`);--> statement-breakpoint
CREATE INDEX `idx_matches_played_at` ON `matches` (`played_at`);