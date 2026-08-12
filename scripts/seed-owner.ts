/**
 * Seed a real, owned workspace for a specific person.
 *
 *   npm run seed:owner                       (defaults to OWNER_EMAIL below)
 *   OWNER_EMAIL=you@example.com npm run seed:owner
 *
 * Creates the User row up front so that signing in with Google links straight
 * into it (auth.ts sets allowDangerousEmailAccountLinking), meaning you land in
 * a populated dashboard instead of an empty onboarding flow.
 *
 * The feedback below is written to cluster: several distinct underlying
 * problems, each described in different words by different people, plus noise
 * and praise around them. That's the shape real feedback has, and it's the only
 * way to tell whether the clustering is actually working.
 */

import "dotenv/config";
import { randomBytes } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type FeedbackType } from "@prisma/client";

const OWNER_EMAIL = process.env.OWNER_EMAIL ?? "eashaan.bhattacharyya@atacana.com";
const OWNER_NAME = process.env.OWNER_NAME ?? "Eashaan";
const ORG_NAME = process.env.OWNER_ORG ?? "Atacana";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("\nDATABASE_URL is not set.\n");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

type Seed = {
  body: string;
  type: FeedbackType;
  rating?: number;
  days: number;
  email?: string;
  plan?: string;
};

const FEEDBACK: Seed[] = [
  // Onboarding friction, the loudest cluster, mostly unhappy.
  { body: "Signed up and then just stared at an empty screen. No idea what I was meant to do next.", type: "ISSUE", rating: 2, days: 1, plan: "free" },
  { body: "The setup flow lost me at the second step. What is a workspace and why do I need two?", type: "ISSUE", rating: 2, days: 2, email: "priya@example.com", plan: "free" },
  { body: "Took me 20 minutes to find where to invite my team. It's buried.", type: "ISSUE", rating: 3, days: 3, plan: "pro" },
  { body: "Genuinely could not work out how to get started without watching a YouTube video.", type: "ISSUE", rating: 2, days: 5, plan: "free" },
  { body: "Onboarding assumes I already know your vocabulary. I didn't.", type: "ISSUE", rating: 2, days: 8, plan: "free" },

  // Slow dashboard, the performance cluster.
  { body: "Dashboard takes about 8 seconds to load every morning. Painful.", type: "ISSUE", rating: 2, days: 1, plan: "pro" },
  { body: "Everything is fast until I filter by date, then it hangs for ages.", type: "ISSUE", rating: 2, days: 2, plan: "pro" },
  { body: "The main page is so slow I've started leaving it open in a tab so I don't have to reload.", type: "ISSUE", rating: 1, days: 4, email: "marcus@example.com", plan: "scale" },
  { body: "Loading spinner for 10+ seconds on the reports view. Every single time.", type: "ISSUE", rating: 2, days: 6, plan: "pro" },

  // Exports, different words, same underlying request.
  { body: "Please let me export to CSV. I need to get this into a spreadsheet for my board.", type: "IDEA", rating: 4, days: 2, plan: "pro" },
  { body: "Any way to download the raw data? Copy-pasting 200 rows is not viable.", type: "QUESTION", rating: 3, days: 5, plan: "free" },
  { body: "Would be great to pull this into Excel rather than screenshotting it.", type: "IDEA", rating: 4, days: 9, plan: "pro" },

  // Mobile, small but consistent.
  { body: "On my phone the sidebar covers the whole screen and I can't dismiss it.", type: "ISSUE", rating: 2, days: 3, plan: "free" },
  { body: "Mobile layout is basically unusable. Tables overflow off the side.", type: "ISSUE", rating: 2, days: 7, plan: "pro" },
  { body: "Tried to check this on my iPad and half the buttons are off screen.", type: "ISSUE", rating: 2, days: 11, plan: "pro" },

  // Integrations, the feature-request cluster.
  { body: "A Slack integration would be huge for us. We live in Slack.", type: "IDEA", rating: 5, days: 1, email: "dana@example.com", plan: "scale" },
  { body: "Do you have a Zapier connector? We want this feeding into Notion automatically.", type: "QUESTION", rating: 4, days: 4, plan: "pro" },
  { body: "Notifications in Slack instead of email please. Email gets buried.", type: "IDEA", rating: 4, days: 10, plan: "pro" },
  { body: "Is there an API? I couldn't find docs anywhere.", type: "QUESTION", rating: 3, days: 12, plan: "scale" },

  // Pricing confusion.
  { body: "I upgraded but my limits didn't change for two days. Support sorted it but that was stressful.", type: "ISSUE", rating: 3, days: 6, plan: "pro" },
  { body: "The pricing page says one thing and my invoice says another. Which is right?", type: "QUESTION", rating: 2, days: 9, email: "tom@example.com", plan: "pro" },

  // Praise, should collapse into one theme, not five.
  { body: "Honestly the cleanest tool we've adopted this year. Setup aside, it's lovely.", type: "PRAISE", rating: 5, days: 1, plan: "pro" },
  { body: "Support replied in under an hour on a Sunday. Genuinely impressed.", type: "PRAISE", rating: 5, days: 3, plan: "scale" },
  { body: "This replaced two other tools for us. Well built.", type: "PRAISE", rating: 5, days: 5, plan: "scale" },
  { body: "Love the new design. Much easier to scan than the old one.", type: "PRAISE", rating: 5, days: 8, plan: "pro" },
  { body: "Whoever wrote your empty states, thank you. They actually tell me what to do.", type: "PRAISE", rating: 5, days: 13, plan: "free" },

  // Genuine one-offs, so the clustering has to decide what not to merge.
  { body: "Dark mode when? My eyes are begging.", type: "IDEA", rating: 4, days: 2, plan: "pro" },
  { body: "Search doesn't tolerate typos at all. One wrong letter and I get nothing.", type: "IDEA", rating: 3, days: 7, plan: "free" },
  { body: "Can I change the currency? Everything shows in dollars and we bill in euros.", type: "QUESTION", rating: 3, days: 14, plan: "pro" },
  { body: "The date picker defaults to today and I always want last month. Small thing, adds up.", type: "IDEA", rating: 4, days: 15, plan: "pro" },
];

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

