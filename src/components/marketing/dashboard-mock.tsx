import {
  BarChart3,
  Inbox,
  Layers,
  LayoutGrid,
  RefreshCw,
  Settings,
  Sparkles,
} from "lucide-react";

import { BrandMark } from "@/components/marketing/brand";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   The product shot.

   Built from the same tokens as the real dashboard rather than exported as a
   PNG: it stays truthful when the UI changes, stays sharp at any zoom, and
   costs nothing to load. It is deliberately a close copy of /app so the hero
   is showing the thing you actually buy.
--------------------------------------------------------------------------- */

const NAV = [
  { icon: Sparkles, label: "Overview", active: true },
  { icon: Inbox, label: "Inbox" },
  { icon: Layers, label: "Themes" },
  { icon: BarChart3, label: "Trends" },
  { icon: LayoutGrid, label: "Widget" },
  { icon: Settings, label: "Settings" },
];

/**
 * Themes carry the same fields the real "What to work on" list shows: a count,
 * a representative quote, a full sentiment split, and a twelve-week sparkline.
 */
const THEMES = [
  {
    title: "CSV export times out on large ranges",
    n: 34,
    quote: "Export hangs on quarterly ranges, then fails silently.",
    s: { pos: 0.04, neu: 0.14, mix: 0.0, neg: 0.82 },
    spark: [2, 3, 3, 5, 6, 9, 8, 12, 14, 20, 24, 34],
  },
  {
    title: "Onboarding is confusing",
    n: 19,
    quote: "Signed up and stared at an empty screen with no idea what to do.",
    s: { pos: 0.11, neu: 0.21, mix: 0.0, neg: 0.68 },
    spark: [1, 2, 2, 3, 4, 4, 6, 8, 10, 13, 16, 19],
  },
  {
    title: "Dark mode requested",
    n: 27,
    quote: "Wants a dark theme for late-night sessions.",
    s: { pos: 0.62, neu: 0.3, mix: 0.0, neg: 0.08 },
    spark: [3, 4, 6, 6, 9, 11, 13, 15, 18, 22, 25, 27],
  },
];

/**
 * Twelve weeks of sentiment, stacked the way the real "Sentiment over time"
 * chart stacks it: positive, neutral, mixed, negative. Totals trend up and the
 * negative share hovers near the 34% headline, so the shot agrees with itself.
 */
const TREND: Array<{ pos: number; neu: number; mix: number; neg: number }> = [
  { pos: 9, neu: 6, mix: 1, neg: 6 },
  { pos: 11, neu: 8, mix: 1, neg: 8 },
  { pos: 10, neu: 7, mix: 2, neg: 6 },
  { pos: 14, neu: 9, mix: 2, neg: 9 },
  { pos: 12, neu: 8, mix: 2, neg: 8 },
  { pos: 17, neu: 11, mix: 3, neg: 10 },
  { pos: 16, neu: 10, mix: 2, neg: 10 },
  { pos: 20, neu: 13, mix: 3, neg: 13 },
  { pos: 19, neu: 12, mix: 3, neg: 11 },
  { pos: 24, neu: 15, mix: 4, neg: 15 },
  { pos: 22, neu: 14, mix: 3, neg: 14 },
  { pos: 27, neu: 17, mix: 4, neg: 16 },
];

/** Full sentiment bar, mirroring the app's SentimentBar segment order. */
function Bar({ s }: { s: { pos: number; neu: number; mix: number; neg: number } }) {
  const total = s.pos + s.neu + s.mix + s.neg || 1;
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="mt-1.5 flex h-1 max-w-[150px] overflow-hidden rounded-full bg-sunken">
      <div style={{ width: pct(s.pos) }} className="bg-positive" />
      <div style={{ width: pct(s.neu) }} className="bg-neutral" />
      <div style={{ width: pct(s.mix) }} className="bg-mixed" />
      <div style={{ width: pct(s.neg) }} className="bg-negative" />
    </div>
  );
}

