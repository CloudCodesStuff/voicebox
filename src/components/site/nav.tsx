"use client";

import { Menu, X } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import { SiteButton } from "@/components/site/button";
import { EASE, Magnetic, ScrollProgress } from "@/components/site/motion";
import { SiteWordmark } from "@/components/site/wordmark";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/changelog", label: "Changelog" },
  { href: "/blog", label: "Blog" },
];

/**
 * A floating glass bar. A soft highlight slides under whichever link you
 * point at; the bar tucks away while you read down the page and returns as
 * soon as you scroll up; a thin line along its bottom edge fills as you go.
 * On phones the links move into a menu.
 */
export function SiteNav() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 8);
    if (y < 160 || open) setHidden(false);
    else if (y > prev + 4) setHidden(true);
    else if (y < prev - 4) setHidden(false);
  });

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-4"
      animate={{ y: hidden ? "-120%" : "0%" }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <div
        className={cn(
          "relative mx-auto max-w-[1040px] overflow-hidden rounded-[18px] border backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-500",
          scrolled || open
            ? "border-white/[0.1] bg-[#0B0B0E]/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_50px_-20px_rgba(0,0,0,0.9)]"
            : "border-white/[0.06] bg-[#0B0B0E]/35",
        )}
      >
        <div className="flex h-14 items-center gap-2 pl-5 pr-2">
          <Link
            href="/"
            aria-label="Voicebox home"
            className="mr-auto rounded-md outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-mint/50"
          >
            <SiteWordmark />
          </Link>

          <nav className="hidden items-center lg:flex" onMouseLeave={() => setHover(null)}>
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onMouseEnter={() => setHover(l.href)}
                className="relative isolate rounded-[10px] px-3.5 py-2 text-[14px] text-ink/75 transition-colors duration-200 hover:text-ink"
              >
                {hover === l.href && (
                  <motion.span
                    layoutId="nav-hover"
                    className="absolute inset-0 -z-10 rounded-[10px] bg-white/[0.07]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 lg:ml-3">
            <Link
              href="/signin"
              className="hidden rounded-[10px] px-3.5 py-2 text-[14px] text-ink/75 transition-colors hover:bg-white/[0.07] hover:text-ink sm:block"
            >
              Sign in
            </Link>
            <Magnetic>
              <SiteButton asChild variant="signal" size="sm">
                <Link href="/signin">Start free</Link>
              </SiteButton>
            </Magnetic>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className="grid size-9 place-items-center rounded-[10px] text-ink/80 transition-colors hover:bg-white/[0.07] hover:text-ink lg:hidden"
            >
              {open ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.nav
              key="menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="border-t border-white/[0.07] lg:hidden"
            >
              <ul className="px-2 py-2">
                {[...LINKS, { href: "/signin", label: "Sign in" }].map((l, i) => (
                  <motion.li
                    key={l.href + l.label}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.04, duration: 0.3, ease: EASE }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-[10px] px-3 py-3 text-[16px] text-ink/85 transition-colors hover:bg-white/[0.06] hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.nav>
          )}
        </AnimatePresence>

        <ScrollProgress />
      </div>
    </motion.header>
  );
}
