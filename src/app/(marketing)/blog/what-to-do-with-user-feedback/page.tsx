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
  UL,
} from "@/components/marketing/article";
import { getPost } from "@/lib/blog";
import { site } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

const post = getPost("what-to-do-with-user-feedback")!;

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
    q: "How do you prioritise user feedback?",
    a: "By how many people are affected, how badly, and how recently. Volume alone over-weights whatever is easiest to complain about; sentiment alone over-weights a small number of furious people; recency alone chases noise. The three together are a reasonable proxy for impact and can be computed rather than argued about.",
  },
  {
    q: "How much feedback do you need before patterns appear?",
    a: "Roughly twenty pieces per product area before grouping says anything you did not already know. Below that you can and should just read everything. The threshold is about pattern density, not sample size in a statistical sense.",
  },
  {
    q: "Should you tag feedback manually?",
    a: "It works and it does not last. Manual tagging is accurate for the first few weeks and then decays, because it is unrewarding work that competes with shipping. Tags also encode what you expected to hear, so the categories miss the thing you did not anticipate, which is the feedback worth having.",
  },
  {
    q: "What do you do with feedback you are not going to act on?",
    a: "Keep it and say so. Most feedback will not become work, and that is fine. What you should not do is delete it, because the third person asking for the same thing is the signal, and you cannot count to three if you threw away the first two.",
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
        Collecting feedback is the part everyone gets right. The failure comes
        later, at the point where there is more of it than one person can hold
        in their head, and the honest state of most feedback inboxes is that
        nobody has read the last two hundred messages.
      </P>

      <KeyPoint>
        The unit of decision is not a message, it is a problem. Fifteen people
        describing the same broken export in fifteen different sentences is one
        thing to fix, and the job is turning the first number into the second.
      </KeyPoint>

      <H2 id="why-reading-fails">Why reading everything stops working</H2>

      <P>
        Reading is perfect up to a point. Under fifty pieces a month you should
        just read them, and no tool will beat that.
      </P>

      <P>
        What breaks is not the reading, it is the counting. You will remember
        that several people mentioned the export being slow. You will not
        remember whether it was four or fourteen, whether it is worse this month
        than last, or whether the people saying it are on your most expensive
        plan. Human memory over a stream of text produces impressions, and
        impressions are systematically biased toward whatever you read most
        recently and whoever complained most vividly.
      </P>

      <H2 id="tagging">Why tagging fails differently</H2>

      <P>
        The standard fix is a taxonomy: tag each piece, then count tags. It
        works, briefly.
      </P>

      <UL>
        <LI>
          It decays. Tagging is unrewarding work competing with shipping, and it
          is always the first thing to slip. A half-tagged inbox is worse than
          an untagged one because the counts look authoritative and are wrong.
        </LI>
        <LI>
          It encodes your assumptions. You built the tag list from what you
          expected to hear, so anything surprising lands in
          &ldquo;other&rdquo;, which is precisely where the valuable feedback
          goes to die.
        </LI>
        <LI>
          It splits on words rather than problems. &ldquo;Export is slow&rdquo;
          and &ldquo;the download never finishes&rdquo; are one problem and two
          tags, so the count under-states it.
        </LI>
      </UL>

      <H2 id="grouping">Group by the problem, not the wording</H2>

      <P>
        What you want is for those two sentences to end up in the same bucket
        without anyone deciding they should. That is a semantic judgement, which
        is the one thing language models are reliable at: not writing
        your roadmap, just recognising that two differently-worded complaints
        describe one underlying thing.
      </P>

      <P>
        The output is a much shorter list. Four hundred messages is not four
        hundred decisions, it is usually fifteen or twenty problems with wildly
        different weights behind them.
      </P>

      <H2 id="ranking">Then rank by impact, and make the ranking checkable</H2>

      <P>Three inputs, and you want all three:</P>

      <UL>
        <LI>
          <strong className="text-ink">Volume.</strong> How many people. Alone,
          it over-weights whatever is easiest to complain about.
        </LI>
        <LI>
          <strong className="text-ink">Sentiment.</strong> How unhappy. Alone,
          it hands your roadmap to the angriest person who wrote in.
        </LI>
        <LI>
          <strong className="text-ink">Recency.</strong> Whether it is still
          happening. Alone, it chases noise and forgets long-standing problems.
        </LI>
      </UL>

      <P>
        Multiply them and you get something defensible. The important property
        is not that the formula is clever, it is that it is arithmetic anyone on
        the team can inspect and disagree with. A ranked list nobody can
        interrogate gets ignored the first time it disagrees with someone
        senior.
      </P>

      <H2 id="loop">Close the loop, at least sometimes</H2>

      <P>
        Anyone who left an email address on something you fixed is worth
        replying to. It is a short message and it does two things: it turns a
        complaint into goodwill, and it teaches people that writing to you has
        an effect, which is the only reason anyone writes a second time.
      </P>

      <H2 id="cadence">Make it a habit, not a project</H2>

      <P>
        Fifteen minutes a week beats a quarterly deep-dive, because the point is
        noticing changes and you cannot notice a change you only look at four
        times a year. A weekly summary in your inbox does most of the work of
        remembering to look, which is why{" "}
        <Link href="/docs" className="text-ink underline underline-offset-2">
          {site.name} sends one on Mondays
        </Link>{" "}
        and sends nothing at all on quiet weeks.
      </P>

      <H2 id="faq">Common questions</H2>
      <Faq items={faqs} />

      <ArticleCta />
      <RelatedPosts slug={post.slug} />
    </ArticleShell>
  );
}
