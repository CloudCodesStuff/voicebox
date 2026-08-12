/**
 * Show the last analysis runs and their errors.
 *
 *   npm run inspect
 *
 * Clustering failing silently is the worst failure mode this product has, so
 * every run is recorded with its token spend and its error. This prints them.
 */

import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

db.analysisRun
  .findMany({
    orderBy: { startedAt: "desc" },
    take: 12,
    include: { project: { select: { name: true } } },
  })
  .then((runs) => {
    if (runs.length === 0) {
      console.log("\nNo analysis runs recorded yet.\n");
      return;
    }

    console.log("");
    for (const r of runs) {
      const ms = r.finishedAt
        ? r.finishedAt.getTime() - r.startedAt.getTime()
        : null;
      console.log(
        `  ${r.kind.padEnd(7)} ${r.status.padEnd(7)} ${(r.project?.name ?? ", ").padEnd(18)}` +
          ` items=${String(r.itemsProcessed).padStart(3)}` +
          ` tokens=${String(r.tokensUsed).padStart(6)}` +
          (ms != null ? ` ${(ms / 1000).toFixed(1)}s` : ""),
      );
      if (r.error) console.log(`          error: ${r.error}`);
    }
    console.log("");
  })
  .finally(() => db.$disconnect());
