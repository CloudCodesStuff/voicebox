import { ArrowUp } from "lucide-react";
import Link from "next/link";

import { SiteButton } from "@/components/site/button";
import { Spectrum } from "@/components/site/spectrum";
import { SiteWordmark } from "@/components/site/wordmark";
import { site } from "@/lib/site";

const columns = [
  {
    heading: "Product",
    links: [
      { href: "/#how", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/agencies", label: "For agencies" },
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
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

function Tick({ className }: { className: string }) {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 9 9"
      aria-hidden
      className={`pointer-events-none absolute z-10 text-white/25 ${className}`}
    >
      <path d="M4.5 0v9M0 4.5h9" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="relative mx-auto max-w-[1120px] border-x border-line">
        <Tick className="-left-[5px] -top-[5px]" />
        <Tick className="-right-[5px] -top-[5px]" />

        {/* top: brand + links */}
        <div className="grid gap-12 px-6 py-16 sm:px-10 lg:grid-cols-[1.1fr_2.4fr]">
          <div>
            <SiteWordmark />
            <p className="mt-4 max-w-[300px] text-[15px] font-light leading-[1.55] text-steel">
              {site.description}
            </p>
            <div className="mt-6">
              <SiteButton asChild variant="signal">
                <Link href="/signin">Start free</Link>
              </SiteButton>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {columns.map((c) => (
              <div key={c.heading}>
                <p className="text-[13px] text-faint">{c.heading}</p>
                <ul className="mt-4 space-y-2.5 text-[14.5px]">
                  {c.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link
                        href={l.href}
                        className="link-line text-ink/80 transition-colors hover:text-ink"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* the spectrum, with the name sitting in it */}
        <div className="relative h-[240px] overflow-hidden border-t border-line sm:h-[320px]">
          <div className="absolute inset-x-0 bottom-0">
            <Spectrum height={320} seed={5} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-transparent" />
          <p
            aria-hidden
            className="display pointer-events-none absolute inset-x-0 -bottom-[0.2em] select-none text-center text-[21vw] leading-none text-transparent sm:text-[160px] lg:text-[208px]"
            style={{
              WebkitTextStroke: "1px rgba(255,255,255,0.14)",
              backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            voicebox
          </p>
        </div>

        {/* bottom bar */}
        <div className="flex flex-col gap-3 border-t border-line px-6 py-5 font-mono text-[11.5px] text-faint sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <span>
            © {new Date().getFullYear()} {site.legalEntity}
          </span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/privacy" className="link-line transition-colors hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="link-line transition-colors hover:text-ink">
              Terms
            </Link>
            <Link href="/dpa" className="link-line transition-colors hover:text-ink">
              DPA
            </Link>
            <a href="#top" className="link-line flex items-center gap-1.5 transition-colors hover:text-ink">
              Back to top <ArrowUp className="size-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
