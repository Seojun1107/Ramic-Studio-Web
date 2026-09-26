CREATE TABLE `notices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('STUDIO','NEON VEIL','CAREERS','COMMUNITY') NOT NULL DEFAULT 'STUDIO',
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notices_id` PRIMARY KEY(`id`)
);
