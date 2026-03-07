import { FastifyPluginAsync } from "fastify";
import { prisma } from "../index.js";

export const userRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Params: { userId: string } }>("/profile/:userId", async (request, reply) => {
    const userId = request.session.userId;
    if (!userId) {
      return reply.status(401).send({ error: "Not authenticated" });
    }

    const profile = await prisma.user.findUnique({
      where: { id: request.params.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        favoriteTeam: true,
        createdAt: true,
        espnTeams: {
          select: {
            id: true,
            seasonYear: true,
            name: true,
            abbreviation: true,
            logoUrl: true,
            wins: true,
            losses: true,
            ties: true,
            pointsFor: true,
            finalStandingsPosition: true,
          },
          orderBy: { seasonYear: "desc" },
        },
      },
    });

    if (!profile) {
      return reply.status(404).send({ error: "User not found" });
    }

    return { user: profile };
  });

  app.get("/me", async (request, reply) => {
    const userId = request.session.userId;
    if (!userId) {
      return reply.status(401).send({ error: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      request.session.destroy();
      return reply.status(401).send({ error: "User not found" });
    }

    return user;
  });
};
