ALTER TABLE `users` ADD `phone` varchar(32);
ALTER TABLE `users` ADD `passwordHash` text;
ALTER TABLE `users` ADD CONSTRAINT `users_phone_unique` UNIQUE(`phone`);
