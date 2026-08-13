import type { Sentiment } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import { Bug, Heart, HelpCircle, Lightbulb, MessageSquare } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* Shared dashboard primitives. Sentiment colour lives here and nowhere else,
   so it always means the same thing across every screen. */

const sentimentStyles: Record<Sentiment, { label: string; className: string }> = {
  POSITIVE: { label: "Positive", className: "bg-positive-wash text-positive" },
  NEUTRAL: { label: "Neutral", className: "bg-neutral-wash text-neutral" },
  NEGATIVE: { label: "Negative", className: "bg-negative-wash text-negative" },
  MIXED: { label: "Mixed", className: "bg-mixed-wash text-mixed" },
};

export function SentimentBadge({
  sentiment,
  className,
}: {
  sentiment: Sentiment | null;
  className?: string;
}) {
  if (!sentiment) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-sunken px-2 py-0.5 text-[0.72rem] font-medium text-steel",
          className,
        )}
        title="Waiting for analysis"
      >
        Pending
      </span>
    );
  }

  const s = sentimentStyles[sentiment];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.72rem] font-semibold",
        s.className,
        className,
      )}
    >
      {s.label}
    </span>
  );
}

export function SentimentDot({
  sentiment,
  className,
}: {
  sentiment: Sentiment | null;
  className?: string;
}) {
  const color =
    sentiment === "POSITIVE"
      ? "bg-positive"
      : sentiment === "NEGATIVE"
        ? "bg-negative"
        : sentiment === "MIXED"
          ? "bg-mixed"
          : sentiment === "NEUTRAL"
            ? "bg-neutral"
            : "bg-line";

  return (
    <span
      className={cn("size-2 shrink-0 rounded-full", color, className)}
      aria-hidden="true"
    />
  );
}

export function SentimentBar({
  positive,
  neutral,
  negative,
  mixed = 0,
  className,
}: {
  positive: number;
  neutral: number;
  negative: number;
  mixed?: number;
  className?: string;
}) {
  const total = positive + neutral + negative + mixed || 1;
  const pct = (n: number) => `${(n / total) * 100}%`;

  return (
    <div
      className={cn("flex h-1.5 overflow-hidden rounded-full bg-muted", className)}
      role="img"
      aria-label={`${positive} positive, ${neutral} neutral, ${negative} negative`}
    >
      <div style={{ width: pct(positive) }} className="bg-positive" />
      <div style={{ width: pct(neutral) }} className="bg-neutral" />
      <div style={{ width: pct(mixed) }} className="bg-mixed" />
      <div style={{ width: pct(negative) }} className="bg-negative" />
    </div>
  );
}

export const typeIcons: Record<string, LucideIcon> = {
  IDEA: Lightbulb,
  ISSUE: Bug,
  PRAISE: Heart,
  QUESTION: HelpCircle,
  OTHER: MessageSquare,
};

export function TypeIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const Icon = typeIcons[type] ?? MessageSquare;
  return <Icon className={cn("size-3.5", className)} strokeWidth={1.9} />;
}

/**
 * Page title, what the page is for, and what you're currently looking at.
 *
 * `description` and `subtitle` answer different questions and both are worth
 * the line. A page that only says "5 open, sorted by priority" tells someone
 * who already knows what a theme is how many there are, and tells everyone
 * else nothing. The description is written for the person seeing the screen
 * for the first time; the subtitle is the live state for the person who uses
 * it daily.
 */
export function PageHeader({
  title,
  description,
  subtitle,
  actions,
}: {
  title: string;
  /** One plain sentence: what this page is for. */
  description?: string;
  /** Current state: counts, filters, which project. */
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[1.55rem] font-bold tracking-tight text-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-[62ch] text-[0.88rem] leading-relaxed text-steel">
            {description}
          </p>
        )}
        {subtitle && <div className="label mt-1.5">{subtitle}</div>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * One heading for the sections inside a page ("What to work on", "By type").
 *
 * It exists because the same rank was being set seven different ways across the
 * dashboard, from 0.9rem semibold to 1.15rem bold. Same-rank type has to look
 * the same or the page reads as assembled rather than designed, and a shared
 * component is the only version of that rule which cannot drift.
 */
export function SectionHeading({
  children,
  className,
  as: Tag = "h2",
}: {
  children: ReactNode;
  className?: string;
  as?: "h2" | "h3";
}) {
  return (
    <Tag
      className={cn(
        "text-[1.1rem] leading-tight font-bold tracking-tight text-ink",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * `tone` is semantic, not decorative.
 *
 * It replaces an `accent` boolean that painted its value mint, which meant a
 * negative share above 40% (the worst number on the page) was drawn in the
 * colour this product uses for good news. A stat that is bad should look bad.
 */
export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  /** null or undefined renders as an em dash rather than an empty box. */
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "positive" | "negative";
}) {
  const empty = value === null || value === undefined || value === "";

  return (
    <div className="rounded-xl border border-line bg-paper-2 p-5">
      <div className="label">{label}</div>
      <div
        className={cn(
          "mt-2 text-[1.7rem] leading-none font-bold tracking-tight tabular-nums",
          empty && "text-faint",
          !empty && tone === "negative" && "text-negative",
          !empty && tone === "positive" && "text-positive",
          !empty && tone === "default" && "text-ink",
        )}
      >
        {empty ? "—" : value}
      </div>
      {hint && <div className="mt-2 text-[0.78rem] text-steel">{hint}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-line bg-paper-2 px-6 py-16 text-center",
        className,
      )}
    >
      <p className="text-[1.1rem] font-bold tracking-tight text-ink">
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-[44ch] text-[0.9rem] leading-relaxed text-steel">
        {body}
      </p>
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

/** Twelve-bucket sparkline from the theme trend JSON. */
export function Sparkline({
  data,
  className,
}: {
  data: Array<{ week: string; count: number }> | null | undefined;
  className?: string;
}) {
  if (!data || data.length === 0) {
    return <div className={cn("h-6 w-20", className)} />;
  }

  const max = Math.max(...data.map((d) => d.count), 1);
  const w = 80;
  const h = 24;
  const step = data.length > 1 ? w / (data.length - 1) : w;

  const points = data
    .map((d, i) => `${i * step},${h - (d.count / max) * (h - 2) - 1}`)
    .join(" ");

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={cn("overflow-visible", className)}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
