import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/marketing/motion";
import {
  Eyebrow,
  Lede,
  Section,
  SectionHeading,
} from "@/components/marketing/primitives";
import { site } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: `How to reach ${site.name}: support, security reports, billing, and legal notice. Email reaches a founder, typically within one business day.`,
  path: "/contact",
});

/* Trust-anchor page. Every channel listed here is real and read; nothing is
   listed for decoration. Notice is served by email, which the Terms state
   explicitly — there is deliberately no postal address on this site. */

const channels = [
  {
    title: "Support",
    body: `Anything about using ${site.name}: setup, the widget, billing, plans, exports, deleting data. Replies typically land within one business day, often much sooner.`,
    action: { label: site.supportEmail, href: `mailto:${site.supportEmail}` },
  },
  {
    title: "Security reports",
    body: `Found a vulnerability? Email with "security" in the subject line and it goes to the top of the pile. Please include steps to reproduce; we'll acknowledge within two business days and keep you posted through the fix.`,
    action: {
      label: site.supportEmail,
      href: `mailto:${site.supportEmail}?subject=Security`,
    },
  },
  {
    title: "The quick question lane",
    body: `The widget in the corner of this page is the live product. If your question fits in a sentence, that works too — it lands in the same dashboard we ship with.`,
    action: null,
  },
];

export default function ContactPage() {
  return (
    <>
      <Section className="pb-0 md:pb-0">
        <div className="text-center">
          <Reveal>
            <Eyebrow>Contact</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <SectionHeading as="h1" className="mx-auto mt-5 max-w-[22ch]">
              Email reaches a founder, not a queue.
            </SectionHeading>
          </Reveal>
          <Reveal delay={0.1}>
            <Lede className="mx-auto mt-6 pb-24 text-center md:pb-32">
              {site.name} is run by {site.legalEntity}. There is no phone tree
              and no ticket deflection bot; there is an inbox that gets read.
            </Lede>
          </Reveal>
        </div>
      </Section>

      <Section tone="white">
        <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-3">
          {channels.map((c) => (
            <Reveal key={c.title}>
              <div className="flex h-full flex-col rounded-xl border border-line bg-paper p-6">
                <h2 className="text-[1.05rem] font-bold tracking-tight text-ink">
                  {c.title}
                </h2>
                <p className="mt-2 flex-1 text-[0.93rem] leading-relaxed text-steel">
                  {c.body}
                </p>
                {c.action && (
                  <a
                    href={c.action.href}
                    className="mt-4 text-[0.9rem] font-semibold text-mint-deep hover:underline"
                  >
                    {c.action.label}
                  </a>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mx-auto mt-12 max-w-[64ch] text-center text-[0.9rem] leading-relaxed text-steel">
            Also on X as{" "}
            <a
              href="https://x.com/usevoicebox"
              rel="noopener noreferrer"
              target="_blank"
              className="font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
            >
              {site.twitter}
            </a>
            . Formal legal notice to {site.legalEntity} is served by email per
            the{" "}
            <Link
              href="/terms"
              className="font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
            >
              Terms
            </Link>
            , which is what makes it binding — no paper required.
          </p>
        </Reveal>
      </Section>
    </>
  );
}
