import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "../index.js";

async function checkAdmin(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  const userId = request.session.userId;
  if (!userId) {
    await reply.status(401).send({ error: "Not authenticated" });
    return false;
  }
  const caller = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });
  if (!caller?.isAdmin) {
    await reply.status(403).send({ error: "Forbidden" });
    return false;
  }
  return true;
}

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request, reply) => {
    if (!(await checkAdmin(request, reply))) return;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return { users };
  });

  app.get<{ Params: { id: string } }>("/users/:id", async (request, reply) => {
    if (!(await checkAdmin(request, reply))) return;

    const target = await prisma.user.findUnique({
      where: { id: request.params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        groupmeId: true,
        favoriteTeam: true,
        isAdmin: true,
        createdAt: true,
        espnTeams: {
          select: {
            id: true,
            espnTeamId: true,
            seasonYear: true,
            name: true,
            abbreviation: true,
          },
          orderBy: { seasonYear: "desc" },
        },
      },
    });

    if (!target) {
      return reply.status(404).send({ error: "User not found" });
    }

    return { user: target };
  });

  app.get("/espn-teams", async (request, reply) => {
    if (!(await checkAdmin(request, reply))) return;

    const teams = await prisma.espnTeam.findMany({
      select: {
        id: true,
        espnTeamId: true,
        seasonYear: true,
        name: true,
        abbreviation: true,
        userId: true,
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ seasonYear: "desc" }, { name: "asc" }],
    });

    return { teams };
  });

  app.patch<{
    Params: { teamId: string };
    Body: { userId: string | null };
  }>("/espn-teams/:teamId", async (request, reply) => {
    if (!(await checkAdmin(request, reply))) return;

    const { teamId } = request.params;
    const { userId } = request.body;

    try {
      const team = await prisma.espnTeam.update({
        where: { id: teamId },
        data: { userId },
        select: {
          id: true,
          espnTeamId: true,
          seasonYear: true,
          name: true,
          abbreviation: true,
          userId: true,
        },
      });
      return { team };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return reply.status(404).send({ error: "Team not found" });
      }
      throw err;
    }
  });

  app.put<{
    Params: { id: string };
    Body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      groupmeId?: string;
      favoriteTeam?: string;
      isAdmin?: boolean;
    };
  }>("/users/:id", async (request, reply) => {
    if (!(await checkAdmin(request, reply))) return;

    const { id } = request.params;
    const { firstName, lastName, email, groupmeId, favoriteTeam, isAdmin } = request.body;

    try {
      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(email !== undefined && { email }),
          ...(groupmeId !== undefined && { groupmeId }),
          ...(favoriteTeam !== undefined && { favoriteTeam }),
          ...(isAdmin !== undefined && { isAdmin }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          groupmeId: true,
          favoriteTeam: true,
          isAdmin: true,
          createdAt: true,
        },
      });

      return { user: updated };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return reply.status(404).send({ error: "User not found" });
      }
      throw err;
    }
  });
};
