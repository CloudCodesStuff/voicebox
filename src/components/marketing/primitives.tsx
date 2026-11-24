import Link from "next/link";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/site/button";
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
  // One button for the whole site: see components/site/button.tsx. `accent`
  // is the single mint action on a screen, `primary` the white key, `ghost`
  // the glass one.
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({
          variant: variant === "accent" ? "signal" : variant,
          size: "lg",
        }),
        className,
      )}
    >
      {children}
    </Link>
  );
}
