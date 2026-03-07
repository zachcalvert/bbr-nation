import { FastifyPluginAsync } from "fastify";
import { prisma } from "../index.js";

export const userRoutes: FastifyPluginAsync = async (app) => {
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
        espnId: true,
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
