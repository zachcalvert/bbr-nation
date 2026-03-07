ALTER TABLE "espn_teams" ADD COLUMN "is_champion" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "espn_teams" ADD COLUMN "is_last_place" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: champion is final_standings_position = 1
UPDATE "espn_teams" SET "is_champion" = true WHERE "final_standings_position" = 1;

-- Backfill: last place is the highest regular_season_rank in each season
UPDATE "espn_teams" t
SET "is_last_place" = true
FROM (
  SELECT "season_year", MAX("regular_season_rank") AS max_rank
  FROM "espn_teams"
  WHERE "regular_season_rank" IS NOT NULL
  GROUP BY "season_year"
) ranked
WHERE t."season_year" = ranked."season_year"
  AND t."regular_season_rank" = ranked."max_rank";
