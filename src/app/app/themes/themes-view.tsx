"use client";

import Link from "next/link";
import { Minus, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useProject } from "@/components/app/project-context";
import { CLUSTER_STAGES, WorkingButton } from "@/components/app/working-label";
import {
  EmptyState,
  PageHeader,
  SentimentBar,
  relativeTime,
  trendDirection,
} from "@/components/app/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";

type Sort = "priority" | "volume" | "recent" | "sentiment";
type Status = "ACTIVE" | "RESOLVED" | "IGNORED" | "ALL";

const SORTS: Array<{ key: Sort; label: string }> = [
  { key: "priority", label: "Priority" },
  { key: "volume", label: "Volume" },
  { key: "recent", label: "Recent" },
  { key: "sentiment", label: "Most negative" },
];

const STATUSES: Status[] = ["ACTIVE", "RESOLVED", "IGNORED", "ALL"];

/**
 * Which way a theme is moving.
 *
 * Amber for rising rather than red: on a list of problems, growth is the thing
 * to look at next, not a failure in itself. Cooling earns the positive colour
 * because a shrinking complaint is the outcome this product exists to produce.
 */
function Momentum({
  direction,
}: {
  direction: "rising" | "cooling" | "steady";
}) {
  const map = {
    rising: { Icon: TrendingUp, label: "rising", className: "text-mixed" },
    cooling: { Icon: TrendingDown, label: "cooling", className: "text-positive" },
    steady: { Icon: Minus, label: "steady", className: "text-steel" },
  } as const;

  const { Icon, label, className } = map[direction];
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Icon className="size-3" strokeWidth={2.5} />
      {label}
    </span>
  );
}

export function ThemesView() {
  const { activeProject } = useProject();
  const utils = api.useUtils();

  const [sort, setSort] = useState<Sort>("priority");
  const [status, setStatus] = useState<Status>("ACTIVE");

  const projectId = activeProject?.id ?? "";
  const enabled = Boolean(projectId);

  const themes = api.theme.list.useQuery(
    { projectId, sort, status, limit: 100 },
    { enabled },
  );
  const aiReady = api.theme.configured.useQuery();

  const recluster = api.theme.recluster.useMutation({
    onSuccess(r) {
      toast.success(`Grouped ${r.items} items into ${r.themes} themes.`);
      void utils.theme.invalidate();
      void utils.analytics.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const list = themes.data ?? [];

  /** Scale for the volume bars: the biggest theme currently in view. */
  const maxCount = Math.max(1, ...list.map((t) => t.itemCount));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6">
      <PageHeader
        title="Themes"
        description="One problem, however many ways people described it. Ranked by volume, unhappiness and recency, so start at the top."
        subtitle={`${list.length} ${status.toLowerCase()}, sorted by ${sort.toLowerCase()}`}
        actions={
          <WorkingButton
            working={recluster.isPending}
            disabled={!aiReady.data?.ok}
            onClick={() => recluster.mutate({ projectId })}
            idleIcon={<RefreshCw className="size-3.5" />}
            idleLabel="Regroup now"
            stages={CLUSTER_STAGES}
            className="min-h-10 px-3.5 text-[0.84rem]"
          />
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-line p-0.5">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={sort === s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-[0.78rem] font-medium transition-colors",
                sort === s.key ? "bg-ink text-paper" : "text-steel hover:text-ink",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[0.75rem] font-medium capitalize transition-colors",
                status === s
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-steel hover:border-steel hover:text-ink",
              )}
            >
              {s.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {themes.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[104px] rounded-xl" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            title="No themes yet."
            body={
              aiReady.data?.ok
                ? "Themes form once about twenty pieces have been analyzed."
                : "Theme grouping is paused. Feedback is still arriving, and nothing is lost."
            }
          />
        ) : (
          <ul className="space-y-2">
            {list.map((theme, i) => {
              const trend = theme.trend as
                | Array<{ week: string; count: number }>
                | null;
              const direction = trendDirection(trend);
              const negPct = Math.round(theme.negativeShare * 100);

              return (
                <li key={theme.id}>
                  <Link
                    href={`/app/themes/${theme.id}`}
                    className="group relative block rounded-xl border border-line bg-paper-2 py-4 pr-4 pl-12 transition-colors hover:border-steel"
                  >
                    {/* Position in the current sort. The page tells people to
                        start at the top, so the order has to be countable
                        rather than merely implied. */}
                    <span
                      className={cn(
                        "absolute top-4 left-0 w-12 text-center text-[0.95rem] leading-none font-bold tabular-nums",
                        i === 0 ? "text-ink" : "text-faint",
                      )}
                    >
                      {i + 1}
                    </span>

                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* No sentiment badge here. The share bar and the
                              percentage below already carry sentiment, and more
                              precisely than a one-word label does. */}
                          <h3 className="text-[1rem] font-semibold text-ink">
                            {theme.title}
                          </h3>
                          {theme.status !== "ACTIVE" && (
                            <span className="rounded-full bg-sunken px-2 py-0.5 text-[0.75rem] font-medium text-steel capitalize">
                              {theme.status.toLowerCase()}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 line-clamp-2 max-w-[62ch] text-[0.86rem] leading-relaxed text-steel">
                          {theme.description}
                        </p>
                      </div>

                      {/* The number the list is sorted by. It was computed,
                          used to order the page, and then never shown, which
                          left "ranked by priority" as something to take on
                          trust rather than something to read. */}
                      {/* No sparkline either: the momentum tag below says which
                          way this is going in a word, and a 56px chart next to
                          it was a second answer to a question already
                          answered. It stays on the theme page, where it has the
                          room to show shape rather than just direction. */}
                      <div className="shrink-0 text-right">
                        <div
                          className={cn(
                            "text-[1.15rem] leading-none font-bold tabular-nums",
                            sort === "priority" ? "text-ink" : "text-steel",
                          )}
                        >
                          {Math.round(theme.priorityScore)}
                        </div>
                        <div className="label mt-1">priority</div>
                      </div>
                    </div>

                    <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.75rem]">
                      {/* Volume against the biggest theme in view, so seven
                          items and two items stop looking alike. */}
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-20 overflow-hidden rounded-full bg-sunken">
                          {/* Neutral: this is a magnitude, not good news. Mint
                              on every row made the accent meaningless. */}
                          <span
                            className="block h-full rounded-full bg-steel"
                            style={{
                              width: `${Math.max(4, (theme.itemCount / maxCount) * 100)}%`,
                            }}
                          />
                        </span>
                        <span
                          className={cn(
                            "tabular-nums",
                            sort === "volume"
                              ? "font-semibold text-ink"
                              : "text-steel",
                          )}
                        >
                          {theme.itemCount} items
                        </span>
                      </span>

                      <span className="flex items-center gap-2">
                        {/* Two parts, both real. This used to add a fixed 12%
                            positive slice that no data supported. */}
                        <SentimentBar
                          className="w-16"
                          negative={theme.negativeShare}
                          neutral={1 - theme.negativeShare}
                          positive={0}
                        />
                        <span
                          className={cn(
                            "tabular-nums",
                            sort === "sentiment"
                              ? "font-semibold text-ink"
                              : "text-steel",
                          )}
                        >
                          {negPct}% negative
                        </span>
                      </span>

                      {direction && <Momentum direction={direction} />}

                      <span
                        className={cn(
                          "ml-auto tabular-nums",
                          sort === "recent"
                            ? "font-semibold text-ink"
                            : "text-steel",
                        )}
                      >
                        last seen {relativeTime(theme.lastSeenAt)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
