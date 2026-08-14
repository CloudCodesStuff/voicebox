import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { comparisons } from "@/lib/comparisons";
import { site } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: `Compare ${site.name}`,
  description: `How ${site.name} compares with Canny, Featurebase, Hotjar and Usersnap, including what each of them is better at. Pricing verified August 2026.`,
  path: "/vs",
});

export default function CompareIndex() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <h1 className="text-[2.3rem] font-bold tracking-[-0.03em] text-ink">
        Compare {site.name}
      </h1>
      <p className="mt-4 max-w-[64ch] text-[1.05rem] leading-relaxed text-steel">
        One page per alternative. Each says what the other tool is better
        at, what it costs and what it meters on, with the date the
        pricing was checked. We make one of these products, so the pages are
        written to be useful to someone who might reasonably pick the other one.
      </p>

      <ul className="mt-10 space-y-3">
        {comparisons.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/vs/${c.slug}`}
              className="group block rounded-xl border border-line bg-paper-2 p-5 transition-colors hover:border-steel"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[1.05rem] font-semibold text-ink">
                  {site.name} vs {c.name}
                </span>
                <ArrowRight className="size-4 shrink-0 text-steel transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-1.5 max-w-[68ch] text-[0.9rem] leading-relaxed text-steel">
                {c.name} is {c.what}.
              </p>
              <p className="mt-2 text-[0.8rem] text-faint">
                {c.pricingModel} pricing · verified {c.verifiedOn}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-[0.92rem] text-steel">
        Want all of them side by side?{" "}
        <Link
          href="/blog/best-feedback-widget-reddit"
          className="text-ink underline underline-offset-2"
        >
          The full round-up
        </Link>{" "}
        covers the four categories these tools fall into and when to pick none
        of them.
      </p>
    </div>
  );
}
