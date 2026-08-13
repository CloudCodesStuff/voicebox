"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useProject } from "@/components/app/project-context";
import { CLUSTER_STAGES, WorkingButton } from "@/components/app/working-label";
import {
  EmptyState,
  PageHeader,
  SentimentBadge,
  SentimentBar,
  Sparkline,
  relativeTime,
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6">
      <PageHeader
        title="Themes"
        description={`A theme is one problem, however many different ways people described it. "Export is slow" and "the download keeps failing" end up in the same place, so the count is the number of people affected, not how often a word appeared. Ranked by volume, unhappiness and recency, so start at the top.`}
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
                ? "Themes form once there are enough analyzed pieces to see a pattern, usually around twenty. Hit Regroup now to try anyway."
                : "Theme grouping is paused right now. Your feedback is still arriving and nothing is lost, it gets grouped as soon as analysis is back."
            }
          />
        ) : (
          <ul className="space-y-2">
            {list.map((theme) => (
              <li key={theme.id}>
                <Link
                  href={`/app/themes/${theme.id}`}
                  className="block rounded-xl border border-line bg-paper-2 p-5 transition-colors hover:border-steel"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[1rem] font-semibold text-ink">
                          {theme.title}
                        </h3>
                        <SentimentBadge sentiment={theme.sentiment} />
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

                    <div className="flex shrink-0 items-center gap-5">
                      <div className="text-steel">
                        <Sparkline
                          data={
                            theme.trend as Array<{ week: string; count: number }> | null
                          }
                        />
                      </div>
                      <div className="text-right">
                        <div className="text-[1.35rem] font-bold leading-none text-ink">
                          {theme.itemCount}
                        </div>
                        <div className="label mt-1">items</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <SentimentBar
                      className="max-w-[240px] flex-1"
                      negative={theme.negativeShare}
                      neutral={Math.max(0, 1 - theme.negativeShare - 0.12)}
                      positive={0.12}
                    />
                    <span className="tnum text-[0.75rem] text-steel">
                      {Math.round(theme.negativeShare * 100)}% negative
                    </span>
                    <span className="tnum ml-auto text-[0.75rem] text-steel">
                      last seen {relativeTime(theme.lastSeenAt)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
