import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ArrowRight } from "lucide-react";

import {
  BentoCard,
  ClusterSkeleton,
  CustomiseSkeleton,
  DigestSkeleton,
  InstallSkeleton,
  ScoringSkeleton,
  WidgetSkeleton,
} from "@/components/marketing/bento";
import { BrowserFrame, DashboardMock } from "@/components/marketing/dashboard-mock";
import { FaqGroups, type FaqGroup } from "@/components/marketing/faq-groups";
import { HeroBadge } from "@/components/marketing/rating-proof";
import { Reveal, RevealGroup, ScrollPitch, WordReveal } from "@/components/marketing/motion";
import { PlanCard } from "@/components/marketing/plan-card";
import { CtaButton } from "@/components/marketing/primitives";
import { SignupNudge } from "@/components/marketing/signup-nudge";
import { plans, site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${site.name}, ${site.tagline}` },
  description: site.description,
  alternates: { canonical: "/" },
};

/**
 * Where the widget runs. Deliberately platforms, not customer logos: we have
 * no customers yet and a wall of borrowed brands would be a lie a buyer can
 * check in about four seconds.
 */
const PLATFORMS = [
  "Next.js",
  "React",
  "Vue",
  "Svelte",
  "Rails",
  "Laravel",
  "Django",
  "WordPress",
  "Webflow",
  "Framer",
  "Shopify",
  "Plain HTML",
];

const faqGroups: FaqGroup[] = [
  {
    heading: "Getting started",
    items: [
      {
        q: "How long does setup take?",
        a: "About four minutes: one script tag in your layout. The setup screen confirms the moment your first submission arrives.",
      },
      {
        q: "Will it wreck my styling?",
        a: "No. The widget renders inside a Shadow DOM root, so your CSS can't reach in and ours can't leak out.",
      },
      {
        q: "How much feedback before it's useful?",
        a: "Sentiment and summaries start with the first submission. Themes appear once around twenty pieces have been analyzed.",
      },
      {
        q: "Can I run it on more than one product?",
        a: "Yes. Every project has its own key, its own look and its own themes. Agencies run one per client.",
      },
    ],
  },
  {
    heading: "The AI",
    items: [
      {
        q: "What does it actually do to my feedback?",
        a: "Scores tone and intent, writes a one-line summary, gives it a category, then groups it with everything describing the same underlying problem. The result is ranked by how many people, how unhappy, and how recently.",
      },
      {
        q: "Does my users' writing go to a model?",
        a: "The message text does, so it can be scored and grouped. The email address they typed and anything you pass through identify() never reach a prompt. The function that calls the model only accepts three fields, so it isn't a policy, it's the code.",
      },
      {
        q: "What if the AI is wrong?",
        a: "Every theme is editable and every piece of feedback keeps its original text. The ranking is plain arithmetic: volume, negative share, recency.",
      },
    ],
  },
  {
    heading: "Billing",
    items: [
      {
        q: "What counts toward my limit?",
        a: "One submission. Analysis, regrouping, exports and dashboard use are all unmetered.",
      },
      {
        q: "What happens if I go over?",
        a: "We keep accepting feedback up to a hard ceiling. What pauses is analysis on the excess, until the period resets or you upgrade. Nothing stored is affected.",
      },
      {
        q: "Can I cancel?",
        a: "Any time, from the billing page. You drop to the free plan at the end of the period you paid for, and keep your history.",
      },
    ],
  },
];

export default function LandingPage() {
  return (
    <>
      {/* ------------------------------------------------------------ HERO */}
      <div className="relative w-full">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-28">
          <Reveal>
            <HeroBadge />
          </Reveal>

          <WordReveal
            text="Feedback in. Fix list out."
            className="mt-5 max-w-4xl text-[2.5rem] leading-[1.05] font-medium tracking-[-0.035em] text-ink md:text-7xl"
          />

          {/* This sentence, not the headline, is the one that says what the
              product actually is, so it is sized and coloured to be read
              rather than skimmed. As grey fine print under a slogan it left
              people three seconds in still not knowing what they were
              looking at. */}
          <Reveal delay={0.3}>
            <p className="mt-6 max-w-3xl text-[1.15rem] leading-relaxed text-ink/85 md:text-[1.45rem]">
              The feedback widget and analysis layer that reads every reply,
              groups it by problem, and ranks what to fix. One line to install.
            </p>
          </Reveal>

          <Reveal delay={0.38}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <CtaButton href="/signin" variant="accent">
                Start free
                <ArrowRight className="size-4" />
              </CtaButton>
              <CtaButton href="#product" variant="ghost">
                See how it works
              </CtaButton>
            </div>
          </Reveal>

          <Reveal delay={0.46}>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.84rem] text-steel">
              <span>Free up to 25 pieces of feedback a month. No card.</span>
              {/* The strongest proof a demo can give: the widget in this
                  page's corner is the real product, running live on the key
                  loaded at the bottom of this file. data-voicebox-trigger is
                  the runtime's own delegated-open hook, and clicks that land
                  before the script finishes booting are queued, not lost. */}
              <button
                type="button"
                data-voicebox-trigger
                className="inline-flex cursor-pointer items-center gap-2 font-medium text-ink transition-colors hover:text-mint-deep"
              >
                <span className="relative flex size-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-mint" />
                </span>
                Live on this page. Try the widget
              </button>
            </div>
          </Reveal>

          <Reveal delay={0.54}>
            <ScrollPitch className="mt-14 md:mt-20">
              <BrowserFrame className="mx-auto max-w-full">
                <DashboardMock className="absolute inset-0" />
              </BrowserFrame>
            </ScrollPitch>
          </Reveal>
        </div>
      </div>

      {/* -------------------------------------------------------- PLATFORMS */}
      {/* One quiet strip, not a 3x4 grid of hover-words. A grid at that size
          apes a logo wall without having logos, which reads as the absence of
          the thing it imitates. A single confident line reads as a fact. */}
      <section className="border-y border-line/60 py-9 md:py-12">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <p className="text-[0.78rem] font-medium tracking-[0.08em] text-faint uppercase">
            Runs anywhere you ship
          </p>
          <RevealGroup className="mt-4 flex flex-wrap items-baseline justify-center gap-x-7 gap-y-2">
            {PLATFORMS.map((p) => (
              <span key={p} className="text-[0.92rem] font-medium text-steel">
                {p}
              </span>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ----------------------------------------------------------- BENTO */}
      <section
        id="product"
        className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-20 lg:py-28"
      >
        <Reveal>
          <h2 className="text-2xl font-bold tracking-tight text-balance text-ink md:text-4xl lg:text-5xl">
            Collect. Score. Group. Rank.
          </h2>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="mt-3 text-sm text-steel md:text-base lg:text-lg">
            Everything between someone typing and you shipping the fix.
          </p>
        </Reveal>

        <div className="mx-auto mt-8 grid grid-cols-1 gap-4 md:mt-12 md:grid-cols-3 md:grid-rows-2">
          <BentoCard
            className="md:row-span-2"
            eyebrow="Drop-in"
            title="A widget that gets replies"
            body="Type chips, an optional rating, one message box. About 11KB, isolated from your CSS, loaded after your page is idle."
          >
            <WidgetSkeleton />
          </BentoCard>

          <BentoCard
            eyebrow="Instant"
            title="Scored on arrival"
            body="Sentiment, intent, category, one-line summary. Seconds, not a nightly batch."
          >
            <ScoringSkeleton />
          </BentoCard>

          <BentoCard
            className="md:row-span-2"
            eyebrow="Grouping"
            title="Themes, not tags"
            body="Grouped by the problem underneath, not the keyword. Five wordings of one complaint become one theme with a count."
          >
            <ClusterSkeleton />
          </BentoCard>

          <BentoCard
            eyebrow="Yours"
            title="Looks like your product"
            body="Colour, copy, typeface, corners, position. On Pro the branding comes off entirely."
          >
            <CustomiseSkeleton />
          </BentoCard>
        </div>

        <div className="mx-auto mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <BentoCard
            eyebrow="Setup"
            title="Live in four minutes"
            body="No package, no build step. The setup screen tells you the moment your first submission lands."
          >
            <InstallSkeleton />
          </BentoCard>

          <BentoCard
            eyebrow="Weekly digest"
            title="Monday morning, summarized"
            body="Three themes worth acting on, how volume moved, quotes worth reading. Quiet weeks send nothing."
          >
            <DigestSkeleton />
          </BentoCard>
        </div>
      </section>

      {/* ------------------------------------------------------------- MCP */}
      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 py-10 md:grid-cols-2 md:gap-16 md:px-8 md:py-20 lg:py-28">
        <Reveal>
          <div className="max-w-xl">
            <div className="text-[0.8rem] font-semibold text-mint-deep">
              New · works with your coding agent
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-balance text-ink md:text-4xl lg:text-5xl">
              Ask your agent what to build next
            </h2>
            <p className="mt-6 max-w-lg text-base text-steel lg:text-lg">
              Voicebox runs as an MCP server. Point Claude Code or Cursor at it
              and your ranked feedback themes land right where you write code.
              Read-only, and on every plan, including free.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <CtaButton href="/docs/api#model-context-protocol" variant="accent">
                Set it up
                <ArrowRight className="size-4" />
              </CtaButton>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="overflow-hidden rounded-2xl bg-slab shadow-sm ring-1 shadow-black/40 ring-white/[0.07]">
            <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-3">
              <span className="size-2.5 rounded-full bg-[#FF5F57]" />
              <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="size-2.5 rounded-full bg-[#28C840]" />
              <span className="ml-2 text-[0.72rem] text-slab-fg/50">
                your terminal
              </span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[0.78rem] leading-[1.9] text-slab-fg/85">
              <code>
                <span className="text-slab-fg/40"># one line, then it&apos;s in every session</span>
                {"\n"}
                <span className="text-mint">claude mcp add</span> --transport http voicebox \{"\n"}
                {"  "}{site.url}/api/mcp \{"\n"}
                {"  "}--header <span className="text-slab-fg">&quot;Authorization: Bearer sk_…&quot;</span>
                {"\n\n"}
                <span className="text-slab-fg/40"># then, mid-task, just ask</span>
                {"\n"}
                <span className="text-slab-fg">&gt; what are the top feedback themes,</span>
                {"\n"}
                <span className="text-slab-fg">{"  "}and what did people actually say?</span>
              </code>
            </pre>
          </div>
        </Reveal>
      </section>

      {/* --------------------------------------------------------- PRICING */}
      <section className="mx-auto flex w-full max-w-7xl flex-col px-4 md:px-8">
        <div className="relative my-12 flex w-full flex-1 flex-col py-0 sm:my-10 md:my-20">
          <Reveal>
            <h2 className="pt-4 text-center text-2xl font-bold tracking-tight text-balance text-ink md:text-4xl lg:text-5xl">
              Priced on volume, not features
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mx-auto mt-4 max-w-md text-center text-base text-steel md:text-lg">
              Every plan gets the full product, analysis included. Paid plans
              buy volume.
            </p>
          </Reveal>

          <RevealGroup className="mx-auto mt-10 grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </RevealGroup>

          <Reveal delay={0.05}>
            <p className="mt-8 text-center text-[0.84rem] text-steel">
              Annual is two months cheaper.{" "}
              <Link href="/pricing" className="text-ink underline">
                See full pricing
              </Link>
            </p>
          </Reveal>

          {/* Each of these is a page or a feature that exists, not a badge:
              the DPA is at /dpa, export lives in settings on every plan, and
              cancellation is self-serve from billing. */}
          <Reveal delay={0.1}>
            <div className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-line/60 pt-8 text-[0.8rem] text-faint">
              <Link href="/dpa" className="transition-colors hover:text-ink">
                GDPR DPA included
              </Link>
              <span>Export everything, any time</span>
              <span>Cancel from the billing page</span>
              <Link href="/docs/security" className="transition-colors hover:text-ink">
                Security &amp; privacy
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- FAQ */}
      <div className="mx-auto max-w-4xl overflow-hidden px-4 py-16 md:px-8 md:py-28">
        <Reveal>
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-balance text-ink md:text-4xl lg:text-5xl">
              Frequently asked questions
            </h2>
          </div>
        </Reveal>

        <FaqGroups groups={faqGroups} />
      </div>

      {/* ------------------------------------------------------------- CTA */}
      <section className="mx-auto my-10 grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 md:my-20 md:grid-cols-2 md:gap-16 md:px-8">
        <Reveal>
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight text-balance text-ink md:text-4xl lg:text-5xl">
              Know what to fix by tomorrow.
            </h2>
            <p className="mt-6 max-w-lg text-base text-steel lg:text-lg">
              Your users are already telling you what to build. By tomorrow
              it&apos;s a ranked list, not four hundred unread messages.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <CtaButton href="/signin" variant="accent">
                Start free
                <ArrowRight className="size-4" />
              </CtaButton>
              <CtaButton href={`mailto:${site.supportEmail}`} variant="ghost">
                Talk to us
              </CtaButton>
            </div>
            <p className="mt-5 text-[0.84rem] text-steel">
              Shipping in the open:{" "}
              <Link href="/changelog" className="text-ink underline">
                read the changelog
              </Link>
            </p>
          </div>
        </Reveal>

        {/* Two columns of product cards drifting past each other, masked top
            and bottom, so the block reads as depth rather than a screenshot. */}
        <Reveal delay={0.1}>
          <div className="relative max-h-[34rem] overflow-hidden rounded-2xl bg-paper-2/60 p-3 mask-t-from-50% mask-b-from-50%">
            <div className="grid h-full grid-cols-2 gap-3">
              <div className="flex translate-y-[60px] flex-col gap-3">
                <CtaTile title="CSV export times out" n="34" neg={0.82} />
                <CtaTile title="Dark mode requested" n="27" neg={0.08} />
                <CtaTile title="Onboarding is confusing" n="19" neg={0.68} />
              </div>
              <div className="flex -translate-y-[60px] flex-col gap-3">
                <CtaTile title="Slack integration wanted" n="12" neg={0.05} />
                <CtaTile title="Billing plan mismatch" n="9" neg={0.74} />
                <CtaTile title="Mobile layout breaks" n="7" neg={0.61} />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: site.name,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description: site.description,
            url: site.url,
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqGroups.flatMap((g) =>
              g.items.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            ),
          }),
        }}
      />

      <SignupNudge />

      {/* Dogfooding: the widget on our own landing page. `site.url` resolves
          to the right domain on its own (production, a preview, or
          localhost), the same auto-detection every other absolute link on
          this page already goes through, see src/env.ts. */}
      <Script
        src={`${site.url}/widget.js`}
        data-project="pk_rvP7OxYq0W7sc2Uj0POIDwlh"
        strategy="lazyOnload"
      />
    </>
  );
}

/** One theme card in the closing collage. */
function CtaTile({
  title,
  n,
  neg,
}: {
  title: string;
  n: string;
  neg: number;
}) {
  return (
    <div
      className="rounded-xl bg-paper-2 p-4 shadow-sm ring-1 shadow-black/40 ring-white/[0.06]"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[0.82rem] leading-snug font-semibold text-ink">
          {title}
        </span>
        <span className="tnum shrink-0 text-[0.82rem] font-semibold text-mint-deep">
          {n}
        </span>
      </div>
      <div className="mt-3 flex h-1 overflow-hidden rounded-full bg-sunken">
        <div style={{ width: `${(1 - neg) * 100}%` }} className="bg-neutral" />
        <div style={{ width: `${neg * 100}%` }} className="bg-negative" />
      </div>
    </div>
  );
}
