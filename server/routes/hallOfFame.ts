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
}

export const hallOfFameRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => {
    const [
      mostPointsFor,
      fewestPointsFor,
      mostWins,
      fewestWins,
      highestDifferential,
      lowestDifferential,
      highestGameScore,
      lowestGameScore,
      biggestBlowout,
      closestGame,
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
        SELECT id, name, abbreviation, logo_url, season_year,
               wins, losses, ties, points_for, points_against,
               (points_for - points_against) AS differential
        FROM espn_teams
        ORDER BY differential DESC
        LIMIT 25
      `),
      prisma.$queryRaw<RawDiffRow[]>(Prisma.sql`
        SELECT id, name, abbreviation, logo_url, season_year,
               wins, losses, ties, points_for, points_against,
               (points_for - points_against) AS differential
        FROM espn_teams
        ORDER BY differential ASC
        LIMIT 25
      `),

      // --- Matchup records (raw SQL with UNION) ---
      prisma.$queryRaw<RawMatchupRow[]>(Prisma.sql`
        SELECT * FROM (
          SELECT m.season_year, m.matchup_period_id AS week,
                 m.home_score AS score,
                 ht.id AS team_id, ht.name AS team_name, ht.abbreviation AS team_abbr, ht.logo_url AS team_logo,
                 at.name AS opp_name, at.abbreviation AS opp_abbr
          FROM espn_matchups m
          JOIN espn_teams ht ON m.home_team_id = ht.id
          JOIN espn_teams at ON m.away_team_id = at.id
          UNION ALL
          SELECT m.season_year, m.matchup_period_id AS week,
                 m.away_score AS score,
                 at.id AS team_id, at.name AS team_name, at.abbreviation AS team_abbr, at.logo_url AS team_logo,
                 ht.name AS opp_name, ht.abbreviation AS opp_abbr
          FROM espn_matchups m
          JOIN espn_teams ht ON m.home_team_id = ht.id
          JOIN espn_teams at ON m.away_team_id = at.id
        ) combined
        ORDER BY score DESC
        LIMIT 25
      `),
      prisma.$queryRaw<RawMatchupRow[]>(Prisma.sql`
        SELECT * FROM (
          SELECT m.season_year, m.matchup_period_id AS week,
                 m.home_score AS score,
                 ht.id AS team_id, ht.name AS team_name, ht.abbreviation AS team_abbr, ht.logo_url AS team_logo,
                 at.name AS opp_name, at.abbreviation AS opp_abbr
          FROM espn_matchups m
          JOIN espn_teams ht ON m.home_team_id = ht.id
          JOIN espn_teams at ON m.away_team_id = at.id
          UNION ALL
          SELECT m.season_year, m.matchup_period_id AS week,
                 m.away_score AS score,
                 at.id AS team_id, at.name AS team_name, at.abbreviation AS team_abbr, at.logo_url AS team_logo,
                 ht.name AS opp_name, ht.abbreviation AS opp_abbr
          FROM espn_matchups m
          JOIN espn_teams ht ON m.home_team_id = ht.id
          JOIN espn_teams at ON m.away_team_id = at.id
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
               CASE WHEN m.home_score > m.away_score THEN at.abbreviation ELSE ht.abbreviation END AS loser_abbr
        FROM espn_matchups m
        JOIN espn_teams ht ON m.home_team_id = ht.id
        JOIN espn_teams at ON m.away_team_id = at.id
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
               CASE WHEN m.home_score > m.away_score THEN at.abbreviation ELSE ht.abbreviation END AS loser_abbr
        FROM espn_matchups m
        JOIN espn_teams ht ON m.home_team_id = ht.id
        JOIN espn_teams at ON m.away_team_id = at.id
        WHERE ABS(m.home_score - m.away_score) > 0
        ORDER BY margin ASC
        LIMIT 25
      `),
    ]);

    return {
      seasonRecords: {
        mostPointsFor: toSeasonEntries(mostPointsFor, (t) => t.pointsFor),
        fewestPointsFor: toSeasonEntries(fewestPointsFor, (t) => t.pointsFor),
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
    };
  });
}
