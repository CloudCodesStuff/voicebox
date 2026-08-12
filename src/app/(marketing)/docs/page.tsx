import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CodeBlock } from "@/components/marketing/docs";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Documentation",
  description: `Install the ${site.name} widget, customize it, and pull your feedback out via the API.`,
  alternates: { canonical: "/docs" },
};

export default function DocsHome() {
  return (
    <>
      <h1 className="text-[2.1rem] font-bold tracking-[-0.025em] text-ink">
        Documentation
      </h1>
      <p className="mt-4 text-[1rem] leading-relaxed text-steel">
        {site.name} is two things: a widget your users write into, and an analysis
        layer that turns what they write into a ranked list of things to fix.
        Getting the first part running takes one line.
      </p>

      <CodeBlock
        className="mt-8"
        filename="index.html"
        code={`<script async
  src="https://usevoicebox.dev/widget.js"
  data-project="pk_live_your_key"></script>`}
      />

      <p className="mt-4 text-[0.9rem] leading-relaxed text-steel">
        That&apos;s the whole installation. Your project key is on the{" "}
        <Link href="/app/widget" className="text-ink underline">
          Widget
        </Link>{" "}
        page in the dashboard.
      </p>

      <h2 className="mt-12 text-[1.3rem] font-bold tracking-tight text-ink">
        How it fits together
      </h2>

      <ol className="mt-5 space-y-4">
        {[
          {
            t: "The widget collects",
            d: "Rendered in a shadow root so your CSS and ours can never collide. Under 30KB, loaded on idle, and it never blocks your page.",
          },
          {
            t: "Ingest validates",
            d: "Submissions are checked against your project key and domain allowlist, rate-limited per IP, and screened for bots without a captcha.",
          },
          {
            t: "Analysis enriches",
            d: "Each submission gets a sentiment score, an intent category, and a one-line summary within seconds of arriving.",
          },
          {
            t: "Clustering groups",
            d: "Feedback describing the same underlying problem is merged into a named theme, ranked by volume × sentiment × recency.",
          },
        ].map((s, i) => (
          <li key={s.t} className="flex gap-4">
            <span className="tnum mt-0.5 shrink-0 text-[0.75rem] text-mint-deep">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <div className="text-[0.95rem] font-semibold text-ink">{s.t}</div>
              <p className="mt-1 text-[0.88rem] leading-relaxed text-steel">
                {s.d}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="mt-12 text-[1.3rem] font-bold tracking-tight text-ink">
        Next
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { href: "/docs/install", t: "Install the widget", d: "HTML, Next.js, React" },
          { href: "/docs/customize", t: "Customization", d: "Colors, copy, behavior" },
          { href: "/docs/api", t: "API & webhooks", d: "Pull data out" },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-xl border border-line bg-paper-2 p-4 transition-colors hover:border-steel"
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.9rem] font-semibold text-ink">{c.t}</span>
              <ArrowRight className="size-3.5 text-steel transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-1 text-[0.8rem] text-steel">{c.d}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
