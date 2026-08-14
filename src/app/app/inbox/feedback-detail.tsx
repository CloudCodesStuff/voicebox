"use client";

import {
  Archive,
  Check,
  Globe,
  Loader2,
  Mail,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useProject } from "@/components/app/project-context";
import {
  actionClass,
  SectionHeading,
  SentimentBadge,
  TypeIcon,
  relativeTime,
} from "@/components/app/ui";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/client";

/**
 * Side drawer for one submission. Shows the raw text and everything derived
 * from it, plus the context the widget captured, which is often what turns a
 * vague complaint into a reproducible bug.
 */
export function FeedbackDetail({
  id,
  onClose,
  onChanged,
}: {
  id: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { activeProject } = useProject();
  const item = api.feedback.byId.useQuery({ id });
  const themes = api.theme.list.useQuery(
    { projectId: activeProject?.id ?? "", status: "ALL", limit: 100 },
    { enabled: Boolean(activeProject) },
  );

  const setStatus = api.feedback.setStatus.useMutation({
    onSuccess() {
      toast.success("Updated.");
      onChanged();
      void item.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const assignTheme = api.feedback.assignTheme.useMutation({
    onSuccess() {
      toast.success("Theme updated.");
      onChanged();
      void item.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const reanalyze = api.feedback.reanalyze.useMutation({
    onSuccess(r) {
      toast[r.ok ? "success" : "error"](
        r.ok ? "Re-analyzed." : "Analysis failed. Try again.",
      );
      onChanged();
      void item.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const panelRef = useRef<HTMLElement>(null);

  /**
   * Dialog behaviour, not just dialog markup.
   *
   * This carried role="dialog" while leaving focus out on the page behind it,
   * so a keyboard user opened the drawer and then tabbed through the list
   * underneath without ever reaching its controls, and on close landed at the
   * top of the document instead of the row they came from. Escape already
   * worked; the rest of the contract did not.
   */
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      // Wrap at both ends, so Tab can never walk out into the page behind.
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      // Back to the row that opened it, if it is still on the page.
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [onClose]);

  const f = item.data;
  const metadata = (f?.metadata ?? {}) as Record<string, unknown>;
  // _ip is bookkeeping for rate limiting, not a customer-facing trait.
  const traits = Object.entries(metadata).filter(([k]) => !k.startsWith("_"));

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-paper-2 shadow-2xl outline-none"
        role="dialog"
        aria-modal="true"
        aria-label="Feedback detail"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <SectionHeading>
            Feedback
          </SectionHeading>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg text-steel hover:bg-muted hover:text-ink"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {item.isLoading || !f ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[0.75rem] font-medium text-ink capitalize">
                  <TypeIcon type={f.type} />
                  {f.type.toLowerCase()}
                </span>
                <SentimentBadge sentiment={f.sentiment} />
                {f.rating != null && (
                  <span className="tnum rounded-full bg-muted px-2.5 py-1 text-[0.75rem] text-ink">
                    {f.rating}/5
                  </span>
                )}
                <span className="tnum ml-auto text-[0.75rem] text-steel">
                  {relativeTime(f.createdAt)}
                </span>
              </div>

              <p className="mt-4 rounded-xl border border-line bg-paper px-4 py-3.5 text-[0.94rem] leading-relaxed text-ink">
                {f.body}
              </p>

              {f.summary && (
                <div className="mt-4">
                  <div className="label flex items-center gap-1.5">
                    <Sparkles className="size-3 text-mint-deep" />
                    AI summary
                  </div>
                  <p className="mt-1.5 text-[0.875rem] leading-relaxed text-steel">
                    {f.summary}
                  </p>
                </div>
              )}

              {(f.aiCategory || f.sentimentScore != null) && (
                <div className="mt-4 flex flex-wrap gap-4">
                  {f.aiCategory && (
                    <div>
                      <div className="label">Category</div>
                      <div className="mt-1 text-[0.84rem] text-ink">
                        {f.aiCategory}
                      </div>
                    </div>
                  )}
                  {f.sentimentScore != null && (
                    <div>
                      <div className="label">Score</div>
                      <div className="tnum mt-1 text-[0.84rem] text-ink">
                        {f.sentimentScore.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Theme */}
              <div className="mt-6">
                <label htmlFor="assign-theme" className="label">
                  Theme
                </label>
                {/* Radix items can't carry an empty value, so "unassigned"
                    travels as a sentinel and turns back into null here. */}
                <Select
                  value={f.themeId ?? "none"}
                  onValueChange={(v) =>
                    assignTheme.mutate({
                      ids: [f.id],
                      themeId: v === "none" ? null : v,
                    })
                  }
                  disabled={assignTheme.isPending}
                >
                  <SelectTrigger
                    id="assign-theme"
                    className="mt-1.5 w-full rounded-lg border-line bg-paper text-[0.875rem] text-ink shadow-none data-[size=default]:h-10 dark:bg-paper dark:hover:bg-paper"
                  >
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="none">Unassigned</SelectItem>
                    {themes.data?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Context */}
              <div className="mt-6 space-y-2.5 border-t border-line pt-5">
                <div className="label">Context</div>

                {f.email && (
                  <a
                    href={`mailto:${f.email}`}
                    className="flex items-center gap-2 text-[0.84rem] text-ink hover:underline"
                  >
                    <Mail className="size-3.5 text-steel" />
                    {f.email}
                  </a>
                )}

                {f.pageUrl && /^https?:\/\//i.test(f.pageUrl) && (
                  <a
                    href={f.pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-2 text-[0.84rem] break-all text-steel hover:text-ink"
                  >
                    <Globe className="mt-0.5 size-3.5 shrink-0" />
                    {f.pageUrl}
                  </a>
                )}

                {f.locale && (
                  <div className="tnum text-[0.75rem] text-steel">
                    {f.locale}
                  </div>
                )}

                {traits.length > 0 && (
                  <div className="rounded-lg bg-muted p-3">
                    <div className="label mb-1.5">Identify traits</div>
                    <dl className="space-y-1">
                      {traits.map(([k, v]) => (
                        <div key={k} className="flex gap-2 text-[0.76rem]">
                          <dt className="tnum text-steel">{k}</dt>
                          <dd className="text-ink">{String(v)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {f && (
          <footer className="flex flex-wrap gap-2 border-t border-line px-5 py-4">
            <button
              type="button"
              onClick={() =>
                setStatus.mutate({
                  ids: [f.id],
                  status: f.status === "REVIEWED" ? "NEW" : "REVIEWED",
                })
              }
              disabled={setStatus.isPending}
              className={cn("flex-1", actionClass("primary", "md"))}
            >
              <Check className="size-3.5" />
              {f.status === "REVIEWED" ? "Mark unread" : "Mark reviewed"}
            </button>

            <button
              type="button"
              onClick={() => setStatus.mutate({ ids: [f.id], status: "ARCHIVED" })}
              disabled={setStatus.isPending}
              aria-label="Archive"
              title="Archive"
              className={actionClass("secondary", "md")}
            >
              <Archive className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={() => reanalyze.mutate({ id: f.id })}
              disabled={reanalyze.isPending}
              aria-label="Re-run AI analysis"
              title="Re-run AI analysis"
              className={actionClass("secondary", "md")}
            >
              {reanalyze.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
