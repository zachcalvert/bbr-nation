import { FastifyPluginAsync } from "fastify";
import { prisma } from "../index.js";

export const carouselRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => {
    const slides = await prisma.carouselSlide.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        imageUrl: true,
        caption: true,
        sortOrder: true,
      },
    });
    return { slides };
  });
};
