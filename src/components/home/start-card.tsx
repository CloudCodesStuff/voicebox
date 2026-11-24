import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import { SiteButton } from "@/components/site/button";
import { Spectrum } from "@/components/site/spectrum";
import { plans } from "@/lib/site";

const free = plans[0];

const FACTS = [
  `${free.projects} project and ${free.seats} seat, free for good`,
  `${free.feedbackPerMonth} replies a month, with the analysis on`,
  "The MCP server for your coding agent",
  "No card, and you can export everything",
];

/** The closing card: the same hairline-gradient frame as a plan, with the spectrum along its top. */
export function StartCard() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="absolute -inset-10 -z-10 rounded-[48px] bg-mint/[0.07] blur-3xl" aria-hidden />
      <div className="rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04))] p-px shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)]">
        <div className="overflow-hidden rounded-[23px] bg-[#0A0A0C]">
          <div className="relative h-[112px] overflow-hidden border-b border-white/[0.08]">
            <div className="absolute inset-x-0 bottom-0">
              <Spectrum height={112} seed={3} />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0A0A0C] via-[#0A0A0C]/40 to-transparent" />
          </div>
          <div className="px-6 pb-6 pt-6 sm:px-7">
            <h3 className="display text-[30px] leading-[1.05] text-ink">Start free</h3>
            <p className="mt-2 text-[14.5px] font-light leading-[1.55] text-steel">
              Sign in, copy one script tag, and your first reply shows up on the setup screen.
            </p>

            <ul className="mt-6 space-y-3">
              {FACTS.map((f) => (
                <li key={f} className="flex gap-3 text-[14.5px] leading-snug text-ink/90">
                  <Check className="mt-0.5 size-4 shrink-0 text-mint" strokeWidth={2.5} aria-hidden />
                  {f}
                </li>
              ))}
            </ul>

            <SiteButton asChild variant="signal" size="lg" className="group mt-7 w-full">
              <Link href="/signin">
                Start free
                <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </SiteButton>
          </div>
        </div>
      </div>
    </div>
  );
}
