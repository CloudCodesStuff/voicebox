"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Wordmark } from "@/components/marketing/brand";
import { cn } from "@/lib/utils";

// Three links. The old nav had five, two of which pointed at pages that now
// repeat what the landing page says on its way past.
const links = [
  { href: "/#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  // A visible changelog is the strongest "this product is alive" signal a
  // young product has, so it earns a top-level slot.
  { href: "/changelog", label: "Changelog" },
  { href: "/blog", label: "Blog" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300",
        // Nothing at rest: the page's own gradient runs straight through.
        // The blurred bar only appears once there is content to separate from.
        scrolled
          ? "border-b border-line/60 bg-paper/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="Voicebox home">
          <Wordmark />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[0.875rem] font-medium text-steel transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/signin"
            className="text-[0.875rem] font-medium text-steel transition-colors hover:text-ink"
          >
            Sign in
          </Link>
          <Link
            href="/signin"
            className="rounded-lg bg-mint px-4 py-2.5 text-[0.85rem] font-semibold text-mint-ink transition-all hover:brightness-[0.96]"
          >
            Start free
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 flex size-11 items-center justify-center md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto border-t border-line bg-paper px-6 py-8 md:hidden">
          <div className="flex flex-col">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 text-xl font-bold tracking-tight text-ink"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6">
            <Link
              href="/signin"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-mint px-4 py-3.5 text-center font-semibold text-mint-ink"
            >
              Start free
            </Link>
            <Link
              href="/signin"
              onClick={() => setOpen(false)}
              className="rounded-lg border-[1.5px] border-line px-4 py-3.5 text-center font-semibold text-ink"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
