import { PrismaClient } from "@prisma/client";

// Singleton Prisma client — avoids exhausting connections during Next.js HMR.
// Vercel's Postgres (Neon) integration provides DATABASE_URL_UNPOOLED rather
// than DIRECT_URL; fall back so nobody has to copy it over by hand.
process.env.DIRECT_URL ||= process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
