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
import { pageMetadata } from "@/lib/seo";

const post = getPost("feedback-widget-vs-survey-tool")!;

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
    q: "What is the difference between a feedback widget and a survey?",
    a: "A survey asks a question you chose at a moment you chose. A widget waits for a moment the user chose and lets them raise the subject. Surveys are better for measuring something specific over time; widgets are better for finding out what you did not know to ask about.",
  },
  {
    q: "Is NPS worth running?",
    a: "As a trend line across quarters, sometimes. As a decision input, rarely. A single number cannot tell you what to change, and the free-text follow-up is where all the usable information in an NPS survey lives, which suggests running the free-text part on its own.",
  },
  {
    q: "Can you use both a widget and surveys?",
    a: "Yes, and it is the common setup. The widget runs permanently and catches whatever people bring you; surveys go out when you have a specific question, such as testing a redesign. They fail in opposite directions, which makes them complementary rather than redundant.",
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
        These get compared as if they were competing products. They are not.
        They differ on one axis that decides everything else: who chose the
        moment, and who chose the subject.
      </P>

      <KeyPoint>
        A survey answers a question you already thought of. A widget surfaces
        the one you did not. If you knew what to ask, run a survey. If you are
        trying to find out what is wrong, you cannot get there by asking better
        questions.
      </KeyPoint>

      <H2 id="surveys">What surveys are good at</H2>

      <UL>
        <LI>
          <strong className="text-ink">Measuring one thing over time.</strong>{" "}
          Same question, same scale, quarter after quarter. That comparability
          is genuinely valuable and a widget cannot give it to you.
        </LI>
        <LI>
          <strong className="text-ink">Testing a specific change.</strong> You
          redesigned checkout and want to know whether it reads as simpler.
          That is a question with a known shape.
        </LI>
        <LI>
          <strong className="text-ink">Reaching people who would never write
          in.</strong> Most users will never volunteer anything. A survey goes
          to them.
        </LI>
      </UL>

      <H2 id="surveys-fail">Where surveys fail</H2>

      <P>
        They can only return answers to questions you already had. If your
        checkout is fine and your export is quietly broken, a checkout survey
        returns reassuring numbers and you learn nothing, while remaining
        confident you measured something.
      </P>

      <P>
        They also interrupt. A survey arrives at a moment convenient for you,
        which biases responses toward people willing to be interrupted, and
        that is not a random sample of your users.
      </P>

      <H2 id="widgets">What widgets are good at</H2>

      <UL>
        <LI>
          <strong className="text-ink">Specificity.</strong> Someone who just
          hit a problem writes about that problem, in detail, while it is in
          front of them.
        </LI>
        <LI>
          <strong className="text-ink">Subjects you did not anticipate.</strong>{" "}
          The free-text box has no opinion about what you should hear.
        </LI>
        <LI>
          <strong className="text-ink">Not interrupting.</strong> It waits. The
          cost of an unused feedback button is zero.
        </LI>
      </UL>

      <H2 id="widgets-fail">Where widgets fail</H2>

      <P>
        Self-selection, and it is a real limitation worth being clear-eyed
        about. The people who write in are disproportionately the annoyed and
        the invested. Silence is not contentment; it is mostly indifference, and
        a widget cannot tell you the difference.
      </P>

      <P>
        They also produce unstructured text, which is only an advantage if
        something turns it into counts.{" "}
        <Link href="/blog/what-to-do-with-user-feedback" className="text-ink underline underline-offset-2">
          That part
        </Link>{" "}
        is where widget-based feedback usually dies.
      </P>

      <H2 id="nps">A note on NPS</H2>

      <P>
        NPS is a survey wearing a widget&apos;s clothes: one question, in the
        product, on a scale. The score itself is nearly useless for deciding
        anything, because &ldquo;7&rdquo; does not tell you what to change.
      </P>

      <P>
        Everything actionable in an NPS response is in the free-text follow-up,
        which is the part most teams skim. If that is where the value is, it is
        worth asking whether the number is earning its place at all.
      </P>

      <H2 id="both">Running both</H2>

      <P>
        The sensible setup for most teams: a widget permanently, surveys
        occasionally. The widget is the always-on channel that catches whatever
        people bring you; surveys go out when you have a specific question worth
        interrupting people for.
      </P>

      <P>
        If you are only going to run one and you do not yet know what is wrong,
        run the widget.{" "}
        <Link href="/blog/how-to-collect-user-feedback-on-your-website" className="text-ink underline underline-offset-2">
          How to set one up well
        </Link>{" "}
        covers placement, what to ask, and when to prompt.
      </P>

      <H2 id="faq">Common questions</H2>
      <Faq items={faqs} />

      <ArticleCta />
      <RelatedPosts slug={post.slug} />
    </ArticleShell>
  );
}
