import { FastifyPluginAsync } from "fastify";
import { prisma } from "../index.js";
import { Prisma } from "@prisma/client";

interface SeasonEntry {
  rank: number;
  teamName: string;
  abbreviation: string;
  logoUrl: string | null;
  teamId: string;
  seasonYear: number;
  value: number;
  wins?: number;
  losses?: number;
  ties?: number;
  managerName: string | null;
  managerId: string | null;
  isChampion: boolean;
  isLastPlace: boolean;
}

interface AllTimeRecord {
  userId: string;
  firstName: string;
  lastName: string;
  wins: number;
  losses: number;
  ties: number;
  seasonsPlayed: number;
  championships: number;
  lastPlaceFinishes: number;
  totalPointsFor: number;
  totalPointsAgainst: number;
}

interface TeamHistoryEntry {
  teamId: string;
  teamName: string;
  abbreviation: string;
  logoUrl: string | null;
  seasonYear: number;
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface MatchupEntry {
  rank: number;
  teamName: string;
  abbreviation: string;
  logoUrl: string | null;
  teamId: string;
  opponentName: string;
  opponentAbbreviation: string;
  seasonYear: number;
  week: number;
  value: number;
  score?: string; // "120.5 - 98.3" for blowout/closest
  managerName: string | null;
  managerId: string | null;
  isChampion: boolean;
  isLastPlace: boolean;
}

interface IndividualRecord {
  rank: number;
  playerName: string;
  nflTeam: string;
  points: number;
  week: number;
  teamId: string;
  teamName: string;
  teamAbbreviation: string;
  teamLogoUrl: string | null;
  seasonYear: number;
  isChampion: boolean;
  isLastPlace: boolean;
  managerName: string | null;
  managerId: string | null;
  opponentName: string | null;
}

export const hallOfFameRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => {
    const [
      mostPointsFor,
      fewestPointsFor,
      mostPointsAgainst,
      fewestPointsAgainst,
      mostWins,
      fewestWins,
      highestDifferential,
      lowestDifferential,
      allTimeRecordsRaw,
      championsRaw,
      lastPlaceTeamsRaw,
      highestGameScore,
      lowestGameScore,
      biggestBlowout,
      closestGame,
      tiedGames,
      indQB,
      indRB,
      indWR,
      indTE,
      indK,
    ] = await Promise.all([
      // --- Season records (Prisma) ---
      prisma.espnTeam.findMany({
        orderBy: { pointsFor: "desc" },
        take: 25,
        select: teamSelect,
      }),
      prisma.espnTeam.findMany({
        orderBy: { pointsFor: "asc" },
        take: 25,
        select: teamSelect,
      }),
      prisma.espnTeam.findMany({
        orderBy: { pointsAgainst: "desc" },
        take: 25,
        select: teamSelect,
      }),
      prisma.espnTeam.findMany({
        orderBy: { pointsAgainst: "asc" },
        take: 25,
        select: teamSelect,
      }),
      prisma.espnTeam.findMany({
        orderBy: [{ wins: "desc" }, { pointsFor: "desc" }],
        take: 25,
        select: teamSelect,
      }),
      prisma.espnTeam.findMany({
        orderBy: [{ wins: "asc" }, { pointsFor: "asc" }],
        take: 25,
        select: teamSelect,
      }),

      // --- Differential (raw SQL) ---
      prisma.$queryRaw<RawDiffRow[]>(Prisma.sql`
        SELECT t.id, t.name, t.abbreviation, t.logo_url, t.season_year,
               t.wins, t.losses, t.ties, t.points_for, t.points_against,
               (t.points_for - t.points_against) AS differential,
               t.is_champion, t.is_last_place,
               u.id AS manager_id, u.first_name AS manager_first_name, u.last_name AS manager_last_name
        FROM espn_teams t
        LEFT JOIN users u ON t.user_id = u.id
        ORDER BY differential DESC
        LIMIT 25
      `),
      prisma.$queryRaw<RawDiffRow[]>(Prisma.sql`
        SELECT t.id, t.name, t.abbreviation, t.logo_url, t.season_year,
               t.wins, t.losses, t.ties, t.points_for, t.points_against,
               (t.points_for - t.points_against) AS differential,
               t.is_champion, t.is_last_place,
               u.id AS manager_id, u.first_name AS manager_first_name, u.last_name AS manager_last_name
        FROM espn_teams t
        LEFT JOIN users u ON t.user_id = u.id
        ORDER BY differential ASC
        LIMIT 25
      `),

      // All-time records
      prisma.$queryRaw<RawAllTimeRow[]>(Prisma.sql`
        SELECT
          u.id            AS user_id,
          u.first_name,
          u.last_name,
          SUM(et.wins)    AS wins,
          SUM(et.losses)  AS losses,
          SUM(et.ties)    AS ties,
          COUNT(DISTINCT et.season_year) AS seasons_played,
          COUNT(CASE WHEN et.is_champion   THEN 1 END) AS championships,
          COUNT(CASE WHEN et.is_last_place THEN 1 END) AS last_place_finishes,
          SUM(et.points_for) AS total_points_for,
          SUM(et.points_against) AS total_points_against
        FROM users u
        JOIN espn_teams et ON u.id = et.user_id
        GROUP BY u.id, u.first_name, u.last_name
        ORDER BY wins DESC
      `),

      // Champions
      prisma.$queryRaw<RawTeamHistoryRow[]>(Prisma.sql`
        SELECT et.id AS team_id, et.name AS team_name, et.abbreviation, et.logo_url,
               et.season_year,
               u.id AS user_id, u.first_name, u.last_name
        FROM espn_teams et
        LEFT JOIN users u ON u.id = et.user_id
        WHERE et.is_champion = true
        ORDER BY et.season_year DESC
      `),

      // Last place teams
      prisma.$queryRaw<RawTeamHistoryRow[]>(Prisma.sql`
        SELECT et.id AS team_id, et.name AS team_name, et.abbreviation, et.logo_url,
               et.season_year,
               u.id AS user_id, u.first_name, u.last_name
        FROM espn_teams et
        LEFT JOIN users u ON u.id = et.user_id
        WHERE et.is_last_place = true
        ORDER BY et.season_year DESC
      `),

      // --- Matchup records (raw SQL with UNION) ---
      prisma.$queryRaw<RawMatchupRow[]>(Prisma.sql`
        SELECT * FROM (
          SELECT m.season_year, m.matchup_period_id AS week,
                 m.home_score AS score,
                 ht.id AS team_id, ht.name AS team_name, ht.abbreviation AS team_abbr, ht.logo_url AS team_logo,
                 at.name AS opp_name, at.abbreviation AS opp_abbr,
                 ht.is_champion, ht.is_last_place,
                 hu.id AS manager_id, hu.first_name AS manager_first_name, hu.last_name AS manager_last_name
          FROM espn_matchups m
          JOIN espn_teams ht ON m.home_team_id = ht.id
          JOIN espn_teams at ON m.away_team_id = at.id
          LEFT JOIN users hu ON ht.user_id = hu.id
          UNION ALL
          SELECT m.season_year, m.matchup_period_id AS week,
                 m.away_score AS score,
                 at.id AS team_id, at.name AS team_name, at.abbreviation AS team_abbr, at.logo_url AS team_logo,
                 ht.name AS opp_name, ht.abbreviation AS opp_abbr,
                 at.is_champion, at.is_last_place,
                 au.id AS manager_id, au.first_name AS manager_first_name, au.last_name AS manager_last_name
          FROM espn_matchups m
          JOIN espn_teams ht ON m.home_team_id = ht.id
          JOIN espn_teams at ON m.away_team_id = at.id
          LEFT JOIN users au ON at.user_id = au.id
        ) combined
        ORDER BY score DESC
        LIMIT 25
      `),
      prisma.$queryRaw<RawMatchupRow[]>(Prisma.sql`
        SELECT * FROM (
          SELECT m.season_year, m.matchup_period_id AS week,
                 m.home_score AS score,
                 ht.id AS team_id, ht.name AS team_name, ht.abbreviation AS team_abbr, ht.logo_url AS team_logo,
                 at.name AS opp_name, at.abbreviation AS opp_abbr,
                 ht.is_champion, ht.is_last_place,
                 hu.id AS manager_id, hu.first_name AS manager_first_name, hu.last_name AS manager_last_name
          FROM espn_matchups m
          JOIN espn_teams ht ON m.home_team_id = ht.id
          JOIN espn_teams at ON m.away_team_id = at.id
          LEFT JOIN users hu ON ht.user_id = hu.id
          UNION ALL
          SELECT m.season_year, m.matchup_period_id AS week,
                 m.away_score AS score,
                 at.id AS team_id, at.name AS team_name, at.abbreviation AS team_abbr, at.logo_url AS team_logo,
                 ht.name AS opp_name, ht.abbreviation AS opp_abbr,
                 at.is_champion, at.is_last_place,
                 au.id AS manager_id, au.first_name AS manager_first_name, au.last_name AS manager_last_name
          FROM espn_matchups m
          JOIN espn_teams ht ON m.home_team_id = ht.id
          JOIN espn_teams at ON m.away_team_id = at.id
          LEFT JOIN users au ON at.user_id = au.id
        ) combined
        WHERE score > 0
        ORDER BY score ASC
        LIMIT 25
      `),

      // Biggest blowout
      prisma.$queryRaw<RawMarginRow[]>(Prisma.sql`
        SELECT m.season_year, m.matchup_period_id AS week,
               m.home_score, m.away_score,
               ABS(m.home_score - m.away_score) AS margin,
               CASE WHEN m.home_score > m.away_score THEN ht.id ELSE at.id END AS winner_id,
               CASE WHEN m.home_score > m.away_score THEN ht.name ELSE at.name END AS winner_name,
               CASE WHEN m.home_score > m.away_score THEN ht.abbreviation ELSE at.abbreviation END AS winner_abbr,
               CASE WHEN m.home_score > m.away_score THEN ht.logo_url ELSE at.logo_url END AS winner_logo,
               CASE WHEN m.home_score > m.away_score THEN at.name ELSE ht.name END AS loser_name,
               CASE WHEN m.home_score > m.away_score THEN at.abbreviation ELSE ht.abbreviation END AS loser_abbr,
               CASE WHEN m.home_score > m.away_score THEN ht.is_champion ELSE at.is_champion END AS is_champion,
               CASE WHEN m.home_score > m.away_score THEN ht.is_last_place ELSE at.is_last_place END AS is_last_place,
               CASE WHEN m.home_score > m.away_score THEN hu.id ELSE au.id END AS manager_id,
               CASE WHEN m.home_score > m.away_score THEN hu.first_name ELSE au.first_name END AS manager_first_name,
               CASE WHEN m.home_score > m.away_score THEN hu.last_name ELSE au.last_name END AS manager_last_name
        FROM espn_matchups m
        JOIN espn_teams ht ON m.home_team_id = ht.id
        JOIN espn_teams at ON m.away_team_id = at.id
        LEFT JOIN users hu ON ht.user_id = hu.id
        LEFT JOIN users au ON at.user_id = au.id
        ORDER BY margin DESC
        LIMIT 25
      `),

      // Closest game
      prisma.$queryRaw<RawMarginRow[]>(Prisma.sql`
        SELECT m.season_year, m.matchup_period_id AS week,
               m.home_score, m.away_score,
               ABS(m.home_score - m.away_score) AS margin,
               CASE WHEN m.home_score > m.away_score THEN ht.id ELSE at.id END AS winner_id,
               CASE WHEN m.home_score > m.away_score THEN ht.name ELSE at.name END AS winner_name,
               CASE WHEN m.home_score > m.away_score THEN ht.abbreviation ELSE at.abbreviation END AS winner_abbr,
               CASE WHEN m.home_score > m.away_score THEN ht.logo_url ELSE at.logo_url END AS winner_logo,
               CASE WHEN m.home_score > m.away_score THEN at.name ELSE ht.name END AS loser_name,
               CASE WHEN m.home_score > m.away_score THEN at.abbreviation ELSE ht.abbreviation END AS loser_abbr,
               CASE WHEN m.home_score > m.away_score THEN ht.is_champion ELSE at.is_champion END AS is_champion,
               CASE WHEN m.home_score > m.away_score THEN ht.is_last_place ELSE at.is_last_place END AS is_last_place,
               CASE WHEN m.home_score > m.away_score THEN hu.id ELSE au.id END AS manager_id,
               CASE WHEN m.home_score > m.away_score THEN hu.first_name ELSE au.first_name END AS manager_first_name,
               CASE WHEN m.home_score > m.away_score THEN hu.last_name ELSE au.last_name END AS manager_last_name
        FROM espn_matchups m
        JOIN espn_teams ht ON m.home_team_id = ht.id
        JOIN espn_teams at ON m.away_team_id = at.id
        LEFT JOIN users hu ON ht.user_id = hu.id
        LEFT JOIN users au ON at.user_id = au.id
        WHERE ABS(m.home_score - m.away_score) > 0
        ORDER BY margin ASC
        LIMIT 25
      `),

      // Ties
      prisma.$queryRaw<RawMatchupRow[]>(Prisma.sql`
        SELECT m.season_year, m.matchup_period_id AS week,
               m.home_score AS score,
               ht.id AS team_id, ht.name AS team_name, ht.abbreviation AS team_abbr, ht.logo_url AS team_logo,
               at.name AS opp_name, at.abbreviation AS opp_abbr,
               ht.is_champion, ht.is_last_place,
               hu.id AS manager_id, hu.first_name AS manager_first_name, hu.last_name AS manager_last_name
        FROM espn_matchups m
        JOIN espn_teams ht ON m.home_team_id = ht.id
        JOIN espn_teams at ON m.away_team_id = at.id
        LEFT JOIN users hu ON ht.user_id = hu.id
        WHERE m.home_score = m.away_score AND m.home_score > 0
        ORDER BY m.home_score DESC
        LIMIT 25
      `),

      // --- Individual records by position ---
      buildPlayerQuery("QB"),
      buildPlayerQuery("RB"),
      buildPlayerQuery("WR"),
      buildPlayerQuery("TE"),
      buildPlayerQuery("K"),
    ]);

    return {
      seasonRecords: {
        mostPointsFor: toSeasonEntries(mostPointsFor, (t) => t.pointsFor),
        fewestPointsFor: toSeasonEntries(fewestPointsFor, (t) => t.pointsFor),
        mostPointsAgainst: toSeasonEntries(mostPointsAgainst, (t) => t.pointsAgainst),
        fewestPointsAgainst: toSeasonEntries(fewestPointsAgainst, (t) => t.pointsAgainst),
        highestDifferential: toDiffEntries(highestDifferential),
        lowestDifferential: toDiffEntries(lowestDifferential),
        mostWins: toSeasonEntries(mostWins, (t) => t.wins),
        fewestWins: toSeasonEntries(fewestWins, (t) => t.wins),
      },
      matchupRecords: {
        highestGameScore: toMatchupEntries(highestGameScore),
        lowestGameScore: toMatchupEntries(lowestGameScore),
        biggestBlowout: toMarginEntries(biggestBlowout),
        closestGame: toMarginEntries(closestGame),
        ties: toMatchupEntries(tiedGames),
      },
      allTimeRecords: toAllTimeRecords(allTimeRecordsRaw),
      champions: toTeamHistoryEntries(championsRaw),
      lastPlaceTeams: toTeamHistoryEntries(lastPlaceTeamsRaw),
      individualRecords: {
        QB: toIndividualRecords(indQB),
        RB: toIndividualRecords(indRB),
        WR: toIndividualRecords(indWR),
        TE: toIndividualRecords(indTE),
        K: toIndividualRecords(indK),
      },
    };
  });
};

