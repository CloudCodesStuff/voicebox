import { BarChart3, Inbox, Layers, LayoutGrid, Settings, Sparkles } from "lucide-react";

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

const THEMES = [
  { title: "CSV export times out on large ranges", n: 34, neg: 0.82, up: true },
  { title: "Dark mode requested", n: 27, neg: 0.08, up: true },
  { title: "Onboarding is confusing", n: 19, neg: 0.68, up: false },
  { title: "Slack integration wanted", n: 12, neg: 0.05, up: true },
  { title: "Billing plan mismatch", n: 9, neg: 0.74, up: false },
];

/** Twelve-week volume, hand-tuned to look like real data rather than a curve. */
const TREND = [12, 18, 15, 24, 21, 30, 27, 38, 34, 46, 41, 52];

const LATEST: Array<{ text: string; tone: "neg" | "pos" | "mid"; when: string }> = [
  { text: "Export hangs on quarterly ranges, then fails silently.", tone: "neg", when: "2m" },
  { text: "Wants a dark theme for late-night sessions.", tone: "mid", when: "14m" },
  { text: "New dashboard is a big improvement over the old one.", tone: "pos", when: "38m" },
  { text: "Invoice total didn't match the plan they're on.", tone: "neg", when: "1h" },
  { text: "Asking whether there's a Slack integration.", tone: "mid", when: "2h" },
];

function Bar({ neg }: { neg: number }) {
  return (
    <div className="flex h-1 overflow-hidden rounded-full bg-sunken">
      <div style={{ width: `${(1 - neg) * 100}%` }} className="bg-neutral" />
      <div style={{ width: `${neg * 100}%` }} className="bg-negative" />
    </div>
  );
}

export function DashboardMock({ className }: { className?: string }) {
  const max = Math.max(...TREND);

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

      {/* Main */}
      <div className="min-w-0 flex-1 overflow-hidden p-4 sm:p-5">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[15px] font-bold tracking-tight text-ink">
              Overview
            </div>
            <div className="mt-0.5 text-[9px] text-steel">
              Acme Web App, last 30 days
            </div>
          </div>
          <div className="hidden items-center gap-0.5 rounded-md border border-line p-0.5 sm:flex">
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
            { label: "Feedback, 30d", value: "412", hint: "+38% vs previous" },
            { label: "Negative share", value: "34%", hint: "140 of 412" },
            { label: "All time", value: "1,284", hint: "All analyzed" },
            { label: "Themes", value: "6", hint: "Ranked by priority" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-line bg-paper-2 p-2.5">
              <div className="text-[8px] text-steel">{s.label}</div>
              <div className="tnum mt-1 text-[17px] leading-none font-bold tracking-tight text-ink">
                {s.value}
              </div>
              <div className="mt-1 text-[7.5px] text-steel">{s.hint}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.35fr_1fr]">
          {/* What to work on */}
          <div>
            <div className="flex items-baseline justify-between">
              <div className="text-[11px] font-bold tracking-tight text-ink">
                What to work on
              </div>
              <div className="text-[8px] text-steel">
                How many, how unhappy, how recent
              </div>
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
                    <div className="truncate text-[10px] font-medium text-ink">
                      {t.title}
                    </div>
                    <Bar neg={t.neg} />
                  </div>
                  <span
                    className={cn(
                      "tnum shrink-0 text-[10px] font-semibold",
                      t.up ? "text-negative" : "text-mint-deep",
                    )}
                  >
                    {t.n}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Trend */}
          <div>
            <div className="text-[11px] font-bold tracking-tight text-ink">
              Volume over time
            </div>
            <div className="mt-2 rounded-lg border border-line bg-paper-2 p-3">
              <div className="flex h-[86px] items-end gap-[3px]">
                {TREND.map((v, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 rounded-t-[2px]",
                      i >= TREND.length - 3 ? "bg-mint" : "bg-line-strong",
                    )}
                    style={{ height: `${(v / max) * 100}%` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[7.5px] text-steel">
                <span>12 weeks ago</span>
                <span>This week</span>
              </div>
            </div>

            <div className="mt-2 rounded-lg border border-mint-line bg-mint-wash p-2.5">
              <div className="text-[9px] font-semibold text-ink">
                Newest theme
              </div>
              <div className="mt-0.5 text-[9px] leading-snug text-steel">
                Six people hit the same export timeout this week.
              </div>
            </div>
          </div>
        </div>

        {/* Latest feedback. Fills the frame the way the real page does, and
            shows the raw material the themes above were made from. */}
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <div className="text-[11px] font-bold tracking-tight text-ink">
              Latest feedback
            </div>
            <div className="text-[8px] text-steel">View all</div>
          </div>

          <div className="mt-2 divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper-2">
            {LATEST.map((f) => (
              <div key={f.text} className="flex items-center gap-2 px-2.5 py-[7px]">
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    f.tone === "neg"
                      ? "bg-negative"
                      : f.tone === "pos"
                        ? "bg-positive"
                        : "bg-neutral",
                  )}
                />
                <span className="min-w-0 flex-1 truncate text-[9.5px] text-ink">
                  {f.text}
                </span>
                <span className="tnum shrink-0 text-[8px] text-steel">
                  {f.when}
                </span>
              </div>
            ))}
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
}: {
  url?: string;
  children: React.ReactNode;
  className?: string;
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
      <div className="relative aspect-[16/10] w-full">{children}</div>
    </div>
  );
}
