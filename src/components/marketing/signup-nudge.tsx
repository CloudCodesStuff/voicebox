"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";

import { SiteButton } from "@/components/site/button";

const DISMISS_KEY = "vb-nudge-dismissed";

/**
 * The bottom-left signup nudge on the landing page.
 *
 * Earned, not immediate: it appears after real engagement (60% scroll depth
 * or 20 seconds, whichever comes first), never for someone who already
 * dismissed it, and it sits on the opposite side from the live widget
 * trigger rather than on top of it — the right corner already has a tenant
 * on this page.
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
        (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
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
      className="fixed bottom-5 left-5 z-40 hidden w-[300px] rounded-[16px] border border-white/[0.1] bg-[#0B0B0E]/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_30px_70px_-20px_rgba(0,0,0,0.95)] backdrop-blur-md lg:block motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2.5 top-2.5 grid size-7 cursor-pointer place-items-center rounded-md text-faint transition-colors hover:bg-white/[0.07] hover:text-ink"
      >
        <X className="size-3.5" />
      </button>

      <p className="pr-6 text-[0.95rem] font-semibold tracking-[-0.01em] text-ink">
        Four minutes to your first feedback.
      </p>
      <p className="mt-1 text-[0.82rem] leading-relaxed text-steel">
        Free for 25 replies a month, insights included. No card.
      </p>
      <Image
        src="/hero-poster.jpg"
        alt="The Voicebox dashboard: themes ranked by priority"
        width={810}
        height={416}
        className="mt-3 rounded-[10px] border border-line"
      />
      <SiteButton asChild variant="signal" size="md" className="group mt-3 w-full">
        <Link href="/signin">
          Start free
          <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </SiteButton>
    </aside>
  );
}
