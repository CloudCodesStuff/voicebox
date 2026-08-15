import { Check } from "lucide-react";

import { CtaButton } from "@/components/marketing/primitives";
import { plans, type PlanConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * One plan.
 *
 * Two decisions carry the card. The diff model: each tier lists only what it
 * adds over the one before it, so choosing is three short reads instead of
 * diffing twenty-two bullets (the full matrix lives on the pricing page).
 * And the volume meter: the product is priced on volume and nothing else,
 * the headline above the cards says so, so each card draws its position on
 * that one axis. Log scale, because 25 next to 15,000 on a linear bar is a
 * bar that reads as empty against two full ones.
 */

/** Position on the volume axis, log-scaled, 15k = full. */
function volumePct(n: number): number {
  const min = Math.log10(10);
  const max = Math.log10(15000);
  return Math.round(((Math.log10(n) - min) / (max - min)) * 100);
}

/** "$6.33" for $19 over 3,000 replies; the value line paid tiers earn. */
function perThousand(monthlyPrice: number, volume: number): string {
  return (monthlyPrice / (volume / 1000)).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function PlanCard({
  plan,
  annual = false,
  className,
}: {
  plan: PlanConfig;
  annual?: boolean;
  className?: string;
}) {
  const popular = "popular" in plan && plan.popular;
  const price = annual ? Math.round(plan.priceAnnual / 12) : plan.priceMonthly;
  const effectiveMonthly = annual ? plan.priceAnnual / 12 : plan.priceMonthly;

  const index = plans.findIndex((p) => p.id === plan.id);
  const previous = index > 0 ? plans[index - 1] : null;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-paper-2 p-6",
        // The popular card is the only one allowed elevation and the only
        // one that rises. One card up beats three cards shouting.
        popular
          ? "border-mint-line shadow-[0_24px_48px_-20px_rgba(0,0,0,0.55)] md:-translate-y-3"
          : "border-line",
        className,
      )}
    >
      {popular && (
        <span className="absolute -top-3 left-6 rounded-full border border-mint-line bg-mint-wash px-2.5 py-1 text-[0.68rem] font-semibold text-mint-deep">
          Most teams
        </span>
      )}

      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[1.05rem] font-bold tracking-tight text-ink">
          {plan.name}
        </h2>
      </div>
      <p className="mt-1 text-[0.82rem] text-steel">{plan.who}</p>

      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="tnum text-[2.4rem] leading-none font-bold tracking-tight text-ink">
          ${price}
        </span>
        <span className="text-[0.82rem] text-steel">
          {plan.priceMonthly === 0 ? "forever" : "/month"}
        </span>
      </div>
      <p className="tnum mt-1.5 min-h-[1.1rem] text-[0.76rem] text-steel">
        {plan.priceMonthly === 0
          ? "No card required"
          : annual
            ? `$${plan.priceAnnual} billed yearly`
            : `or $${Math.round(plan.priceAnnual / 12)}/month billed yearly`}
      </p>

      {/* The volume block: where this plan sits on the one axis you pay for. */}
      <div className="mt-5 rounded-xl bg-sunken/60 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="tnum text-[1.15rem] font-bold text-ink">
            {plan.feedbackPerMonth.toLocaleString("en-US")}
          </span>
          {plan.priceMonthly > 0 && (
            <span className="tnum text-[0.72rem] text-steel">
              {perThousand(effectiveMonthly, plan.feedbackPerMonth)} per 1,000
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[0.76rem] text-steel">
          pieces of feedback a month · {plan.scope.toLowerCase()}
        </p>
        <div
          className="mt-3 flex h-1 overflow-hidden rounded-full bg-line/60"
          role="img"
          aria-label={`${plan.feedbackPerMonth.toLocaleString("en-US")} pieces of feedback a month`}
        >
          <div
            className="rounded-full bg-mint"
            style={{ width: `${volumePct(plan.feedbackPerMonth)}%` }}
          />
        </div>
      </div>

      <ul className="mt-5 flex-1 space-y-2.5">
        {previous && (
          <li className="text-[0.78rem] font-medium tracking-[0.02em] text-steel">
            Everything in {previous.name}, plus
          </li>
        )}
        {[...plan.included, ...plan.adds].map((feature) => (
          <li
            key={feature}
            className="flex gap-2.5 text-[0.85rem] leading-snug text-ink"
          >
            <Check
              className="mt-0.5 size-3.5 shrink-0 text-mint-deep"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            {feature}
          </li>
        ))}
      </ul>

      <CtaButton
        href="/signin"
        variant={popular ? "accent" : "ghost"}
        className="mt-6 w-full"
      >
        {plan.priceMonthly === 0 ? "Start free" : `Choose ${plan.name}`}
      </CtaButton>
      <p className="mt-3 text-center text-[0.72rem] text-faint">
        {plan.priceMonthly === 0
          ? "Free plan, not a trial"
          : "Cancel any time, from the billing page"}
      </p>
    </div>
  );
}
