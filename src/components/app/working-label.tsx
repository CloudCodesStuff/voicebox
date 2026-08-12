"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Progress you can read.

   Clustering is a real model call that can run for a minute or more. A bare
   spinner for that long reads as "hung", and people re-click or leave. We
   can't stream true progress out of one tRPC mutation, but we can say what
   the system is actually doing at each point in time, because the pipeline's
   order is fixed: read, group, name, rank. The stages advance on the clock,
   matched to how long each step really takes.
--------------------------------------------------------------------------- */

export type Stage = { at: number; label: string };

export const CLUSTER_STAGES: Stage[] = [
  { at: 0, label: "Reading your feedback…" },
  { at: 6, label: "Finding what repeats…" },
  { at: 20, label: "Grouping by problem…" },
  { at: 45, label: "Naming the themes…" },
  { at: 80, label: "Ranking by priority…" },
  { at: 120, label: "Almost there, big batch…" },
];

export function useStagedLabel(active: boolean, stages: Stage[]): string {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) return;
    const started = Date.now();
    const id = window.setInterval(
      () => setElapsed((Date.now() - started) / 1000),
      1000,
    );
    // Reset on cleanup rather than on entry, so the effect body never sets
    // state synchronously and the next run always starts from zero.
    return () => {
      window.clearInterval(id);
      setElapsed(0);
    };
  }, [active]);

  let label = stages[0]?.label ?? "";
  for (const stage of stages) {
    if (elapsed >= stage.at) label = stage.label;
  }
  return label;
}

/**
 * The button. While working it widens into a live status line with a
 * moving shimmer, so long operations read as in-flight rather than stuck.
 */
export function WorkingButton({
  working,
  idleIcon,
  idleLabel,
  stages,
  onClick,
  disabled,
  className,
}: {
  working: boolean;
  idleIcon: React.ReactNode;
  idleLabel: string;
  stages: Stage[];
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const label = useStagedLabel(working, stages);

  return (
    <button
      type="button"
      disabled={disabled || working}
      onClick={onClick}
      aria-busy={working}
      // aria-live lets a screen reader hear the stage changes too.
      aria-live="polite"
      className={cn(
        "relative inline-flex min-h-9 items-center gap-2 overflow-hidden rounded-lg border border-line px-3 text-[0.8rem] font-medium transition-colors",
        working
          ? "cursor-wait border-mint-line bg-mint-wash text-ink"
          : "text-steel hover:text-ink disabled:opacity-50",
        className,
      )}
    >
      {working ? (
        <>
          {/* A shimmer sweeping the button is cheap, honest motion: it only
              says "alive", which is exactly the claim being made. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 -translate-x-full animate-[working-sweep_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-mint/15 to-transparent"
          />
          <Loader2 className="size-3.5 animate-spin text-mint-deep" />
          <span className="relative">{label}</span>
        </>
      ) : (
        <>
          {idleIcon}
          {idleLabel}
        </>
      )}
    </button>
  );
}
