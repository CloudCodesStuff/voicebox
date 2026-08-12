import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Prisma client (Prisma 7 driver-adapter style).
 *
 * Construction is deferred until the first query so that importing this module
 *, which Next does while building any route that transitively touches it,
 * never requires DATABASE_URL. The marketing site renders on a clean checkout
 * with an empty .env; only code that actually queries needs credentials.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and add a Postgres " +
        "connection string (Neon and Supabase both have a free tier).",
    );
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

function getClient(): PrismaClient {
  // Reuse across HMR reloads in dev, otherwise each edit leaks a connection pool.
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