// --- Helpers ---

const teamSelect = {
  id: true,
  name: true,
  abbreviation: true,
  logoUrl: true,
  seasonYear: true,
  wins: true,
  losses: true,
  ties: true,
  pointsFor: true,
  pointsAgainst: true,
  isChampion: true,
  isLastPlace: true,
  user: { select: { id: true, firstName: true, lastName: true } },
} as const;

type TeamRow = {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl: string | null;
  seasonYear: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  isChampion: boolean;
  isLastPlace: boolean;
  user: { id: string; firstName: string; lastName: string } | null;
};

interface RawDiffRow {
  id: string;
  name: string;
  abbreviation: string;
  logo_url: string | null;
  season_year: number;
  wins: number;
  losses: number;
  ties: number;
  points_for: number;
  points_against: number;
  differential: number;
  is_champion: boolean;
  is_last_place: boolean;
  manager_id: string | null;
  manager_first_name: string | null;
  manager_last_name: string | null;
}

interface RawMatchupRow {
  season_year: number;
  week: number;
  score: number;
  team_id: string;
  team_name: string;
  team_abbr: string;
  team_logo: string | null;
  opp_name: string;
  opp_abbr: string;
  is_champion: boolean;
  is_last_place: boolean;
  manager_id: string | null;
  manager_first_name: string | null;
  manager_last_name: string | null;
}

