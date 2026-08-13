import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { comparisons } from "@/lib/comparisons";
import { postsByDate } from "@/lib/blog";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Practical writing on collecting user feedback, choosing a feedback tool, and turning a pile of replies into a list of things to fix.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <h1 className="text-[2.3rem] font-bold tracking-[-0.03em] text-ink">
        Blog
      </h1>
      <p className="mt-4 max-w-[64ch] text-[1.05rem] leading-relaxed text-steel">
        How to collect feedback people actually write, how to tell which tool
        fits, and what to do once the replies pile up. Everything here states
        its tradeoffs, including ours.
      </p>

      <ul className="mt-10 divide-y divide-line border-t border-line">
        {postsByDate.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/blog/${p.slug}`}
              className="group flex flex-col gap-2 py-7 transition-opacity hover:opacity-90"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.76rem] text-steel">
                <span className="rounded-full border border-line px-2 py-0.5">
                  {p.category}
                </span>
                <span>{p.readingMinutes} min read</span>
              </div>
              <h2 className="max-w-[54ch] text-[1.25rem] font-semibold leading-snug tracking-[-0.015em] text-ink">
                {p.title}
              </h2>
              <p className="max-w-[68ch] text-[0.94rem] leading-relaxed text-steel">
                {p.description}
              </p>
              <span className="mt-1 inline-flex items-center gap-1.5 text-[0.85rem] font-medium text-mint-deep">
                Read
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-16">
        <h2 className="text-[1.3rem] font-bold tracking-tight text-ink">
          Compared with other tools
        </h2>
        <p className="mt-2 max-w-[64ch] text-[0.95rem] leading-relaxed text-steel">
          One page per alternative, each saying what they are genuinely better
          at. If a comparison page never lets the other tool win, it is an
          advert.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {comparisons.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/vs/${c.slug}`}
                className="group block rounded-xl border border-line bg-paper-2 p-4 transition-colors hover:border-steel"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[0.95rem] font-semibold text-ink">
                    {site.name} vs {c.name}
                  </span>
                  <ArrowRight className="size-3.5 shrink-0 text-steel transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-1 text-[0.83rem] leading-relaxed text-steel">
                  {c.pricingModel} pricing, verified {c.verifiedOn}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
