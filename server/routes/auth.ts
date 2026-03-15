import { FastifyPluginAsync } from "fastify";
import bcrypt from "bcrypt";
import { prisma } from "../index.js";

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post<{
    Body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      groupmeId?: string;
      favoriteTeam: string;
    };
  }>("/register", async (request, reply) => {
    const { email, password, firstName, lastName, groupmeId, favoriteTeam } =
      request.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        firstName,
        lastName,
        favoriteTeam,
        ...(groupmeId ? { groupmeId } : {}),
      },
    });

    request.session.userId = user.id;

    return reply.status(201).send({
      id: user.id,
      email: user.email,
    });
  });

  app.post<{ Body: { email: string; password: string } }>(
    "/login",
    async (request, reply) => {
      const { email, password } = request.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.status(401).send({ error: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return reply.status(401).send({ error: "Invalid credentials" });
      }

      request.session.userId = user.id;

      return { id: user.id, email: user.email };
    }
  );

  app.post("/logout", async (request, reply) => {
    request.session.destroy();
    return reply.status(204).send();
  });
};
