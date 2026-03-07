-- AlterTable
ALTER TABLE "espn_teams" ADD COLUMN "user_id" TEXT;

-- AddForeignKey
ALTER TABLE "espn_teams" ADD CONSTRAINT "espn_teams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
