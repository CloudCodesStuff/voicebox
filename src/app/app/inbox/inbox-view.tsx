"use client";

import Link from "next/link";
import {
  Archive,
  ArrowRight,
  Check,
  Loader2,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useProject } from "@/components/app/project-context";
import {
  actionClass,
  pagePath,
  EmptyState,
  PageHeader,
  SentimentBadge,
  SentimentDot,
  TypeIcon,
  relativeTime,
} from "@/components/app/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";

import { FeedbackDetail } from "./feedback-detail";

type Status = "ALL" | "NEW" | "REVIEWED" | "ARCHIVED";
type Sentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "MIXED";
type FType = "IDEA" | "ISSUE" | "PRAISE" | "QUESTION" | "OTHER";

const STATUSES: Status[] = ["ALL", "NEW", "REVIEWED", "ARCHIVED"];
const SENTIMENTS: Sentiment[] = ["POSITIVE", "NEUTRAL", "MIXED", "NEGATIVE"];
const TYPES: FType[] = ["IDEA", "ISSUE", "PRAISE", "QUESTION", "OTHER"];

export function InboxView({ initialId }: { initialId?: string }) {
  const { activeProject } = useProject();
  const utils = api.useUtils();

  const [status, setStatus] = useState<Status>("ALL");
  const [sentiment, setSentiment] = useState<Sentiment | undefined>();
  const [type, setType] = useState<FType | undefined>();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? null);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const projectId = activeProject?.id ?? "";
  const enabled = Boolean(projectId);

  const list = api.feedback.list.useQuery(
    {
      projectId,
      status,
      sentiment,
      type,
      search: search.trim() || undefined,
      limit: 100,
    },
    { enabled },
  );

  const invalidate = () => {
    void utils.feedback.invalidate();
    void utils.analytics.invalidate();
  };

  const setStatusMutation = api.feedback.setStatus.useMutation({
    onSuccess() {
      toast.success("Updated.");
      setChecked(new Set());
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = api.feedback.delete.useMutation({
    onSuccess() {
      toast.success("Deleted.");
      setChecked(new Set());
      setSelectedId(null);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const items = list.data?.items ?? [];
  const allChecked = items.length > 0 && checked.size === items.length;

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const activeFilters =
    status !== "ALL" || sentiment !== undefined || type !== undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6">
      <PageHeader
        title="Inbox"
        description="Every individual piece of feedback, newest first. Each one is scored for tone and given a one-line summary as it arrives. Read, reply by email, and archive what you've dealt with."
        subtitle={
          list.data ? `${items.length} shown` : activeProject?.name ?? undefined
        }
        actions={
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-steel" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search feedback"
              className="h-10 w-full border-line bg-paper-2 pl-9 text-[0.875rem] sm:w-64"
            />
          </div>
        }
      />

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-line p-0.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-[0.78rem] font-medium capitalize transition-colors",
                status === s ? "bg-ink text-paper" : "text-steel hover:text-ink",
              )}
            >
              {s.toLowerCase()}
            </button>
          ))}
        </div>

        <FilterChips
          options={SENTIMENTS}
          value={sentiment}
          onChange={setSentiment}
        />
        <FilterChips options={TYPES} value={type} onChange={setType} />

        {activeFilters && (
          <button
            type="button"
            onClick={() => {
              setStatus("ALL");
              setSentiment(undefined);
              setType(undefined);
            }}
            className="inline-flex items-center gap-1 text-[0.78rem] text-steel hover:text-ink"
          >
            <X className="size-3" />
            Clear
          </button>
        )}
      </div>

      {/* Bulk bar */}
      {checked.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-ink bg-ink px-4 py-2.5 text-paper">
          <span className="tnum text-[0.78rem]">
            {checked.size} selected
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <BulkButton
              onClick={() =>
                setStatusMutation.mutate({
                  ids: [...checked],
                  status: "REVIEWED",
                })
              }
              pending={setStatusMutation.isPending}
              icon={<Check className="size-3.5" />}
              label="Reviewed"
            />
            <BulkButton
              onClick={() =>
                setStatusMutation.mutate({
                  ids: [...checked],
                  status: "ARCHIVED",
                })
              }
              pending={setStatusMutation.isPending}
              icon={<Archive className="size-3.5" />}
              label="Archive"
            />
            <BulkButton
              onClick={() => deleteMutation.mutate({ ids: [...checked] })}
              pending={deleteMutation.isPending}
              icon={<Trash2 className="size-3.5" />}
              label="Delete"
            />
          </div>
        </div>
      )}

      {/* List */}
      <div className="mt-5">
        {list.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[72px] rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title={search || activeFilters ? "No matches." : "Nothing here yet."}
            body={
              search || activeFilters
                ? "Try a different filter or search term."
                : "Feedback from your widget lands here the moment it's submitted. If you haven't installed it yet, that's the next step."
            }
            // Only on a genuinely empty inbox. Offering "set up the widget" to
            // someone who has simply filtered their existing feedback down to
            // nothing would be answering a question they didn't ask.
            action={
              search || activeFilters ? undefined : (
                <Link
                  href="/app/widget"
                  className={actionClass("primary", "md")}
                >
                  Set up the widget
                  <ArrowRight className="size-3.5" />
                </Link>
              )
            }
          />
        ) : (
          <>
            <label
              htmlFor="select-all"
              className="mb-2 flex w-fit cursor-pointer items-center gap-2 text-[0.75rem] text-steel"
            >
              <Checkbox
                id="select-all"
                checked={allChecked}
                onCheckedChange={() =>
                  setChecked(
                    allChecked ? new Set() : new Set(items.map((i) => i.id)),
                  )
                }
              />
              Select all
            </label>

            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper-2">
              {items.map((f) => {
                const isNew = f.status === "NEW";
                // The summary is the model's one line about the message. When
                // there is one, the person's own words were never shown in this
                // list at all, so the row now reads subject-then-preview the way
                // a mail client does.
                const preview =
                  f.summary && f.summary !== f.body ? f.body : null;

                return (
                  <li
                    key={f.id}
                    className="flex items-start gap-3 px-4 py-3.5"
                  >
                    <Checkbox
                      checked={checked.has(f.id)}
                      onCheckedChange={() => toggle(f.id)}
                      className="mt-1"
                      aria-label="Select feedback"
                    />

                    <button
                      type="button"
                      onClick={() => setSelectedId(f.id)}
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    >
                      <SentimentDot sentiment={f.sentiment} className="mt-1.5" />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <TypeIcon
                            type={f.type}
                            className="shrink-0 text-steel"
                          />
                          {/* Unread carries on weight and contrast, not
                              colour. Read rows recede instead of unread rows
                              shouting, which keeps the accent meaning
                              something on a list where most rows are unread. */}
                          <p
                            className={cn(
                              "min-w-0 flex-1 truncate text-[0.875rem]",
                              isNew
                                ? "font-semibold text-ink"
                                : "font-normal text-steel",
                            )}
                          >
                            {f.summary ?? f.body}
                          </p>
                          {isNew && <span className="sr-only">Unread</span>}
                        </div>

                        {preview && (
                          <p className="mt-1 truncate text-[0.8rem] leading-relaxed text-steel">
                            {preview}
                          </p>
                        )}

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.72rem] text-steel">
                          {/* Neutral, not mint. This chip is on nearly every
                              row, and an accent that appears everywhere stops
                              reading as one. */}
                          {f.theme && (
                            <span className="max-w-[24ch] truncate rounded-full bg-sunken px-2 py-0.5 font-medium text-steel">
                              {f.theme.title}
                            </span>
                          )}
                          {f.rating != null && (
                            <span className="tabular-nums">{f.rating}/5</span>
                          )}
                          {/* Where it was sent from. The single most useful
                              piece of context for reproducing a complaint, and
                              it was already stored and never shown here. */}
                          {pagePath(f.pageUrl) && (
                            <span className="truncate font-mono text-[0.7rem] text-faint">
                              {pagePath(f.pageUrl)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <SentimentBadge sentiment={f.sentiment} />
                        <span className="tabular-nums text-[0.72rem] text-steel">
                          {relativeTime(f.createdAt)}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {selectedId && (
        <FeedbackDetail
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={invalidate}
        />
      )}
    </div>
  );
}

function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T | undefined;
  onChange: (v: T | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(value === o ? undefined : o)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-[0.75rem] font-medium capitalize transition-colors",
            value === o
              ? "border-ink bg-ink text-paper"
              : "border-line text-steel hover:border-steel hover:text-ink",
          )}
        >
          {o.toLowerCase()}
        </button>
      ))}
    </div>
  );
}

function BulkButton({
  onClick,
  pending,
  icon,
  label,
}: {
  onClick: () => void;
  pending: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      // paper-relative, not white-relative: the bulk bar is `bg-ink`, which is
      // near-white in dark mode, so a white overlay would vanish into it.
      className="inline-flex items-center gap-1.5 rounded-md bg-paper/15 px-2.5 py-1.5 text-[0.78rem] font-medium transition-colors hover:bg-paper/25 disabled:opacity-50"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}
