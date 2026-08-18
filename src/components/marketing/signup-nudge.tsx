"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";

const DISMISS_KEY = "vb-nudge-dismissed";

/**
 * The bottom-right signup nudge on the landing page.
 *
 * Earned, not immediate: it appears after real engagement (60% scroll depth
 * or 20 seconds, whichever comes first), never for someone who already
 * dismissed it, and it sits above the live widget trigger rather than on top
 * of it — the corner already has a tenant on this page.
 */
export function SignupNudge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;

    let done = false;
    const fire = () => {
      if (done) return;
      done = true;
      setShow(true);
      cleanup();
    };

    const onScroll = () => {
      const depth =
        (window.scrollY + window.innerHeight) /
        document.documentElement.scrollHeight;
      if (depth > 0.6) fire();
    };

    const timer = window.setTimeout(fire, 20_000);
    window.addEventListener("scroll", onScroll, { passive: true });

    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
    return cleanup;
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <aside
      aria-label="Sign up"
      // Bottom-left: the live widget trigger owns the right corner. Desktop
      // only; on smaller screens it would sit on top of the content.
      className="fixed bottom-5 left-5 z-40 hidden w-[300px] rounded-xl border border-line bg-paper-2 p-4 shadow-[0_20px_48px_-16px_rgba(0,0,0,0.6)] lg:block motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-md text-faint transition-colors hover:bg-muted hover:text-ink"
      >
        <X className="size-3.5" />
      </button>

      <p className="pr-6 text-[0.9rem] font-semibold text-ink">
        Four minutes to your first feedback.
      </p>
      <p className="mt-1 text-[0.8rem] leading-relaxed text-steel">
        Free for 25 replies a month, AI included. No card.
      </p>
      <Image
        src="/hero-poster.jpg"
        alt="The Voicebox dashboard: themes ranked by priority"
        width={810}
        height={416}
        className="mt-3 rounded-lg border border-line"
      />
      <Link
        href="/signin"
        className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-ink text-[0.83rem] font-semibold text-paper transition-opacity hover:opacity-90"
      >
        Start free
        <ArrowRight className="size-3.5" />
      </Link>
    </aside>
  );
}
