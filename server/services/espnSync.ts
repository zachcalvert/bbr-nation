import { prisma } from "../index.js";
import { espnClient, ESPN_LEAGUE_START_YEAR } from "./espnClient.js";
import type {
  EspnTeam as ApiTeam,
  EspnBoxscore,
  EspnBoxscorePlayer,
} from "espn-fantasy-football-api/node";

// ── Helpers ───────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));
const API_DELAY_MS = 250;

/** Returns the NFL season year for a given calendar year + month.
 *  ESPN season years follow the calendar year the season starts (Aug–Dec),
 *  so Jan–July of year N belong to season N-1. */
export function currentEspnSeasonYear(): number {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-indexed
  return month >= 8 ? now.getFullYear() : now.getFullYear() - 1;
}

// ── Sync status (in-memory, read by the routes layer) ─────────────────────────

export interface SyncStatus {
  running: boolean;
  lastStartedAt: Date | null;
  lastCompletedAt: Date | null;
  lastError: string | null;
}

export const syncStatus: SyncStatus = {
  running: false,
  lastStartedAt: null,
  lastCompletedAt: null,
  lastError: null,
};

// ── Regular-season rank computation ───────────────────────────────────────────

function computeRegularSeasonRanks(teams: ApiTeam[]): Map<number, number> {
  const sorted = [...teams].sort((a, b) => {
    const aScore = a.wins + a.ties * 0.5;
    const bScore = b.wins + b.ties * 0.5;
    if (bScore !== aScore) return bScore - aScore;
    return b.regularSeasonPointsFor - a.regularSeasonPointsFor;
  });
  const rankMap = new Map<number, number>();
  sorted.forEach((team, i) => rankMap.set(team.id, i + 1));
  return rankMap;
}

// ── Roster week + entry upsert ────────────────────────────────────────────────

async function syncRosterWeek(
  players: EspnBoxscorePlayer[],
  teamDbId: string,
  scoringPeriodId: number
): Promise<void> {
  if (players.length === 0) return;

  const rosterWeek = await prisma.espnRosterWeek.upsert({
    where: { teamId_scoringPeriodId: { teamId: teamDbId, scoringPeriodId } },
    create: { id: crypto.randomUUID(), teamId: teamDbId, scoringPeriodId },
    update: {},
  });

  for (const p of players) {
    if (!p.id) continue; // guard against malformed API responses

    const fullName =
      p.fullName ?? [p.firstName, p.lastName].filter(Boolean).join(" ") ?? "Unknown";
    const position =
      p.eligiblePositions?.[0] ?? p.defaultPosition ?? "UNKNOWN";
    const lineupSlot = p.rosteredPosition ?? "UNKNOWN";
    const nflTeam = p.proTeam ?? "Free Agent";
    const nflTeamAbbreviation = p.proTeamAbbreviation ?? "FA";

    await prisma.espnRosterEntry.upsert({
      where: {
        rosterWeekId_espnPlayerId: {
          rosterWeekId: rosterWeek.id,
          espnPlayerId: p.id,
        },
      },
      create: {
        id: crypto.randomUUID(),
        rosterWeekId: rosterWeek.id,
        espnPlayerId: p.id,
        fullName,
        position,
        lineupSlot,
        nflTeam,
        nflTeamAbbreviation,
        totalPoints: p.totalPoints ?? 0,
        acquisitionDate: p.acquiredDate ?? null,
        injuryStatus: p.injuryStatus ?? null,
      },
      update: {
        fullName,
        position,
        lineupSlot,
        nflTeam,
        nflTeamAbbreviation,
        totalPoints: p.totalPoints ?? 0,
        acquisitionDate: p.acquiredDate ?? null,
        injuryStatus: p.injuryStatus ?? null,
      },
    });
  }
}

// ── Boxscore (matchup + rosters) upsert ───────────────────────────────────────

