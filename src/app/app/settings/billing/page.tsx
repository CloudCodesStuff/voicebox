"use client";

import { Check } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { plans } from "@/lib/site";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";

export default function BillingSettings() {
  const org = api.org.current.useQuery();

  if (org.isLoading || !org.data) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  const { usage, subscription } = org.data;
  const billingConfigured = false; // Stripe keys aren't wired yet.

  return (
    <div className="space-y-6">
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
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {plans.map((p) => {
            const current = p.id === usage.plan;
            return (
              <div
                key={p.id}
                className={cn(
                  "rounded-xl border bg-paper-2 p-5",
                  current ? "border-ink" : "border-line",
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[0.92rem] font-semibold text-ink">
                    {p.name}
                  </h3>
                  {current && (
                    <span className="rounded-full bg-ink px-2 py-0.5 text-[0.72rem] font-medium text-paper">
                      Current
                    </span>
                  )}
                </div>
                <div className="mt-3 text-[1.6rem] font-bold text-ink">
                  ${p.priceMonthly}
                  <span className="text-[0.78rem] font-normal text-steel">/mo</span>
                </div>
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

                <button
                  type="button"
                  disabled={current || !billingConfigured}
                  title={
                    billingConfigured ? undefined : "Stripe isn't configured yet"
                  }
                  className={cn(
                    "mt-5 min-h-9 w-full rounded-lg text-[0.82rem] font-semibold transition-colors",
                    current
                      ? "border border-line text-steel"
                      : "bg-ink text-paper disabled:opacity-40",
                  )}
                >
                  {current ? "Current plan" : `Choose ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>

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
