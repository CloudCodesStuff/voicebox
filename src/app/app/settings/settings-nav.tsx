"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/app/settings/general", label: "General" },
  { href: "/app/settings/projects", label: "Projects" },
  { href: "/app/settings/team", label: "Team" },
  { href: "/app/settings/developers", label: "Developers" },
  { href: "/app/settings/billing", label: "Billing" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "relative shrink-0 px-4 py-2.5 text-[0.875rem] font-medium transition-colors",
              active ? "text-ink" : "text-steel hover:text-ink",
            )}
          >
            {t.label}
            {active && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-ink" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
