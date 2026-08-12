import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* Shared marketing layout primitives. Every page composes from these so the
   vertical rhythm and type scale can't drift page to page. */

export function Section({
  children,
  className,
  id,
  tone = "paper",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "paper" | "ink" | "white";
}) {
  return (
    <section
      id={id}
      className={cn(
        "px-6 py-24 md:py-32",
        tone === "paper" && "bg-paper text-ink",
        tone === "white" && "bg-paper-2 text-ink",
        tone === "ink" && "border-y border-line bg-paper-2 text-ink",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-[0.8rem] font-medium text-mint-deep", className)}>
      {children}
    </div>
  );
}

export function SectionHeading({
  children,
  className,
  as: Tag = "h2",
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag
      className={cn(
        "text-[clamp(1.85rem,3.6vw,2.7rem)] font-bold leading-[1.1] tracking-[-0.025em]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Lede({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "max-w-[56ch] text-[1.02rem] leading-relaxed text-steel",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function CtaButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost" | "accent";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-6 py-3 text-[0.95rem] font-medium transition-all duration-200 active:scale-[0.98]",
        // The primary action. A vertical gradient and an inset highlight give
        // it a physical edge; mint is too light for white text, so the label
        // is near-black and the whole thing still reads as one bright control.
        variant === "accent" &&
          "bg-gradient-to-b from-[#2AEFB4] to-[#00BE89] text-mint-ink shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.45)] hover:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,229,160,0.35),inset_0_1px_0_rgba(255,255,255,0.5)]",
        variant === "primary" &&
          "bg-ink text-paper hover:opacity-90",
        variant === "ghost" &&
          "bg-paper-2 text-ink shadow-[0_1px_2px_rgba(0,0,0,0.25)] ring-1 ring-line-strong hover:bg-sunken",
        className,
      )}
    >
      {children}
    </Link>
  );
}
