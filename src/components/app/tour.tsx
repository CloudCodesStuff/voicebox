"use client";

import { ArrowRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   The first-visit tour

   Four stops, not fourteen. A tour earns its interruption only if it points at
   the things you would otherwise have to discover by clicking everything, so
   this one names the two ideas the product is actually built on (feedback
   becomes themes; themes get ranked) and then gets out of the way.

   It targets real elements by `data-tour` attribute and moves a spotlight over
   them, rather than describing the UI in the abstract. Anything not on screen
   is skipped rather than pointed at emptily.

   Seen-state is one localStorage key. There is no server round trip, because
   a tour that fails to appear is a much smaller problem than a dashboard that
   waits on a query before it renders.
--------------------------------------------------------------------------- */

const STORAGE_KEY = "voicebox.tourSeen.v1";

type Stop = {
  target: string;
  title: string;
  body: string;
  placement?: "right" | "bottom";
};

const STOPS: Stop[] = [
  {
    target: "nav-inbox",
    title: "Everything lands here",
    body: "Every submission, newest first, with sentiment already scored. Filter by type, or search, including by the email someone left.",
    placement: "right",
  },
  {
    target: "nav-themes",
    title: "Grouped into themes",
    body: "One problem, however many ways people described it. “Export is slow” and “the download keeps failing” end up in the same theme, so the count is people affected, not words counted.",
    placement: "right",
  },
  {
    target: "nav-trends",
    title: "Whether it's getting better",
    body: "Sentiment over time, so you can tell a bad week from a bad direction.",
    placement: "right",
  },
  {
    target: "nav-widget",
    title: "Make it yours",
    body: "Colour, copy, corners, and where it sits. Every change previews live, and saved changes reach your site within a minute.",
    placement: "right",
  },
];

export function Tour({ enabled }: { enabled: boolean }) {
  const [index, setIndex] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Start only when there is something to point at. Deferred a frame so the
  // sidebar has painted and getBoundingClientRect returns real numbers.
  useEffect(() => {
    if (!enabled) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const id = window.setTimeout(() => {
      const first = document.querySelector(`[data-tour="${STOPS[0]!.target}"]`);
      if (first) setIndex(0);
    }, 600);
    return () => window.clearTimeout(id);
  }, [enabled]);

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    setIndex(null);
  }, []);

  // Track the current target's position, and follow it if the window moves.
  useEffect(() => {
    if (index === null) return;

    const measure = () => {
      const node = document.querySelector(`[data-tour="${STOPS[index]!.target}"]`);
      setRect(node ? node.getBoundingClientRect() : null);
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [index]);

  // Escape leaves, arrows move. A modal you can't dismiss from the keyboard is
  // a trap, and this one covers the whole screen.
  useEffect(() => {
    if (index === null) return;
    const current = index;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (current + 1 >= STOPS.length) finish();
        else setIndex(current + 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, finish]);

  if (index === null) return null;

  const stop = STOPS[index]!;
  const isLast = index === STOPS.length - 1;

  // Position the card beside the highlight, clamped into the viewport so a
  // target near the bottom edge doesn't push it off screen.
  const cardTop = rect
    ? Math.min(Math.max(rect.top - 8, 16), window.innerHeight - 240)
    : 120;
  const cardLeft = rect ? rect.right + 16 : 96;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Product tour"
      className="fixed inset-0 z-[60]"
    >
      {/* Dim everything, then cut a hole over the target with a huge outward
          shadow. One element, no four-rectangle mask maths. */}
      <div
        className="absolute inset-0 bg-ink/60 transition-opacity duration-200"
        onClick={finish}
        aria-hidden="true"
        style={
          rect
            ? {
                background: "transparent",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.62)",
                position: "absolute",
                top: rect.top - 4,
                left: rect.left - 4,
                width: rect.width + 8,
                height: rect.height + 8,
                borderRadius: 10,
                transition: "all 220ms cubic-bezier(0.22,1,0.36,1)",
              }
            : undefined
        }
      />

      {rect && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-[10px] ring-2 ring-mint transition-all duration-200"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
        />
      )}

      <div
        className={cn(
          "absolute w-[19rem] rounded-xl border border-line-strong bg-paper-2 p-5",
          "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]",
        )}
        style={{ top: cardTop, left: cardLeft }}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="tnum text-[0.72rem] font-medium text-mint-deep">
            {index + 1} of {STOPS.length}
          </span>
          <button
            type="button"
            onClick={finish}
            aria-label="Skip the tour"
            className="-mt-1 -mr-1 grid size-7 place-items-center rounded-md text-steel transition-colors hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <h2 className="mt-2 text-[1rem] font-semibold tracking-tight text-ink">
          {stop.title}
        </h2>
        <p className="mt-1.5 text-[0.85rem] leading-relaxed text-steel">
          {stop.body}
        </p>

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={finish}
            className="text-[0.82rem] font-medium text-steel transition-colors hover:text-ink"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => (isLast ? finish() : setIndex(index + 1))}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-mint px-3.5 text-[0.84rem] font-semibold text-mint-ink transition-all hover:brightness-105"
          >
            {isLast ? "Got it" : "Next"}
            {!isLast && <ArrowRight className="size-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Lets the user run it again from Settings. */
export function resetTour() {
  localStorage.removeItem(STORAGE_KEY);
}
