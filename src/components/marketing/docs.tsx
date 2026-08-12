"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export const docsNav = [
  {
    heading: "Getting started",
    items: [
      { href: "/docs", label: "Overview" },
      { href: "/docs/install", label: "Install the widget" },
    ],
  },
  {
    heading: "Reference",
    items: [
      { href: "/docs/customize", label: "Customization" },
      { href: "/docs/api", label: "API & webhooks" },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      {docsNav.map((section) => (
        <div key={section.heading}>
          <h3 className="label">{section.heading}</h3>
          <ul className="mt-3 space-y-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
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
