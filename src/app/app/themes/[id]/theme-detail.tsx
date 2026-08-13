"use client";

import Link from "next/link";
import { ArrowLeft, Check, Copy, Download, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  SentimentBadge,
  SentimentBar,
  SentimentDot,
  Sparkline,
  TypeIcon,
  relativeTime,
} from "@/components/app/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { csvCell, mdInline } from "@/lib/export-safe";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";

export function ThemeDetail({ themeId }: { themeId: string }) {
  const utils = api.useUtils();
  const theme = api.theme.byId.useQuery({ id: themeId });
  const [copied, setCopied] = useState(false);

  const setStatus = api.theme.setStatus.useMutation({
    onSuccess() {
      toast.success("Theme updated.");
      void utils.theme.invalidate();
      void theme.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  if (theme.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const t = theme.data;
  if (!t) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <p className="text-[1.2rem] font-bold text-ink">
          Theme not found.
        </p>
        <Link href="/app/themes" className="mt-3 inline-block text-[0.9rem] underline">
          Back to themes
        </Link>
      </div>
    );
  }

  const counts = t.feedback.reduce(
    (acc, f) => {
      if (f.sentiment) acc[f.sentiment] = (acc[f.sentiment] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  /** Quotes formatted for pasting straight into a planning doc. */
  async function copyQuotes() {
    const text = [
      `## ${t!.title}`,
      "",
      t!.description,
      "",
      `${t!.itemCount} pieces of feedback · ${Math.round(t!.negativeShare * 100)}% negative`,
      "",
      // Feedback bodies are unauthenticated public input. Fence them so pasted
      // Markdown/HTML lands as literal text in Notion/Linear, not as markup.
      ...t!.feedback.slice(0, 40).map((f) => `- ${mdInline(f.body)}`),
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied.");
    setTimeout(() => setCopied(false), 2000);
  }

  function exportCsv() {
    const rows = [
      ["date", "sentiment", "type", "rating", "feedback"],
      ...t!.feedback.map((f) => [
        new Date(f.createdAt).toISOString(),
        f.sentiment ?? "",
        f.type,
        f.rating?.toString() ?? "",
        csvCell(f.body),
      ]),
    ];

    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${t!.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24 sm:px-6">
      <Link
        href="/app/themes"
        className="inline-flex items-center gap-2 text-[0.85rem] font-medium text-steel hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Themes
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[1.5rem] font-bold tracking-tight text-ink">
              {t.title}
            </h1>
            <SentimentBadge sentiment={t.sentiment} />
          </div>
          <p className="mt-2 max-w-[64ch] text-[0.94rem] leading-relaxed text-steel">
            {t.description}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyQuotes}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3.5 text-[0.83rem] font-medium text-steel hover:text-ink"
          >
            {copied ? (
              <Check className="size-3.5 text-positive" />
            ) : (
              <Copy className="size-3.5" />
            )}
            Copy quotes
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3.5 text-[0.83rem] font-medium text-steel hover:text-ink"
          >
            <Download className="size-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-7 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-line bg-paper-2 p-4">
          <div className="label">Items</div>
          <div className="mt-1.5 text-[1.5rem] font-bold text-ink">
            {t.itemCount}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-paper-2 p-4">
          <div className="label">Negative</div>
          <div className="mt-1.5 text-[1.5rem] font-bold text-ink">
            {Math.round(t.negativeShare * 100)}%
          </div>
        </div>
        <div className="rounded-xl border border-line bg-paper-2 p-4">
          <div className="label">Priority</div>
          <div className="mt-1.5 text-[1.5rem] font-bold text-mint-deep">
            {Math.round(t.priorityScore)}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-paper-2 p-4">
          <div className="label">Trend · 12 weeks</div>
          <div className="mt-2 text-mint-deep">
            <Sparkline
              data={t.trend as Array<{ week: string; count: number }> | null}
            />
          </div>
        </div>
      </div>

      <SentimentBar
        className="mt-4"
        positive={counts.POSITIVE ?? 0}
        neutral={counts.NEUTRAL ?? 0}
        mixed={counts.MIXED ?? 0}
        negative={counts.NEGATIVE ?? 0}
      />

      {/* Status actions */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(["ACTIVE", "RESOLVED", "IGNORED"] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={t.status === s}
            disabled={setStatus.isPending || t.status === s}
            onClick={() => setStatus.mutate({ id: t.id, status: s })}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-[0.8rem] font-medium capitalize transition-colors disabled:cursor-default",
              t.status === s
                ? "border-ink bg-ink text-paper"
                : "border-line text-steel hover:text-ink",
            )}
          >
            {s === "RESOLVED" && <Check className="size-3.5" />}
            {s === "IGNORED" && <EyeOff className="size-3.5" />}
            {s.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Quotes */}
      <section className="mt-10">
        <h2 className="text-[1.1rem] font-bold tracking-tight text-ink">
          What people said
        </h2>
        <ul className="mt-4 space-y-2">
          {t.feedback.map((f) => (
            <li
              key={f.id}
              className="rounded-xl border border-line bg-paper-2 px-4 py-3.5"
            >
              <div className="flex items-start gap-3">
                <SentimentDot sentiment={f.sentiment} className="mt-2" />
                <TypeIcon type={f.type} className="mt-1.5 shrink-0 text-steel" />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9rem] leading-relaxed text-ink">
                    {f.body}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3">
                    <span className="tnum text-[0.72rem] text-steel">
                      {relativeTime(f.createdAt)}
                    </span>
                    {f.rating != null && (
                      <span className="tnum text-[0.72rem] text-steel">
                        {f.rating}/5
                      </span>
                    )}
                    {f.pageUrl && (
                      <span className="tnum truncate text-[0.72rem] text-steel">
                        {f.pageUrl.replace(/^https?:\/\//, "").slice(0, 48)}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/app/inbox/${f.id}`}
                  className="shrink-0 text-[0.75rem] text-steel hover:text-ink"
                >
                  Open
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
