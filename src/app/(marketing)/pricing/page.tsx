import type { Metadata } from "next";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/marketing/motion";
import {
  CtaButton,
  Eyebrow,
  Lede,
  Section,
  SectionHeading,
} from "@/components/marketing/primitives";
import { plans, site } from "@/lib/site";

import { PricingTable } from "./pricing-table";
import { pageMetadata } from "@/lib/seo";

const [, pro, scale] = plans;

export const metadata: Metadata = pageMetadata({
  title: "Pricing",
  description: `Free for 50 pieces of feedback a month, then $${pro.priceMonthly} or $${scale.priceMonthly}. The AI is on every plan. Cancel any time.`,
  path: "/pricing",
});

const billingFaqs = [
  {
    q: "What counts toward my limit?",
    a: "One submission. Analysis, regrouping, exports and dashboard use are all unmetered.",
  },
  {
    q: "Why is the AI on the free plan?",
    a: "Because it's the point of the product. A feedback list with no themes is a worse spreadsheet. Free gets sentiment, themes and ranking on all 50 items.",
  },
  {
    q: "What happens if I go over?",
    a: "We keep accepting feedback up to a hard ceiling. What pauses is analysis on the excess, until the period resets or you upgrade. Nothing stored is affected.",
  },
  {
    q: "Can I use one account for several products?",
    a: "Yes. Each project has its own widget, its own key and its own themes. Agencies run one per client.",
  },
  {
    q: "Can I cancel?",
    a: "Any time, from the billing page. You drop to the free plan at the end of the period you paid for, and keep your history.",
  },
  {
    q: "Is there an annual discount?",
    a: "Annual costs ten months instead of twelve.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Section className="pb-0 md:pb-0">
        <div className="text-center">
          <Reveal>
            <Eyebrow>Pricing</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <SectionHeading as="h1" className="mx-auto mt-5 max-w-[20ch]">
              The AI is on every plan, including free.
            </SectionHeading>
          </Reveal>
          <Reveal delay={0.1}>
            <Lede className="mx-auto mt-6 text-center">
              Priced on how much feedback you collect, not on which features you
              get to use.
            </Lede>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="mt-14">
          <PricingTable />
        </Reveal>
      </Section>

      <Section tone="white">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Reveal>
              <Eyebrow>Billing</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <SectionHeading className="mt-5">Straight answers.</SectionHeading>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <Accordion type="single" collapsible className="w-full">
              {billingFaqs.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q} className="border-line">
                  <AccordionTrigger className="py-5 text-left text-[1.02rem] font-bold tracking-tight text-ink hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-[0.93rem] leading-relaxed text-steel">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </Section>

      <Section tone="ink" className="text-center">
        <Reveal>
          <SectionHeading className="mx-auto max-w-[20ch]">
            Fifty pieces is enough to see your first themes.
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: billingFaqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: site.url },
              {
                "@type": "ListItem",
                position: 2,
                name: "Pricing",
                item: `${site.url}/pricing`,
              },
            ],
          }),
        }}
      />
    </>
  );
}
