import { FastifyPluginAsync } from "fastify";
import { prisma } from "../index.js";
import {
  syncCurrentSeason,
  backfillAllSeasons,
  syncSeason,
  syncStatus,
} from "../services/espnSync.js";

export const espnRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/espn/status
  // Returns current sync state and list of synced seasons.
  app.get("/status", async () => {
    const seasons = await prisma.espnSeason.findMany({
      orderBy: { year: "desc" },
      select: { year: true, leagueName: true, leagueSize: true, syncedAt: true },
    });
    return {
      sync: {
        running: syncStatus.running,
        lastStartedAt: syncStatus.lastStartedAt,
        lastCompletedAt: syncStatus.lastCompletedAt,
        lastError: syncStatus.lastError,
      },
      seasons,
    };
  });

  // POST /api/espn/sync/current
  // Triggers a sync of the current season (fire-and-forget). Auth required.
  app.post("/sync/current", async (request, reply) => {
    if (!request.session.userId) {
      return reply.status(401).send({ error: "Not authenticated" });
    }
    syncCurrentSeason(); // intentionally not awaited
    return reply.status(202).send({ message: "Current season sync started" });
  });

  // POST /api/espn/sync/backfill
  // Triggers a full historical backfill (fire-and-forget). Auth required.
  app.post("/sync/backfill", async (request, reply) => {
    if (!request.session.userId) {
      return reply.status(401).send({ error: "Not authenticated" });
    }
    backfillAllSeasons(); // intentionally not awaited
    return reply.status(202).send({ message: "Backfill started" });
  });

  // POST /api/espn/sync/:year
  // Triggers a sync of a specific year (fire-and-forget). Auth required.
  app.post<{ Params: { year: string } }>("/sync/:year", async (request, reply) => {
    if (!request.session.userId) {
      return reply.status(401).send({ error: "Not authenticated" });
    }
    const year = parseInt(request.params.year, 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      return reply.status(400).send({ error: "Invalid year" });
    }
    syncSeason(year).catch((err: unknown) => {
      console.error(`[espnRoutes] Manual sync for ${year} failed:`, err);
    });
    return reply.status(202).send({ message: `Sync started for ${year}` });
  });

  // GET /api/espn/seasons
  // Returns all synced seasons with team standings.
  app.get("/seasons", async () => {
    const seasons = await prisma.espnSeason.findMany({
      orderBy: { year: "desc" },
      include: {
        teams: {
          orderBy: [{ regularSeasonRank: "asc" }, { wins: "desc" }, { pointsFor: "desc" }],
          select: {
            id: true,
            espnTeamId: true,
            name: true,
            abbreviation: true,
            logoUrl: true,
            ownerEspnMemberId: true,
            wins: true,
            losses: true,
            ties: true,
            pointsFor: true,
            pointsAgainst: true,
            playoffSeed: true,
            finalStandingsPosition: true,
            regularSeasonRank: true,
          },
        },
      },
    });
    return seasons;
  });

  // GET /api/espn/seasons/:year
  // Returns one season with full teams and matchup schedule.
  app.get<{ Params: { year: string } }>("/seasons/:year", async (request, reply) => {
    const year = parseInt(request.params.year, 10);
    if (isNaN(year)) {
      return reply.status(400).send({ error: "Invalid year" });
    }
    const season = await prisma.espnSeason.findUnique({
      where: { year },
      include: {
        teams: {
          orderBy: [{ regularSeasonRank: "asc" }, { wins: "desc" }],
        },
        matchups: {
          orderBy: { matchupPeriodId: "asc" },
        },
      },
    });
    if (!season) {
      return reply.status(404).send({ error: "Season not found" });
    }
    return season;
  });

  // GET /api/espn/seasons/:year/teams/:teamId
  // Returns a team with its weekly roster history.
  app.get<{ Params: { year: string; teamId: string } }>(
    "/seasons/:year/teams/:teamId",
    async (request, reply) => {
      const year = parseInt(request.params.year, 10);
      if (isNaN(year)) {
        return reply.status(400).send({ error: "Invalid year" });
      }
      const team = await prisma.espnTeam.findFirst({
        where: { seasonYear: year, id: request.params.teamId },
        include: {
          rosterWeeks: {
            orderBy: { scoringPeriodId: "asc" },
            include: {
              entries: {
                orderBy: { totalPoints: "desc" },
              },
            },
          },
          homeMatchups: { orderBy: { matchupPeriodId: "asc" } },
          awayMatchups: { orderBy: { matchupPeriodId: "asc" } },
        },
      });
      if (!team) {
        return reply.status(404).send({ error: "Team not found" });
      }
      return team;
    }
  );
};
