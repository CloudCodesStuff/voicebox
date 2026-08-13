"use client";

import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { useState } from "react";

import { useProject } from "@/components/app/project-context";
import { SentimentLegend, TrendChart } from "@/components/app/trend-chart";
import { EmptyState, PageHeader, StatCard, TypeIcon } from "@/components/app/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { csvCell } from "@/lib/export-safe";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";

const RANGES = [7, 30, 90, 365] as const;

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
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-ink px-4 text-[0.85rem] font-semibold text-paper"
            >
              Set up the widget
              <ArrowRight className="size-3.5" />
            </Link>
          }
        />
      ) : (
        <>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total"
              value={overview.data?.current ?? 0}
              hint={`in ${days} days`}
            />
            <StatCard
              label="Daily average"
              value={(
                (overview.data?.current ?? 0) / Math.max(days, 1)
              ).toFixed(1)}
            />
            <StatCard
              label="Negative share"
              value={`${Math.round((overview.data?.negativeShare ?? 0) * 100)}%`}
              accent={(overview.data?.negativeShare ?? 0) > 0.4}
            />
            <StatCard
              label="Avg rating"
              value={avgRating ?? ", "}
              hint={avgRating ? "out of 5" : "no ratings yet"}
            />
          </div>

          <section className="mt-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[1.1rem] font-bold tracking-tight text-ink">
                Volume &amp; sentiment
              </h2>
              <SentimentLegend />
            </div>
            <div className="mt-4 rounded-xl border border-line bg-paper-2 p-4">
              <TrendChart data={data} height={240} />
            </div>
          </section>

          <section className="mt-9">
            <h2 className="text-[1.1rem] font-bold tracking-tight text-ink">
              By type
            </h2>
            <div className="mt-4 space-y-2.5 rounded-xl border border-line bg-paper-2 p-5">
              {(byType.data ?? []).map((t) => (
                <div key={t.type} className="flex items-center gap-3">
                  <TypeIcon type={t.type} className="shrink-0 text-steel" />
                  <span className="w-20 shrink-0 text-[0.82rem] capitalize text-ink">
                    {t.type.toLowerCase()}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-mint"
                      style={{ width: `${(t.count / typeTotal) * 100}%` }}
                    />
                  </div>
                  <span className="tnum w-10 shrink-0 text-right text-[0.78rem] text-steel">
                    {t.count}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
