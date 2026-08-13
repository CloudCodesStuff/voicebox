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

const post = getPost("canny-alternatives-reddit")!;

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
    q: "Why do people look for Canny alternatives?",
    a: "Most often the pricing model rather than the product. Canny meters on tracked users, meaning anyone who submits, votes or comments, so the bill grows with engagement. Reported costs at 1,000 tracked users are around $275 a month on Core and $579 on Pro. The second reason is that a public voting board is not what every team wants.",
  },
  {
    q: "What is the cheapest Canny alternative?",
    a: "It depends on which limit you hit. Featurebase has a permanent free plan at one seat, and Voicebox is free for 50 pieces of feedback a month with AI analysis included. Beyond free, per-seat and per-volume pricing diverge sharply, so the cheapest option is whichever meters on the thing you have least of.",
  },
  {
    q: "Is there a free alternative to Canny with a public roadmap?",
    a: "Featurebase's free plan includes feedback boards, roadmaps and changelogs at one seat. Voicebox does not have a public roadmap or voting at all, so it is not a replacement if that is the part you need.",
  },
  {
    q: "Do I need a public voting board at all?",
    a: "Not usually, and it is worth deciding deliberately. A public board is good for transparency and for letting customers see they are not alone. It also turns your roadmap into a forum you have to moderate, and loud minorities vote. If you only wanted to know what to fix, a private inbox gets you there with less overhead.",
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
        &ldquo;Canny alternatives&rdquo; is a search that spikes on Reddit
        whenever someone opens an invoice. The threads follow a pattern: a team
        adopted Canny when it was cheap, their product got more popular, and the
        bill went up in a way they did not predict. Then twenty replies naming
        other products, with no explanation of why any of them would be
        different.
      </P>

      <P>
        Here is the useful version. We make one of the alternatives, so treat
        the recommendation accordingly and note that this page says clearly
        where Canny is the better choice.
      </P>

      <KeyPoint>
        Before switching, work out whether your problem is Canny or public
        voting boards. If you want the board and dislike the meter, the answer
        is a different board. If you never wanted a public forum, the answer is
        a different category of tool, and switching boards will not help.
      </KeyPoint>

      <H2 id="why">Why the bill grew</H2>

      <P>
        Canny meters on tracked users. A tracked user is anyone who submits,
        votes or comments, which means the meter is engagement. Free covers 25
        tracked users. Core starts at $19 a month and Pro at $79 billed annually
        ($99 monthly). Reported figures put 1,000 tracked users at roughly $275
        a month on Core and $579 on Pro.
      </P>

      <P>
        That is not a trick, it is a choice, and it has a logic: more
        participants means more value from the board. It fails in one specific
        way, which is that a good launch raises your cost without raising your
        revenue. If that is what happened to you, the fix is a tool that meters
        on something else.
      </P>

      <H2 id="options">The alternatives, by what they meter on</H2>

      <UL>
        <LI>
          <strong className="text-ink">Featurebase</strong> — per seat. $29,
          $59 and $99 per seat per month billed yearly, plus $0.29 per AI
          resolution, with a permanent free plan at one seat. Boards, roadmap,
          changelog, surveys, help centre and a support inbox in one product. A
          real like-for-like swap if you want the board, and it has a large
          discount programme for companies under two years old.{" "}
          <Link href="/vs/featurebase" className="text-ink underline underline-offset-2">
            Compared in detail
          </Link>
          .
        </LI>
        <LI>
          <strong className="text-ink">Voicebox</strong> — per piece of
          feedback. Free for 50 a month, $19 for 3,000, $49 for 15,000 with
          unlimited seats, AI analysis on every plan. No public board and no
          voting, so this is a swap only if the board was never the point.{" "}
          <Link href="/vs/canny" className="text-ink underline underline-offset-2">
            Compared in detail
          </Link>
          .
        </LI>
        <LI>
          <strong className="text-ink">Hotjar</strong> — per session. Different
          question entirely: behaviour rather than requests. Worth naming
          because a surprising number of &ldquo;we left Canny&rdquo; threads end
          with someone realising they wanted to see where users struggled.
        </LI>
        <LI>
          <strong className="text-ink">Roll your own.</strong> A form posting to
          a database and a weekly look through it. Genuinely correct under
          maybe fifty pieces a month, and the honest recommendation if that is
          where you are.
        </LI>
      </UL>

      <H2 id="board-question">The question worth asking first</H2>

      <P>
        Do you actually want customers to see each other&apos;s requests?
      </P>

      <P>
        A public board buys you transparency, and it is genuinely reassuring for
        a customer to find their complaint already posted with forty votes. It
        also costs you moderation, gives loud users disproportionate weight, and
        publishes a queue of things you have not built, which some teams find
        harder to live with than they expected.
      </P>

      <P>
        Plenty of teams adopt a board because that is what feedback tools looked
        like, discover they only ever wanted to know what to fix, and are then
        surprised to be paying for participation in a forum they did not want to
        run. If that is the story, the switch is out of the category rather than
        across it.
      </P>

      <H2 id="migrating">Before you migrate</H2>

      <UL>
        <LI>
          Export first. Whatever you move to, your existing feedback is the
          asset and you want it in a file before you cancel anything.
        </LI>
        <LI>
          Check what breaks for customers. If people have bookmarked your public
          board, moving to a private inbox is a visible change and worth
          announcing rather than discovering.
        </LI>
        <LI>
          Count the thing the new tool meters. Whatever it charges for, you want
          a rough figure before you commit, not after.
        </LI>
      </UL>

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
          {
            label: "Featurebase pricing breakdown, FeatureOS",
            url: "https://featureos.com/blog/featurebase-pricing",
          },
        ]}
      />

      <RelatedPosts slug={post.slug} />
    </ArticleShell>
  );
}
