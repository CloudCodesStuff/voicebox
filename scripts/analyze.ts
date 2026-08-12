/**
 * Run the analysis pipeline over every project from the command line.
 *
 *   npm run analyze
 *
 * Useful for backfilling after a seed, or after adding DEEPSEEK_API_KEY to an
 * instance that had been collecting feedback without it.
 */

import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { analyzePending, runClustering } from "../src/server/ai/pipeline";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("\nDATABASE_URL is not set.\n");
  process.exit(1);
}

if (!process.env.DEEPSEEK_API_KEY) {
  console.error("\nDEEPSEEK_API_KEY is not set, nothing to run.\n");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const projects = await db.project.findMany({
    select: { id: true, name: true, _count: { select: { feedback: true } } },
  });

  if (projects.length === 0) {
    console.log("\nNo projects found. Run `npm run db:seed` first.\n");
    return;
  }

  for (const project of projects) {
    console.log(`\n${project.name}, ${project._count.feedback} items`);

    process.stdout.write("  Scoring sentiment… ");
    let total = 0;
    // Batched so a large backlog doesn't hold one long transaction open.
    for (;;) {
      const done = await analyzePending(project.id, 25, db);
      total += done;
      if (done === 0) break;
      process.stdout.write(".");
    }
    console.log(` ${total} analyzed`);

    process.stdout.write("  Clustering into themes… ");
    const result = await runClustering(project.id, db);
    console.log(
      result ? `${result.themes} themes over ${result.items} items` : "skipped",
    );

    const themes = await db.theme.findMany({
      where: { projectId: project.id },
      orderBy: { priorityScore: "desc" },
      select: {
        title: true,
        itemCount: true,
        negativeShare: true,
        priorityScore: true,
      },
    });

    if (themes.length > 0) {
      console.log("\n  What to work on:");
      for (const t of themes) {
        console.log(
          `    ${String(Math.round(t.priorityScore)).padStart(3)}  ${t.title}` +
            `  (${t.itemCount} items, ${Math.round(t.negativeShare * 100)}% negative)`,
        );
      }
    }
  }

  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
