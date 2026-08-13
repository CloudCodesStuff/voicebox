/**
 * Seed a real, owned workspace for a specific person.
 *
 *   npm run seed:owner                       (the `atacana` profile)
 *   OWNER_PROFILE=lanci npm run seed:owner
 *   OWNER_PROFILE=lanci OWNER_PLAN=PRO npm run seed:owner
 *
 * Profiles live in scripts/seed-profiles.ts. Each one is a whole account: who
 * owns it, what they ship, and a body of feedback written to cluster.
 *
 * Creates the User row up front so that signing in with Google links straight
 * into it (auth.ts sets allowDangerousEmailAccountLinking), meaning you land in
 * a populated dashboard instead of an empty onboarding flow.
 *
 * ── Re-running this is safe, and deliberately not destructive. ──
 *
 * An earlier version deleted the owner's organization and built a new one. That
 * is fine against a scratch database and wrong against the one people are
 * actually using: Organization cascades to Subscription, and the Subscription
 * row carries `stripeCustomerId`. Dropping it orphans a live Stripe customer,
 * so the person's next checkout silently creates a second one and their billing
 * history splits in two. The Project row is just as load-bearing, because its
 * `key` is already pasted into a real site's HTML; minting a new one breaks an
 * install nobody thought they were changing.
 *
 * So this reuses the org, its subscription and its first project when they
 * exist, and only replaces what it owns: that project's feedback and themes.
 * Other projects in the same workspace are left completely alone.
 */

import "dotenv/config";
import { randomBytes } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Plan } from "@prisma/client";

import { seedProfiles, type SeedProfileKey } from "./seed-profiles";

const profileKey = (process.env.OWNER_PROFILE ?? "atacana") as SeedProfileKey;
const profile = seedProfiles[profileKey];

if (!profile) {
  console.error(
    `\nUnknown OWNER_PROFILE "${profileKey}". Available: ${Object.keys(seedProfiles).join(", ")}\n`,
  );
  process.exit(1);
}

const OWNER_EMAIL = process.env.OWNER_EMAIL ?? profile.email;
const OWNER_NAME = process.env.OWNER_NAME ?? profile.name;
const ORG_NAME = process.env.OWNER_ORG ?? profile.orgName;
const PLAN = (process.env.OWNER_PLAN ?? "SCALE") as Plan;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("\nDATABASE_URL is not set.\n");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const { feedback: FEEDBACK } = profile;
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Bare hostname, which is what the ingest allowlist matches on. */
const allowedDomain = new URL(profile.url).hostname.replace(/^www\./, "");

const widgetConfig = {
  accentColor: profile.accentColor,
  font: "sans",
  position: "bottom-right",
  theme: "auto",
  radius: 12,
  triggerLabel: "Feedback",
  triggerHidden: false,
  heading: profile.heading,
  subheading: profile.subheading,
  enabledTypes: ["IDEA", "ISSUE", "PRAISE", "QUESTION"],
  askRating: true,
  ratingStyle: "stars",
  askEmail: true,
  successMessage: "Got it. Thank you.",
  hideBranding: false,
  logoUrl: null,
};

async function main() {
  console.log(`\nSeeding the "${profileKey}" workspace for ${OWNER_EMAIL}…\n`);

  const user = await db.user.upsert({
    where: { email: OWNER_EMAIL },
    create: { email: OWNER_EMAIL, name: OWNER_NAME },
    update: {},
  });

  // Reuse the workspace this person already owns, if there is one. Their
  // Stripe customer hangs off it.
  const existing = await db.membership.findFirst({
    where: { userId: user.id, role: "OWNER" },
    orderBy: { createdAt: "asc" },
    select: { orgId: true },
  });

  const org = existing
    ? await db.organization.update({
        where: { id: existing.orgId },
        data: { name: ORG_NAME, slug: slugify(ORG_NAME) },
        include: { projects: { orderBy: { createdAt: "asc" } } },
      })
    : await db.organization.create({
        data: {
          name: ORG_NAME,
          slug: slugify(ORG_NAME),
          memberships: { create: { userId: user.id, role: "OWNER" } },
        },
        include: { projects: true },
      });

  await db.subscription.upsert({
    where: { orgId: org.id },
    create: {
      orgId: org.id,
      plan: PLAN,
      status: "ACTIVE",
      feedbackUsedThisPeriod: FEEDBACK.length,
    },
    // Note the absence of stripeCustomerId here: whatever is on the row stays.
    update: {
      plan: PLAN,
      status: "ACTIVE",
      feedbackUsedThisPeriod: FEEDBACK.length,
    },
  });

  const reused = org.projects[0];
  const project = reused
    ? await db.project.update({
        where: { id: reused.id },
        data: {
          name: profile.projectName,
          url: profile.url,
          widgetConfig,
          allowedDomains: [allowedDomain],
        },
      })
    : await db.project.create({
        data: {
          orgId: org.id,
          name: profile.projectName,
          url: profile.url,
          key: `pk_${randomBytes(18).toString("base64url")}`,
          widgetConfig,
          allowedDomains: [allowedDomain],
        },
      });

  // Replace only this project's contents, so a second project in the same
  // workspace survives a re-run untouched. Feedback first: Theme is its parent.
  const cleared = await db.feedback.deleteMany({ where: { projectId: project.id } });
  await db.theme.deleteMany({ where: { projectId: project.id } });

  await db.feedback.createMany({
    data: FEEDBACK.map((f) => ({
      orgId: org.id,
      projectId: project.id,
      body: f.body,
      type: f.type,
      rating: f.rating ?? null,
      email: f.email ?? null,
      pageUrl: profile.pageUrl,
      locale: "en-US",
      metadata: f.meta,
      createdAt: daysAgo(f.days),
    })),
  });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  console.log(`  User          ${user.email}`);
  console.log(
    `  Organization  ${org.name}  ·  ${PLAN} plan  ·  ${existing ? "reused" : "created"}`,
  );
  console.log(`  Project       ${project.name}  ·  ${reused ? "reused" : "created"}`);
  console.log(`  Allowlist     ${allowedDomain}`);
  console.log(
    `  Feedback      ${FEEDBACK.length} items, unanalyzed` +
      (cleared.count ? `  (${cleared.count} replaced)` : ""),
  );
  console.log(`\n  Script tag:`);
  console.log(
    `    <script async src="${base}/widget.js" data-project="${project.key}"></script>\n`,
  );
  console.log(`  Next:  npm run analyze -- ${project.id}     then sign in with Google.\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
