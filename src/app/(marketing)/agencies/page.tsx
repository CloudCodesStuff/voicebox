import type { Metadata } from "next";
import { FolderKanban, Paintbrush, Stamp } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal, RevealGroup } from "@/components/marketing/motion";
import {
  CtaButton,
  Eyebrow,
  Lede,
  Section,
  SectionHeading,
} from "@/components/marketing/primitives";
import { plans, site } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

const scale = plans[2];

export const metadata: Metadata = pageMetadata({
  title: "For agencies",
  description: `One feedback widget on every client site, one dashboard for all of them. The widget matches each brand on its own. $${scale.priceMonthly} covers unlimited projects.`,
  path: "/agencies",
});

/* The page the outreach points at. An agency landing here has usually just
   seen a screenshot of the widget on one of their own client sites, so the
   job is to confirm the mechanics: per-client projects, self-matching
   styling, their branding, and the price math. */

const points = [
  {
    icon: Paintbrush,
    title: "It styles itself",
    body: "One script tag. The widget reads the site's colors, corners and font and matches them, so a Webflow build and a Shopify store each get a widget that looks native.",
  },
  {
    icon: FolderKanban,
    title: "A project per client",
    body: "Each client gets their own widget key, their own themes, their own trends. Nothing bleeds between accounts.",
  },
  {
    icon: Stamp,
    title: "Your name on it",
    body: "From Pro up, the widget carries your branding, not ours. Feedback reporting becomes a line on your retainer.",
  },
];

const steps = [
  { n: "1", text: "Add a project and paste the tag on the client's site." },
  { n: "2", text: "The widget matches their brand. Feedback starts arriving." },
  { n: "3", text: "AI groups it into themes, ranked by priority." },
  { n: "4", text: "Export the ranked list for the monthly call." },
];

const agencyFaqs = [
  {
    q: "Can I remove the Voicebox branding?",
    a: "Yes. On Pro and Scale the widget carries your branding, not ours.",
  },
  {
    q: "Do my clients need accounts?",
    a: "No. Your team runs the dashboard, and clients get the ranked list as a CSV export or in your monthly report.",
  },
  {
    q: "Which platforms does it work on?",
    a: "Anywhere you can paste a script tag: Webflow, Framer, Shopify, WordPress, Next.js, Rails, plain HTML.",
  },
  {
    q: "What happens when a client leaves?",
    a: "Export their feedback as CSV, then delete the project. Deleted means deleted.",
  },
  {
    q: "Can I start with one client?",
    a: "Free covers one project and 25 submissions a month. Put it on one client site, show them their first themes, then decide.",
  },
];

export default function AgenciesPage() {
  return (
    <>
      <Section className="pb-0 md:pb-0">
        <div className="text-center">
          <Reveal>
            <Eyebrow>For agencies and studios</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <SectionHeading as="h1" className="mx-auto mt-5 max-w-[22ch]">
              Every client site. One feedback dashboard.
            </SectionHeading>
          </Reveal>
          <Reveal delay={0.1}>
            <Lede className="mx-auto mt-6 text-center">
              A project per client, a widget that matches each brand on its
              own, and a ranked list of what their users want fixed.
            </Lede>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 pb-24 md:pb-32">
              <CtaButton href="/signin" variant="accent">
                Start free
              </CtaButton>
              <CtaButton href="/pricing" variant="ghost">
                See pricing
              </CtaButton>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section tone="white">
        <RevealGroup className="grid gap-5 md:grid-cols-3">
          {points.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-line bg-paper p-6"
            >
              <p.icon className="size-5 text-mint-deep" aria-hidden />
              <h2 className="mt-4 text-[1.05rem] font-bold tracking-tight text-ink">
                {p.title}
              </h2>
              <p className="mt-2 text-[0.93rem] leading-relaxed text-steel">
                {p.body}
              </p>
            </div>
          ))}
        </RevealGroup>
      </Section>

      <Section>
        <div className="grid items-start gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Reveal>
              <Eyebrow>Per client</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <SectionHeading className="mt-5 max-w-[16ch]">
                The monthly report writes itself.
              </SectionHeading>
            </Reveal>
            <Reveal delay={0.1}>
              <Lede className="mt-6">
                &ldquo;What should we fix next?&rdquo; gets answered with the
                client&apos;s own users&apos; words, grouped and ranked.
              </Lede>
            </Reveal>
          </div>

          <RevealGroup className="grid gap-3" delay={0.1}>
            {steps.map((s) => (
              <div
                key={s.n}
                className="flex items-center gap-4 rounded-xl border border-line bg-paper-2 px-5 py-4"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-mint-wash text-[0.8rem] font-bold text-mint-deep">
                  {s.n}
                </span>
                <p className="text-[0.93rem] text-ink">{s.text}</p>
              </div>
            ))}
          </RevealGroup>
        </div>
      </Section>

      <Section tone="white">
        <div className="text-center">
          <Reveal>
            <Eyebrow>The math</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <SectionHeading className="mx-auto mt-5 max-w-[24ch]">
              ${scale.priceMonthly} a month. Unlimited projects and seats.
            </SectionHeading>
          </Reveal>
          <Reveal delay={0.1}>
            <Lede className="mx-auto mt-6 text-center">
              Ten clients on Scale is ${(scale.priceMonthly / 10).toFixed(2)}{" "}
              per client, with {scale.feedbackPerMonth.toLocaleString()} pieces
              of feedback a month across all of them. What you bill for the
              reporting is your business.
            </Lede>
          </Reveal>
        </div>
      </Section>

      <Section>
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Reveal>
              <Eyebrow>Questions</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <SectionHeading className="mt-5">
                The agency specifics.
              </SectionHeading>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <Accordion type="single" collapsible className="w-full">
              {agencyFaqs.map((faq) => (
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
            Put it on one client site this week.
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
            mainEntity: agencyFaqs.map((f) => ({
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
                name: "For agencies",
                item: `${site.url}/agencies`,
              },
            ],
          }),
        }}
      />
    </>
  );
}
