"use client";

import { Check, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { plans } from "@/lib/site";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";
import { SectionHeader } from "../section-header";

type BillingInterval = "monthly" | "annual";

export default function BillingSettings() {
  const org = api.org.current.useQuery();

  if (org.isLoading || !org.data) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  const { usage, subscription, billingConfigured } = org.data;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Billing"
        description="Your plan, how much of this month's feedback allowance you've used, and where to change either. Plans are priced on how much feedback you collect; the AI analysis is included on every one."
      />
      <section className="rounded-xl border border-line bg-paper-2 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[1rem] font-semibold text-ink">
              <span className="capitalize">{usage.plan.toLowerCase()}</span> plan
            </h2>
            <p className="mt-1 text-[0.85rem] text-steel">
              Resets on{" "}
              {new Date(subscription.usageResetAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {billingConfigured && subscription.stripeCustomerId && (
              <ManageBillingLink />
            )}
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[0.78rem] font-medium capitalize",
                subscription.status === "ACTIVE"
                  ? "bg-positive-wash text-positive"
                  : "bg-mixed-wash text-mixed",
              )}
            >
              {subscription.status.toLowerCase()}
            </span>
          </div>
        </div>

        {subscription.cancelAtPeriodEnd && (
          <p className="mt-4 rounded-lg bg-mixed-wash px-3.5 py-2.5 text-[0.82rem] leading-relaxed text-mixed">
            Cancels on{" "}
            {subscription.currentPeriodEnd
              ? new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                })
              : "the end of this period"}
            . You&apos;ll keep {usage.plan.toLowerCase()} access until then.
          </p>
        )}

        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <span className="label">Feedback this period</span>
            <span className="tnum text-[0.85rem] text-ink">
              {usage.used.toLocaleString()} / {usage.limit.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                usage.percent >= 90 ? "bg-negative" : "bg-mint",
              )}
              style={{ width: `${usage.percent}%` }}
            />
          </div>
          {usage.overLimit && (
            <p className="mt-3 rounded-lg bg-mixed-wash px-3.5 py-2.5 text-[0.82rem] leading-relaxed text-mixed">
              You&apos;re over your monthly limit. Feedback is still being
              collected, we won&apos;t throw away your users&apos; words, but
              new submissions aren&apos;t being analyzed until you upgrade or the
              period resets.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-[1rem] font-semibold text-ink">Plans</h2>
        <PlanGrid
          currentPlan={usage.plan}
          billingConfigured={billingConfigured}
        />

        {!billingConfigured && (
          <p className="mt-4 rounded-lg border border-line bg-muted px-4 py-3 text-[0.82rem] leading-relaxed text-steel">
            Checkout isn&apos;t connected yet. Add your{" "}
            <code className="font-mono">STRIPE_*</code> keys to{" "}
            <code className="font-mono">.env</code> to turn on upgrades.
          </p>
        )}
      </section>
    </div>
  );
}

/**
 * Monthly/annual interval lives here as shared state, since switching it
 * should reflect on every plan's price at once, the way it does on the
 * public pricing page, not per-card.
 */
function PlanGrid({
  currentPlan,
  billingConfigured,
}: {
  currentPlan: string;
  billingConfigured: boolean;
}) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  return (
    <>
      {billingConfigured && (
        <div className="mt-4 inline-flex rounded-lg border border-line p-0.5 text-[0.78rem] font-medium">
          {(["monthly", "annual"] as const).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInterval(i)}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors",
                interval === i ? "bg-ink text-paper" : "text-steel hover:text-ink",
              )}
            >
              {i === "monthly" ? "Monthly" : "Annual, 2 months free"}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {plans.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            current={p.id === currentPlan}
            interval={interval}
            billingConfigured={billingConfigured}
          />
        ))}
      </div>
    </>
  );
}

function PlanCard({
  plan: p,
  current,
  interval,
  billingConfigured,
}: {
  plan: (typeof plans)[number];
  current: boolean;
  interval: BillingInterval;
  billingConfigured: boolean;
}) {
  const utils = api.useUtils();
  const isFree = p.id === "FREE";
  const price = interval === "monthly" ? p.priceMonthly : Math.round(p.priceAnnual / 12);

  const changePlan = api.billing.changePlan.useMutation({
    onSuccess(result) {
      if (result.mode === "checkout") {
        window.location.href = result.url;
        return;
      }
      toast.success(`Switched to ${p.name}.`);
      void utils.org.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const canChoose = billingConfigured && !current && !isFree;

  return (
    <div
      className={cn(
        "rounded-xl border bg-paper-2 p-5",
        current ? "border-ink" : "border-line",
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[0.92rem] font-semibold text-ink">{p.name}</h3>
        {current && (
          <span className="rounded-full bg-ink px-2 py-0.5 text-[0.72rem] font-medium text-paper">
            Current
          </span>
        )}
      </div>
      <div className="mt-3 text-[1.6rem] font-bold text-ink">
        ${price}
        <span className="text-[0.78rem] font-normal text-steel">/mo</span>
      </div>
      {!isFree && interval === "annual" && (
        <div className="mt-0.5 text-[0.74rem] text-steel">
          ${p.priceAnnual} billed yearly
        </div>
      )}
      <div className="mt-1 text-[0.78rem] text-steel">
        {p.feedbackPerMonth.toLocaleString()} a month
      </div>

      <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
        <li className="text-[0.78rem] text-steel">{p.scope}</li>
        {[...p.included, ...p.adds].map((f) => (
          <li
            key={f}
            className="flex gap-2 text-[0.78rem] leading-snug text-steel"
          >
            <Check className="mt-0.5 size-3 shrink-0 text-mint-deep" />
            {f}
          </li>
        ))}
      </ul>

      {!isFree && (
        <button
          type="button"
          disabled={!canChoose || changePlan.isPending}
          title={billingConfigured ? undefined : "Stripe isn't configured yet"}
          onClick={() => changePlan.mutate({ plan: p.id, interval })}
          className={cn(
            "mt-5 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg text-[0.82rem] font-semibold transition-colors",
            current
              ? "border border-line text-steel"
              : "bg-ink text-paper disabled:opacity-40",
          )}
        >
          {changePlan.isPending && <Loader2 className="size-3.5 animate-spin" />}
          {current ? "Current plan" : `Choose ${p.name}`}
        </button>
      )}
    </div>
  );
}

/** Opens Stripe's own hosted page for updating a card, past invoices, or cancelling. */
function ManageBillingLink() {
  const portal = api.billing.createPortalSession.useMutation({
    onSuccess: (result) => {
      window.location.href = result.url;
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <button
      type="button"
      disabled={portal.isPending}
      onClick={() => portal.mutate()}
      className="inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-steel transition-colors hover:text-ink disabled:opacity-50"
    >
      {portal.isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <ExternalLink className="size-3.5" />
      )}
      Manage billing
    </button>
  );
}
