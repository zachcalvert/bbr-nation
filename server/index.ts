import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import fastifyWebsocket from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import { PrismaClient } from "@prisma/client";
import connectPgSimple from "connect-pg-simple";
import { authRoutes } from "./routes/auth.js";
import { userRoutes } from "./routes/users.js";
import { espnRoutes } from "./routes/espn.js";
import { wsRoutes } from "./ws/channels.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const prisma = new PrismaClient();

const app = Fastify({ logger: true });

await app.register(fastifyCookie);

const PgStore = connectPgSimple(fastifySession as any);

await app.register(fastifySession, {
  secret: process.env.SESSION_SECRET || "change-me",
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  store: new PgStore({
    conString: process.env.DATABASE_URL,
    tableName: "sessions",
    createTableIfMissing: true,
  }) as any,
});

await app.register(fastifyWebsocket);

await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(userRoutes, { prefix: "/api/users" });
await app.register(espnRoutes, { prefix: "/api/espn" });
await app.register(wsRoutes, { prefix: "/ws" });

// In production, serve the built Vite frontend
if (process.env.NODE_ENV === "production") {
  await app.register(fastifyStatic, {
    root: path.join(__dirname, "..", "dist"),
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
