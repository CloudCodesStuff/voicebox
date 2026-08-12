"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { useRef, type ReactNode } from "react";

import { WidgetLivePreview } from "@/components/app/widget-live-preview";
import { defaultWidgetConfig } from "@/lib/widget-config";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* ---------------------------------------------------------------------------
   Marketing visuals
   ---------------------------------------------------------------------------
   Built from the same tokens as the product rather than exported as images:
   they stay truthful as the UI changes, stay sharp at any zoom, and cost
   nothing to load.
--------------------------------------------------------------------------- */

/**
 * The hero widget.
 *
 * This used to be a second, hand-maintained mockup, which promptly drifted out
 * of step with the real thing the moment the widget was redesigned. It now
 * renders the exact component the Widget Studio previews, fed the shipping
 * defaults, so the landing page cannot lie about what you get.
 */
export function WidgetPreview({
  className,
  accent,
  rating = 4,
}: {
  className?: string;
  accent?: string;
  rating?: number;
}) {
  return (
    <div className={className}>
      <WidgetLivePreview
        initialRating={rating}
        config={{
          ...defaultWidgetConfig,
          ...(accent ? { accentColor: accent } : {}),
          theme: "light",
        }}
      />
    </div>
  );
}

export function WidgetTrigger({
  className,
  accent,
}: {
  className?: string;
  accent?: string;
}) {
  return (
    <div className={className}>
      <WidgetLivePreview
        state="trigger"
        config={{
          ...defaultWidgetConfig,
          ...(accent ? { accentColor: accent } : {}),
          theme: "light",
        }}
      />
    </div>
  );
}

/* --------------------------------------------------------------------------
   Hero showcase: both sides of the product in one glance.

   The old hero showed only the widget, which is the half a visitor does not
   buy. Somebody landing cold reads "feedback form" and leaves. Putting the
   thing your users see next to the thing you see answers "what is this and
   what do I get" before anyone has to read a sentence.
-------------------------------------------------------------------------- */

export function HeroShowcase({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid items-start gap-8 lg:grid-cols-[minmax(0,340px)_auto_minmax(0,1fr)] lg:gap-6",
        className,
      )}
    >
      <figure className="m-0 flex flex-col items-center lg:items-start">
        <figcaption className="mb-3 flex items-center gap-2 text-[0.8rem] font-medium text-steel">
          <span className="size-1.5 rounded-full bg-line-strong" />
          What your users see
        </figcaption>
        <WidgetPreview />
      </figure>

      {/* Direction of travel. Rotates to point down once the grid stacks. */}
      <div
        aria-hidden="true"
        className="flex justify-center self-center lg:pt-9"
      >
        <svg
          width="34"
          height="34"
          viewBox="0 0 34 34"
          fill="none"
          className="rotate-90 text-mint lg:rotate-0"
        >
          <path
            d="M6 17h21m0 0-6.5-6.5M27 17l-6.5 6.5"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <figure className="m-0 min-w-0">
        <figcaption className="mb-3 flex items-center gap-2 text-[0.8rem] font-medium text-mint-deep">
          <span className="size-1.5 rounded-full bg-mint" />
          What you get back
        </figcaption>
        <InsightMock />
      </figure>
    </div>
  );
}

/* --------------------------------------------------------------------------
   The centrepiece: raw comments collapsing into named themes.
   Scroll-scrubbed, so the user performs the clustering by scrolling, which
   is a far better explanation of the product than any paragraph.
-------------------------------------------------------------------------- */

const RAW = [
  "csv export just spins forever",
  "can you add dark mode please",
  "export times out on big ranges",
  "love the new dashboard!",
  "downloading a year of data fails",
  "dark theme would be amazing",
  "billing page says I'm on Pro but I'm not",
  "export keeps failing at 6 months",
  "any plans for a dark mode?",
  "invoice didn't match my plan",
];

const THEMES = [
  {
    title: "CSV export times out on large ranges",
    count: 4,
    tone: "negative" as const,
  },
  { title: "Dark mode requested", count: 3, tone: "neutral" as const },
  { title: "Billing plan mismatch", count: 2, tone: "negative" as const },
];

