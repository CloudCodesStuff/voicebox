import { Check } from "lucide-react";

import { CtaButton } from "@/components/marketing/primitives";
import { plans, type PlanConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * One plan.
 *
 * The old card repeated every feature on all four tiers, so choosing meant
 * reading twenty-two bullets and diffing them in your head. This shows the
 * volume, the scope, and only what the tier adds over the one before it. The
 * full matrix still exists further down the pricing page for anyone who wants
 * to check a specific line.
 */
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

  const index = plans.findIndex((p) => p.id === plan.id);
  const previous = index > 0 ? plans[index - 1] : null;

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-paper-2 p-6",
        popular
          ? "border-ink shadow-[0_16px_44px_-22px_rgba(12,12,14,0.4)]"
          : "border-line",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[1.05rem] font-bold tracking-tight text-ink">
          {plan.name}
        </h3>
        {popular && (
          <span className="rounded-full bg-mint-wash px-2.5 py-1 text-[0.68rem] font-medium text-mint-deep">
            Most teams
          </span>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="tnum text-[2.1rem] font-bold tracking-tight text-ink">
          ${price}
        </span>
        <span className="text-[0.8rem] text-steel">/mo</span>
      </div>
      <p className="mt-1 text-[0.76rem] text-steel">
        {plan.priceMonthly === 0
          ? "Free forever"
          : annual
            ? `$${plan.priceAnnual} a year`
            : "Billed monthly"}
      </p>

      <div className="mt-5 border-t border-line pt-5">
        <p className="text-[0.9rem] font-semibold text-ink">{plan.volume}</p>
        <p className="mt-1 text-[0.82rem] text-steel">{plan.scope}</p>
      </div>

      <ul className="mt-4 flex-1 space-y-2">
        {previous && (
          <li className="text-[0.82rem] font-medium text-steel">
            Everything in {previous.name}, plus
          </li>
        )}
        {[...plan.included, ...plan.adds].map((feature) => (
          <li
            key={feature}
            className="flex gap-2 text-[0.84rem] leading-snug text-ink"
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
    </div>
  );
}
