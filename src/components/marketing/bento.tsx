"use client";

import { Bug, Check, Heart, HelpCircle, Lightbulb, Send } from "lucide-react";
import type { ReactNode } from "react";

import { WidgetLivePreview } from "@/components/app/widget-live-preview";
import { defaultWidgetConfig } from "@/lib/widget-config";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Feature bento

   Each card states a claim at the top and then shows the piece of product that
   makes it true underneath, faded out at the edge so it reads as a window into
   the app rather than a cropped screenshot.
--------------------------------------------------------------------------- */

export function BentoCard({
  title,
  body,
  children,
  className,
  visualClassName,
}: {
  title: string;
  body: string;
  children: ReactNode;
  className?: string;
  visualClassName?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl bg-paper-2 shadow-sm ring-1 shadow-black/40 ring-white/[0.07]",
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex flex-col gap-2 p-6">
          <h3 className="text-[0.95rem] font-semibold text-ink">{title}</h3>
          <p className="text-[0.875rem] leading-relaxed text-balance text-steel">
            {body}
          </p>
        </div>
        <div
          className={cn(
            "mt-auto flex flex-1 items-center justify-center overflow-hidden pt-4",
            visualClassName,
          )}
          aria-hidden="true"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** Dashed rule used to frame the inset skeletons, as on the reference. */
function DashedFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full">
      <span className="absolute inset-x-0 top-0 z-10 h-px bg-[repeating-linear-gradient(to_right,var(--line-strong)_0,var(--line-strong)_2px,transparent_2px,transparent_5px)]" />
      <span className="absolute inset-x-0 bottom-0 z-10 h-px bg-[repeating-linear-gradient(to_right,var(--line-strong)_0,var(--line-strong)_2px,transparent_2px,transparent_5px)]" />
      <span className="absolute inset-y-0 left-0 z-10 w-px bg-[repeating-linear-gradient(to_bottom,var(--line-strong)_0,var(--line-strong)_2px,transparent_2px,transparent_5px)]" />
      <span className="absolute inset-y-0 right-0 z-10 w-px bg-[repeating-linear-gradient(to_bottom,var(--line-strong)_0,var(--line-strong)_2px,transparent_2px,transparent_5px)]" />
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ skeletons */

/** The widget itself, shown at real fidelity because it is the thing you ship. */
export function WidgetSkeleton() {
  return (
    <div className="h-full w-full mask-b-from-55% px-6 pt-2">
      <DashedFrame>
        <div className="flex justify-center px-4 py-5">
          <div className="w-[240px] origin-top scale-[0.92]">
            <WidgetLivePreview
              initialRating={4}
              config={{ ...defaultWidgetConfig, theme: "light" }}
            />
          </div>
        </div>
      </DashedFrame>
    </div>
  );
}

/** One comment turning into a scored, categorised row. */
export function ScoringSkeleton() {
  return (
    <div className="w-full mask-b-from-70% px-6 pb-6">
      <div className="space-y-2.5">
        <div className="rounded-lg border border-line bg-paper-2 p-3">
          <p className="text-[11.5px] leading-relaxed text-steel">
            &ldquo;i was trying to pull our numbers for the quarter and the
            export just sat there spinning for ten minutes then nothing&rdquo;
          </p>
        </div>

        <div className="flex justify-center">
          <span className="rounded-full bg-mint-wash px-2 py-0.5 text-[8.5px] font-medium text-mint-deep">
            scored in 1.4s
          </span>
        </div>

        <div className="rounded-lg border border-mint-line bg-mint-wash/60 p-3">
          <p className="text-[11.5px] font-medium text-ink">
            Export hangs on quarterly ranges, then fails silently.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Issue", "Negative", "Data export"].map((c) => (
              <span
                key={c}
                className="rounded-full bg-paper px-2 py-0.5 text-[9px] font-medium text-steel"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Scattered comments collapsing into one named theme. */
export function ClusterSkeleton() {
  const raw = [
    "csv export just spins",
    "download keeps failing",
    "times out at 6 months",
    "export died again",
    "can't pull a year",
  ];

  return (
    <div className="w-full mask-b-from-75% px-6 pb-6">
      <div className="flex flex-wrap justify-center gap-1.5">
        {raw.map((r) => (
          <span
            key={r}
            className="rounded-md border border-line bg-paper-2 px-2 py-1 text-[9.5px] text-steel"
          >
            {r}
          </span>
        ))}
      </div>

      {/* Converging lines, drawn rather than animated: the shape is the point. */}
      <svg viewBox="0 0 200 26" className="mt-2 h-6 w-full text-line-strong">
        {[20, 60, 100, 140, 180].map((x) => (
          <path
            key={x}
            d={`M ${x} 0 C ${x} 14, 100 12, 100 26`}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2 3"
            fill="none"
          />
        ))}
      </svg>

      <div className="rounded-lg border border-mint-line bg-mint-wash/60 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11.5px] font-semibold text-ink">
            CSV export times out
          </span>
          <span className="tnum rounded-full bg-paper px-2 py-0.5 text-[9.5px] font-semibold text-ink">
            34
          </span>
        </div>
        <div className="mt-2 flex h-1 overflow-hidden rounded-full bg-paper">
          <div className="w-[18%] bg-neutral" />
          <div className="w-[82%] bg-negative" />
        </div>
        <p className="mt-2 text-[9.5px] text-mint-deep">
          Ranked #1, up from #4 last week
        </p>
      </div>
    </div>
  );
}

/** Type chips and the four positions, the two knobs people touch first. */
export function CustomiseSkeleton() {
  const swatches = ["#00C48C", "#09090B", "#5B4BFF", "#0EA5E9", "#D33C33"];
  const types = [
    { icon: Lightbulb, label: "Idea" },
    { icon: Bug, label: "Issue" },
    { icon: Heart, label: "Praise" },
    { icon: HelpCircle, label: "Question" },
  ];

  return (
    <div className="w-full mask-b-from-75% px-6 pb-6">
      <div className="space-y-3">
        <div>
          <div className="text-[9px] text-steel">Accent</div>
          <div className="mt-1.5 flex gap-1.5">
            {swatches.map((c, i) => (
              <span
                key={c}
                className={cn(
                  "size-6 rounded-md",
                  i === 0 && "ring-2 ring-mint-deep ring-offset-1",
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="text-[9px] text-steel">Types</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {types.map((t, i) => (
              <span
                key={t.label}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9.5px] font-medium",
                  i === 0
                    ? "border-transparent bg-mint text-mint-ink"
                    : "border-line text-steel",
                )}
              >
                <t.icon className="size-2.5" strokeWidth={2} />
                {t.label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex h-9 items-center justify-center rounded-md bg-mint text-[10px] font-medium text-mint-ink">
          <Send className="mr-1 size-2.5" strokeWidth={2} />
          Send feedback
        </div>
      </div>
    </div>
  );
}

/** The install line, because "one script tag" only lands when you see it. */
export function InstallSkeleton() {
  return (
    <div className="w-full mask-b-from-80% px-6 pb-6">
      <div className="overflow-hidden rounded-lg bg-slab p-4">
        <pre className="overflow-hidden font-mono text-[10.5px] leading-[1.9] text-slab-fg/80">
          <code>
            {`<script async\n  src="usevoicebox.dev/widget.js"\n  data-project="`}
            <span className="text-mint">pk_live_7Kx2…</span>
            {`"></script>`}
          </code>
        </pre>
      </div>
      <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[9.5px] text-mint-deep">
        <Check className="size-3" strokeWidth={3} />
        Connected, first feedback received
      </div>
    </div>
  );
}

/** Weekly digest, rendered as the email people actually get. */
export function DigestSkeleton() {
  return (
    <div className="w-full mask-b-from-70% px-6 pb-6">
      <div className="rounded-lg border border-line bg-paper-2 p-3.5">
        <div className="text-[8.5px] text-steel">Monday, 9:00</div>
        <div className="mt-1 text-[11.5px] font-semibold text-ink">
          412 new pieces this week
        </div>
        <div className="mt-2.5 space-y-1.5">
          {[
            ["CSV export times out", "34"],
            ["Dark mode requested", "27"],
            ["Onboarding is confusing", "19"],
          ].map(([t, n], i) => (
            <div key={t} className="flex items-center gap-2">
              <span className="tnum w-2 text-[8.5px] text-steel">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-[10px] text-ink">
                {t}
              </span>
              <span className="tnum text-[9.5px] font-semibold text-mint-deep">
                {n}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