/** A tiny line sparkline, same shape as the app's theme Sparkline. */
function MiniSpark({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const w = 56;
  const h = 18;
  const step = w / (data.length - 1);
  const pts = data
    .map((d, i) => `${i * step},${h - (d / max) * (h - 2) - 1}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="text-steel">
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Stacked sentiment area chart, a scaled copy of components/app/trend-chart.
 * Same series order and colour language, so the hero shows the chart the app
 * actually draws rather than a different one.
 */
function SentimentArea() {
  const W = 320;
  const H = 92;
  const plotH = H - 4;
  const max = Math.max(...TREND.map((d) => d.pos + d.neu + d.mix + d.neg), 1);
  const step = W / (TREND.length - 1);
  const x = (i: number) => i * step;
  const y = (v: number) => plotH - (v / max) * (plotH - 4);

  const series = [
    { key: "pos", color: "var(--positive)" },
    { key: "neu", color: "var(--neutral)" },
    { key: "mix", color: "var(--mixed)" },
    { key: "neg", color: "var(--negative)" },
  ] as const;

  const cumulative = TREND.map(() => 0);
  const areas = series.map((s) => {
    const top: string[] = [];
    const bottom: string[] = [];
    TREND.forEach((d, i) => {
      const base = cumulative[i]!;
      const value = base + d[s.key];
      top.push(`${x(i)},${y(value)}`);
      bottom.unshift(`${x(i)},${y(base)}`);
      cumulative[i] = value;
    });
    return { ...s, d: `M${top.join(" L")} L${bottom.join(" L")} Z` };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} preserveAspectRatio="none">
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
    </svg>
  );
}

const LEGEND = [
  { label: "Positive", color: "bg-positive" },
  { label: "Neutral", color: "bg-neutral" },
  { label: "Mixed", color: "bg-mixed" },
  { label: "Negative", color: "bg-negative" },
];

export function DashboardMock({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex h-full w-full bg-paper text-left", className)}
      aria-hidden="true"
    >
      {/* Sidebar */}
      <aside className="hidden w-[168px] shrink-0 flex-col border-r border-line bg-paper-2 p-3 sm:flex">
        <div className="flex items-center gap-1.5 px-1 py-1.5">
          <BrandMark className="text-mint-deep" size={14} />
          <span className="text-[12px] font-bold tracking-tight text-ink">
            {site.name}
          </span>
        </div>

        <div className="mt-3 rounded-md border border-line px-2 py-1.5">
          <div className="text-[8px] text-steel">Project</div>
          <div className="text-[10px] font-medium text-ink">Acme Web App</div>
        </div>

        <nav className="mt-3 space-y-0.5">
          {NAV.map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-medium",
                item.active ? "bg-sunken text-ink" : "text-steel",
              )}
            >
              <item.icon className="size-2.5" strokeWidth={2} />
              {item.label}
            </div>
          ))}
        </nav>

        <div className="mt-auto rounded-md border border-line p-2">
          <div className="flex items-center justify-between text-[8px] text-steel">
            <span>Pro plan</span>
            <span className="tnum">412/3,000</span>
          </div>
          <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-sunken">
            <div className="h-full w-[14%] rounded-full bg-mint" />
          </div>
        </div>
      </aside>

      {/* Main. Stacked exactly like the real /app overview: header, stat row,
          "What to work on", then "Sentiment over time". */}
      <div className="min-w-0 flex-1 overflow-hidden p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[15px] font-bold tracking-tight text-ink">
              Overview
            </div>
            <div className="mt-0.5 text-[8.5px] leading-snug text-steel">
              What your users are telling you, and what to do about it first.
            </div>
            <div className="mt-1 text-[8px] font-medium tracking-wide text-faint uppercase">
              Acme Web App · last 30 days
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-0.5 rounded-md border border-line p-0.5 sm:flex">
            {["7d", "30d", "90d"].map((r) => (
              <span
                key={r}
                className={cn(
                  "rounded px-2 py-1 text-[9px] font-medium",
                  r === "30d" ? "bg-ink text-paper" : "text-steel",
                )}
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {[
            {
              label: "Feedback · 30d",
              value: "412",
              hint: <span className="text-positive">+38% vs previous 30d</span>,
            },
            { label: "Negative share", value: "34%", hint: "140 of 412 analyzed" },
            { label: "All time", value: "1,284", hint: "All analyzed" },
            { label: "Themes", value: "6", hint: "Ranked by priority" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-line bg-paper-2 p-2.5">
              <div className="text-[7.5px] font-medium tracking-wide text-faint uppercase">
                {s.label}
              </div>
              <div className="tnum mt-1.5 text-[18px] leading-none font-bold tracking-tight text-ink">
                {s.value}
              </div>
              <div className="mt-1.5 text-[7.5px] text-steel">{s.hint}</div>
            </div>
          ))}
        </div>

        {/* What to work on */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold tracking-tight text-ink">
              What to work on
            </div>
            <div className="mt-0.5 text-[8px] text-steel">
              How many people, how unhappy, and how recently
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[8.5px] font-medium text-steel">
            <RefreshCw className="size-2.5" strokeWidth={2} />
            Regroup now
          </span>
        </div>

        <div className="mt-2 space-y-1.5">
          {THEMES.map((t, i) => (
            <div
              key={t.title}
              className="flex items-center gap-2.5 rounded-lg border border-line bg-paper-2 px-2.5 py-2"
            >
              <span className="tnum w-2 shrink-0 text-[8px] text-steel">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[10px] font-semibold text-ink">
                    {t.title}
                  </span>
                  <span className="tnum shrink-0 rounded-full bg-sunken px-1.5 py-px text-[7.5px] text-steel">
                    {t.n}
                  </span>
                </div>
                <div className="truncate text-[8.5px] text-steel italic">
                  &ldquo;{t.quote}&rdquo;
                </div>
                <Bar s={t.s} />
              </div>
              <div className="hidden shrink-0 sm:block">
                <MiniSpark data={t.spark} />
              </div>
            </div>
          ))}
        </div>

        {/* Sentiment over time */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-[11px] font-bold tracking-tight text-ink">
            Sentiment over time
          </div>
          <div className="hidden items-center gap-2.5 sm:flex">
            {LEGEND.map((l) => (
              <span key={l.label} className="flex items-center gap-1">
                <span className={cn("size-1.5 rounded-full", l.color)} />
                <span className="text-[7.5px] text-steel">{l.label}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="mt-2 rounded-lg border border-line bg-paper-2 p-2.5">
          <SentimentArea />
          <div className="mt-1 flex justify-between text-[7px] text-steel">
            <span>12 weeks ago</span>
            <span>This week</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Browser chrome. Traffic lights, a domain, and nothing else. */
export function BrowserFrame({
  url = "app.usevoicebox.dev",
  children,
  className,
  aspect = "aspect-[16/10]",
}: {
  url?: string;
  children: React.ReactNode;
  className?: string;
  /** Tailwind aspect class for the viewport; the hero video is 16:9. */
  aspect?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-line/70 bg-paper/70 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-line/60 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-[#FF5F57]" />
          <span className="size-3 rounded-full bg-[#FEBC2E]" />
          <span className="size-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-[11px] text-steel">{url}</span>
        </div>
        <div className="w-12" />
      </div>
      <div className={cn("relative w-full", aspect)}>{children}</div>
    </div>
  );
}
