import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Callout, CodeBlock } from "@/components/marketing/docs";
import { site } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Documentation",
  description: `Install the ${site.name} widget, customize it, and pull your feedback out via the API.`,
  path: "/docs",
});

const stages = [
  {
    t: "The widget collects",
    d: "A button in the corner of your site, or your own button. Renders in a shadow root so your CSS and ours can never collide, around 11KB over the wire, loaded on idle, and it never blocks your page.",
  },
  {
    t: "Ingest validates",
    d: "Submissions are checked against your project key and domain allowlist, rate-limited per IP, and screened for bots without making anyone solve a captcha.",
  },
  {
    t: "Analysis enriches",
    d: "Each one gets a sentiment score, an intent category, and a one-line summary, usually within seconds of arriving. Only the message, type, and rating are sent to the model.",
  },
  {
    t: "Clustering groups",
    d: "Feedback describing the same underlying problem is merged into a named theme, ranked by volume, sentiment and recency, so the top of the list is the thing worth fixing next.",
  },
];

const next = [
  {
    href: "/docs/install",
    t: "Install the widget",
    d: "HTML, Next.js, React, Vue, Svelte, Astro, WordPress, Shopify, Webflow, GTM",
  },
  {
    href: "/docs/triggers",
    t: "Triggers & JavaScript API",
    d: "Your own button, keyboard shortcuts, and attaching who the user is",
  },
  {
    href: "/docs/customize",
    t: "Customization",
    d: "Colors, copy, position, which questions to ask",
  },
  {
    href: "/docs/security",
    t: "Security & privacy",
    d: "Keys, domain allowlist, CSP, and exactly what data leaves the page",
  },
  {
    href: "/docs/troubleshooting",
    t: "Troubleshooting",
    d: "When the widget isn't showing up, in order of likelihood",
  },
  {
    href: "/docs/api",
    t: "API & webhooks",
    d: "Read your feedback and themes, or push events to your stack",
  },
];

export default function DocsHome() {
  return (
    <>
      <h1 className="text-[2.1rem] font-bold tracking-[-0.025em] text-ink">
        Documentation
      </h1>
      <p className="mt-4 text-[1rem] leading-relaxed text-steel">
        {site.name} is two things: a widget your users write into, and an
        analysis layer that turns what they write into a ranked list of things
        to fix. Getting the first part running takes one line.
      </p>

      <CodeBlock
        className="mt-8"
        filename="index.html"
        code={`<script async
  src="${site.url}/widget.js"
  data-project="pk_live_your_key"></script>`}
      />

      <p className="mt-4 text-[0.9rem] leading-relaxed text-steel">
        That is the whole installation. Your project key is on the{" "}
        <Link href="/app/widget" className="text-ink underline">
          Widget
        </Link>{" "}
        page in the dashboard, where the snippet comes pre-filled. Not using
        plain HTML?{" "}
        <Link href="/docs/install" className="text-ink underline">
          Every framework and site builder
        </Link>{" "}
        is one page over.
      </p>

      <Callout type="tip" title="Nothing to install first">
        No package, no build step, no SDK, and no dependency on your framework.
        If you can paste a script tag into your site, you can finish this in
        about a minute.
      </Callout>

      <h2 className="mt-12 text-[1.3rem] font-bold tracking-tight text-ink">
        How it fits together
      </h2>

      <ol className="mt-5 space-y-4">
        {stages.map((s, i) => (
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
        Where to go next
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {next.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-xl border border-line bg-paper-2 p-4 transition-colors hover:border-steel"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.9rem] font-semibold text-ink">
                {c.t}
              </span>
              <ArrowRight className="size-3.5 shrink-0 text-steel transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-1 text-[0.8rem] leading-relaxed text-steel">
              {c.d}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
