"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export type TrendPoint = {
  date: string;
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  mixed: number;
};

/**
 * Stacked area chart, hand-rolled in SVG.
 *
 * A charting library would add ~50KB for one chart shape, and the thing we
 * actually need, sentiment stacked in a fixed order with a shared colour
 * language, is about forty lines of path maths. Hover is handled with a
 * single overlay rather than per-point listeners so it stays smooth at 365
 * points.
 */
export function TrendChart({
  data,
  height = 200,
  className,
}: {
  data: TrendPoint[];
  height?: number;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-dashed border-line text-[0.85rem] text-steel",
          className,
        )}
        style={{ height }}
      >
        No data in this range yet.
      </div>
    );
  }

  const W = 720;
  const H = height;
  const PAD_B = 22;
  const plotH = H - PAD_B;

  const max = Math.max(...data.map((d) => d.total), 1);
  const step = data.length > 1 ? W / (data.length - 1) : W;
  const x = (i: number) => i * step;
  const y = (v: number) => plotH - (v / max) * (plotH - 6);

  // Stack order matches the legend and every other sentiment surface.
  const series = [
    { key: "positive" as const, color: "var(--positive)" },
    { key: "neutral" as const, color: "var(--neutral)" },
    { key: "mixed" as const, color: "var(--mixed)" },
    { key: "negative" as const, color: "var(--negative)" },
  ];

  const cumulative = data.map(() => 0);
  const areas = series.map((s) => {
    const top: string[] = [];
    const bottom: string[] = [];

    data.forEach((d, i) => {
      const base = cumulative[i]!;
      const value = base + d[s.key];
      top.push(`${x(i)},${y(value)}`);
      bottom.unshift(`${x(i)},${y(base)}`);
      cumulative[i] = value;
    });

    return { ...s, d: `M${top.join(" L")} L${bottom.join(" L")} Z` };
  });

  const active = hover != null ? data[hover] : null;

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          setHover(
            Math.max(0, Math.min(data.length - 1, Math.round(ratio * (data.length - 1)))),
          );
        }}
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={W}
            y1={plotH * f}
            y2={plotH * f}
            stroke="var(--line)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {areas.map((a) => (
          <path key={a.key} d={a.d} fill={a.color} opacity={0.85} />
        ))}

        {hover != null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={0}
            y2={plotH}
            stroke="var(--ink)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            opacity={0.35}
          />
        )}
      </svg>

      <div className="mt-1 flex justify-between tnum text-[0.72rem] text-steel">
        <span>{formatDay(data[0]!.date)}</span>
        <span>{formatDay(data[data.length - 1]!.date)}</span>
      </div>

      {active && (
        <div className="pointer-events-none absolute top-2 left-2 rounded-lg border border-line bg-paper-2 px-3 py-2 shadow-sm">
          <div className="tnum text-[0.75rem] text-steel">
            {formatDay(active.date)}
          </div>
          <div className="mt-1 text-[1rem] font-bold text-ink">
            {active.total} {active.total === 1 ? "item" : "items"}
          </div>
          <div className="mt-1.5 flex gap-2.5 tnum text-[0.72rem]">
            <span className="text-positive">{active.positive}+</span>
            <span className="text-neutral">{active.neutral}=</span>
            <span className="text-negative">{active.negative}−</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function SentimentLegend({ className }: { className?: string }) {
  const items = [
    { label: "Positive", color: "bg-positive" },
    { label: "Neutral", color: "bg-neutral" },
    { label: "Mixed", color: "bg-mixed" },
    { label: "Negative", color: "bg-negative" },
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", i.color)} />
          <span className="text-[0.75rem] text-steel">{i.label}</span>
        </span>
      ))}
    </div>
  );
}

function formatDay(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
