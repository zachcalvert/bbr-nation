-- Make groupme_id optional (nullable) so the app works without GroupMe
ALTER TABLE "users" ALTER COLUMN "groupme_id" DROP NOT NULL;
