"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/errors", label: "Errors" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-[0.85rem] font-medium transition-colors",
              active ? "bg-muted text-ink" : "text-steel hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
