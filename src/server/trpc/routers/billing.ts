import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { clientEnv, features } from "@/env";
import { adminProcedure, createTRPCRouter } from "@/server/trpc/init";
import { priceIdFor, stripe } from "@/server/lib/stripe";

/* ---------------------------------------------------------------------------
   Billing
   ---------------------------------------------------------------------------
   Two ways in, matching what Stripe is actually good at:

     changePlan          no subscription yet -> hosted Checkout, redirect out.
                          subscription exists -> update the price in place, no
                          redirect, so switching from Pro to Scale doesn't
                          create a second subscription billing the customer
                          twice.

     createPortalSession -> Stripe's own hosted page for updating a card,
                          reading past invoices, or cancelling. Building that
                          UI ourselves would be re-implementing a page Stripe
                          already ships and tests.

   Every mutation is admin-only: `adminProcedure`'s own doc comment names
   billing as exactly what it's for.
--------------------------------------------------------------------------- */

function requireBilling() {
  if (!features.billing) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Billing is not configured. Add the STRIPE_* keys to .env.",
    });
  }
}

const planInput = z.object({
  plan: z.enum(["PRO", "SCALE"]),
  interval: z.enum(["monthly", "annual"]),
});

export const billingRouter = createTRPCRouter({
  changePlan: adminProcedure.input(planInput).mutation(async ({ ctx, input }) => {
    requireBilling();

    const subscription = await ctx.db.subscription.findUniqueOrThrow({
      where: { orgId: ctx.orgId },
    });

    const price = priceIdFor(input.plan, input.interval);

    // Already has a live Stripe subscription: swap the price on it rather
    // than starting a second one. Stripe prorates the difference automatically.
    if (subscription.stripeSubscriptionId) {
      const live = await stripe().subscriptions.retrieve(
        subscription.stripeSubscriptionId,
      );
      const item = live.items.data[0];
      if (!item) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Your Stripe subscription has no billing item to update.",
        });
      }

      await stripe().subscriptions.update(subscription.stripeSubscriptionId, {
        items: [{ id: item.id, price }],
        proration_behavior: "create_prorations",
      });

      // The webhook will also sync this, but updating here means the UI
      // reflects the change immediately rather than waiting on delivery.
      await ctx.db.subscription.update({
        where: { orgId: ctx.orgId },
        data: { plan: input.plan, stripePriceId: price },
      });

      return { mode: "updated" as const };
    }

    // No subscription yet: create (or reuse) a Stripe customer, then send
    // them to hosted Checkout. Creating the customer up front, rather than
    // letting Checkout create one implicitly, means the id survives an
    // abandoned checkout and the next attempt reuses it instead of creating
    // an orphaned duplicate customer per retry.
    const customerId =
      subscription.stripeCustomerId ??
      (
        await stripe().customers.create({
          email: ctx.session.user.email ?? undefined,
          name: ctx.org.name,
          metadata: { orgId: ctx.orgId },
        })
      ).id;

    if (!subscription.stripeCustomerId) {
      await ctx.db.subscription.update({
        where: { orgId: ctx.orgId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      success_url: `${clientEnv.NEXT_PUBLIC_APP_URL}/app/settings/billing?checkout=success`,
      cancel_url: `${clientEnv.NEXT_PUBLIC_APP_URL}/app/settings/billing?checkout=cancelled`,
      // Carried on the Subscription object itself (not just this Session), so
      // every later webhook event on that subscription can find the org
      // straight from event.data.object.metadata without a second lookup.
      subscription_data: { metadata: { orgId: ctx.orgId } },
      metadata: { orgId: ctx.orgId },
    });

    if (!session.url) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Stripe didn't return a checkout URL. Try again.",
      });
    }

    return { mode: "checkout" as const, url: session.url };
  }),

  createPortalSession: adminProcedure.mutation(async ({ ctx }) => {
    requireBilling();

    const subscription = await ctx.db.subscription.findUniqueOrThrow({
      where: { orgId: ctx.orgId },
    });

    if (!subscription.stripeCustomerId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Subscribe to a plan before managing billing.",
      });
    }

    const session = await stripe().billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${clientEnv.NEXT_PUBLIC_APP_URL}/app/settings/billing`,
    });

    return { url: session.url };
  }),
});
