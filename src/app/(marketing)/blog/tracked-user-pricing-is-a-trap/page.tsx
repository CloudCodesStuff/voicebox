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
import { site } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

const post = getPost("tracked-user-pricing-is-a-trap")!;

export const metadata: Metadata = pageMetadata({
  title: post.seoTitle ?? post.title,
  description: post.description,
  path: `/blog/${post.slug}`,
  type: "article",
  published: post.published,
  modified: post.updated,
  ogSlug: post.slug,
});

const faqs = [
  {
    q: "What is a tracked user?",
    a: "In feedback tools it usually means any end user who interacts with the feedback system: submits a request, votes on one, or comments. It is not your team, and it is not your total customer base, which is why the number is hard to predict before you start.",
  },
  {
    q: "Is per-seat pricing better than per-tracked-user?",
    a: "It is more predictable, because you control how many colleagues you add. Its failure mode is that it discourages exactly what you want, which is more of your team reading customer feedback. Teams routinely share one login to avoid a seat charge, which defeats the point.",
  },
  {
    q: "What should feedback tools charge for?",
    a: "Ideally something that correlates with the value you get and that you can forecast. Volume of feedback collected is the closest available proxy: it rises when you are getting more signal, it is countable in advance from your traffic, and it does not punish involving your team or succeeding with customers.",
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
        We sell a feedback tool, so this is not a neutral essay. It is still
        arithmetic you can check, and the arithmetic is the point.
      </P>

      <KeyPoint>
        A meter is a bet on what should make your bill grow. Tracked-user
        pricing bets on engagement, which means the better your product does,
        the more you pay for the privilege of hearing about it.
      </KeyPoint>

      <H2 id="arithmetic">The arithmetic</H2>

      <P>
        Take Canny, the clearest example because its figures are public. Free
        covers 25 tracked users. Core starts at $19 a month, Pro at $79 billed
        annually. A tracked user is anyone who submits, votes or comments.
      </P>

      <P>
        Now run a good quarter. You launch something, traffic doubles, and the
        share of customers who bother to vote on a request goes from tiny to
        merely small. Reported figures at 1,000 tracked users are around $275 a
        month on Core and $579 on Pro. Nothing about your revenue necessarily
        changed. What changed is that more people participated.
      </P>

      <P>
        The uncomfortable part is the incentive it creates. Every prompt that
        gets more customers to vote makes your tool more expensive. Teams
        respond rationally: they stop promoting the board.
      </P>

      <H2 id="seats">Per-seat has the same shape, aimed at your team</H2>

      <P>
        Featurebase charges $29, $59 and $99 per seat per month on its paid
        tiers, plus $0.29 per AI resolution. That is predictable, which is a
        real advantage over engagement-based metering. Its failure mode is
        pointed at the other side of the table.
      </P>

      <P>
        Customer feedback is most useful when the people building the thing read
        it directly. Per-seat pricing puts a price on exactly that, and the
        result is familiar: one person has the login, exports a summary, and
        pastes it into Slack. The information gets one layer of lossy
        compression added because the compression is cheaper than a seat.
      </P>

      <H2 id="sessions">Per-session bills you for traffic</H2>

      <P>
        Behavioural tools like Hotjar meter on sessions, from around $32 a month
        on paid plans. If your question is genuinely behavioural that is
        reasonable, since sessions are the raw material. It does mean a piece of
        content going unexpectedly viral shows up as a bill.
      </P>

      <H2 id="alternative">What to look for instead</H2>

      <UL>
        <LI>
          <strong className="text-ink">Can you forecast it?</strong> You should
          be able to estimate next quarter&apos;s bill from numbers you already
          have. Tracked users fails this: nobody knows what share of their users
          will vote.
        </LI>
        <LI>
          <strong className="text-ink">Does it punish the behaviour you
          want?</strong> If getting more feedback, or getting more of your team
          to read it, costs extra, you will do less of both.
        </LI>
        <LI>
          <strong className="text-ink">What happens at 10x?</strong> Multiply
          the meter by ten and look at the number. If it is absurd, you will be
          migrating during the busiest quarter you have ever had.
        </LI>
      </UL>

      <P>
        For what it is worth, {site.name} meters on feedback collected: free for
        25 a month, $19 for 3,000, $49 for 15,000 with unlimited seats. That has
        its own failure mode, which is a spam wave, and the fix is the domain
        allowlist rather than a bigger plan. Every meter fails somewhere; the
        useful question is whether it fails when things are going well or when
        things are going badly.
      </P>

      <P>
        If you are weighing specific tools,{" "}
        <Link href="/blog/canny-alternatives-reddit" className="text-ink underline underline-offset-2">
          the Canny alternatives piece
        </Link>{" "}
        works through the same numbers by product.
      </P>

      <H2 id="faq">Common questions</H2>
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
          { label: "Hotjar pricing", url: "https://www.hotjar.com/pricing/" },
        ]}
      />

      <RelatedPosts slug={post.slug} />
    </ArticleShell>
  );
}
