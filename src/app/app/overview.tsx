"use client";

import Link from "next/link";
import { RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FirstRun } from "@/components/app/first-run";
import { CLUSTER_STAGES, WorkingButton } from "@/components/app/working-label";
import { useProject } from "@/components/app/project-context";
import { SentimentLegend, TrendChart } from "@/components/app/trend-chart";
import {
  EmptyState,
  PageHeader,
  SentimentBar,
  SentimentDot,
  Sparkline,
  StatCard,
  TypeIcon,
  relativeTime,
} from "@/components/app/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";

const RANGES = [7, 30, 90] as const;

export function Overview() {
  const { activeProject, isLoading: projectLoading } = useProject();
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const utils = api.useUtils();

  const projectId = activeProject?.id ?? "";
  const enabled = Boolean(projectId);

  const overview = api.analytics.overview.useQuery(
    { projectId, days },
    { enabled },
  );
  const trend = api.analytics.trend.useQuery({ projectId, days }, { enabled });
  const topThemes = api.analytics.topThemes.useQuery(
    { projectId, limit: 5 },
    { enabled },
  );
  const aiReady = api.theme.configured.useQuery();

  const recluster = api.theme.recluster.useMutation({
    onSuccess(result) {
      toast.success(
        `Grouped ${result.items} items into ${result.themes} themes.`,
      );
      void utils.analytics.invalidate();
      void utils.theme.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (projectLoading || (enabled && overview.isLoading)) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6">
        <Skeleton className="h-9 w-40" />
        <div className="grid gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[104px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const data = overview.data;
  const hasAny = (data?.total ?? 0) > 0;

  // Before the first submission there is no dashboard worth showing, only one
  // thing to do. FirstRun is that one thing, with the snippet in it.
  if (!hasAny) return <FirstRun />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6">
      <PageHeader
        title="Overview"
        subtitle={
          activeProject
            ? `${activeProject.name} · last ${days} days`
            : undefined
        }
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-line p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={days === r}
                onClick={() => setDays(r)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[0.8rem] font-medium transition-colors",
                  days === r ? "bg-ink text-paper" : "text-steel hover:text-ink",
                )}
              >
                {r}d
              </button>
            ))}
          </div>
        }
      />

      <>
          {/* Stat row */}
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={`Feedback · ${days}d`}
              value={data!.current}
              hint={
                <span
                  className={cn(
                    data!.changePercent > 0 ? "text-positive" : "text-steel",
                  )}
                >
                  {data!.changePercent >= 0 ? "+" : ""}
                  {data!.changePercent}% vs previous {days}d
                </span>
              }
            />
            <StatCard
              label="Negative share"
              value={`${Math.round(data!.negativeShare * 100)}%`}
              hint={`${data!.sentiment.NEGATIVE} of ${data!.analyzed} analyzed`}
              accent={data!.negativeShare > 0.4}
            />
            <StatCard
              label="All time"
              value={data!.total}
              hint={
                data!.unanalyzed > 0
                  ? `${data!.unanalyzed} awaiting analysis`
                  : "All analyzed"
              }
            />
            <StatCard
              label="Themes"
              value={topThemes.data?.length ?? 0}
              hint="Ranked by priority"
            />
          </div>

          {/* What to work on */}
          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[1.15rem] font-bold tracking-tight text-ink">
                  What to work on
                </h2>
                <p className="mt-1 text-[0.8rem] text-steel">
                  How many people, how unhappy, and how recently
                </p>
              </div>
              <WorkingButton
                working={recluster.isPending}
                disabled={!aiReady.data?.ok}
                onClick={() => recluster.mutate({ projectId })}
                idleIcon={<RefreshCw className="size-3.5" />}
                idleLabel="Regroup now"
                stages={CLUSTER_STAGES}
              />
            </div>

            {!aiReady.data?.ok && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-line bg-mint-wash px-4 py-3.5">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-mint-deep" />
                {/* Deliberately says nothing about environment variables.
                    This renders for every member of every workspace, and a
                    customer cannot set a key on a server they don't run. The
                    operator finds the cause in `npm run env:check`. */}
                <p className="text-[0.85rem] leading-relaxed text-ink">
                  <strong className="font-semibold">Analysis is paused.</strong>{" "}
                  Sentiment scoring and themes are unavailable right now.
                  Feedback is still being collected and stored, and everything
                  is scored automatically once analysis is back.
                </p>
              </div>
            )}

            {topThemes.data && topThemes.data.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {topThemes.data.map((theme, i) => (
                  <li key={theme.id}>
                    <Link
                      href={`/app/themes/${theme.id}`}
                      className="flex items-start gap-4 rounded-xl border border-line bg-paper-2 p-4 transition-colors hover:border-steel"
                    >
                      <span className="tnum mt-0.5 w-4 shrink-0 text-[0.75rem] text-steel">
                        {i + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[0.94rem] font-semibold text-ink">
                            {theme.title}
                          </span>
                          <span className="tnum rounded-full bg-muted px-2 py-0.5 text-[0.72rem] text-steel">
                            {theme.itemCount}
                          </span>
                        </div>

                        {theme.quote && (
                          <p className="mt-1.5 line-clamp-2 text-[0.84rem] leading-relaxed text-steel italic">
                            &ldquo;{theme.quote.body}&rdquo;
                          </p>
                        )}

                        <SentimentBar
                          className="mt-2.5 max-w-[220px]"
                          negative={theme.negativeShare}
                          neutral={Math.max(0, 1 - theme.negativeShare - 0.1)}
                          positive={0.1}
                        />
                      </div>

                      <div className="hidden shrink-0 text-steel sm:block">
                        <Sparkline
                          data={
                            theme.trend as Array<{ week: string; count: number }> | null
                          }
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                className="mt-4"
                title="No themes yet."
                body={
                  aiReady.data?.ok
                    ? "Themes appear once there are enough analyzed pieces to find a pattern, usually around twenty. Hit Regroup now to try anyway."
                    : "Theme grouping is paused right now. Nothing is lost."
                }
              />
            )}
          </section>

          {/* Trend */}
          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[1.15rem] font-bold tracking-tight text-ink">
                Sentiment over time
              </h2>
              <SentimentLegend />
            </div>
            <div className="mt-4 rounded-xl border border-line bg-paper-2 p-4">
              {trend.isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <TrendChart data={trend.data ?? []} />
              )}
            </div>
          </section>

          {/* Latest */}
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-[1.15rem] font-bold tracking-tight text-ink">
                Latest feedback
              </h2>
              <Link
                href="/app/inbox"
                className="text-[0.82rem] font-medium text-steel hover:text-ink"
              >
                View all →
              </Link>
            </div>

            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper-2">
              {data!.latest.map((f) => (
                <li key={f.id}>
                  <Link
                    href={`/app/inbox/${f.id}`}
                    className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40"
                  >
                    <SentimentDot sentiment={f.sentiment} className="mt-1.5" />
                    <TypeIcon type={f.type} className="mt-1 shrink-0 text-steel" />
                    <p className="min-w-0 flex-1 truncate text-[0.875rem] text-ink">
                      {f.summary ?? f.body}
                    </p>
                    <span className="tnum shrink-0 text-[0.75rem] text-steel">
                      {relativeTime(f.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
      </>
    </div>
  );
}
