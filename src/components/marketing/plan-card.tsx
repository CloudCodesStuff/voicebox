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
 *
 * The card is a hairline-gradient frame around a near-black face; the popular
 * one is lit from the top in mint, the others are not lit at all.
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
        "relative rounded-[22px] p-px",
        popular
          ? "bg-[linear-gradient(180deg,rgba(0,229,160,0.55),rgba(0,229,160,0.08)_38%,rgba(255,255,255,0.05))] shadow-[0_30px_80px_-40px_rgba(0,229,160,0.5)] md:-translate-y-3"
          : "bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))]",
        className,
      )}
    >
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-[21px] bg-[#09090B] p-6 sm:p-7"
        style={
          popular
            ? {
                backgroundImage:
                  "radial-gradient(120% 55% at 50% 0%, rgba(0,229,160,0.12), transparent 70%)",
              }
            : undefined
        }
      >
        {popular && (
          <span className="absolute right-5 top-5 rounded-full border border-mint/30 bg-mint/10 px-2.5 py-1 font-mono text-[11px] text-mint">
            Most teams
          </span>
        )}

        <h2 className="display text-[22px] leading-none tracking-[-0.03em] text-ink">{plan.name}</h2>
        <p className="mt-2 text-[14px] font-light text-steel">{plan.who}</p>

        <div className="mt-7 flex items-baseline gap-2">
          <span className="display tnum text-[56px] leading-none tracking-[-0.05em] text-ink">
            ${price}
          </span>
          <span className="text-[14px] text-faint">{plan.priceMonthly === 0 ? "forever" : "a month"}</span>
        </div>
        <p className="tnum mt-2 min-h-[1.2rem] text-[13px] text-faint">
          {plan.priceMonthly === 0
            ? "No card required"
            : annual
              ? `$${plan.priceAnnual} billed yearly`
              : `or $${Math.round(plan.priceAnnual / 12)} a month billed yearly`}
        </p>

        {/* The volume block: where this plan sits on the one axis you pay for. */}
        <div className="mt-6 rounded-[14px] bg-[linear-gradient(180deg,rgba(0,0,0,0.45),rgba(255,255,255,0.03))] p-4 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.07)]">
          <div className="flex items-baseline justify-between gap-2">
            <span className="display tnum text-[24px] leading-none tracking-[-0.03em] text-ink">
              {plan.feedbackPerMonth.toLocaleString("en-US")}
            </span>
            {plan.priceMonthly > 0 && (
              <span className="tnum font-mono text-[11.5px] text-faint">
                {perThousand(effectiveMonthly, plan.feedbackPerMonth)} per 1,000
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[12.5px] text-faint">
            replies a month · {plan.scope.toLowerCase()}
          </p>
          <div
            className="mt-3.5 flex h-1.5 overflow-hidden rounded-full bg-white/[0.07]"
            role="img"
            aria-label={`${plan.feedbackPerMonth.toLocaleString("en-US")} pieces of feedback a month`}
          >
            <div
              className="rounded-full bg-[linear-gradient(180deg,#8FF5D2,#0FB985)] shadow-[0_0_12px_rgba(0,229,160,0.5)]"
              style={{ width: `${volumePct(plan.feedbackPerMonth)}%` }}
            />
          </div>
        </div>

        <ul className="mt-6 flex-1 space-y-2.5">
          {previous && <li className="text-[13px] text-faint">Everything in {previous.name}, plus</li>}
          {[...plan.included, ...plan.adds].map((feature) => (
            <li key={feature} className="flex gap-2.5 text-[14.5px] leading-snug text-ink/90">
              <Check className="mt-0.5 size-4 shrink-0 text-mint" strokeWidth={2.5} aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>

        <CtaButton href="/signin" variant={popular ? "accent" : "ghost"} className="mt-7 w-full">
          {plan.priceMonthly === 0 ? "Start free" : `Choose ${plan.name}`}
        </CtaButton>
        <p className="mt-3 text-center text-[12px] text-faint">
          {plan.priceMonthly === 0 ? "Free plan, not a trial" : "Cancel any time, from the billing page"}
        </p>
      </div>
    </div>
  );
}
