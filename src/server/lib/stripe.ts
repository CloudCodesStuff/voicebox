import "server-only";

import Stripe from "stripe";

import { env, features } from "@/env";
import type { Plan } from "@prisma/client";

/**
 * One client, constructed lazily so importing this module never requires
 * STRIPE_SECRET_KEY, the same reasoning as `db.ts`: the app has to build and
 * run on a clean checkout with an empty `.env`, and billing is optional.
 */
let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!client) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set. Callers should check features.billing " +
          "before reaching here; this is a bug if it fires.",
      );
    }
    client = new Stripe(env.STRIPE_SECRET_KEY, {
      // Pinned to whatever this installed SDK version's types expect, rather
      // than a string typed by hand: the two must always match, so let the
      // type system enforce it instead of drifting silently on an SDK bump.
      apiVersion: "2026-07-29.dahlia",
    });
  }
  return client;
}

/** Only the two paid plans are real Stripe products; Free isn't sold. */
export type PaidPlan = Extract<Plan, "PRO" | "SCALE">;
export type BillingInterval = "monthly" | "annual";

/**
 * Maps a plan + interval to the Stripe Price id created for it. One place to
 * change if a price is ever recreated, rather than four call sites.
 */
export function priceIdFor(plan: PaidPlan, interval: BillingInterval): string {
  const table: Record<PaidPlan, Record<BillingInterval, string | undefined>> = {
    PRO: { monthly: env.STRIPE_PRICE_PRO_MONTHLY, annual: env.STRIPE_PRICE_PRO_ANNUAL },
    SCALE: { monthly: env.STRIPE_PRICE_SCALE_MONTHLY, annual: env.STRIPE_PRICE_SCALE_ANNUAL },
  };
  const id = table[plan][interval];
  if (!id) {
    throw new Error(
      `STRIPE_PRICE_${plan}_${interval.toUpperCase()} is not set. Create the price in Stripe and add it to .env.`,
    );
  }
  return id;
}

/** Reverse lookup: a Price id from a webhook event back to our own Plan enum. */
export function planForPriceId(priceId: string): Plan | null {
  const table: Array<[string | undefined, Plan]> = [
    [env.STRIPE_PRICE_PRO_MONTHLY, "PRO"],
    [env.STRIPE_PRICE_PRO_ANNUAL, "PRO"],
    [env.STRIPE_PRICE_SCALE_MONTHLY, "SCALE"],
    [env.STRIPE_PRICE_SCALE_ANNUAL, "SCALE"],
  ];
  return table.find(([id]) => id === priceId)?.[1] ?? null;
}

export { features };
