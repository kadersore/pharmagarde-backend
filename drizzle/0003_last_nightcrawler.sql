CREATE TABLE IF NOT EXISTS `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(64) NOT NULL DEFAULT 'ligdicash',
	`providerTransactionId` varchar(128),
	`merchantReference` varchar(128) NOT NULL,
	`planId` varchar(32) NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'XOF',
	`status` enum('pending','success','failed','cancelled') NOT NULL DEFAULT 'pending',
	`paymentUrl` text,
	`rawProviderPayload` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `transactions_merchantReference_unique` UNIQUE(`merchantReference`),
	CONSTRAINT `transactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action
);