async function syncBoxscore(
  boxscore: EspnBoxscore,
  seasonYear: number,
  matchupPeriodId: number,
  teamIdMap: Map<number, string>
): Promise<void> {
  const homeDbId = teamIdMap.get(boxscore.homeTeamId);
  const awayDbId = teamIdMap.get(boxscore.awayTeamId);

  if (!homeDbId || !awayDbId) {
    console.warn(
      `syncBoxscore: skipping week ${matchupPeriodId} — ` +
        `unknown teamId home=${boxscore.homeTeamId} away=${boxscore.awayTeamId}`
    );
    return;
  }

  await prisma.espnMatchup.upsert({
    where: {
      seasonYear_matchupPeriodId_homeTeamId: {
        seasonYear,
        matchupPeriodId,
        homeTeamId: homeDbId,
      },
    },
    create: {
      id: crypto.randomUUID(),
      seasonYear,
      matchupPeriodId,
      homeTeamId: homeDbId,
      awayTeamId: awayDbId,
      homeScore: boxscore.homeScore,
      awayScore: boxscore.awayScore,
    },
    update: {
      homeScore: boxscore.homeScore,
      awayScore: boxscore.awayScore,
    },
  });

  await Promise.all([
    syncRosterWeek(boxscore.homeRoster, homeDbId, matchupPeriodId),
    syncRosterWeek(boxscore.awayRoster, awayDbId, matchupPeriodId),
  ]);
}

// ── Core: sync one full season ────────────────────────────────────────────────

export async function syncSeason(year: number): Promise<void> {
  console.log(`[espnSync] Starting season ${year}...`);

  // 1. League info → upsert EspnSeason
  const league = await espnClient.getLeagueInfo({ seasonId: year });
  await delay(API_DELAY_MS);

  const regularSeasonWeeks = league.scheduleSettings.numberOfRegularSeasonMatchups;
  const playoffWeeks = league.scheduleSettings.numberOfPlayoffMatchups;
  const playoffTeamCount = league.scheduleSettings.numberOfPlayoffTeams;
  const totalWeeks = regularSeasonWeeks + playoffWeeks;

  await prisma.espnSeason.upsert({
    where: { year },
    create: {
      year,
      leagueName: league.name,
      leagueSize: league.size,
      regularSeasonWeeks,
      playoffWeeks,
      playoffTeamCount,
      syncedAt: new Date(),
    },
    update: {
      leagueName: league.name,
      leagueSize: league.size,
      regularSeasonWeeks,
      playoffWeeks,
      playoffTeamCount,
      syncedAt: new Date(),
    },
  });

  // 2. Fetch teams at final scoring period → upsert EspnTeam rows
  const isCurrentSeason = year === currentEspnSeasonYear();
  const finalScoringPeriod = isCurrentSeason
    ? league.currentScoringPeriodId
    : totalWeeks;

  const apiTeams =
    year >= 2018
      ? await espnClient.getTeamsAtWeek({ seasonId: year, scoringPeriodId: finalScoringPeriod })
      : await espnClient.getHistoricalTeamsAtWeek({ seasonId: year, scoringPeriodId: finalScoringPeriod });
  await delay(API_DELAY_MS);

  for (const apiTeam of apiTeams) {
    const ownerEspnMemberId = String(apiTeam.id);
    const teamData = {
      name: apiTeam.name,
      abbreviation: apiTeam.abbreviation,
      logoUrl: apiTeam.logoURL ?? null,
      wins: apiTeam.wins,
      losses: apiTeam.losses,
      ties: apiTeam.ties,
      pointsFor: apiTeam.regularSeasonPointsFor,
      pointsAgainst: apiTeam.regularSeasonPointsAgainst,
      playoffSeed: apiTeam.playoffSeed ?? null,
      finalStandingsPosition: apiTeam.finalStandingsPosition ?? null,
      isChampion: (apiTeam.finalStandingsPosition ?? null) === 1,
      waiverRank: apiTeam.wavierRank ?? null, // upstream library spells it "wavier"
    };

    await prisma.espnTeam.upsert({
      where: { espnTeamId_seasonYear: { espnTeamId: apiTeam.id, seasonYear: year } },
      create: {
        id: crypto.randomUUID(),
        espnTeamId: apiTeam.id,
        seasonYear: year,
        ownerEspnMemberId,
        ...teamData,
      },
      update: teamData,
    });
  }

  // 3. Build espnTeamId → DB id map for FK use in matchups/rosters
  const dbTeams = await prisma.espnTeam.findMany({
    where: { seasonYear: year },
    select: { id: true, espnTeamId: true },
  });
  const teamIdMap = new Map<number, string>(dbTeams.map((t) => [t.espnTeamId, t.id]));

  // 4. Compute and apply regular season ranks (when regular season is complete)
  const regularSeasonComplete =
    !isCurrentSeason || league.currentScoringPeriodId >= regularSeasonWeeks;

  if (regularSeasonComplete) {
    const rankMap = computeRegularSeasonRanks(apiTeams);
    const maxRank = Math.max(...rankMap.values());
    for (const [espnTeamId, rank] of rankMap) {
      const dbId = teamIdMap.get(espnTeamId);
      if (!dbId) continue;
      await prisma.espnTeam.update({
        where: { id: dbId },
        data: { regularSeasonRank: rank, isLastPlace: rank === maxRank },
      });
    }
  }

  // 5. Sync each week's boxscore (matchup scores + weekly rosters)
  const weeksToSync = isCurrentSeason
    ? Math.min(league.currentScoringPeriodId, totalWeeks)
    : totalWeeks;

  for (let week = 1; week <= weeksToSync; week++) {
    await delay(API_DELAY_MS);

    const boxscores =
      year >= 2018
        ? await espnClient.getBoxscoreForWeek({
            seasonId: year,
            matchupPeriodId: week,
            scoringPeriodId: week,
          })
        : await espnClient.getHistoricalScoreboardForWeek({
            seasonId: year,
            matchupPeriodId: week,
            scoringPeriodId: week,
          });

    for (const boxscore of boxscores) {
      await syncBoxscore(boxscore, year, week, teamIdMap);
    }
  }

  console.log(`[espnSync] Season ${year} complete (${weeksToSync} weeks synced).`);
}

