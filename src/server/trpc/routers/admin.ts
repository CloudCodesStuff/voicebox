import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";
import { isAdminEmail } from "@/server/lib/admin";
import { planRules } from "@/server/lib/plan";

/**
 * Operator dashboard queries.
 *
 * ⚠️  THIS IS THE ONLY ROUTER THAT READS ACROSS TENANTS.
 *
 * Every other procedure in this codebase derives an `orgId` from the session
 * and scopes its queries to it, so a forgotten `where` fails closed. This file
 * deliberately does not, which is exactly why it is a separate file: the set of
 * queries that can see everything should be short enough to read in one sitting
 * and obvious enough to audit.
 *
 * The rule it holds itself to: **aggregates and operational health, never
 * customer content.** Nothing here returns the text a customer's end users
 * wrote. Those people never agreed to us reading their words, our own privacy
 * policy positions us as a processor acting on the customer's instructions, and
 * "the operator can read everyone's feedback" is a question you do not want to
 * answer during diligence.
 *
 * Failure identifiers (which workspace has a dead webhook) are operational
 * metadata and are in scope. Message bodies are not.
 */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isAdminEmail(ctx.session.user.email)) {
    // NOT_FOUND rather than FORBIDDEN. A 403 confirms the route exists to
    // anyone who guesses it; a 404 tells them nothing.
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  return next({ ctx });
});

/** Midnight N days ago, for the trend buckets. */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export const adminRouter = createTRPCRouter({
  /** Everything the overview needs, in one round trip. */
  overview: adminProcedure.query(async ({ ctx }) => {
    const since7 = daysAgo(7);
    const since30 = daysAgo(30);

    const [
      users,
      orgs,
      projects,
      feedbackTotal,
      feedback7,
      feedback30,
      unanalyzed,
      subscriptions,
      openErrors,
      usersWithFeedback,
      usersWithWorkspace,
      usersActive7,
      failedRuns7,
      disabledWebhooks,
      openAllowlists,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.organization.count(),
      ctx.db.project.count(),
      ctx.db.feedback.count(),
      ctx.db.feedback.count({ where: { createdAt: { gte: since7 } } }),
      ctx.db.feedback.count({ where: { createdAt: { gte: since30 } } }),
      ctx.db.feedback.count({ where: { sentiment: null } }),
      ctx.db.subscription.groupBy({ by: ["plan"], _count: true }),
      ctx.db.errorEvent.count({ where: { resolvedAt: null } }),
      // Funnel steps count PEOPLE, at every stage. Counting workspaces at one
      // step and users at another produced a funnel that read over 100%,
      // because one person can own several workspaces.
      ctx.db.user.count({
        where: { memberships: { some: { org: { feedback: { some: {} } } } } },
      }),
      ctx.db.user.count({ where: { memberships: { some: {} } } }),
      ctx.db.user.count({
        where: {
          memberships: {
            some: { org: { feedback: { some: { createdAt: { gte: since7 } } } } },
          },
        },
      }),
      ctx.db.analysisRun.count({
        where: { status: "FAILED", startedAt: { gte: since7 } },
      }),
      ctx.db.webhook.count({ where: { active: false } }),
      ctx.db.project.count({ where: { allowedDomains: { isEmpty: true } } }),
    ]);

    const planCounts: Record<string, number> = {};
    for (const row of subscriptions) planCounts[row.plan] = row._count;

    // Monthly recurring revenue from the plan table rather than from Stripe:
    // it is the number the product believes, and a mismatch with Stripe is
    // itself worth seeing.
    const mrr = subscriptions.reduce((sum, row) => {
      const price =
        row.plan === "PRO" ? 19 : row.plan === "SCALE" ? 49 : 0;
      return sum + price * row._count;
    }, 0);

    return {
      users,
      orgs,
      projects,
      feedbackTotal,
      feedback7,
      feedback30,
      unanalyzed,
      planCounts,
      mrr,
      openErrors,
      /**
       * Activation, the number worth watching. Each step is a strictly
       * smaller set than the one before it.
       */
      funnel: {
        signedUp: users,
        madeWorkspace: usersWithWorkspace,
        installedWidget: usersWithFeedback,
        activeLast7: usersActive7,
      },
      health: {
        failedRuns7,
        disabledWebhooks,
        openAllowlists,
        totalProjects: projects,
      },
      limits: {
        free: planRules.FREE.feedbackPerMonth,
        pro: planRules.PRO.feedbackPerMonth,
        scale: planRules.SCALE.feedbackPerMonth,
      },
    };
  }),

  /** Daily signup and feedback counts for the last 30 days. */
  trend: adminProcedure.query(async ({ ctx }) => {
    const since = daysAgo(29);

    const [feedback, orgs] = await Promise.all([
      ctx.db.feedback.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      ctx.db.organization.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);

    const buckets = new Map<string, { feedback: number; orgs: number }>();
    for (let i = 0; i < 30; i++) {
      const d = daysAgo(29 - i);
      buckets.set(d.toISOString().slice(0, 10), { feedback: 0, orgs: 0 });
    }

    for (const f of feedback) {
      const key = f.createdAt.toISOString().slice(0, 10);
      const b = buckets.get(key);
      if (b) b.feedback += 1;
    }
    for (const o of orgs) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const b = buckets.get(key);
      if (b) b.orgs += 1;
    }

    return [...buckets.entries()].map(([date, v]) => ({ date, ...v }));
  }),

  /** Grouped errors, newest activity first. */
  errors: adminProcedure
    .input(
      z.object({
        includeResolved: z.boolean().default(false),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.db.errorEvent.findMany({
        where: input.includeResolved ? {} : { resolvedAt: null },
        orderBy: { lastSeenAt: "desc" },
        take: input.limit,
      }),
    ),

  resolveError: adminProcedure
    .input(z.object({ id: z.string(), resolved: z.boolean() }))
    .mutation(({ ctx, input }) =>
      ctx.db.errorEvent.update({
        where: { id: input.id },
        data: { resolvedAt: input.resolved ? new Date() : null },
      }),
    ),

  /**
   * Deletes one error group outright.
   *
   * Resolving is the normal action and keeps the history. This is for noise
   * that will never be worth seeing again.
   */
  deleteError: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.errorEvent.delete({ where: { id: input.id } }),
    ),
});
