import type { Metadata } from "next";
import Link from "next/link";

import {
  ArticleCta,
  ArticleHeader,
  ArticleJsonLd,
  ArticleShell,
  BreadcrumbJsonLd,
  Faq,
  H2,
  KeyPoint,
  LI,
  P,
  RelatedPosts,
  Sources,
  UL,
} from "@/components/marketing/article";
import { getPost } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

const post = getPost("best-feedback-widget-reddit")!;

export const metadata: Metadata = pageMetadata({
  title: post.title,
  description: post.description,
  path: `/blog/${post.slug}`,
  type: "article",
  published: post.published,
  modified: post.updated,
  ogSlug: post.slug,
});

const faqs = [
  {
    q: "What is the best feedback widget for a website?",
    a: "There is no single best one, because the tools solve different problems. For public feature voting, Canny. For support and feedback in one subscription, Featurebase. For seeing where people struggle rather than reading what they wrote, Hotjar. For annotated bug reports, Usersnap. For collecting written feedback privately and having it grouped and ranked automatically, Voicebox.",
  },
  {
    q: "Is there a free feedback widget?",
    a: "Yes, most tools in this category have a free tier. Canny is free up to 25 tracked users, Featurebase has a permanent free plan with one seat and no AI, and Voicebox is free for 50 pieces of feedback a month with AI analysis included. The limits differ in kind, so check which one you would hit first.",
  },
  {
    q: "Why do feedback tools get expensive so quickly?",
    a: "Usually because of the meter. Tools priced per tracked user charge more as more of your customers participate, so cost rises with engagement rather than with value delivered. Reported figures put Canny around $275 a month on Core and $579 on Pro at 1,000 tracked users. Tools priced per seat charge you for teammates who only read.",
  },
  {
    q: "Do I need a feedback widget if I already use Hotjar?",
    a: "They answer different questions. Hotjar shows you behaviour, where people hesitated or dropped off. A feedback widget collects what they would say about it. Plenty of teams run both, and the two rarely replace each other.",
  },
];

