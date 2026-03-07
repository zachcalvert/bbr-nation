import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import fastifyWebsocket from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import { PrismaClient } from "@prisma/client";
import { authRoutes } from "./routes/auth.js";
import { userRoutes } from "./routes/users.js";
import { espnRoutes } from "./routes/espn.js";
import { hallOfFameRoutes } from "./routes/hallOfFame.js";
import { chatRoutes } from "./routes/chat.js";
import { adminRoutes } from "./routes/admin.js";
import { carouselRoutes } from "./routes/carousel.js";
import { wsRoutes } from "./ws/channels.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const prisma = new PrismaClient();

const app = Fastify({ logger: true, trustProxy: true });

await app.register(fastifyCookie);

const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

const prismaSessionStore = {
  get(sessionId: string, callback: (err: any, session?: any) => void) {
    prisma.$queryRaw<Array<{ sess: any }>>`
      SELECT sess FROM sessions WHERE sid = ${sessionId} AND expire > NOW()
    `
      .then((rows) => callback(null, rows[0]?.sess ?? null))
      .catch((err) => callback(err));
  },
  set(sessionId: string, session: any, callback?: (err?: any) => void) {
    const maxAge = session?.cookie?.maxAge ?? SESSION_MAX_AGE;
    const expire = new Date(Date.now() + maxAge);
    prisma.$executeRaw`
      INSERT INTO sessions (sid, sess, expire)
      VALUES (${sessionId}, ${JSON.stringify(session)}::json, ${expire})
      ON CONFLICT (sid) DO UPDATE SET sess = EXCLUDED.sess, expire = EXCLUDED.expire
    `
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  },
  destroy(sessionId: string, callback?: (err?: any) => void) {
    prisma.$executeRaw`DELETE FROM sessions WHERE sid = ${sessionId}`
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  },
};

await app.register(fastifySession, {
  secret: process.env.SESSION_SECRET || "change-me",
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
  },
  store: prismaSessionStore as any,
});

await app.register(fastifyWebsocket);

await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(userRoutes, { prefix: "/api/users" });
await app.register(espnRoutes, { prefix: "/api/espn" });
await app.register(hallOfFameRoutes, { prefix: "/api/espn/hall-of-fame" });
await app.register(chatRoutes, { prefix: "/api/chat" });
await app.register(adminRoutes, { prefix: "/api/admin" });
await app.register(carouselRoutes, { prefix: "/api/carousel" });
await app.register(wsRoutes, { prefix: "/ws" });

// In production, serve the built Vite frontend
app.get("/api/health", async (_req, reply) => {
  return reply.send({ status: "ok" });
});

if (process.env.NODE_ENV === "production") {
  await app.register(fastifyStatic, {
    root: path.join(__dirname, ".."),
    wildcard: false,
  });

  app.setNotFoundHandler((_req, reply) => {
    reply.sendFile("index.html");
  });
}

const port = Number(process.env.PORT) || 3001;

try {
  await app.listen({ port, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
