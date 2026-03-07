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
        espnId: true,
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
        espnId: true,
        groupmeId: true,
        favoriteTeam: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    if (!target) {
      return reply.status(404).send({ error: "User not found" });
    }

    return { user: target };
  });

  app.put<{
    Params: { id: string };
    Body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      espnId?: string;
      groupmeId?: string;
      favoriteTeam?: string;
      isAdmin?: boolean;
    };
  }>("/users/:id", async (request, reply) => {
    if (!(await checkAdmin(request, reply))) return;

    const { id } = request.params;
    const { firstName, lastName, email, espnId, groupmeId, favoriteTeam, isAdmin } = request.body;

    try {
      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(email !== undefined && { email }),
          ...(espnId !== undefined && { espnId }),
          ...(groupmeId !== undefined && { groupmeId }),
          ...(favoriteTeam !== undefined && { favoriteTeam }),
          ...(isAdmin !== undefined && { isAdmin }),
        },
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

      return { user: updated };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return reply.status(404).send({ error: "User not found" });
      }
      throw err;
    }
  });
};
