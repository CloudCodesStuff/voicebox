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

  const rawMax = Math.max(...data.map((d) => d.total), 1);
  // Round the ceiling to something a person would pick, so the gridlines land
  // on readable numbers instead of 7.3333.
  const max = niceCeiling(rawMax);
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

  /**
   * Painted largest-first from the baseline, rather than as stacked ribbons.
   *
   * Each band is the running total up to and including its own series, drawn
   * down to the axis, so the next (smaller) band paints over it and the visible
   * slices come out identical to a stack. Every path then closes on a straight
   * baseline, which is what makes curved tops possible at all: a ribbon would
   * need its lower edge reversed, and reversing a bezier is where this kind of
   * chart usually gives up and goes back to straight lines.
   */
  const cumulative = data.map(() => 0);
  const bands = series.map((s) => {
    const points = data.map((d, i) => {
      const value = cumulative[i]! + d[s.key];
      cumulative[i] = value;
      return { x: x(i), y: y(value) };
    });
    return { ...s, points };
  });

  const active = hover != null ? data[hover] : null;
  const gridLines = [0.25, 0.5, 0.75];

  return (
    <div className={cn("relative", className)}>
      <div className="flex">
        {/* An axis, because "is that peak five or fifty" was unanswerable. */}
        <div
          className="relative mr-2 w-7 shrink-0 tabular-nums"
          style={{ height: plotH }}
          aria-hidden="true"
        >
          <span className="absolute top-0 right-0 -translate-y-1/2 text-[0.68rem] text-faint">
            {max}
          </span>
          <span className="absolute right-0 bottom-0 translate-y-1/2 text-[0.68rem] text-faint">
            0
          </span>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="min-w-0 flex-1"
          style={{ height }}
          preserveAspectRatio="none"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            setHover(
              Math.max(
                0,
                Math.min(data.length - 1, Math.round(ratio * (data.length - 1))),
              ),
            );
          }}
        >
          {gridLines.map((f) => (
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

          {/* Largest band first; each one overpaints the last. */}
          {[...bands].reverse().map((b) => (
            <path
              key={b.key}
              d={`${smoothPath(b.points)} L${W},${plotH} L0,${plotH} Z`}
              fill={b.color}
              opacity={0.92}
            />
          ))}

          {/* A hairline along each band's own edge. Without it, adjacent fills
              of similar weight blur into one shape. */}
          {[...bands].reverse().map((b) => (
            <path
              key={`${b.key}-edge`}
              d={smoothPath(b.points)}
              fill="none"
              stroke={b.color}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
            />
          ))}

          <line
            x1={0}
            x2={W}
            y1={plotH}
            y2={plotH}
            stroke="var(--line-strong)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />

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
      </div>

      <div className="tnum mt-1 flex justify-between pl-9 text-[0.72rem] text-steel">
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

/** A ceiling a person would choose: 1, 2, 5, 10, 20, 50, 100 and so on. */
function niceCeiling(n: number): number {
  if (n <= 5) return Math.max(1, Math.ceil(n));
  const magnitude = 10 ** Math.floor(Math.log10(n));
  for (const m of [1, 2, 2.5, 5, 10]) {
    const candidate = m * magnitude;
    if (n <= candidate) return Math.round(candidate);
  }
  return Math.round(10 * magnitude);
}

/**
 * Monotone cubic interpolation (Fritsch–Carlson), as an SVG path.
 *
 * Daily counts are spiky and mostly small, and drawing them as straight
 * segments turned a month of feedback into a row of triangles. Ordinary spline
 * smoothing is not an option here: it overshoots between points, so a curve
 * between two low days can bulge below zero and draw feedback that never
 * arrived. This variant clamps the tangents so the curve can never leave the
 * range of the values it connects, which means it is smooth and still honest.
 */
function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length < 3) {
    return `M${points.map((p) => `${p.x},${p.y}`).join(" L")}`;
  }

  const n = points.length;
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1]!.x - points[i]!.x;
    slopes.push(dx === 0 ? 0 : (points[i + 1]!.y - points[i]!.y) / dx);
  }

  // Tangents start as the average of the neighbouring slopes.
  const tangents: number[] = [slopes[0]!];
  for (let i = 1; i < n - 1; i++) {
    const a = slopes[i - 1]!;
    const b = slopes[i]!;
    tangents.push(a * b <= 0 ? 0 : (a + b) / 2);
  }
  tangents.push(slopes[n - 2]!);

  // Then get clamped wherever they would overshoot the segment they span.
  for (let i = 0; i < n - 1; i++) {
    const slope = slopes[i]!;
    if (slope === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const alpha = tangents[i]! / slope;
    const beta = tangents[i + 1]! / slope;
    const magnitude = alpha * alpha + beta * beta;
    if (magnitude > 9) {
      const tau = 3 / Math.sqrt(magnitude);
      tangents[i] = tau * alpha * slope;
      tangents[i + 1] = tau * beta * slope;
    }
  }

  let d = `M${points[0]!.x},${points[0]!.y}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    const dx = (p1.x - p0.x) / 3;
    d +=
      ` C${p0.x + dx},${p0.y + tangents[i]! * dx}` +
      ` ${p1.x - dx},${p1.y - tangents[i + 1]! * dx}` +
      ` ${p1.x},${p1.y}`;
  }
  return d;
}

function formatDay(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
