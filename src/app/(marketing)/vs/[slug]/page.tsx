import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Minus } from "lucide-react";

import {
  ArticleCta,
  ArticleShell,
  BreadcrumbJsonLd,
  Faq,
  H2,
  LI,
  P,
  Sources,
  UL,
} from "@/components/marketing/article";
import { comparisons, getComparison } from "@/lib/comparisons";
import { plans, site } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return comparisons.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const c = getComparison((await params).slug);
  if (!c) return {};

  return pageMetadata({
    title: c.title,
    description: c.description,
    path: `/vs/${c.slug}`,
    type: "article",
    ogSlug: c.slug,
  });
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const c = getComparison((await params).slug);
  if (!c) notFound();

  const free = plans.find((p) => p.id === "FREE");
  const pro = plans.find((p) => p.id === "PRO");
  const scale = plans.find((p) => p.id === "SCALE");

  const faqs = [
    {
      q: `Is ${site.name} a ${c.name} alternative?`,
      a: `Partly. ${c.name} is ${c.what}. ${site.name} collects written feedback through a widget and groups it into ranked themes automatically. They overlap on collecting feedback and diverge on everything after that, so the honest answer depends on which half you needed.`,
    },
    {
      q: `How does ${c.name} pricing compare?`,
      a: `${c.name} is metered ${c.pricingModel.toLowerCase()}. ${c.pricingDetail} ${site.name} is metered on how much feedback you collect: free for ${free?.feedbackPerMonth ?? 25} pieces a month, $${pro?.priceMonthly ?? 19} for ${pro?.feedbackPerMonth ?? 3000}, and $${scale?.priceMonthly ?? 49} for ${scale?.feedbackPerMonth ?? 15000} with unlimited seats. Figures for ${c.name} were checked in ${c.verifiedOn}.`,
    },
    {
      q: `Can I use both?`,
      a: `Yes, and for ${c.name} in particular it is a reasonable setup. They meter different things and answer different questions, so running both costs you two subscriptions and no conflict. Nothing in either tool assumes it is the only one installed.`,
    },
    {
      q: `Which should I pick?`,
      a: `Pick ${c.name} if ${c.pickThemIf} Pick ${site.name} if ${c.pickUsIf}`,
    },
  ];

  return (
    <ArticleShell>
      <BreadcrumbJsonLd
        trail={[
          { name: "Compare", path: "/vs" },
          { name: c.title, path: `/vs/${c.slug}` },
        ]}
      />

      <header className="border-b border-line pb-8">
        <div className="flex flex-wrap items-center gap-x-3 text-[0.78rem] text-steel">
          <Link href="/blog" className="text-mint-deep hover:underline">
            Blog
          </Link>
          <span aria-hidden="true">·</span>
          <span>Comparison</span>
          <span aria-hidden="true">·</span>
          <span>Verified {c.verifiedOn}</span>
        </div>
        <h1 className="mt-4 text-[2rem] leading-[1.1] font-bold tracking-[-0.03em] text-ink md:text-[2.6rem]">
          {c.title}
        </h1>
        <p className="mt-4 max-w-[68ch] text-[1.05rem] leading-relaxed text-ink/80">
          {c.description}
        </p>
      </header>

      <P>
        {c.name} is {c.what}. {site.name} is a feedback widget you paste into
        your site plus an AI that reads every reply and ranks what to fix. Both
        collect feedback. What happens next is where they part company, and
        that is the part worth deciding on.
      </P>

      <H2 id="pricing">Pricing, and what it is metered on</H2>
      <P>
        The meter matters more than the headline number, because it decides
        which kind of growth makes your bill go up.
      </P>

      <div className="mt-6 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-paper-2">
              <th className="label px-4 py-3" />
              <th className="label px-4 py-3">{c.name}</th>
              <th className="label px-4 py-3">{site.name}</th>
            </tr>
          </thead>
          <tbody className="bg-paper-2">
            <tr className="border-b border-line">
              <td className="px-4 py-3 text-[0.84rem] font-medium text-ink">
                Metered on
              </td>
              <td className="px-4 py-3 text-[0.84rem] text-steel">
                {c.pricingModel}
              </td>
              <td className="px-4 py-3 text-[0.84rem] text-steel">
                Feedback collected
              </td>
            </tr>
            <tr className="border-b border-line">
              <td className="px-4 py-3 align-top text-[0.84rem] font-medium text-ink">
                Free tier
              </td>
              <td className="px-4 py-3 align-top text-[0.84rem] text-steel">
                Yes, see detail below
              </td>
              <td className="px-4 py-3 align-top text-[0.84rem] text-steel">
                {free?.feedbackPerMonth ?? 25} pieces of feedback a month, AI included
              </td>
            </tr>
            <tr className="border-b border-line">
              <td className="px-4 py-3 text-[0.84rem] font-medium text-ink">
                Cost of adding a teammate
              </td>
              <td className="px-4 py-3 text-[0.84rem] text-steel">
                {c.pricingModel === "Per seat, plus usage for AI"
                  ? "One more seat"
                  : "Varies by plan"}
              </td>
              <td className="px-4 py-3 text-[0.84rem] text-steel">
                Nothing on Scale, which has unlimited seats
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-[0.84rem] font-medium text-ink">
                AI analysis
              </td>
              <td className="px-4 py-3 text-[0.84rem] text-steel">
                {c.slug === "featurebase"
                  ? "Paid plans, charged per resolution"
                  : "Varies by product and plan"}
              </td>
              <td className="px-4 py-3 text-[0.84rem] text-steel">
                Every plan, including free
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <P>{c.pricingDetail}</P>

      <H2 id="better">What {c.name} does better</H2>
      <P>
        Stated plainly, because a comparison page where the other tool never
        wins is an advert and you would be right to discount it.
      </P>
      <UL>
        {c.theyreBetterAt.map((t) => (
          <LI key={t}>
            <span className="inline-flex items-baseline gap-2">
              <Check className="mt-1 size-3.5 shrink-0 text-mint-deep" />
              <span>{t}</span>
            </span>
          </LI>
        ))}
      </UL>

      <H2 id="different">What {site.name} does differently</H2>
      <UL>
        {c.weDoDifferently.map((t) => (
          <LI key={t}>
            <span className="inline-flex items-baseline gap-2">
              <Minus className="mt-1 size-3.5 shrink-0 text-steel" />
              <span>{t}</span>
            </span>
          </LI>
        ))}
      </UL>

      <H2 id="choose">Which to pick</H2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-paper-2 p-5">
          <h3 className="text-[1rem] font-semibold text-ink">
            Pick {c.name} if
          </h3>
          <p className="mt-2 text-[0.92rem] leading-relaxed text-steel">
            {c.pickThemIf}
          </p>
        </div>
        <div className="rounded-xl border border-mint/40 bg-mint-wash p-5">
          <h3 className="text-[1rem] font-semibold text-ink">
            Pick {site.name} if
          </h3>
          <p className="mt-2 text-[0.92rem] leading-relaxed text-steel">
            {c.pickUsIf}
          </p>
        </div>
      </div>

      <H2 id="faq">Common questions</H2>
      <Faq items={faqs} />

      <ArticleCta />
      <Sources items={c.sources} />

      <nav aria-label="Other comparisons" className="mt-14 border-t border-line pt-8">
        <h2 className="label">Other comparisons</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {comparisons
            .filter((o) => o.slug !== c.slug)
            .map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/vs/${o.slug}`}
                  className="inline-flex rounded-lg border border-line px-3 py-2 text-[0.86rem] text-steel transition-colors hover:border-steel hover:text-ink"
                >
                  vs {o.name}
                </Link>
              </li>
            ))}
          <li>
            <Link
              href="/blog/best-feedback-widget-reddit"
              className="inline-flex rounded-lg border border-line px-3 py-2 text-[0.86rem] text-steel transition-colors hover:border-steel hover:text-ink"
            >
              All of them, compared
            </Link>
          </li>
        </ul>
      </nav>
    </ArticleShell>
  );
}
