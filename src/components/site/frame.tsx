import type { ReactNode } from "react";

import { Reveal, RevealWords, TickMark } from "@/components/site/motion";
import { cn } from "@/lib/utils";

/**
 * One section of the page: a full-width hairline above, and inside it the
 * framed column (hairlines down both sides) with a cross at each top corner.
 * The frame is the page's only ornament; everything else sits inside it.
 */
export function Band({
  children,
  id,
  className,
  ticks = true,
}: {
  children: ReactNode;
  id?: string;
  className?: string;
  ticks?: boolean;
}) {
  return (
    <section id={id} className={cn("relative scroll-mt-16 border-t border-line", className)}>
      <div className="relative mx-auto max-w-[1120px] border-x border-line">
        {ticks && (
          <>
            <TickMark className="-left-[5px] -top-[5px]" />
            <TickMark className="-right-[5px] -top-[5px]" />
          </>
        )}
        {children}
      </div>
    </section>
  );
}

/** The centred heading block every band opens with: a label, a title, a line. */
export function Head({
  label,
  title,
  accent,
  sub,
  className,
}: {
  label: string;
  title: string;
  accent?: string[];
  sub?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 pb-10 pt-20 text-center sm:px-10 sm:pb-14 sm:pt-28", className)}>
      <Reveal y={8}>
        <p className="font-mono text-[12px] text-mint">{label}</p>
      </Reveal>
      <RevealWords
        text={title}
        accent={accent}
        delay={0.08}
        className="display mx-auto mt-4 max-w-[980px] text-balance text-[36px] leading-[1.04] text-ink sm:text-[52px] lg:text-[60px]"
      />
      {sub && (
        <Reveal delay={0.25}>
          <p className="mx-auto mt-6 max-w-[580px] text-[16.5px] font-light leading-[1.6] text-steel sm:text-[18px]">
            {sub}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/** The small "Example" tag that sits on every piece of demo data. */
export function ExampleTag({ children = "Example data" }: { children?: ReactNode }) {
  return (
    <span className="shrink-0 rounded-md border border-white/[0.12] px-1.5 py-px text-[11px] font-normal text-faint">
      {children}
    </span>
  );
}
