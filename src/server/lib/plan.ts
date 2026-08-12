import { TRPCError } from "@trpc/server";
import type { Plan, PrismaClient, Subscription } from "@prisma/client";

/**
 * Plan limits and feature gates.
 *
 * Enforced in server procedures rather than by hiding UI. A hidden button is a
 * hint; this is the rule.
 */

export type Feature =
  | "themes"
  | "digest"
  | "branding"
  | "api"
  | "askAI";

type PlanRules = {
  feedbackPerMonth: number;
  projects: number | null;
  seats: number | null;
  features: readonly Feature[];
};

export const planRules: Record<Plan, PlanRules> = {
  // The AI is the hook, so Free gets themes. Gating the one thing that makes
  // the product interesting would kill the demo and the word of mouth.
  FREE: {
    feedbackPerMonth: 50,
    projects: 1,
    seats: 1,
    features: ["themes"],
  },
  // Legacy, no longer sold. Kept because the enum value may exist in old
  // rows; treated as Free-plus-volume so nothing gated ever names it.
  STARTER: {
    feedbackPerMonth: 500,
    projects: 3,
    seats: 3,
    features: ["themes"],
  },
  PRO: {
    feedbackPerMonth: 3_000,
    projects: 10,
    seats: 10,
    features: ["themes", "digest", "branding", "api", "askAI"],
  },
  SCALE: {
    feedbackPerMonth: 15_000,
    projects: null,
    seats: null,
    features: ["themes", "digest", "branding", "api", "askAI"],
  },
};

export const planLabels: Record<Plan, string> = {
  FREE: "Free",
  STARTER: "Starter",
  PRO: "Pro",
  SCALE: "Scale",
};

const PLAN_ORDER: Plan[] = ["FREE", "STARTER", "PRO", "SCALE"];

/** Cheapest plan that unlocks a feature, used to write an honest upgrade prompt. */
export function requiredPlanFor(feature: Feature): Plan {
  return PLAN_ORDER.find((p) => planRules[p].features.includes(feature)) ?? "SCALE";
}

export function hasFeature(plan: Plan, feature: Feature): boolean {
  return planRules[plan].features.includes(feature);
}

export function assertFeature(plan: Plan, feature: Feature): void {
  if (hasFeature(plan, feature)) return;
  throw new TRPCError({
    code: "FORBIDDEN",
    message: `UPGRADE_REQUIRED:${requiredPlanFor(feature)}`,
  });
}

/**
 * Rolls the usage window forward if the period elapsed, then returns the
 * subscription. The reset is lazy rather than scheduled: an org that receives
 * no feedback doesn't need a cron firing on its behalf, and a lazy reset can't
 * drift out of sync with the billing period the way a separate scheduler can.
 */
export async function ensureUsageWindow(
  db: PrismaClient,
  orgId: string,
): Promise<Subscription> {
  const subscription = await db.subscription.findUnique({ where: { orgId } });

  if (!subscription) {
    return db.subscription.create({
      data: { orgId, plan: "FREE", status: "ACTIVE" },
    });
  }

  const now = new Date();
  const windowEnd = new Date(subscription.usageResetAt);
  windowEnd.setMonth(windowEnd.getMonth() + 1);
  if (now < windowEnd) return subscription;

  // Advance to the current window rather than to "now", so the reset day of
  // the month stays stable even after a long gap.
  const nextReset = new Date(subscription.usageResetAt);
  while (nextReset <= now) nextReset.setMonth(nextReset.getMonth() + 1);
  nextReset.setMonth(nextReset.getMonth() - 1);

  return db.subscription.update({
    where: { orgId },
    data: { feedbackUsedThisPeriod: 0, usageResetAt: nextReset },
  });
}

export type Usage = {
  used: number;
  limit: number;
  remaining: number;
  percent: number;
  plan: Plan;
  overLimit: boolean;
};

export function describeUsage(subscription: Subscription): Usage {
  const limit = planRules[subscription.plan].feedbackPerMonth;
  const used = subscription.feedbackUsedThisPeriod;
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    percent: Math.min(100, Math.round((used / limit) * 100)),
    plan: subscription.plan,
    overLimit: used >= limit,
  };
}

/**
 * Ingest is deliberately soft-capped. Feedback belongs to the customer's own
 * users, silently dropping it because the customer is over quota punishes the
 * wrong person and loses data that can never be recovered. We accept it, stop
 * analyzing it, and prompt an upgrade.
 */
export const INGEST_HARD_CAP_MULTIPLIER = 3;

export function ingestDecision(subscription: Subscription): {
  accept: boolean;
  analyze: boolean;
  overLimit: boolean;
} {
  const limit = planRules[subscription.plan].feedbackPerMonth;
  const used = subscription.feedbackUsedThisPeriod;
  const hardCap = limit * INGEST_HARD_CAP_MULTIPLIER;

  return {
    accept: used < hardCap,
    analyze: used < limit,
    overLimit: used >= limit,
  };
}