export default function Page() {
  return (
    <ArticleShell>
      <ArticleJsonLd post={post} />
      <BreadcrumbJsonLd
        trail={[
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ]}
      />

      <ArticleHeader
        category={post.category}
        title={post.title}
        description={post.description}
        published={post.published}
        updated={post.updated}
        readingMinutes={post.readingMinutes}
      />

      <P>
        &ldquo;What are people using for a feedback widget?&rdquo; is one of
        those questions that gets asked on Reddit every few weeks, in
        r/SaaS, r/webdev, r/ProductManagement and half a dozen smaller subs,
        and it almost never gets a straight answer. The replies are usually a
        list of product names with no indication of which one fits which
        situation, plus at least one person who built their own.
      </P>

      <P>
        This page is the answer written out properly. We make one of the tools
        on this list, which you should factor in, so every section says what
        the alternatives are genuinely better at and there is a section at the
        end on when to pick none of them.
      </P>

      <KeyPoint>
        The short version: pick by what you want to happen to the feedback
        after it arrives. Public voting board, private analysis, behaviour
        recording and bug reporting are four different products, and most
        arguments about &ldquo;the best feedback widget&rdquo; are people
        comparing across those categories without noticing.
      </KeyPoint>

      <H2 id="four-categories">The four things people mean by feedback widget</H2>

      <P>
        Almost every recommendation thread mixes these up, which is why the
        answers look contradictory.
      </P>

      <UL>
        <LI>
          <strong className="text-ink">A public voting board.</strong> Customers
          post requests, everyone sees them, people vote. Canny is the
          best-known. The value is transparency and the cost is that your
          feature requests become a public forum you have to moderate.
        </LI>
        <LI>
          <strong className="text-ink">A private feedback inbox.</strong> People
          write in, only you read it. Nobody performs for an audience, which
          changes what they write. This is where Voicebox sits.
        </LI>
        <LI>
          <strong className="text-ink">Behavioural analytics.</strong> Heatmaps
          and session recordings. Hotjar is the default. You see what people
          did without asking them anything, which is powerful and answers a
          different question.
        </LI>
        <LI>
          <strong className="text-ink">Visual bug reporting.</strong> Annotated
          screenshots with browser and console detail attached. Usersnap. Built
          for QA cycles rather than for hearing from customers.
        </LI>
      </UL>

      <P>
        If a thread recommends Hotjar to someone asking about feature requests,
        or Canny to someone collecting bug reports from beta testers, that is
        the mix-up happening in real time.
      </P>

      <H2 id="pricing">The pricing model matters more than the price</H2>

      <P>
        The complaint that comes up most often in these threads is not that a
        tool is expensive, it is that it got expensive unexpectedly. That is
        almost always the meter rather than the price.
      </P>

      <UL>
        <LI>
          <strong className="text-ink">Per tracked user</strong> means anyone
          who submits, votes or comments counts. Your bill grows as engagement
          grows. Canny is free to 25 tracked users, then Core from $19/mo and
          Pro from $79/mo billed annually, and reported costs at 1,000 tracked
          users are around $275 and $579 a month respectively.
        </LI>
        <LI>
          <strong className="text-ink">Per seat</strong> means you pay for
          colleagues who only ever read. Featurebase runs $29, $59 and $99 per
          seat per month on its paid tiers, with a permanent free plan at one
          seat, plus $0.29 per AI resolution.
        </LI>
        <LI>
          <strong className="text-ink">Per session</strong> is how behavioural
          tools meter. Hotjar&apos;s paid plans are reported from about $32/mo,
          rising with traffic rather than with feedback.
        </LI>
        <LI>
          <strong className="text-ink">Per piece of feedback</strong> is what
          Voicebox uses: $0 for 50 a month, $19 for 3,000, $49 for 15,000, with
          unlimited seats on the top plan.
        </LI>
      </UL>

      <P>
        None of these is dishonest. They just fail differently. Per-user pricing
        punishes a successful launch, per-seat pricing punishes involving your
        team, and volume pricing punishes a spam wave. Pick the failure mode you
        can live with, and read{" "}
        <Link href="/blog/tracked-user-pricing-is-a-trap" className="text-ink underline underline-offset-2">
          the longer piece on tracked-user pricing
        </Link>{" "}
        if that is the one biting you.
      </P>

      <H2 id="honest-comparison">What each one is actually good at</H2>

      <UL>
        <LI>
          <strong className="text-ink">Canny</strong> if you want customers
          voting in public on what you build next. Nothing else on this list
          does that properly, and Voicebox does not attempt it.{" "}
          <Link href="/vs/canny" className="text-ink underline underline-offset-2">
            Full comparison
          </Link>
          .
        </LI>
        <LI>
          <strong className="text-ink">Featurebase</strong> if you would rather
          have one subscription covering support inbox, help centre, roadmap and
          feedback than run several tools.{" "}
          <Link href="/vs/featurebase" className="text-ink underline underline-offset-2">
            Full comparison
          </Link>
          .
        </LI>
        <LI>
          <strong className="text-ink">Hotjar</strong> if your real question is
          where people get stuck, not what they think.{" "}
          <Link href="/vs/hotjar" className="text-ink underline underline-offset-2">
            Full comparison
          </Link>
          .
        </LI>
        <LI>
          <strong className="text-ink">Usersnap</strong> if you need
          reproducible bug reports with screenshots and environment detail.{" "}
          <Link href="/vs/usersnap" className="text-ink underline underline-offset-2">
            Full comparison
          </Link>
          .
        </LI>
        <LI>
          <strong className="text-ink">Voicebox</strong> if you want written
          feedback collected privately and grouped by the underlying problem, so
          five wordings of one complaint arrive as one ranked theme instead of
          five tickets.
        </LI>
      </UL>

      <H2 id="build-your-own">When to build your own instead</H2>

      <P>
        Someone always suggests this, and for a lot of cases they are right. A
        form that posts to a database or a Slack webhook is an afternoon of
        work, and if you get ten pieces of feedback a month you can read all of
        them yourself. No tool beats reading ten messages.
      </P>

      <P>
        It stops being right at roughly the point where you can no longer hold
        the whole picture in your head. That is usually somewhere between 50 and
        200 pieces a month, and the symptom is specific: you remember that
        several people complained about the same thing but you cannot say how
        many, or whether it is getting worse. Counting that by hand is the work
        these tools exist to remove.
      </P>

      <H2 id="how-to-choose">A shorter way to decide</H2>

      <P>Three questions, in order:</P>

      <UL>
        <LI>
          Should other customers see what people submit? Yes means a public
          board. No means a private inbox.
        </LI>
        <LI>
          Do you need to know what they said, or what they did? Said means a
          feedback tool. Did means behavioural analytics.
        </LI>
        <LI>
          What breaks first as you grow, your user count, your team size, or
          your feedback volume? Whichever it is, do not pick the tool that
          meters on it.
        </LI>
      </UL>

      <H2 id="faq">Questions people ask alongside this one</H2>
      <Faq items={faqs} />

      <ArticleCta />

      <Sources
        items={[
          { label: "Canny pricing", url: "https://canny.io/pricing" },
          {
            label: "Canny pricing analysis, ProductLift",
            url: "https://www.productlift.dev/blog/canny-pricing/",
          },
          {
            label: "Featurebase pricing",
            url: "https://www.featurebase.app/pricing",
          },
          {
            label: "Featurebase pricing breakdown, FeatureOS",
            url: "https://featureos.com/blog/featurebase-pricing",
          },
          { label: "Hotjar pricing", url: "https://www.hotjar.com/pricing/" },
          { label: "Usersnap pricing", url: "https://usersnap.com/pricing" },
        ]}
      />

      <RelatedPosts slug={post.slug} />
    </ArticleShell>
  );
}
