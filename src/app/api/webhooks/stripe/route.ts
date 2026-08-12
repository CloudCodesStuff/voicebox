import { NextResponse, type NextRequest } from "next/server";

import { env, features } from "@/env";
import { db } from "@/server/db";
import { stripe, planForPriceId } from "@/server/lib/stripe";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

/* ---------------------------------------------------------------------------
   Inbound Stripe webhook
   ---------------------------------------------------------------------------
   Four events are registered on the Stripe side (see the endpoint in the
   dashboard): checkout.session.completed, customer.subscription.updated,
   customer.subscription.deleted, invoice.payment_failed. Notably absent:
   customer.subscription.created — Stripe fires that on every new
   subscription, but checkout.session.completed already carries everything we
   need for the first sync, so this file treats checkout.session.completed as
   the "a subscription now exists, go fetch its real state" event and
   customer.subscription.updated as "something about it changed, resync",
   both funneling into the same syncSubscription() so there's one source of
   truth for what a Subscription row should look like, not two.

   Signature verification uses the RAW body. Next's App Router hands you a
   Request whose .text() gives exactly the bytes Stripe signed; parsing JSON
   first and re-serializing would very likely produce different bytes
   (key order, whitespace) and fail verification for a legitimate event.

   syncSubscription takes an already-hydrated Stripe.Subscription rather than
   an id to re-fetch: a subscription event's `data.object` already IS the full
   resource, so re-fetching it would be a second live API call for data
   already in hand. checkout.session.completed is the one exception, its
   `data.object` is the Checkout Session, not the Subscription, so that
   handler fetches once before calling in here.
--------------------------------------------------------------------------- */

/** Pulls the full current state of a Stripe subscription into our own row. */
async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const orgId = sub.metadata.orgId;
  if (!orgId) {
    // A subscription we don't recognize, e.g. created by hand in the
    // dashboard without the metadata this app always sets. Nothing to sync.
    return;
  }

  const item = sub.items.data[0];
  const plan = item ? planForPriceId(item.price.id) : null;

  await db.subscription
    .update({
      where: { orgId },
      data: {
        // A price that isn't one of ours (plan came back null) is left alone
        // rather than guessed at; the rest of the row still syncs.
        ...(plan ? { plan } : {}),
        status: mapStatus(sub.status),
        stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
        stripeSubscriptionId: sub.id,
        stripePriceId: item?.price.id ?? null,
        currentPeriodStart: item ? new Date(item.current_period_start * 1000) : null,
        currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    })
    // The org may have been deleted after the subscription was created but
    // before Stripe's event arrived; nothing left to sync it into.
    .catch(() => undefined);
}

function mapStatus(
  status: Stripe.Subscription.Status,
): "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "paused":
      return "CANCELED";
    default:
      return "INCOMPLETE";
  }
}

/** Back to Free. The subscription is gone; the customer id is kept so a resubscribe reuses it. */
async function handleDeleted(sub: Stripe.Subscription): Promise<void> {
  const orgId = sub.metadata.orgId;
  if (!orgId) return;

  await db.subscription
    .update({
      where: { orgId },
      data: {
        plan: "FREE",
        status: "ACTIVE",
        stripeSubscriptionId: null,
        stripePriceId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      },
    })
    .catch(() => undefined);
}

/**
 * A failed charge doesn't downgrade anyone. Stripe's own retry schedule (Smart
 * Retries) will keep trying, and if it ultimately gives up, that's a
 * customer.subscription.updated (status -> past_due, already handled by
 * syncSubscription) or a customer.subscription.deleted if it cancels outright.
 * This handler exists only so the event type is acknowledged rather than
 * falling through to the unhandled-event log line.
 */
function handlePaymentFailed(invoice: Stripe.Invoice): void {
  console.warn(
    `[stripe] Payment failed for customer ${typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id}, invoice ${invoice.id}`,
  );
}

export async function POST(req: NextRequest) {
  if (!features.billing) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    // Deliberately generic: telling a forged request which part of the
    // signature failed helps nobody but the person forging it.
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (typeof session.subscription === "string") {
        await syncSubscription(await stripe().subscriptions.retrieve(session.subscription));
      }
      break;
    }
    case "customer.subscription.updated": {
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    }
    case "customer.subscription.deleted": {
      await handleDeleted(event.data.object as Stripe.Subscription);
      break;
    }
    case "invoice.payment_failed": {
      handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    }
    default:
      // Stripe endpoints commonly receive events beyond what they're
      // "subscribed to" (account-level events, or ones added to the
      // dashboard after this file was last touched). Acknowledging with 200
      // is correct either way — retrying an event this code doesn't act on
      // wouldn't produce a different outcome.
      break;
  }

  return NextResponse.json({ received: true });
}
