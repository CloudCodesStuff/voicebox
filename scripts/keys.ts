/**
 * Print every project's widget install snippet.
 *
 *   npm run keys
 *
 * Handy when testing locally: you need a real project key to point a test page
 * at, and digging it out of the dashboard every time is friction.
 */

import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("\nDATABASE_URL is not set.\n");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

db.project
  .findMany({
    orderBy: { createdAt: "asc" },
    select: {
      name: true,
      key: true,
      allowedDomains: true,
      org: { select: { name: true } },
      _count: { select: { feedback: true } },
    },
  })
  .then((projects) => {
    if (projects.length === 0) {
      console.log("\nNo projects yet. Run `npm run db:seed`.\n");
      return;
    }

    for (const p of projects) {
      console.log(`\n${p.org.name} → ${p.name}  (${p._count.feedback} items)`);
      console.log(
        `  domains: ${p.allowedDomains.length ? p.allowedDomains.join(", ") : "any (unrestricted)"}`,
      );
      console.log(
        `  <script async src="${base}/widget.js" data-project="${p.key}"></script>`,
      );
    }
    console.log("");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
