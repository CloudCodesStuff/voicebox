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
import { RatingProof } from "@/components/marketing/rating-proof";
import { Reveal, RevealGroup, WordReveal } from "@/components/marketing/motion";
import { PlanCard } from "@/components/marketing/plan-card";
import { CtaButton } from "@/components/marketing/primitives";
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
        a: "About four minutes. One script tag in your layout, the same as any analytics snippet. The setup screen watches for your first submission and tells you the moment it arrives.",
      },
      {
        q: "Will it wreck my styling?",
        a: "No. Everything renders inside a Shadow DOM root, so your CSS can't reach in and ours can't leak out. We test it against a page that forces red backgrounds and lime borders onto every button.",
      },
      {
        q: "How much feedback before it's useful?",
        a: "Sentiment and summaries start on the first submission. Themes need a pattern, so they appear around twenty pieces. The free plan's fifty a month clears that.",
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
        a: "Every theme is editable and every piece of feedback keeps its original text. The ranking is arithmetic you can check, not a black box: volume, times negative share, times recency decay.",
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
            <RatingProof />
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
            <p className="mt-4 text-[0.84rem] text-steel">
              Free up to 50 pieces of feedback a month. No card.
            </p>
          </Reveal>

          {/* The whole mechanism, above the fold, in three short phrases.
              Everything else on this page elaborates on one of these; someone
              who reads only this far should still be able to say what the
              product does and what it would take to run it. */}
          <Reveal delay={0.52}>
            <ol className="mt-12 grid max-w-4xl gap-4 sm:grid-cols-3 sm:gap-6">
              {[
                {
                  n: "01",
                  t: "Paste one line",
                  d: "One script tag, anywhere before your closing body tag. No package. No build step. Under 6KB.",
                },
                {
                  n: "02",
                  t: "Your users write in",
                  d: "A button in the corner, styled to match your site. They pick a type and write.",
                },
                {
                  n: "03",
                  t: "You get a ranked list",
                  d: "Every reply scored and grouped. The top of the list is what to fix next.",
                },
              ].map((s) => (
                <li key={s.n} className="border-t border-line pt-4">
                  <div className="tnum text-[0.72rem] text-mint-deep">{s.n}</div>
                  <div className="mt-1.5 text-[0.98rem] font-semibold text-ink">
                    {s.t}
                  </div>
                  <p className="mt-1 text-[0.86rem] leading-relaxed text-steel">
                    {s.d}
                  </p>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={0.54}>
            <div className="mt-14 md:mt-20">
              <BrowserFrame className="mx-auto max-w-full">
                <DashboardMock className="absolute inset-0" />
              </BrowserFrame>
            </div>
          </Reveal>
        </div>
      </div>

      {/* -------------------------------------------------------- PLATFORMS */}
      <section className="py-10 md:py-20 lg:py-28">
        <h2 className="mx-auto max-w-xl px-4 text-center text-[1.05rem] font-medium text-steel">
          Runs anywhere you ship.{" "}
          <br className="hidden sm:block" />
          <span className="text-faint">
            No package to install, no framework to match.
          </span>
        </h2>

        <RevealGroup className="mx-auto mt-10 grid max-w-5xl grid-cols-3 gap-x-4 gap-y-6 px-4 sm:grid-cols-4 md:grid-cols-6">
          {PLATFORMS.map((p) => (
            <div
              key={p}
              className="text-center text-[0.9rem] font-medium text-faint transition-colors hover:text-ink"
            >
              {p}
            </div>
          ))}
        </RevealGroup>
      </section>

      {/* ----------------------------------------------------------- BENTO */}
      <section
        id="product"
        className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-20 lg:py-28"
      >
        <Reveal>
          <h2 className="text-2xl tracking-tight text-balance text-ink md:text-4xl lg:text-5xl">
            Collect. Score. Group. Rank.
          </h2>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="mt-3 text-sm text-steel md:text-base lg:text-lg">
            Everything between someone typing and you shipping the fix. You
            do the last part.
          </p>
        </Reveal>

        <div className="mx-auto mt-8 grid grid-cols-1 gap-4 md:mt-12 md:grid-cols-3 md:grid-rows-2">
          <BentoCard
            className="md:row-span-2"
            eyebrow="Drop-in"
            title="A widget you'd actually ship"
            body="One script tag. Your colour, your words, your typeface, any corner. Under 6KB over the wire."
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
            eyebrow="Monday"
            title="The weekly email"
            body="Three themes worth acting on, how volume moved, quotes worth reading. Quiet weeks send nothing."
          >
            <DigestSkeleton />
          </BentoCard>
        </div>
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
              You pay for how much feedback you collect. The AI is on every
              plan, including free.
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
                Compare every line
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- FAQ */}
      <div className="mx-auto max-w-4xl overflow-hidden px-4 py-16 md:px-8 md:py-28">
        <Reveal>
          <div className="text-center">
            <h2 className="text-2xl tracking-tight text-balance text-ink md:text-4xl lg:text-5xl">
              Questions people ask
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-steel md:text-base lg:text-lg">
              Everything worth knowing before you paste the line in.
            </p>
          </div>
        </Reveal>

        <FaqGroups groups={faqGroups} />
      </div>

      {/* ------------------------------------------------------------- CTA */}
      <section className="mx-auto my-10 grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 md:my-20 md:grid-cols-2 md:gap-16 md:px-8">
        <Reveal>
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight text-balance text-ink md:text-4xl lg:text-5xl">
              Know what to fix by tomorrow.
            </h2>
            <p className="mt-6 max-w-lg text-base text-steel lg:text-lg">
              Paste one line today. Your users are already telling you what to
              build. By morning it is six things to fix, not four hundred
              messages you keep meaning to read.
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
