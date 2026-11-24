import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Script from "next/script";

import { AgentBlock } from "@/components/home/agent-block";
import { HeroPill } from "@/components/home/hero-pill";
import { Install, Steps } from "@/components/home/how-it-works";
import { StartCard } from "@/components/home/start-card";
import { FaqGroups, type FaqGroup } from "@/components/marketing/faq-groups";
import { HeroVideo } from "@/components/marketing/hero-video";
import { PlanCard } from "@/components/marketing/plan-card";
import { PlatformMark, platformLogos } from "@/components/marketing/platform-logos";
import { SignupNudge } from "@/components/marketing/signup-nudge";
import { SiteButton } from "@/components/site/button";
import { Band, Head } from "@/components/site/frame";
import { Magnetic, Reveal, RevealWords } from "@/components/site/motion";
import { Spectrum } from "@/components/site/spectrum";
import { plans, site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${site.name}, ${site.tagline}` },
  description: site.description,
  alternates: { canonical: "/" },
};

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
    heading: "The insight engine",
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
        q: "What if the grouping is wrong?",
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

const HERO_VIDEO =
  "https://zjpcynbgnr460dw9.public.blob.vercel-storage.com/screen_display_0%202-Edited.mp4";

const free = plans[0];

export default function LandingPage() {
  return (
    <>
      {/* ------------------------------------------------------------ HERO */}
      <section className="border-b border-line">
        <div className="relative mx-auto max-w-[1120px] border-x border-line px-4 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
          <Reveal onLoad y={10} className="flex justify-center">
            <HeroPill />
          </Reveal>

          <RevealWords
            as="h1"
            onLoad
            delay={0.1}
            text="Feedback in. | Fix list out."
            accent={["Fix", "list", "out"]}
            className="display mx-auto mt-6 max-w-[1040px] text-center text-[52px] leading-[0.98] text-ink sm:text-[76px] lg:text-[88px]"
          />

          <Reveal onLoad delay={0.5}>
            <p className="mx-auto mt-6 max-w-[560px] text-balance text-center text-[16px] font-light leading-[1.55] text-steel sm:text-[19px]">
              Add one script tag. Voicebox collects what your users say, groups it by problem, and
              ranks what to fix.
            </p>
          </Reveal>

          <Reveal onLoad delay={0.65} className="mt-8">
            <div className="flex flex-wrap justify-center gap-3">
              <Magnetic>
                <SiteButton asChild variant="signal" size="lg" className="group">
                  <Link href="/signin">
                    Start free
                    <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </SiteButton>
              </Magnetic>
              <SiteButton asChild variant="ghost" size="lg">
                <a href="#how">See how it works</a>
              </SiteButton>
            </div>
            <p className="mt-4 text-center text-[13.5px] text-faint">
              Free plan: {free.projects} project, {free.feedbackPerMonth} pieces of feedback a month. No card.
            </p>
          </Reveal>

          {/* The real dashboard, recorded. */}
          <Reveal onLoad delay={0.8} y={30} className="mx-auto mt-14 max-w-[1000px] sm:mt-16">
            <div className="overflow-hidden rounded-[14px] border border-white/[0.12] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.07)]">
              <div className="flex h-10 items-center gap-1.5 border-b border-line bg-[#09090B] px-4">
                <span className="size-2.5 rounded-full bg-white/10" />
                <span className="size-2.5 rounded-full bg-white/10" />
                <span className="size-2.5 rounded-full bg-white/10" />
                <span className="ml-3 font-mono text-[11.5px] text-faint">app.usevoicebox.dev</span>
              </div>
              <div className="relative aspect-video bg-black">
                <HeroVideo src={HERO_VIDEO} poster="/hero-poster.jpg" className="absolute inset-0" />
              </div>
            </div>
          </Reveal>

          <div className="mx-auto mt-12 text-center">
            <p className="text-[13px] text-faint">Runs anywhere you ship</p>
            <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 sm:gap-x-9">
              {platformLogos.map((p) => (
                <li key={p.name} className="flex items-center gap-2 text-[14px] text-steel">
                  <PlatformMark d={p.d} className="size-4 opacity-80" />
                  {p.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- HOW */}
      <Band id="how">
        <Head
          label="How it works"
          title="From a reply to a ranked fix list"
          accent={["ranked"]}
          className="pb-10 sm:pb-12"
        />
        <Steps />
        <Install>
          <span className="text-faint">{"<"}</span>
          <span className="text-[#a5a0ff]">script</span> <span className="text-ink/85">async</span>
          {"\n  "}
          <span className="text-ink/85">src</span>=<span className="text-mint">&quot;{site.url}/widget.js&quot;</span>
          {"\n  "}
          <span className="text-ink/85">data-project</span>=<span className="text-mint">&quot;pk_your_project_key&quot;</span>
          <span className="text-faint">{"></"}</span>
          <span className="text-[#a5a0ff]">script</span>
          <span className="text-faint">{">"}</span>
        </Install>
      </Band>

      {/* ------------------------------------------------------------ AGENT */}
      <Band id="agents">
        <Head
          label="For your coding agent"
          title="Ask your agent what to build next"
          accent={["build", "next"]}
          className="pb-10 sm:pb-12"
        />
        <AgentBlock />
      </Band>

      {/* ----------------------------------------------------------- PRICING */}
      <Band id="pricing">
        <Head
          label="Pricing"
          title="Priced on volume, not features"
          accent={["volume"]}
          sub="Every plan gets the full product. Paid plans buy more replies, projects and seats."
          className="pb-10 sm:pb-12"
        />
        <div className="border-t border-line px-4 pb-4 pt-12 sm:px-10">
          <div className="mx-auto grid max-w-[1000px] gap-5 md:grid-cols-3 md:gap-4">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 pb-10 pt-6 text-[13.5px] text-faint sm:px-10">
          <span>Annual is two months cheaper.</span>
          <Link href="/pricing" className="link-line text-ink transition-colors">
            See full pricing
          </Link>
        </div>
      </Band>

      {/* --------------------------------------------------------------- FAQ */}
      <Band id="faq">
        <Head label="Questions" title="Frequently asked questions" className="pb-10 sm:pb-12" />
        <FaqGroups groups={faqGroups} />
      </Band>

      {/* ------------------------------------------------------------- CLOSE */}
      <Band>
        <div className="relative overflow-hidden px-6 py-20 sm:px-10 sm:py-28">
          <div className="absolute inset-x-0 bottom-0 opacity-50">
            <Spectrum height={440} seed={23} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />
          <div className="relative grid items-center gap-12 lg:grid-cols-[1fr_520px] lg:gap-10">
            <div className="lg:pl-6">
              <RevealWords
                text="Know what to fix by tomorrow."
                accent={["fix"]}
                className="display text-[40px] leading-[1.02] text-ink sm:text-[52px] lg:text-[60px]"
              />
              <Reveal delay={0.3}>
                <p className="mt-5 max-w-[440px] text-[17px] font-light leading-[1.55] text-steel">
                  Your users are already telling you what to build. By tomorrow it&apos;s a ranked
                  list your agent can read, not four hundred unread messages.
                </p>
                <p className="mt-5 text-[14px] text-faint">
                  Shipping in the open:{" "}
                  <Link href="/changelog" className="link-line text-ink">
                    read the changelog
                  </Link>
                </p>
              </Reveal>
            </div>
            <Reveal y={28} delay={0.1}>
              <StartCard />
            </Reveal>
          </div>
        </div>
      </Band>

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