export function ClusteringSequence({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const raws = el.querySelectorAll<HTMLElement>("[data-raw]");
        const themes = el.querySelectorAll<HTMLElement>("[data-theme]");
        const arrow = el.querySelector<HTMLElement>("[data-arrow]");

        gsap.set(themes, { opacity: 0, y: 14 });
        gsap.set(arrow, { opacity: 0 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top 72%",
            end: "bottom 55%",
            scrub: 0.7,
          },
        });

        // Raw comments compress and fade as themes resolve out of them.
        tl.to(raws, {
          opacity: 0.28,
          scale: 0.97,
          stagger: { each: 0.03, from: "random" },
          duration: 0.5,
        })
          .to(arrow, { opacity: 1, duration: 0.2 }, "<0.2")
          .to(
            themes,
            { opacity: 1, y: 0, stagger: 0.12, duration: 0.5 },
            "<0.1",
          );
      });

      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      className={cn(
        "grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]",
        className,
      )}
    >
      {/* Raw */}
      <div>
        <div className="mb-3 text-[0.78rem] text-steel">412 comments</div>
        <div className="flex flex-wrap gap-1.5">
          {RAW.map((r, i) => (
            <span
              key={i}
              data-raw
              className="rounded-md border border-line bg-paper-2 px-2.5 py-1.5 text-[11.5px] text-steel"
            >
              {r}
            </span>
          ))}
          <span className="rounded-md border border-dashed border-line px-2.5 py-1.5 text-[11.5px] text-steel">
            +402 more
          </span>
        </div>
      </div>

      <div
        data-arrow
        className="hidden justify-center lg:flex"
        aria-hidden="true"
      >
        <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
          <path
            d="M2 12h34m0 0-7-7m7 7-7 7"
            stroke="var(--mint)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Themes */}
      <div>
        <div className="mb-3 text-[0.78rem] text-steel">6 themes</div>
        <div className="space-y-2">
          {THEMES.map((t) => (
            <div
              key={t.title}
              data-theme
              className="rounded-xl border border-line bg-paper-2 p-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[13.5px] font-semibold leading-snug text-ink">
                  {t.title}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 tnum text-[10.5px] font-semibold",
                    t.tone === "negative"
                      ? "bg-negative-wash text-negative"
                      : "bg-neutral-wash text-neutral",
                  )}
                >
                  {t.count}
                </span>
              </div>
              <SentimentBar
                className="mt-2.5"
                negative={t.tone === "negative" ? 0.75 : 0.15}
                neutral={t.tone === "negative" ? 0.2 : 0.6}
                positive={t.tone === "negative" ? 0.05 : 0.25}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Three-segment proportional bar. The only place these colours appear. */
export function SentimentBar({
  positive,
  neutral,
  negative,
  className,
}: {
  positive: number;
  neutral: number;
  negative: number;
  className?: string;
}) {
  const total = positive + neutral + negative || 1;
  const pct = (n: number) => `${(n / total) * 100}%`;

  return (
    <div
      className={cn("flex h-1.5 overflow-hidden rounded-full bg-muted", className)}
      role="img"
      aria-label={`${Math.round((positive / total) * 100)}% positive, ${Math.round((neutral / total) * 100)}% neutral, ${Math.round((negative / total) * 100)}% negative`}
    >
      <div style={{ width: pct(positive) }} className="bg-positive" />
      <div style={{ width: pct(neutral) }} className="bg-neutral" />
      <div style={{ width: pct(negative) }} className="bg-negative" />
    </div>
  );
}

/** Dashboard mock for the insight section. */
export function InsightMock({ className }: { className?: string }) {
  const rows = [
    {
      title: "CSV export times out on large ranges",
      n: 34,
      neg: 0.82,
      trend: "up" as const,
      quote: "I tried exporting a year of data three times and it just dies.",
    },
    { title: "Dark mode requested", n: 27, neg: 0.1, trend: "up" as const },
    { title: "Onboarding is confusing", n: 19, neg: 0.68, trend: "down" as const },
    { title: "Slack integration wanted", n: 12, neg: 0.08, trend: "up" as const },
  ];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-paper-2 shadow-[0_24px_70px_-28px_rgba(12,12,14,0.3)]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <div className="text-[0.95rem] font-semibold tracking-tight text-ink">
            What to work on
          </div>
          <div className="mt-0.5 text-[0.78rem] text-steel">
            How many people, how unhappy, how recently
          </div>
        </div>
        <span className="rounded-full bg-mint-wash px-2.5 py-1 tnum text-[10.5px] font-semibold text-mint-deep">
          412 analyzed
        </span>
      </div>

      <div className="divide-y divide-line">
        {rows.map((r, i) => (
          <div key={r.title} className="flex items-center gap-4 px-5 py-3.5">
            <span className="tnum w-4 text-[11px] text-steel">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[0.875rem] font-medium text-ink">
                {r.title}
              </div>
              {r.quote && (
                <p className="mt-1 truncate text-[0.8rem] text-steel italic">
                  &ldquo;{r.quote}&rdquo;
                </p>
              )}
              <SentimentBar
                className="mt-2 max-w-[180px]"
                negative={r.neg}
                neutral={1 - r.neg - 0.05}
                positive={0.05}
              />
            </div>
            <div className="flex items-center gap-2">
              {r.trend === "up" ? (
                <TrendingUp className="size-3.5 text-negative" />
              ) : (
                <TrendingDown className="size-3.5 text-positive" />
              )}
              <span className="tnum text-[0.8rem] font-semibold text-ink">
                {r.n}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-line px-5 py-3">
        <span className="text-[0.8rem] text-steel">2 more themes</span>
        <span className="text-[0.8rem] font-medium text-mint-deep">
          Updated 4 minutes ago
        </span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Hero furniture
-------------------------------------------------------------------------- */

/** The counted claim under the hero CTAs. */
export function StatBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-line bg-paper-2 py-1.5 pr-4 pl-1.5",
        className,
      )}
    >
      <span className="grid size-6 place-items-center rounded-full bg-mint">
        <Sparkles className="size-3 text-mint-ink" strokeWidth={2.4} />
      </span>
      <span className="text-[0.82rem] font-medium text-ink">
        <span className="tnum">412</span> comments read,{" "}
        <span className="tnum">6</span> things to fix
      </span>
    </div>
  );
}

/**
 * A single submission, moments after it arrived.
 *
 * Floated near the hero so the page has one piece of evidence that the product
 * is a live thing rather than a diagram. It is the same shape as a real row in
 * the Inbox.
 */
export function ActivityCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-[300px] rounded-xl border border-line bg-paper p-3.5 shadow-[0_12px_32px_-14px_rgba(9,9,11,0.16)]",
        className,
      )}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2">
        <span className="size-1.5 shrink-0 rounded-full bg-negative" />
        <span className="text-[0.78rem] font-medium text-ink">
          New feedback
        </span>
        <span className="ml-auto text-[0.72rem] text-steel">2m ago</span>
      </div>
      <p className="mt-2 text-[0.82rem] leading-relaxed text-steel">
        &ldquo;Tried exporting a year of data three times, it just spins.&rdquo;
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {["Issue", "Negative", "CSV export"].map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-line px-2 py-0.5 text-[0.68rem] font-medium text-steel"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

/** The other end of the same story: that comment, now one of thirty-four. */
export function ThemeCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-[300px] rounded-xl border border-line bg-paper p-3.5 shadow-[0_12px_32px_-14px_rgba(9,9,11,0.16)]",
        className,
      )}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2">
        <span className="size-1.5 shrink-0 rounded-full bg-mint" />
        <span className="text-[0.78rem] font-medium text-ink">
          Theme updated
        </span>
        <span className="ml-auto text-[0.72rem] text-steel">just now</span>
      </div>
      <p className="mt-2 text-[0.86rem] font-semibold text-ink">
        CSV export times out on large ranges
      </p>
      <SentimentBar className="mt-2.5" negative={0.82} neutral={0.13} positive={0.05} />
      <div className="mt-2 flex items-center justify-between text-[0.72rem]">
        <span className="text-steel">
          <span className="tnum font-semibold text-ink">34</span> people
        </span>
        <span className="font-medium text-mint-deep">Now ranked #1</span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Solution visuals: three before/after pairs, one per claim.
