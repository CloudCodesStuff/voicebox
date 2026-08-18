"use client";

import Link from "next/link";
import { RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";

import { FirstRun } from "@/components/app/first-run";
import { useJobs } from "@/components/app/jobs";
import { CLUSTER_STAGES, WorkingButton } from "@/components/app/working-label";
import { useProject } from "@/components/app/project-context";
import { SentimentLegend, TrendChart } from "@/components/app/trend-chart";
import {
  EmptyState,
  SectionHeading,
  PageHeader,
  SentimentBar,
  SentimentDot,
  Sparkline,
  StatGroup,
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

  // Owned by JobsProvider, not this page, so the in-flight state and its
  // stage clock survive switching pages mid-run.
  const jobs = useJobs();
  const regroupStartedAt = jobs.runningSince(`regroup:${projectId}`);

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
        description="What your users are telling you, and what to do about it first."
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
          <StatGroup
            className="mt-7"
            stats={[
              {
                label: `Feedback · ${days}d`,
                value: data!.current,
                hint: (
                  <span
                    className={cn(
                      data!.changePercent > 0 ? "text-positive" : "text-steel",
                    )}
                  >
                    {data!.changePercent >= 0 ? "+" : ""}
                    {data!.changePercent}% vs previous {days}d
                  </span>
                ),
              },
              {
                label: "Negative share",
                value: `${Math.round(data!.negativeShare * 100)}%`,
                hint: `${data!.sentiment.NEGATIVE} of ${data!.analyzed} analyzed`,
                tone: data!.negativeShare > 0.4 ? "negative" : "default",
              },
              {
                label: "All time",
                value: data!.total,
                hint:
                  data!.unanalyzed > 0
                    ? `${data!.unanalyzed} awaiting analysis`
                    : "All analyzed",
              },
              {
                label: "Themes",
                value: topThemes.data?.length ?? 0,
                hint: "Ranked by priority",
              },
            ]}
          />

          {/* What to work on */}
          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <SectionHeading>
                  What to work on
                </SectionHeading>
                <p className="mt-1 text-[0.8rem] text-steel">
                  How many people, how unhappy, and how recently
                </p>
              </div>
              <WorkingButton
                working={regroupStartedAt !== null}
                startedAt={regroupStartedAt}
                disabled={!aiReady.data?.ok}
                onClick={() => jobs.regroup(projectId)}
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
                  Feedback is still being collected, and everything is scored
                  once it is back.
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

                        {/* Negative against everything else, both real. The
                            fixed 10% positive slice this used to draw was not
                            in the data: a Theme carries a negative share and
                            no positive one. */}
                        <SentimentBar
                          className="mt-2.5 max-w-[220px]"
                          negative={theme.negativeShare}
                          neutral={1 - theme.negativeShare}
                          positive={0}
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
                    ? "Themes appear once about twenty pieces have been analyzed."
                    : "Theme grouping is paused. Nothing is lost."
                }
              />
            )}
          </section>

          {/* Trend */}
          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionHeading>
                Sentiment over time
              </SectionHeading>
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
              <SectionHeading>
                Latest feedback
              </SectionHeading>
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
