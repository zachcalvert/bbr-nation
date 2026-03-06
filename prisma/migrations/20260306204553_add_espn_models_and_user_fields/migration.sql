-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "espn_id" TEXT NOT NULL,
    "groupme_id" TEXT NOT NULL,
    "favorite_team" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espn_seasons" (
    "year" INTEGER NOT NULL,
    "league_name" TEXT NOT NULL,
    "league_size" INTEGER NOT NULL,
    "regular_season_weeks" INTEGER NOT NULL,
    "playoff_weeks" INTEGER NOT NULL,
    "playoff_team_count" INTEGER NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "espn_seasons_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "espn_teams" (
    "id" TEXT NOT NULL,
    "espn_team_id" INTEGER NOT NULL,
    "season_year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "logo_url" TEXT,
    "owner_espn_member_id" TEXT NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "ties" INTEGER NOT NULL DEFAULT 0,
    "points_for" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "points_against" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "playoff_seed" INTEGER,
    "final_standings_position" INTEGER,
    "regular_season_rank" INTEGER,
    "waiver_rank" INTEGER,

    CONSTRAINT "espn_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espn_matchups" (
    "id" TEXT NOT NULL,
    "season_year" INTEGER NOT NULL,
    "matchup_period_id" INTEGER NOT NULL,
    "home_team_id" TEXT NOT NULL,
    "away_team_id" TEXT NOT NULL,
    "home_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "away_score" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "espn_matchups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espn_roster_weeks" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "scoring_period_id" INTEGER NOT NULL,

    CONSTRAINT "espn_roster_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espn_roster_entries" (
    "id" TEXT NOT NULL,
    "roster_week_id" TEXT NOT NULL,
    "espn_player_id" INTEGER NOT NULL,
    "full_name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "lineup_slot" TEXT NOT NULL,
    "nfl_team" TEXT NOT NULL,
    "nfl_team_abbreviation" TEXT NOT NULL,
    "total_points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "acquisition_date" TIMESTAMP(3),
    "injury_status" TEXT,

    CONSTRAINT "espn_roster_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_espn_id_key" ON "users"("espn_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_groupme_id_key" ON "users"("groupme_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sid_key" ON "sessions"("sid");

-- CreateIndex
CREATE UNIQUE INDEX "espn_teams_espn_team_id_season_year_key" ON "espn_teams"("espn_team_id", "season_year");

-- CreateIndex
CREATE UNIQUE INDEX "espn_matchups_season_year_matchup_period_id_home_team_id_key" ON "espn_matchups"("season_year", "matchup_period_id", "home_team_id");

-- CreateIndex
CREATE UNIQUE INDEX "espn_roster_weeks_team_id_scoring_period_id_key" ON "espn_roster_weeks"("team_id", "scoring_period_id");

-- CreateIndex
CREATE UNIQUE INDEX "espn_roster_entries_roster_week_id_espn_player_id_key" ON "espn_roster_entries"("roster_week_id", "espn_player_id");

-- AddForeignKey
ALTER TABLE "espn_teams" ADD CONSTRAINT "espn_teams_season_year_fkey" FOREIGN KEY ("season_year") REFERENCES "espn_seasons"("year") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espn_teams" ADD CONSTRAINT "espn_teams_owner_espn_member_id_fkey" FOREIGN KEY ("owner_espn_member_id") REFERENCES "users"("espn_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espn_matchups" ADD CONSTRAINT "espn_matchups_season_year_fkey" FOREIGN KEY ("season_year") REFERENCES "espn_seasons"("year") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espn_matchups" ADD CONSTRAINT "espn_matchups_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "espn_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espn_matchups" ADD CONSTRAINT "espn_matchups_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "espn_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espn_roster_weeks" ADD CONSTRAINT "espn_roster_weeks_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "espn_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espn_roster_entries" ADD CONSTRAINT "espn_roster_entries_roster_week_id_fkey" FOREIGN KEY ("roster_week_id") REFERENCES "espn_roster_weeks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
