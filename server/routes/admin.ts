import { FastifyPluginAsync } from "fastify";
import { prisma } from "../index.js";

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request, reply) => {
    const userId = request.session.userId;
    if (!userId) {
      return reply.status(401).send({ error: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!user || !user.isAdmin) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        espnId: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return { users };
  });
};