-------------------------------------------------------------------------- */

function Pane({
  label,
  tone = "before",
  children,
}: {
  label: string;
  tone?: "before" | "after";
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div
        className={cn(
          "mb-2 text-[0.72rem] font-medium",
          tone === "after" ? "text-mint-deep" : "text-steel",
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "h-[152px] overflow-hidden rounded-xl border p-3",
          tone === "after"
            ? "border-mint-line bg-mint-wash/40"
            : "border-line bg-paper-2",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Where feedback lives now, versus one place. */
export function BeforeAfterCollect() {
  return (
    <div className="flex gap-4">
      <Pane label="Today">
        <div className="flex flex-wrap gap-1.5">
          {[
            "Support inbox",
            "Slack DMs",
            "App Store",
            "A Notion doc",
            "Twitter replies",
            "That one email",
            "Sales calls",
          ].map((s) => (
            <span
              key={s}
              className="rounded-md border border-line bg-paper px-2 py-1 text-[10.5px] text-steel"
            >
              {s}
            </span>
          ))}
        </div>
      </Pane>
      <Pane label={`With ${site.name}`} tone="after">
        <div className="flex h-full items-center justify-center">
          <WidgetLivePreview
            state="trigger"
            config={{ ...defaultWidgetConfig, theme: "light" }}
          />
        </div>
      </Pane>
    </div>
  );
}

/** Raw text versus scored text. */
export function BeforeAfterScore() {
  return (
    <div className="flex gap-4">
      <Pane label="What arrives">
        <p className="text-[11.5px] leading-relaxed text-steel">
          &ldquo;hey so i was trying to pull our numbers for the quarter and the
          export just sat there spinning for like ten minutes then nothing
          happened, tried again twice, same thing&rdquo;
        </p>
      </Pane>
      <Pane label="What you read" tone="after">
        <div>
          <p className="text-[11.5px] font-medium text-ink">
            Export hangs on quarterly ranges, then fails silently.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {["Issue", "Negative", "CSV export"].map((c) => (
              <span
                key={c}
                className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-medium text-steel"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </Pane>
    </div>
  );
}

/** A list versus a ranking. */
export function BeforeAfterRank() {
  return (
    <div className="flex gap-4">
      <Pane label="A list of 412">
        <div className="space-y-1.5">
          {RAW.slice(0, 6).map((r, i) => (
            <div
              key={i}
              className="truncate rounded border border-line bg-paper px-2 py-1 text-[10.5px] text-steel"
            >
              {r}
            </div>
          ))}
        </div>
      </Pane>
      <Pane label="Six things to fix" tone="after">
        <ol className="space-y-2">
          {THEMES.map((t, i) => (
            <li key={t.title} className="flex items-start gap-2">
              <span className="tnum text-[10.5px] text-steel">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-ink">
                {t.title}
              </span>
              <span className="tnum text-[10.5px] font-semibold text-mint-deep">
                {t.count * 8}
              </span>
            </li>
          ))}
        </ol>
      </Pane>
    </div>
  );
}

/** Install snippet block for the hero / docs teaser. */
export function InstallSnippet({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-slab",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-slab-fg/10 px-4 py-2.5">
        <span className="size-2 rounded-full bg-slab-fg/20" />
        <span className="size-2 rounded-full bg-slab-fg/20" />
        <span className="size-2 rounded-full bg-slab-fg/20" />
        <span className="ml-2 tnum text-[10.5px] text-slab-fg/40">
          index.html
        </span>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[12px] leading-relaxed text-slab-fg/80">
        <code>
          {`<script async
  src="https://usevoicebox.dev/widget.js"
  data-project="`}
          <span className="text-mint">pk_live_7Kx2…</span>
          {`"></script>`}
        </code>
      </pre>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Step visuals.

   "How it works" used to be three paragraphs. Three paragraphs is a
   description; a visitor forms a mental model from what a thing looks like.
   Each of these is a real fragment of the product at the moment that step
   happens, small enough to read in a glance.
-------------------------------------------------------------------------- */

function StepFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex h-[132px] items-center justify-center overflow-hidden rounded-xl border border-line bg-paper px-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Step 1: the one line you paste. */
export function StepInstall() {
  return (
    <StepFrame className="bg-slab">
      <pre className="w-full overflow-hidden font-mono text-[11px] leading-[1.9] text-slab-fg/80">
        <code>
          {`<script async\n  src="usevoicebox.dev/widget.js"\n  data-project="`}
          <span className="text-mint">pk_live_7Kx2…</span>
          {`"></script>`}
        </code>
      </pre>
    </StepFrame>
  );
}

/** Step 2: one submission, seconds after it lands. */
export function StepScored() {
  return (
    <StepFrame>
      <div className="w-full">
        <div className="flex items-center gap-2">
          <span className="size-2 shrink-0 rounded-full bg-negative" />
          <span className="text-[12.5px] font-medium text-ink">
            Export fails on big date ranges
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed text-steel">
          &ldquo;I tried exporting a year of data three times and it just spins
          then dies.&rdquo;
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {["Issue", "Negative", "Data export"].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-steel"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </StepFrame>
  );
}

/** Step 3: the same submission, now one of thirty-four. */
export function StepTheme() {
  return (
    <StepFrame>
      <div className="w-full rounded-lg border border-mint-line bg-mint-wash p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] font-semibold text-ink">
            CSV export times out
          </span>
          <span className="tnum shrink-0 rounded-full bg-paper px-2 py-0.5 text-[10.5px] font-semibold text-ink">
            34
          </span>
        </div>
        <SentimentBar className="mt-2.5" negative={0.82} neutral={0.13} positive={0.05} />
        <p className="mt-2 text-[10.5px] text-mint-deep">
          Now ranked #1, up from #4
        </p>
      </div>
    </StepFrame>
  );
}

export function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-[0.9rem] leading-relaxed text-steel">
      <Check className="mt-1 size-3.5 shrink-0 text-mint-deep" strokeWidth={2.5} />
      <span>{children}</span>
    </li>
  );
}
