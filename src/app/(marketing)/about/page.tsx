import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/marketing/motion";
import {
  CtaButton,
  Eyebrow,
  Lede,
  Section,
  SectionHeading,
} from "@/components/marketing/primitives";
import { site } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: `${site.name} is a feedback widget and analysis engine built and operated by ${site.legalEntity}. What it is, what it isn't, and the principles it runs on.`,
  path: "/about",
});

/* A trust-anchor page: the one agents and cautious buyers read to decide
   whether the company behind the product is real. Plain facts, no adjectives
   that can't be checked. */

const principles = [
  {
    title: "One thing, done properly",
    body: `${site.name} collects feedback through a widget on your site and turns it into a ranked list of what to fix. No voting boards, no roadmap theater, no support suite bolted on. Products that do one job stay understandable — to the people using them and to the person building them.`,
  },
  {
    title: "Privacy by construction, not by policy",
    body: "Only the message text, the chosen type, and the rating ever reach the analysis model. The function that calls the model accepts three fields, so emails and account traits are excluded by code, not by promise. Analysis can be switched off per workspace entirely.",
  },
  {
    title: "Honest marketing",
    body: "No invented testimonials, no borrowed logos, no fabricated counts. The widget in the corner of the site is the live product running on its own key — the demo is the product, not a video of it.",
  },
  {
    title: "Built in the open",
    body: "The changelog records what actually shipped, dated. Comparisons with other tools state what they are better at and carry the date the pricing was verified.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Section className="pb-0 md:pb-0">
        <div className="text-center">
          <Reveal>
            <Eyebrow>About</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <SectionHeading as="h1" className="mx-auto mt-5 max-w-[24ch]">
              A small company that reads what your users write.
            </SectionHeading>
          </Reveal>
          <Reveal delay={0.1}>
            <Lede className="mx-auto mt-6 pb-24 text-center md:pb-32">
              {site.name} is built and operated by {site.legalEntity}, a New
              Jersey company. One product, kept deliberately small: a feedback
              widget for your site, and an engine that groups every reply into
              a ranked list of what to fix next.
            </Lede>
          </Reveal>
        </div>
      </Section>

      <Section tone="white">
        <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
          {principles.map((p) => (
            <Reveal key={p.title}>
              <div className="h-full rounded-xl border border-line bg-paper p-6">
                <h2 className="text-[1.05rem] font-bold tracking-tight text-ink">
                  {p.title}
                </h2>
                <p className="mt-2 text-[0.93rem] leading-relaxed text-steel">
                  {p.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mx-auto mt-12 max-w-[64ch] text-center text-[0.93rem] leading-relaxed text-steel">
            Questions, security reports, or anything else:{" "}
            <a
              href={`mailto:${site.supportEmail}`}
              className="font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
            >
              {site.supportEmail}
            </a>{" "}
            reaches a founder, not a queue. More ways to reach us on the{" "}
            <Link
              href="/contact"
              className="font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
            >
              contact page
            </Link>
            . The legal details live in the{" "}
            <Link
              href="/terms"
              className="font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
            >
              terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
            >
              privacy policy
            </Link>
            .
          </p>
        </Reveal>
      </Section>

      <Section tone="ink" className="text-center">
        <Reveal>
          <SectionHeading className="mx-auto max-w-[20ch]">
            See it work on your own site.
          </SectionHeading>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="mt-10">
            <CtaButton href="/signin" variant="accent">
              Start free
            </CtaButton>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
