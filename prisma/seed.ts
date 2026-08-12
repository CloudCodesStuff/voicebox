/**
 * Seed a realistic demo workspace.
 *
 *   npm run db:seed
 *
 * The feedback below is deliberately lifelike and deliberately *clusterable*,
 * several distinct underlying problems, each described in different words by
 * different people. That's what makes the theme clustering legible in a demo,
 * and it exercises the exact case the product exists for.
 *
 * Safe to re-run: it rebuilds only the demo organization.
 */

import "dotenv/config";
import { randomBytes } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type FeedbackType } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("\nDATABASE_URL is not set. Copy .env.example to .env first.\n");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const DEMO_SLUG = "acme-demo";

type Seed = { body: string; type: FeedbackType; rating?: number; days: number };

const FEEDBACK: Seed[] = [
  // --- Cluster: CSV export times out -------------------------------------
  { body: "The CSV export just spins forever when I pick more than about 6 months of data. Never finishes.", type: "ISSUE", rating: 2, days: 1 },
  { body: "Trying to download a full year of transactions and it times out every single time.", type: "ISSUE", rating: 1, days: 2 },
  { body: "Export is broken for large date ranges. Small ones are fine.", type: "ISSUE", rating: 2, days: 3 },
  { body: "Can you fix the export? It fails silently and I have no idea if it worked.", type: "ISSUE", rating: 2, days: 5 },
  { body: "Downloading reports over ~10k rows never completes.", type: "ISSUE", rating: 2, days: 8 },

  // --- Cluster: dark mode ------------------------------------------------
  { body: "Please add a dark mode, I use this at night constantly and it's blinding.", type: "IDEA", rating: 4, days: 1 },
  { body: "Any plans for a dark theme? Would genuinely make my day.", type: "IDEA", rating: 5, days: 4 },
  { body: "Dark mode would be amazing. That's my only real complaint.", type: "IDEA", rating: 4, days: 6 },
  { body: "The white background is rough on the eyes late in the evening.", type: "IDEA", rating: 3, days: 9 },

  // --- Cluster: billing/plan confusion -----------------------------------
  { body: "My billing page says I'm on Pro but I'm being charged the Starter rate. Confusing.", type: "ISSUE", rating: 2, days: 2 },
  { body: "Invoice doesn't match the plan I selected. Can someone check?", type: "QUESTION", rating: 3, days: 7 },
  { body: "I upgraded three days ago and the dashboard still shows my old limits.", type: "ISSUE", rating: 2, days: 3 },

  // --- Cluster: onboarding confusion -------------------------------------
  { body: "Took me ages to figure out where to add my team. The settings menu isn't obvious.", type: "ISSUE", rating: 3, days: 4 },
  { body: "Setup was confusing. I didn't know what a 'project' meant at first.", type: "ISSUE", rating: 3, days: 11 },
  { body: "Onboarding could use more hand-holding. I bounced off it twice before it clicked.", type: "IDEA", rating: 3, days: 14 },

  // --- Cluster: integrations ---------------------------------------------
  { body: "Would love a Slack integration so alerts land in our channel.", type: "IDEA", rating: 5, days: 2 },
  { body: "Any chance of a Zapier connector? We want to pipe this into Notion.", type: "IDEA", rating: 4, days: 10 },
  { body: "Slack notifications please! Checking the dashboard manually is a pain.", type: "IDEA", rating: 4, days: 12 },

  // --- Praise ------------------------------------------------------------
  { body: "Honestly the cleanest tool we've adopted this year. Setup took five minutes.", type: "PRAISE", rating: 5, days: 1 },
  { body: "Love the new dashboard layout, it's so much faster to scan.", type: "PRAISE", rating: 5, days: 5 },
  { body: "Support got back to me in under an hour on a Sunday. Genuinely impressed.", type: "PRAISE", rating: 5, days: 6 },
  { body: "This replaced two other tools for us. Great work.", type: "PRAISE", rating: 5, days: 13 },

  // --- Mixed bag ---------------------------------------------------------
  { body: "Mobile layout breaks on my iPhone, the sidebar covers everything.", type: "ISSUE", rating: 2, days: 3 },
  { body: "Is there an API? Couldn't find docs for it anywhere.", type: "QUESTION", rating: 3, days: 8 },
  { body: "Search doesn't find results if I typo even slightly. Fuzzy matching would help.", type: "IDEA", rating: 3, days: 9 },
];

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

async function main() {
  console.log("\nSeeding demo workspace…\n");

  await db.organization.deleteMany({ where: { slug: DEMO_SLUG } });

  const org = await db.organization.create({
    data: {
      slug: DEMO_SLUG,
      name: "Acme",
      subscription: { create: { plan: "PRO", status: "ACTIVE" } },
      projects: {
        create: {
          name: "Acme Web App",
          url: "https://app.acme.example.com",
          key: `pk_${randomBytes(18).toString("base64url")}`,
          widgetConfig: {
            accentColor: "#00C48C",
            position: "bottom-right",
            theme: "auto",
            radius: 12,
            triggerLabel: "Feedback",
            triggerHidden: false,
            heading: "Share your feedback",
            subheading:
              "We read every one of these. It's how we pick what to build.",
            enabledTypes: ["IDEA", "ISSUE", "PRAISE", "QUESTION"],
            askRating: true,
            askEmail: true,
            successMessage: "Got it. Thank you.",
            hideBranding: false,
            logoUrl: null,
          },
        },
      },
    },
    include: { projects: true },
  });

  const project = org.projects[0]!;

  await db.feedback.createMany({
    data: FEEDBACK.map((f, i) => ({
      orgId: org.id,
      projectId: project.id,
      body: f.body,
      type: f.type,
      rating: f.rating ?? null,
      email: i % 4 === 0 ? `user${i}@example.com` : null,
      pageUrl: "https://app.acme.example.com/dashboard",
      locale: "en-US",
      createdAt: daysAgo(f.days),
    })),
  });

  await db.subscription.update({
    where: { orgId: org.id },
    data: { feedbackUsedThisPeriod: FEEDBACK.length },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  console.log(`  Organization   ${org.name} (${org.slug})`);
  console.log(`  Project        ${project.name}`);
  console.log(`  Project key    ${project.key}`);
  console.log(`  Feedback       ${FEEDBACK.length} items (unanalyzed)\n`);
  console.log("  Test the widget by adding this to any HTML page:\n");
  console.log(
    `    <script async src="${base}/widget.js" data-project="${project.key}"></script>\n`,
  );
  console.log(
    "  Run analysis:  npm run analyze\n" +
      "  The demo org has no owner attached, so it won't collide with your account.\n",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
