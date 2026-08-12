"use client";

import { Check, Minus } from "lucide-react";
import { useState } from "react";

import { PlanCard } from "@/components/marketing/plan-card";
import { plans } from "@/lib/site";
import { cn } from "@/lib/utils";

const comparison: Array<{ label: string; values: Array<string | boolean> }> = [
  { label: "Feedback per month", values: ["50", "3,000", "15,000"] },
  { label: "Projects", values: ["1", "10", "Unlimited"] },
  { label: "Team seats", values: ["1", "10", "Unlimited"] },
  { label: "The widget, fully customizable", values: [true, true, true] },
  { label: "Shadow DOM isolation", values: [true, true, true] },
  { label: "Domain allowlist", values: [true, true, true] },
  { label: "Sentiment on every submission", values: [true, true, true] },
  { label: "AI themes", values: [true, true, true] },
  { label: "Priority ranking", values: [true, true, true] },
  { label: "Trends and CSV export", values: [true, true, true] },
  { label: "Weekly digest email", values: [false, true, true] },
  { label: "Remove Voicebox branding", values: [false, true, true] },
  { label: "API access and webhooks", values: [false, true, true] },
  { label: "Priority support", values: [false, false, true] },
];

export function PricingTable() {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      <div className="flex justify-center">
        <div
          role="radiogroup"
          aria-label="Billing period"
          className="inline-flex items-center gap-1 rounded-xl border border-line bg-paper-2 p-1"
        >
          {(
            [
              { key: false, label: "Monthly" },
              { key: true, label: "Annual" },
            ] as const
          ).map((opt) => (
            <button
              key={String(opt.key)}
              type="button"
              role="radio"
              aria-checked={annual === opt.key}
              onClick={() => setAnnual(opt.key)}
              className={cn(
                "rounded-lg px-5 py-2.5 text-[0.86rem] font-semibold transition-colors",
                annual === opt.key
                  ? "bg-ink text-paper"
                  : "text-steel hover:text-ink",
              )}
            >
              {opt.label}
              {opt.key && (
                <span
                  className={cn(
                    "ml-2 text-[0.72rem] font-medium",
                    annual ? "text-mint-deep" : "text-steel",
                  )}
                >
                  2 months free
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-10 grid w-full max-w-4xl gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} annual={annual} />
        ))}
      </div>

      <div className="mt-20">
        <h2 className="text-[1.5rem] font-bold tracking-tight text-ink">
          Every line, side by side
        </h2>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-paper-2">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="px-5 py-4 text-[0.78rem] font-medium text-steel">
                  Feature
                </th>
                {plans.map((p) => (
                  <th
                    key={p.id}
                    className="px-5 py-4 text-center text-[0.92rem] font-bold tracking-tight text-ink"
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.label} className="border-b border-line last:border-0">
                  <td className="px-5 py-3.5 text-[0.86rem] text-ink">
                    {row.label}
                  </td>
                  {row.values.map((v, i) => (
                    <td key={i} className="px-5 py-3.5 text-center">
                      {typeof v === "boolean" ? (
                        v ? (
                          <Check
                            className="mx-auto size-4 text-mint-deep"
                            aria-label="Included"
                          />
                        ) : (
                          <Minus
                            className="mx-auto size-4 text-line-strong"
                            aria-label="Not included"
                          />
                        )
                      ) : (
                        <span className="tnum text-[0.86rem] font-medium text-ink">
                          {v}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
