CREATE TABLE `favorites` (
	`user_id` text NOT NULL,
	`post_id` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `post_id`)
);
