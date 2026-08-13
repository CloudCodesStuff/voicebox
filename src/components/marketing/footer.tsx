import Link from "next/link";

import { Wordmark } from "@/components/marketing/brand";
import { site } from "@/lib/site";

const columns = [
  {
    heading: "Product",
    links: [
      { href: "/#how", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/changelog", label: "Changelog" },
    ],
  },
  {
    heading: "Developers",
    links: [
      { href: "/docs", label: "Documentation" },
      { href: "/docs/install", label: "Install the widget" },
      { href: "/docs/triggers", label: "Triggers & JS API" },
      { href: "/docs/security", label: "Security & privacy" },
      { href: "/docs/api", label: "API reference" },
    ],
  },
  {
    heading: "Compare",
    links: [
      { href: "/vs/canny", label: "vs Canny" },
      { href: "/vs/featurebase", label: "vs Featurebase" },
      { href: "/vs/hotjar", label: "vs Hotjar" },
      { href: "/vs/usersnap", label: "vs Usersnap" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/changelog", label: "Changelog" },
      { href: `mailto:${site.supportEmail}`, label: "Contact" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-[28ch] text-[0.875rem] leading-relaxed text-steel">
              {site.description}
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h2 className="text-[0.78rem] font-medium text-steel">
                {col.heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[0.875rem] text-steel transition-colors hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.78rem] text-steel">
            © {new Date().getFullYear()} {site.legalEntity}
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-[0.78rem] text-steel transition-colors hover:text-ink"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-[0.78rem] text-steel transition-colors hover:text-ink"
            >
              Terms
            </Link>
            <Link
              href="/dpa"
              className="text-[0.78rem] text-steel transition-colors hover:text-ink"
            >
              DPA
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
