-- Add nullable username column with unique constraint
ALTER TABLE "users" ADD COLUMN "username" TEXT;
ALTER TABLE "users" ADD CONSTRAINT "users_username_key" UNIQUE ("username");
