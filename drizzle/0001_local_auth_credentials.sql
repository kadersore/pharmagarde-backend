ALTER TABLE `users` ADD `phone` varchar(32);
--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` text;
--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_phone_unique` UNIQUE(`phone`);
