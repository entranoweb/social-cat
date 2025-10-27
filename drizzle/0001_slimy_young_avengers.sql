CREATE TABLE `api_credentials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`platform` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_credentials_key_unique` ON `api_credentials` (`key`);--> statement-breakpoint
CREATE INDEX `api_credentials_platform_idx` ON `api_credentials` (`platform`);--> statement-breakpoint
CREATE TABLE `job_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_name` text NOT NULL,
	`status` text NOT NULL,
	`message` text NOT NULL,
	`details` text,
	`duration` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `job_logs_job_name_idx` ON `job_logs` (`job_name`);--> statement-breakpoint
CREATE INDEX `job_logs_status_idx` ON `job_logs` (`status`);--> statement-breakpoint
CREATE INDEX `job_logs_created_at_idx` ON `job_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `twitter_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`window_type` text NOT NULL,
	`posts_count` integer DEFAULT 0 NOT NULL,
	`reads_count` integer DEFAULT 0 NOT NULL,
	`window_start` integer NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `twitter_usage_window_type_unique` ON `twitter_usage` (`window_type`);--> statement-breakpoint
CREATE INDEX `twitter_usage_window_type_idx` ON `twitter_usage` (`window_type`);--> statement-breakpoint
CREATE INDEX `twitter_usage_window_start_idx` ON `twitter_usage` (`window_start`);--> statement-breakpoint
CREATE INDEX `app_settings_key_idx` ON `app_settings` (`key`);--> statement-breakpoint
CREATE INDEX `tweet_replies_original_tweet_status_idx` ON `tweet_replies` (`original_tweet_id`,`status`);--> statement-breakpoint
CREATE INDEX `youtube_comments_status_created_idx` ON `youtube_comments` (`status`,`created_at`);