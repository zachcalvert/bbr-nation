import { FastifyPluginAsync } from "fastify";
import { prisma } from "../index.js";

export const chatRoutes: FastifyPluginAsync = async (app) => {
  app.get("/messages", async (request, reply) => {
    const userId = request.session.userId;
    if (!userId) {
      return reply.status(401).send({ error: "Not authenticated" });
    }

    const { before, limit } = request.query as {
      before?: string;
      limit?: string;
    };

    const take = Math.min(Number(limit) || 50, 100);

    const messages = await prisma.chatMessage.findMany({
      where: before
        ? { createdAt: { lt: new Date(before) } }
        : undefined,
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Return in chronological order (oldest first)
    return { messages: messages.reverse() };
  });
};