// ── Public sync entry points ───────────────────────────────────────────────────

export async function syncCurrentSeason(): Promise<void> {
  if (syncStatus.running) {
    console.log("[espnSync] Sync already running, skipping.");
    return;
  }

  syncStatus.running = true;
  syncStatus.lastStartedAt = new Date();
  syncStatus.lastError = null;

  try {
    await syncSeason(currentEspnSeasonYear());
    syncStatus.lastCompletedAt = new Date();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    syncStatus.lastError = message;
    console.error("[espnSync] Current season sync failed:", message);
  } finally {
    syncStatus.running = false;
  }
}

export async function backfillAllSeasons(): Promise<void> {
  if (syncStatus.running) {
    console.log("[espnSync] Sync already running, skipping.");
    return;
  }

  syncStatus.running = true;
  syncStatus.lastStartedAt = new Date();
  syncStatus.lastError = null;

  const currentYear = currentEspnSeasonYear();

  try {
    for (let year = ESPN_LEAGUE_START_YEAR; year <= currentYear; year++) {
      // Historical seasons: sync once then freeze.
      if (year < currentYear) {
        const existing = await prisma.espnSeason.findUnique({
          where: { year },
          select: { syncedAt: true },
        });
        if (existing) {
          console.log(`[espnSync] Season ${year} already synced, skipping.`);
          continue;
        }
      }

      await syncSeason(year);
      await delay(API_DELAY_MS); // extra pause between seasons
    }
    syncStatus.lastCompletedAt = new Date();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    syncStatus.lastError = message;
    console.error("[espnSync] Backfill failed:", message);
  } finally {
    syncStatus.running = false;
  }
}
