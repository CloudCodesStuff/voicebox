"use client";

import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { useState } from "react";

import { useProject } from "@/components/app/project-context";
import { SentimentLegend, TrendChart } from "@/components/app/trend-chart";
import {
  actionClass,
  EmptyState,
  PageHeader,
  SectionHeading,
  StatGroup,
  TypeIcon,
} from "@/components/app/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { csvCell } from "@/lib/export-safe";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";

const RANGES = [7, 30, 90, 365] as const;

/**
 * Feedback types carry meaning, so the bars carry colour.
 *
 * Every bar used to be mint, which made the chart a length comparison with a
 * decorative fill. An issue and a piece of praise are not the same news, and
 * these are the colours this product already uses to say so everywhere else.
 */
const TYPE_FILL: Record<string, string> = {
  ISSUE: "bg-negative",
  PRAISE: "bg-positive",
  IDEA: "bg-mint",
  QUESTION: "bg-mixed",
  OTHER: "bg-neutral",
};

const TYPE_TONE: Record<string, string> = {
  ISSUE: "text-negative",
  PRAISE: "text-positive",
  IDEA: "text-mint-deep",
  QUESTION: "text-mixed",
  OTHER: "text-steel",
};

export function TrendsView() {
  const { activeProject } = useProject();
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);

  const projectId = activeProject?.id ?? "";
  const enabled = Boolean(projectId);

  const trend = api.analytics.trend.useQuery({ projectId, days }, { enabled });
  const byType = api.analytics.byType.useQuery({ projectId, days }, { enabled });
  const overview = api.analytics.overview.useQuery(
    { projectId, days },
    { enabled },
  );

  const data = trend.data ?? [];
  const hasData = data.some((d) => d.total > 0);

  const ratings = data.filter((d) => d.avgRating != null);
  const avgRating =
    ratings.length === 0
      ? null
      : (
          ratings.reduce((a, d) => a + (d.avgRating ?? 0), 0) / ratings.length
        ).toFixed(2);

  const typeTotal = (byType.data ?? []).reduce((a, t) => a + t.count, 0) || 1;
  const typeMax = Math.max(1, ...(byType.data ?? []).map((t) => t.count));

  function exportCsv() {
    const rows = [
      ["date", "total", "positive", "neutral", "mixed", "negative", "avg_rating"],
      ...data.map((d) => [
        d.date,
        d.total,
        d.positive,
        d.neutral,
        d.mixed,
        d.negative,
        d.avgRating ?? "",
      ]),
    ];
    // Cells are all server-generated dates and numbers today, but routing them
    // through csvCell means the export stays formula-safe the day a label,
    // category, or theme title is added to it.
    const blob = new Blob(
      [rows.map((r) => r.map((c) => csvCell(String(c))).join(",")).join("\n")],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voicebox-trends-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6">
      <PageHeader
        title="Trends"
        description="Whether things are getting better or worse. Volume and sentiment over time, so you can tell a bad week from a bad direction."
        subtitle={activeProject ? `${activeProject.name} · ${days} days` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-lg border border-line p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setDays(r)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-[0.78rem] font-medium transition-colors",
                    days === r ? "bg-ink text-paper" : "text-steel hover:text-ink",
                  )}
                >
                  {r === 365 ? "1y" : `${r}d`}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!hasData}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3.5 text-[0.83rem] font-medium text-steel hover:text-ink disabled:opacity-50"
            >
              <Download className="size-3.5" />
              CSV
            </button>
          </div>
        }
      />

      {trend.isLoading ? (
        <div className="mt-7 space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : !hasData ? (
        <EmptyState
          className="mt-8"
          title="Nothing to chart yet."
          body="Volume and sentiment over time appear here once feedback starts arriving. A chart needs a few days of data before it says anything useful."
          action={
            <Link
              href="/app/widget"
              className={actionClass("primary", "md")}
            >
              Set up the widget
              <ArrowRight className="size-3.5" />
            </Link>
          }
        />
      ) : (
        <>
          <StatGroup
            className="mt-7"
            stats={[
              {
                label: "Total",
                value: overview.data?.current ?? 0,
                hint: `in ${days} days`,
              },
              {
                label: "Daily average",
                value: (
                  (overview.data?.current ?? 0) / Math.max(days, 1)
                ).toFixed(1),
                hint: "a day",
              },
              {
                label: "Negative share",
                value: `${Math.round((overview.data?.negativeShare ?? 0) * 100)}%`,
                tone:
                  (overview.data?.negativeShare ?? 0) > 0.4
                    ? "negative"
                    : "default",
                hint: "of analyzed",
              },
              {
                label: "Avg rating",
                value: avgRating,
                hint: avgRating ? "out of 5" : "no ratings yet",
              },
            ]}
          />

          <section className="mt-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionHeading>
                Volume &amp; sentiment
              </SectionHeading>
              <SentimentLegend />
            </div>
            <div className="mt-4 rounded-xl border border-line bg-paper-2 p-4">
              <TrendChart data={data} height={240} />
            </div>
          </section>

          <section className="mt-9">
            <SectionHeading>
              By type
            </SectionHeading>
            {/* Scaled to the largest type rather than to the total: against the
                total, four categories each sit under a quarter of the track and
                every bar looks the same length. */}
            <div className="mt-4 space-y-3 rounded-xl border border-line bg-paper-2 p-5">
              {(byType.data ?? []).map((t) => {
                const share = t.count / typeTotal;
                return (
                  <div key={t.type} className="flex items-center gap-3">
                    <TypeIcon
                      type={t.type}
                      className={cn("shrink-0", TYPE_TONE[t.type] ?? "text-steel")}
                    />
                    <span className="w-20 shrink-0 text-[0.82rem] text-ink capitalize">
                      {t.type.toLowerCase()}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          TYPE_FILL[t.type] ?? "bg-neutral",
                        )}
                        style={{
                          width: `${Math.max(2, (t.count / typeMax) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right text-[0.78rem] tabular-nums text-ink">
                      {t.count}
                    </span>
                    <span className="w-10 shrink-0 text-right text-[0.75rem] tabular-nums text-steel">
                      {Math.round(share * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
