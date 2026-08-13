import type { Metadata } from "next";

import { Reveal } from "@/components/marketing/motion";
import { Eyebrow, SectionHeading } from "@/components/marketing/primitives";
import { site } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Changelog",
  description: `Every change to ${site.name}: new features, fixes and improvements to the widget, the analysis and the dashboard, newest first.`,
  path: "/changelog",
});

const entries = [
  {
    date: "2026-08-11",
    version: "0.1.0",
    title: `${site.name} is live`,
    items: [
      "Embeddable widget with Shadow DOM isolation, four positions, light/dark/auto, and full copy customization.",
      "Sentiment, intent category, and a one-line summary on every submission, within seconds of arrival.",
      "Theme clustering that groups feedback by the underlying problem rather than by keyword.",
      "Priority ranking on volume × negative share × recency decay.",
      "Inbox with filters, bulk actions, and manual theme reassignment.",
      "Trends: volume and sentiment over time, split by type, with CSV export.",
      "Widget studio with a live preview and a one-line install snippet.",
      "Projects, team seats, and per-project domain allowlists.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
      <Reveal>
        <Eyebrow>Changelog</Eyebrow>
      </Reveal>
      <Reveal delay={0.05}>
        <SectionHeading as="h1" className="mt-5">
          What&apos;s new
        </SectionHeading>
      </Reveal>

      <div className="mt-14 space-y-14">
        {entries.map((entry) => (
          <Reveal key={entry.version}>
            <article className="grid gap-6 sm:grid-cols-[110px_1fr]">
              <div>
                <div className="tnum text-[0.75rem] text-steel">
                  {new Date(`${entry.date}T00:00:00`).toLocaleDateString(
                    undefined,
                    { month: "short", day: "numeric", year: "numeric" },
                  )}
                </div>
                <div className="mt-1.5 inline-block rounded-full bg-mint-wash px-2.5 py-0.5 tnum text-[0.68rem] font-semibold text-mint-deep">
                  v{entry.version}
                </div>
              </div>

              <div>
                <h2 className="text-[1.3rem] font-bold tracking-tight text-ink">
                  {entry.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {entry.items.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2.5 text-[0.92rem] leading-relaxed text-steel"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-mint"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
