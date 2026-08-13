"use client";

import { Check, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { relativeTime } from "@/components/app/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";

export default function AdminErrors() {
  const utils = api.useUtils();
  const [includeResolved, setIncludeResolved] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const errors = api.admin.errors.useQuery({ includeResolved, limit: 100 });

  const invalidate = () => {
    void utils.admin.invalidate();
  };

  const resolve = api.admin.resolveError.useMutation({
    onSuccess: invalidate,
    onError: (e) => toast.error(e.message),
  });

  const remove = api.admin.deleteError.useMutation({
    onSuccess() {
      toast.success("Deleted.");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.55rem] font-bold tracking-tight text-ink">
            Errors
          </h1>
          <p className="mt-1.5 max-w-[64ch] text-[0.88rem] leading-relaxed text-steel">
            Grouped by fault, not by occurrence, so one thing failing ten
            thousand times is one row with a count. You are emailed once the
            first time a new one appears, never again for the same fault.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[0.84rem] text-steel">
          <input
            type="checkbox"
            checked={includeResolved}
            onChange={(e) => setIncludeResolved(e.target.checked)}
            className="size-4 accent-current"
          />
          Show resolved
        </label>
      </div>

      {errors.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (errors.data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-paper-2 px-6 py-16 text-center">
          <p className="text-[1.05rem] font-bold text-ink">Nothing broken.</p>
          <p className="mx-auto mt-2 max-w-[46ch] text-[0.9rem] leading-relaxed text-steel">
            {includeResolved
              ? "No errors have been recorded at all."
              : "No unresolved errors. Anything that happens from here will appear on this page and email you once."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {errors.data?.map((e) => {
            const open = expanded === e.id;
            return (
              <li
                key={e.id}
                className={cn(
                  "rounded-xl border bg-paper-2 p-4",
                  e.resolvedAt ? "border-line opacity-60" : "border-line",
                )}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide uppercase",
                      e.resolvedAt
                        ? "bg-muted text-steel"
                        : "bg-negative-wash text-negative",
                    )}
                  >
                    {e.source}
                  </span>

                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : e.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="font-mono text-[0.85rem] leading-snug break-words text-ink">
                      {e.message}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-[0.76rem] text-steel">
                      <span className="tnum">
                        {e.count} occurrence{e.count === 1 ? "" : "s"}
                      </span>
                      <span>last {relativeTime(e.lastSeenAt)}</span>
                      <span>first {relativeTime(e.firstSeenAt)}</span>
                      {e.resolvedAt && <span>resolved</span>}
                    </div>
                  </button>

                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        resolve.mutate({ id: e.id, resolved: !e.resolvedAt })
                      }
                      className="grid size-8 place-items-center rounded-lg border border-line text-steel hover:text-ink"
                      aria-label={
                        e.resolvedAt ? "Reopen this error" : "Mark resolved"
                      }
                      title={e.resolvedAt ? "Reopen" : "Mark resolved"}
                    >
                      {e.resolvedAt ? (
                        <RotateCcw className="size-3.5" />
                      ) : (
                        <Check className="size-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Delete this error group permanently?")) {
                          remove.mutate({ id: e.id });
                        }
                      }}
                      className="grid size-8 place-items-center rounded-lg border border-line text-steel hover:border-negative hover:text-negative"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="mt-3 space-y-3 border-t border-line pt-3">
                    {e.context != null && (
                      <div>
                        <div className="label">Context</div>
                        <pre className="mt-1 overflow-x-auto rounded-lg bg-slab p-3 font-mono text-[0.74rem] text-slab-fg/85">
                          {JSON.stringify(e.context, null, 2)}
                        </pre>
                      </div>
                    )}
                    {e.stack && (
                      <div>
                        <div className="label">Stack</div>
                        <pre className="mt-1 max-h-72 overflow-auto rounded-lg bg-slab p-3 font-mono text-[0.74rem] leading-relaxed text-slab-fg/85">
                          {e.stack}
                        </pre>
                      </div>
                    )}
                    <p className="text-[0.74rem] text-faint">
                      Email addresses and key-shaped strings are redacted before
                      anything is written here.
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
