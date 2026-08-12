import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma CLI configuration (Prisma 7+).
 *
 * The connection URL lives here rather than in schema.prisma. At runtime the
 * application supplies its own connection through a driver adapter — see
 * src/server/db.ts — so this file only governs CLI commands: migrate, db push,
 * studio, and introspection.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",

  // Read leniently rather than with Prisma's strict `env()` helper: `prisma
  // generate` must succeed on a fresh clone with no .env, so that `npm install`
  // and typecheck work before any database exists. Commands that genuinely
  // need a connection (migrate, studio) fail with their own clear error.
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },

  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
});
