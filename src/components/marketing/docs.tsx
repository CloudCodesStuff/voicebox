"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Info,
  Lightbulb,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The order of this list is the reading order.
 *
 * The pager at the foot of every page is derived from it, so a page added here
 * is automatically reachable by walking forwards from the overview. Docs where
 * a page exists but nothing links to it are how half a product goes
 * undiscovered.
 */
export const docsNav = [
  {
    heading: "Getting started",
    items: [
      { href: "/docs", label: "Overview" },
      { href: "/docs/install", label: "Install the widget" },
      { href: "/docs/triggers", label: "Triggers & JavaScript API" },
    ],
  },
  {
    heading: "Guides",
    items: [
      { href: "/docs/customize", label: "Customization" },
      { href: "/docs/security", label: "Security & privacy" },
      { href: "/docs/troubleshooting", label: "Troubleshooting" },
    ],
  },
  {
    heading: "Reference",
    items: [{ href: "/docs/api", label: "API & webhooks" }],
  },
];

/** Reading order, flattened. */
const flatNav = docsNav.flatMap((s) => s.items);

export function DocsSidebar() {
  const pathname = usePathname();
  const current = flatNav.find((item) => item.href === pathname);

  return (
    <>
      {/* Mobile: collapsed to one row.
          A stacked sidebar above the article pushed the first paragraph most
          of a screen down, so every page opened on a wall of navigation
          instead of the thing you came to read. Native <details> keeps it
          keyboard operable and open-by-default-free without any state. */}
      <details className="group rounded-xl border border-line bg-paper-2 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
          <span className="min-w-0">
            <span className="label block">Documentation</span>
            <span className="mt-0.5 block truncate text-[0.9rem] font-semibold text-ink">
              {current?.label ?? "Contents"}
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-steel transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-line px-2 pt-2 pb-3">
          <SidebarSections pathname={pathname} />
        </div>
      </details>

      <nav className="hidden lg:block">
        <SidebarSections pathname={pathname} />
      </nav>
    </>
  );
}

function SidebarSections({ pathname }: { pathname: string }) {
  return (
    <div className="space-y-6">
      {docsNav.map((section) => (
        <div key={section.heading}>
          {/* A div, not a heading. These name navigation groups rather than
              document sections, and as headings they landed in the outline
              ahead of the page's own h1. The list is labelled instead, so the
              grouping is still announced without inventing structure. */}
          <div className="label" id={`docs-group-${section.heading.replace(/\s+/g, "-").toLowerCase()}`}>
            {section.heading}
          </div>
          <ul
            aria-labelledby={`docs-group-${section.heading.replace(/\s+/g, "-").toLowerCase()}`}
            className="mt-3 space-y-0.5"
          >
            {section.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-3 py-1.5 text-[0.86rem] transition-colors",
                      active
                        ? "bg-muted font-medium text-ink"
                        : "text-steel hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * Previous and next, at the foot of every page.
 *
 * Reference docs get read in order the first time and dipped into afterwards.
 * Without this, finishing a page is a dead end that sends you back to the
 * sidebar to work out what you haven't read yet.
 */
export function DocsPager() {
  const pathname = usePathname();
  const i = flatNav.findIndex((item) => item.href === pathname);
  if (i === -1) return null;

  const prev = i > 0 ? flatNav[i - 1] : null;
  const next = i < flatNav.length - 1 ? flatNav[i + 1] : null;
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Documentation"
      className="mt-16 grid gap-3 border-t border-line pt-8 sm:grid-cols-2"
    >
      {prev ? (
        <Link
          href={prev.href}
          className="group rounded-xl border border-line p-4 transition-colors hover:border-steel"
        >
          <span className="flex items-center gap-1.5 text-[0.75rem] text-steel">
            <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" />
            Previous
          </span>
          <span className="mt-1 block text-[0.9rem] font-semibold text-ink">
            {prev.label}
          </span>
        </Link>
      ) : (
        <span />
      )}

      {next && (
        <Link
          href={next.href}
          className="group rounded-xl border border-line p-4 text-right transition-colors hover:border-steel sm:col-start-2"
        >
          <span className="flex items-center justify-end gap-1.5 text-[0.75rem] text-steel">
            Next
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="mt-1 block text-[0.9rem] font-semibold text-ink">
            {next.label}
          </span>
        </Link>
      )}
    </nav>
  );
}

/** Code block with a copy button. Docs that can't be copied are half a doc. */
export function CodeBlock({
  code,
  filename,
  className,
}: {
  code: string;
  filename?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-slab",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-slab-fg/10 px-4 py-2.5">
        <span className="tnum text-[0.7rem] text-slab-fg/40">
          {filename ?? "example"}
        </span>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 tnum text-[0.7rem] text-slab-fg/50 transition-colors hover:bg-slab-fg/10 hover:text-slab-fg"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[0.78rem] leading-relaxed text-slab-fg/85">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export type CodeTab = { label: string; filename: string; code: string };

/**
 * One snippet per stack, switchable.
 *
 * Install docs that list eight frameworks down the page make seven of them
 * noise for every reader. Tabs mean you see your own stack and nothing else,
 * and the set of tabs still tells you at a glance that yours is supported.
 */
export function CodeTabs({
  tabs,
  className,
}: {
  tabs: CodeTab[];
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const current = tabs[active]!;

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Choose your framework"
        className="flex flex-wrap gap-1 rounded-lg bg-sunken p-1"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={cn(
              "rounded-md px-3 py-1.5 text-[0.8rem] font-medium transition-colors",
              i === active
                ? "bg-paper text-ink shadow-sm"
                : "text-steel hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <CodeBlock
        className="mt-3"
        filename={current.filename}
        code={current.code}
      />
    </div>
  );
}

/**
 * A note, a warning, or a tip.
 *
 * `warning` is reserved for things that cost real time when missed: a strict
 * Content Security Policy silently blocking the script, a publishable key
 * mistaken for a secret.
 */
export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: "note" | "warning" | "tip";
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    note: { icon: Info, wrap: "border-line bg-paper-2", accent: "text-steel" },
    warning: {
      icon: AlertTriangle,
      wrap: "border-mixed/30 bg-mixed-wash",
      accent: "text-mixed",
    },
    tip: {
      icon: Lightbulb,
      wrap: "border-mint/30 bg-mint-wash",
      accent: "text-mint-deep",
    },
  }[type];

  const Icon = styles.icon;

  return (
    <div className={cn("mt-6 rounded-xl border p-4", styles.wrap)}>
      <div className="flex gap-3">
        <Icon className={cn("mt-0.5 size-4 shrink-0", styles.accent)} />
        <div className="min-w-0 flex-1">
          {title && (
            <p className="text-[0.87rem] font-semibold text-ink">{title}</p>
          )}
          <div
            className={cn(
              "text-[0.87rem] leading-relaxed text-steel",
              title && "mt-1",
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Section heading with a stable id, so every section is linkable. */
export function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="mt-12 scroll-mt-24 text-[1.25rem] font-bold tracking-tight text-ink"
    >
      {children}
    </h2>
  );
}