interface RawMarginRow {
  season_year: number;
  week: number;
  home_score: number;
  away_score: number;
  margin: number;
  winner_id: string;
  winner_name: string;
  winner_abbr: string;
  winner_logo: string | null;
  loser_name: string;
  loser_abbr: string;
  is_champion: boolean;
  is_last_place: boolean;
  manager_id: string | null;
  manager_first_name: string | null;
  manager_last_name: string | null;
}

interface RawAllTimeRow {
  user_id: string;
  first_name: string;
  last_name: string;
  wins: bigint;
  losses: bigint;
  ties: bigint;
  seasons_played: bigint;
  championships: bigint;
  last_place_finishes: bigint;
  total_points_for: number;
  total_points_against: number;
}

interface RawTeamHistoryRow {
  team_id: string;
  team_name: string;
  abbreviation: string;
  logo_url: string | null;
  season_year: number;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface RawPlayerRow {
  player_name: string;
  nfl_team: string;
  total_points: number;
  week: number;
  team_id: string;
  team_name: string;
  team_abbr: string;
  team_logo: string | null;
  season_year: number;
  is_champion: boolean;
  is_last_place: boolean;
  manager_id: string | null;
  manager_first_name: string | null;
  manager_last_name: string | null;
  opp_name: string | null;
}

function toManagerName(firstName: string | null, lastName: string | null): string | null {
  return firstName && lastName ? `${firstName} ${lastName}` : null;
}

function toSeasonEntries(
  rows: TeamRow[],
  valueFn: (t: TeamRow) => number
): SeasonEntry[] {
  return rows.map((t, i) => ({
    rank: i + 1,
    teamName: t.name,
    abbreviation: t.abbreviation,
    logoUrl: t.logoUrl,
    teamId: t.id,
    seasonYear: t.seasonYear,
    value: valueFn(t),
    wins: t.wins,
    losses: t.losses,
    ties: t.ties,
    isChampion: t.isChampion,
    isLastPlace: t.isLastPlace,
    managerName: t.user ? `${t.user.firstName} ${t.user.lastName}` : null,
    managerId: t.user?.id ?? null,
  }));
}

function toDiffEntries(rows: RawDiffRow[]): SeasonEntry[] {
  return rows.map((r, i) => ({
    rank: i + 1,
    teamName: r.name,
    abbreviation: r.abbreviation,
    logoUrl: r.logo_url,
    teamId: r.id,
    seasonYear: r.season_year,
    value: Number(r.differential),
    wins: r.wins,
    losses: r.losses,
    ties: r.ties,
    isChampion: r.is_champion,
    isLastPlace: r.is_last_place,
    managerName: toManagerName(r.manager_first_name, r.manager_last_name),
    managerId: r.manager_id ?? null,
  }));
}

function toMatchupEntries(rows: RawMatchupRow[]): MatchupEntry[] {
  return rows.map((r, i) => ({
    rank: i + 1,
    teamName: r.team_name,
    abbreviation: r.team_abbr,
    logoUrl: r.team_logo,
    teamId: r.team_id,
    opponentName: r.opp_name,
    opponentAbbreviation: r.opp_abbr,
    seasonYear: r.season_year,
    week: r.week,
    value: Number(r.score),
    isChampion: r.is_champion,
    isLastPlace: r.is_last_place,
    managerName: toManagerName(r.manager_first_name, r.manager_last_name),
    managerId: r.manager_id ?? null,
  }));
}

function toAllTimeRecords(rows: RawAllTimeRow[]): AllTimeRecord[] {
  return rows.map((r) => ({
    userId: r.user_id,
    firstName: r.first_name,
    lastName: r.last_name,
    wins: Number(r.wins),
    losses: Number(r.losses),
    ties: Number(r.ties),
    seasonsPlayed: Number(r.seasons_played),
    championships: Number(r.championships),
    lastPlaceFinishes: Number(r.last_place_finishes),
    totalPointsFor: Number(r.total_points_for),
    totalPointsAgainst: Number(r.total_points_against),
  }));
}

function toTeamHistoryEntries(rows: RawTeamHistoryRow[]): TeamHistoryEntry[] {
  return rows.map((r) => ({
    teamId: r.team_id,
    teamName: r.team_name,
    abbreviation: r.abbreviation,
    logoUrl: r.logo_url,
    seasonYear: r.season_year,
    userId: r.user_id,
    firstName: r.first_name,
    lastName: r.last_name,
  }));
}

function toMarginEntries(rows: RawMarginRow[]): MatchupEntry[] {
  return rows.map((r, i) => {
    const winScore = Math.max(Number(r.home_score), Number(r.away_score));
    const loseScore = Math.min(Number(r.home_score), Number(r.away_score));
    return {
      rank: i + 1,
      teamName: r.winner_name,
      abbreviation: r.winner_abbr,
      logoUrl: r.winner_logo,
      teamId: r.winner_id,
      opponentName: r.loser_name,
      opponentAbbreviation: r.loser_abbr,
      seasonYear: r.season_year,
      week: r.week,
      value: Number(r.margin),
      score: `${winScore.toFixed(2)} - ${loseScore.toFixed(2)}`,
      isChampion: r.is_champion,
      isLastPlace: r.is_last_place,
      managerName: toManagerName(r.manager_first_name, r.manager_last_name),
      managerId: r.manager_id ?? null,
    };
  });
}

function buildPlayerQuery(position: string) {
  return prisma.$queryRaw<RawPlayerRow[]>(Prisma.sql`
    SELECT
      re.full_name AS player_name,
      re.nfl_team,
      re.total_points,
      rw.scoring_period_id AS week,
      t.id AS team_id,
      t.name AS team_name,
      t.abbreviation AS team_abbr,
      t.logo_url AS team_logo,
      t.season_year,
      t.is_champion,
      t.is_last_place,
      u.id AS manager_id,
      u.first_name AS manager_first_name,
      u.last_name AS manager_last_name,
      CASE
        WHEN m.home_team_id = t.id THEN at_team.name
        WHEN m.away_team_id = t.id THEN ht_team.name
        ELSE NULL
      END AS opp_name
    FROM espn_roster_entries re
    JOIN espn_roster_weeks rw ON re.roster_week_id = rw.id
    JOIN espn_teams t ON rw.team_id = t.id
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN espn_matchups m ON (
      m.season_year = t.season_year AND
      m.matchup_period_id = rw.scoring_period_id AND
      (m.home_team_id = t.id OR m.away_team_id = t.id)
    )
    LEFT JOIN espn_teams ht_team ON m.home_team_id = ht_team.id
    LEFT JOIN espn_teams at_team ON m.away_team_id = at_team.id
    WHERE re.position = ${position}
      AND re.lineup_slot NOT IN ('Bench', 'IR')
    ORDER BY re.total_points DESC
    LIMIT 25
  `);
}

function toIndividualRecords(rows: RawPlayerRow[]): IndividualRecord[] {
  return rows.map((r, i) => ({
    rank: i + 1,
    playerName: r.player_name,
    nflTeam: r.nfl_team,
    points: Number(r.total_points),
    week: Number(r.week),
    teamId: r.team_id,
    teamName: r.team_name,
    teamAbbreviation: r.team_abbr,
    teamLogoUrl: r.team_logo,
    seasonYear: Number(r.season_year),
    isChampion: r.is_champion,
    isLastPlace: r.is_last_place,
    managerName: toManagerName(r.manager_first_name, r.manager_last_name),
    managerId: r.manager_id ?? null,
    opponentName: r.opp_name ?? null,
  }));
}
