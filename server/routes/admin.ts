import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
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

  app.post<{
    Body: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      groupmeId: string;
      favoriteTeam: string;
      isAdmin?: boolean;
    };
  }>("/users", async (request, reply) => {
    if (!(await checkAdmin(request, reply))) return;

    const { firstName, lastName, email, password, groupmeId, favoriteTeam, isAdmin } = request.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashed,
        groupmeId,
        favoriteTeam,
        isAdmin: isAdmin ?? false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    return reply.status(201).send({ user });
  });

  // ─── Carousel CRUD ──────────────────────────────────────────────────────

  app.get("/carousel", async (request, reply) => {
    if (!(await checkAdmin(request, reply))) return;
    const slides = await prisma.carouselSlide.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return { slides };
  });

  app.post<{
    Body: { imageUrl: string; caption?: string; sortOrder: number };
  }>("/carousel", async (request, reply) => {
    if (!(await checkAdmin(request, reply))) return;
    const { imageUrl, caption, sortOrder } = request.body;
    const slide = await prisma.carouselSlide.create({
      data: { imageUrl, caption, sortOrder },
    });
    return reply.status(201).send({ slide });
  });

  app.put<{
    Params: { id: string };
    Body: { imageUrl?: string; caption?: string; sortOrder?: number; isActive?: boolean };
  }>("/carousel/:id", async (request, reply) => {
    if (!(await checkAdmin(request, reply))) return;
    const id = parseInt(request.params.id, 10);
    const { imageUrl, caption, sortOrder, isActive } = request.body;
    try {
      const slide = await prisma.carouselSlide.update({
        where: { id },
        data: {
          ...(imageUrl !== undefined && { imageUrl }),
          ...(caption !== undefined && { caption }),
          ...(sortOrder !== undefined && { sortOrder }),
          ...(isActive !== undefined && { isActive }),
        },
      });
      return { slide };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return reply.status(404).send({ error: "Slide not found" });
      }
      throw err;
    }
  });

  app.delete<{ Params: { id: string } }>("/carousel/:id", async (request, reply) => {
    if (!(await checkAdmin(request, reply))) return;
    const id = parseInt(request.params.id, 10);
    try {
      await prisma.carouselSlide.delete({ where: { id } });
      return { success: true };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return reply.status(404).send({ error: "Slide not found" });
      }
      throw err;
    }
  });

  // ─── User management ──────────────────────────────────────────────────

  app.delete<{ Params: { id: string } }>("/users/:id", async (request, reply) => {
    if (!(await checkAdmin(request, reply))) return;

    const { id } = request.params;

    const target = await prisma.user.findUnique({
      where: { id },
      select: { isAdmin: true },
    });

    if (!target) {
      return reply.status(404).send({ error: "User not found" });
    }

    if (target.isAdmin) {
      return reply.status(403).send({ error: "Admin users cannot be deleted" });
    }

    await prisma.$transaction([
      prisma.espnTeam.updateMany({ where: { userId: id }, data: { userId: null } }),
      prisma.chatReaction.deleteMany({ where: { userId: id } }),
      prisma.chatMessage.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return { success: true };
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
