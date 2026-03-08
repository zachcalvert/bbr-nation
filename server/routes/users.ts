import { FastifyPluginAsync } from "fastify";
import bcrypt from "bcrypt";
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
            isChampion: true,
            isLastPlace: true,
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

  app.put<{ Params: { userId: string }; Body: { firstName?: string; lastName?: string; email?: string; username?: string | null; favoriteTeam?: string } }>(
    "/profile/:userId",
    async (request, reply) => {
      const sessionUserId = request.session.userId;
      if (!sessionUserId) {
        return reply.status(401).send({ error: "Not authenticated" });
      }
      if (sessionUserId !== request.params.userId) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const { firstName, lastName, email, username, favoriteTeam } = request.body;

      if (email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return reply.status(400).send({ error: "Invalid email address" });
        }
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing && existing.id !== request.params.userId) {
          return reply.status(409).send({ error: "Email already in use" });
        }
      }

      const updated = await prisma.user.update({
        where: { id: request.params.userId },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(email !== undefined && { email }),
          ...("username" in request.body && { username: username ?? null }),
          ...(favoriteTeam !== undefined && { favoriteTeam }),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
          favoriteTeam: true,
        },
      });

      return { user: updated };
    }
  );

  app.put<{ Params: { userId: string }; Body: { currentPassword: string; newPassword: string } }>(
    "/profile/:userId/password",
    async (request, reply) => {
      const sessionUserId = request.session.userId;
      if (!sessionUserId) {
        return reply.status(401).send({ error: "Not authenticated" });
      }
      if (sessionUserId !== request.params.userId) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const { currentPassword, newPassword } = request.body;

      if (newPassword.length < 8) {
        return reply.status(400).send({ error: "New password must be at least 8 characters" });
      }

      const user = await prisma.user.findUnique({ where: { id: sessionUserId } });
      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return reply.status(400).send({ error: "Current password is incorrect" });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: sessionUserId },
        data: { password: hashed },
      });

      return { success: true };
    }
  );

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
        username: true,
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
