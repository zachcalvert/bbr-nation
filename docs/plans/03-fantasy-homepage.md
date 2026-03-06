# Plan: Fantasy Football Homepage & ESPN Data

**Status:** Data model finalized

## Overview
Multiple views driven by ESPN fantasy football data, cached locally in Postgres via Prisma. Data is fetched from ESPN using [`espn-fantasy-football-api`](https://github.com/mkreiser/ESPN-Fantasy-Football-API) and refreshed at most once per day.

## Views

### 1. Homepage
Current state of the current season:
- League standings
- Last week's matchup results
- This week's matchups (with projected scores if in-progress)
- Headlines — computed at runtime (biggest blowout, closest matchup, streaks, etc.)

### 2. User Detail Page
- Display name (editable by the user who owns the profile)
- Non-editable ESPN ID
- Overall fantasy record across all seasons in the league (aggregate W-L-T)

### 3. ESPN Team Detail Page (per-season team)
- Win-loss-tie record
- Roster (with weekly history)
- Inferred adds/drops (diff roster snapshots between weeks)
- Inferred sit/start decisions (starter slot vs. bench per week from boxscore data)

### 4. ESPN Season Detail Page
- Standings
- Full schedule (all weeks' matchups)

### 5. League History Page
- Link to each season's detail page
- Champion per season (`finalStandingsPosition = 1`)
- Last place finisher per season — whoever finishes the **regular season** in last place, computed from W-L-T + points-for tiebreaker and stored as `regularSeasonRank` during sync

---

## Prisma Schema

```prisma
/// One row per season we've synced data for.
model EspnSeason {
  year                Int      @id
  leagueName          String   @map("league_name")
  leagueSize          Int      @map("league_size")
  regularSeasonWeeks  Int      @map("regular_season_weeks")
  playoffWeeks        Int      @map("playoff_weeks")
  playoffTeamCount    Int      @map("playoff_team_count")
  syncedAt            DateTime @default(now()) @map("synced_at")

  teams    EspnTeam[]
  matchups EspnMatchup[]

  @@map("espn_seasons")
}

/// One row per fantasy team per season.
/// Links to a User via the team owner's ESPN member ID.
model EspnTeam {
  id                  String  @id @default(cuid())
  espnTeamId          Int     @map("espn_team_id")
  seasonYear          Int     @map("season_year")

  name                String
  abbreviation        String
  logoUrl             String? @map("logo_url")
  ownerEspnMemberId   String  @map("owner_espn_member_id")

  // Regular season record
  wins                Int     @default(0)
  losses              Int     @default(0)
  ties                Int     @default(0)

  // Points
  pointsFor           Float   @map("points_for")    @default(0)
  pointsAgainst       Float   @map("points_against") @default(0)

  // Standings
  playoffSeed            Int? @map("playoff_seed")
  finalStandingsPosition Int? @map("final_standings_position")
  regularSeasonRank      Int? @map("regular_season_rank")

  waiverRank          Int?    @map("waiver_rank")

  season   EspnSeason @relation(fields: [seasonYear], references: [year])
  owner    User?      @relation(fields: [ownerEspnMemberId], references: [espnId])

  homeMatchups  EspnMatchup[]       @relation("HomeTeam")
  awayMatchups  EspnMatchup[]       @relation("AwayTeam")
  rosterWeeks   EspnRosterWeek[]

  @@unique([espnTeamId, seasonYear])
  @@map("espn_teams")
}

/// One row per matchup (one per pair of teams per week).
model EspnMatchup {
  id                  String  @id @default(cuid())
  seasonYear          Int     @map("season_year")
  matchupPeriodId     Int     @map("matchup_period_id")

  homeTeamId          String  @map("home_team_id")
  awayTeamId          String  @map("away_team_id")

  homeScore           Float   @map("home_score")   @default(0)
  awayScore           Float   @map("away_score")   @default(0)

  season   EspnSeason @relation(fields: [seasonYear], references: [year])
  homeTeam EspnTeam   @relation("HomeTeam", fields: [homeTeamId], references: [id])
  awayTeam EspnTeam   @relation("AwayTeam", fields: [awayTeamId], references: [id])

  @@unique([seasonYear, matchupPeriodId, homeTeamId])
  @@map("espn_matchups")
}

/// Groups roster entries by team + week. One per team per scoring period.
model EspnRosterWeek {
  id                  String  @id @default(cuid())
  teamId              String  @map("team_id")
  scoringPeriodId     Int     @map("scoring_period_id")

  team    EspnTeam          @relation(fields: [teamId], references: [id])
  entries EspnRosterEntry[]

  @@unique([teamId, scoringPeriodId])
  @@map("espn_roster_weeks")
}

/// One row per player per team per week.
/// Populated from getBoxscoreForWeek (starters + bench with points)
/// and getTeamsAtWeek (full roster metadata).
model EspnRosterEntry {
  id                  String  @id @default(cuid())
  rosterWeekId        String  @map("roster_week_id")

  espnPlayerId        Int     @map("espn_player_id")
  fullName            String  @map("full_name")
  position            String
  lineupSlot          String  @map("lineup_slot")
  nflTeam             String  @map("nfl_team")
  nflTeamAbbreviation String  @map("nfl_team_abbreviation")
  totalPoints         Float   @map("total_points") @default(0)
  acquisitionDate     DateTime? @map("acquisition_date")
  injuryStatus        String?  @map("injury_status")

  rosterWeek EspnRosterWeek @relation(fields: [rosterWeekId], references: [id])

  @@unique([rosterWeekId, espnPlayerId])
  @@map("espn_roster_entries")
}
```

### Relationships

```
User.espnId  ←——→  EspnTeam.ownerEspnMemberId  (one user owns one team per season)
EspnSeason   1——*  EspnTeam                     (teams belong to a season)
EspnSeason   1——*  EspnMatchup                  (matchups belong to a season)
EspnTeam     1——*  EspnMatchup                  (home/away sides)
EspnTeam     1——*  EspnRosterWeek               (one snapshot per week)
EspnRosterWeek 1——* EspnRosterEntry             (players in that week's roster)
```

### Derived/Computed Data (no extra tables)
- **User's all-time record:** `SUM(wins), SUM(losses), SUM(ties)` across `EspnTeam` rows where `ownerEspnMemberId = user.espnId`
- **Season champion:** `EspnTeam WHERE seasonYear = X AND finalStandingsPosition = 1`
- **Regular season last place:** `EspnTeam WHERE seasonYear = X AND regularSeasonRank = (SELECT MAX(regularSeasonRank) ...)`
- **This/last week's matchups:** `EspnMatchup WHERE seasonYear = X AND matchupPeriodId = Y`
- **Adds/drops:** Diff `EspnRosterEntry` player IDs between consecutive `EspnRosterWeek` snapshots for a team
- **Sit/start decisions:** `lineupSlot` field — "Bench" vs. a starter position (QB, RB, WR, etc.)
- **Headlines:** Computed at render time from matchup scores (blowouts, close games, streaks)

---

## Data Sync Strategy

- **Server-side only.** ESPN cookies (`espn_s2`, `SWID`) stored as env vars.
- **Lazy sync:** On first API request, if `EspnSeason.syncedAt` is stale (>24 hours), trigger a background refresh.
- **Historical seasons:** Synced once (all weeks' rosters + matchups), then frozen. No re-fetching.
- **Current season:** Re-synced daily during the NFL season. Each sync fetches:
  1. `getLeagueInfo` → upsert `EspnSeason`
  2. `getTeamsAtWeek` for latest scoring period → upsert `EspnTeam` records
  3. `getBoxscoreForWeek` for each completed week → upsert `EspnMatchup` + `EspnRosterWeek`/`EspnRosterEntry`
  4. Compute `regularSeasonRank` after the final regular season week
- **Backfill:** For historical seasons (2018+), iterate all weeks via `getTeamsAtWeek` + `getBoxscoreForWeek` to populate roster snapshots. Pre-2018 uses `getHistorical*` variants.

---

## ESPN API Surface (for reference)

| Method | Returns | We Use For |
|--------|---------|------------|
| `getLeagueInfo({ seasonId })` | League metadata | `EspnSeason` |
| `getTeamsAtWeek({ seasonId, scoringPeriodId })` | Team[] | `EspnTeam`, roster metadata |
| `getBoxscoreForWeek({ seasonId, matchupPeriodId, scoringPeriodId })` | Boxscore[] | `EspnMatchup`, `EspnRosterWeek`/`Entry` (points + lineup slot) |
| `getHistoricalTeamsAtWeek(...)` | Team[] | Pre-2018 `EspnTeam` |
| `getHistoricalScoreboardForWeek(...)` | Boxscore[] | Pre-2018 matchups + rosters |
| `getDraftInfo({ seasonId })` | DraftPlayer[] | Future use (draft recap page?) |
| `getFreeAgents({ seasonId, scoringPeriodId })` | FreeAgentPlayer[] | Not currently used |
| `getNFLGamesForPeriod({ startDate, endDate })` | NFLGame[] | Not currently used |

## Decisions Log
- **Transactions:** Dropped from scope. The npm package doesn't expose them. Can revisit later.
- **Roster history:** Stored per-week via `EspnRosterWeek` → `EspnRosterEntry`. Enables inferred adds/drops and sit/start analysis.
- **Regular season last place:** Computed from W-L-T + points-for tiebreaker and stored as `regularSeasonRank` on `EspnTeam` during sync.
- **Headlines:** Computed at runtime from matchup data. No dedicated storage.

## Notes
- Private league access requires `espn_s2` + `SWID` cookies (NodeJS only).
- `getBoxscoreForWeek` is the key call — it gives us matchup scores AND per-player points with lineup positions.
- Each user's `espnId` (see `04-user-model.md`) maps them to their `EspnTeam` across seasons.
