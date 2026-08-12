import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Shared typography for the legal pages, so Terms and Privacy read as one document set. */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[68ch]">
        <div className="text-[0.8rem] font-medium text-mint-deep">
          Legal
        </div>
        <h1 className="mt-4 text-[clamp(2rem,4vw,2.9rem)] font-bold leading-[1.08] tracking-[-0.02em] text-ink">
          {title}
        </h1>
        <p className="mt-4 text-[0.82rem] text-steel">
          Last updated {updated}
        </p>

        {intro && (
          <div className="mt-8 rounded-2xl border border-line bg-paper-2 p-6 text-[0.94rem] leading-relaxed text-steel">
            {intro}
          </div>
        )}

        <div className="mt-12 space-y-10">{children}</div>
      </div>
    </div>
  );
}

export function Clause({
  n,
  heading,
  children,
  className,
}: {
  n: string;
  heading: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("scroll-mt-24", className)}>
      <h2 className="text-[1.15rem] font-bold tracking-tight text-ink">
        <span className="mr-3 font-mono text-[0.78rem] font-medium tracking-widest text-mint-deep">
          {n}
        </span>
        {heading}
      </h2>
      <div className="mt-4 space-y-4 text-[0.95rem] leading-relaxed text-steel [&_a]:text-ink [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}