async function main() {
  console.log(`\nSeeding a workspace for ${OWNER_EMAIL}…\n`);

  const user = await db.user.upsert({
    where: { email: OWNER_EMAIL },
    create: { email: OWNER_EMAIL, name: OWNER_NAME },
    update: { name: OWNER_NAME },
  });

  // Rebuild cleanly so the script is safe to re-run.
  const existing = await db.membership.findFirst({
    where: { userId: user.id },
    select: { orgId: true },
  });
  if (existing) {
    await db.organization.delete({ where: { id: existing.orgId } });
  }

  const org = await db.organization.create({
    data: {
      name: ORG_NAME,
      slug: ORG_NAME.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      memberships: { create: { userId: user.id, role: "OWNER" } },
      subscription: {
        create: {
          plan: "SCALE",
          status: "ACTIVE",
          feedbackUsedThisPeriod: FEEDBACK.length,
        },
      },
      projects: {
        create: {
          name: `${ORG_NAME} Web App`,
          url: "https://app.atacana.com",
          key: `pk_${randomBytes(18).toString("base64url")}`,
          widgetConfig: {
            accentColor: "#00C48C",
            font: "sans",
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
            ratingStyle: "stars",
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
    data: FEEDBACK.map((f) => ({
      orgId: org.id,
      projectId: project.id,
      body: f.body,
      type: f.type,
      rating: f.rating ?? null,
      email: f.email ?? null,
      pageUrl: "https://app.atacana.com/dashboard",
      locale: "en-US",
      metadata: f.plan ? { plan: f.plan } : undefined,
      createdAt: daysAgo(f.days),
    })),
  });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  console.log(`  User          ${user.email}`);
  console.log(`  Organization  ${org.name}  ·  SCALE plan`);
  console.log(`  Project       ${project.name}`);
  console.log(`  Feedback      ${FEEDBACK.length} items, unanalyzed\n`);
  console.log(`  Script tag:`);
  console.log(
    `    <script async src="${base}/widget.js" data-project="${project.key}"></script>\n`,
  );
  console.log("  Next:  npm run analyze     then sign in with Google.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
