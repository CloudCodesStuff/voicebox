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
  H3,
  KeyPoint,
  LI,
  P,
  RelatedPosts,
  UL,
} from "@/components/marketing/article";
import { getPost } from "@/lib/blog";
import { site } from "@/lib/site";

const post = getPost("how-to-collect-user-feedback-on-your-website")!;

export const metadata: Metadata = {
  title: post.title,
  description: post.description,
  alternates: { canonical: `/blog/${post.slug}` },
  openGraph: {
    type: "article",
    title: post.title,
    description: post.description,
    url: `${site.url}/blog/${post.slug}`,
    publishedTime: post.published,
    modifiedTime: post.updated,
  },
};

const faqs = [
  {
    q: "Where should a feedback button go on a website?",
    a: "Bottom right is the convention and conventions are worth using, because people already look there. Bottom left is the usual alternative when a chat widget already owns the right. What matters more than the corner is that it is present on every page rather than only on a contact page nobody visits.",
  },
  {
    q: "How many questions should a feedback form have?",
    a: "One required field, the message. Everything else optional. Each additional required field measurably reduces completions, and the free-text box is the one that carries information you could not have anticipated.",
  },
  {
    q: "Should I ask for an email address?",
    a: "Ask, do not require. An optional email is the only way to close the loop with someone, and a meaningful share of people will give it. Requiring it turns anonymous complaints, which are often the most honest, into no complaints.",
  },
  {
    q: "When is the best time to ask for feedback?",
    a: "Just after something notable happened: a task completed, an error hit, a first successful use. Feedback asked at a random moment gets generalities; feedback asked thirty seconds after an export failed gets specifics you can act on.",
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
        Most websites collect feedback badly in one of two directions. Either
        there is nothing at all beyond a support email nobody writes to, or
        there is a survey that interrupts people mid-task and asks them to rate
        their experience from one to ten before they have had one.
      </P>

      <KeyPoint>
        The goal is not more feedback. It is feedback specific enough to act on,
        from people who were not selected for their willingness to fill in
        forms.
      </KeyPoint>

      <H2 id="placement">Where to put it</H2>

      <P>
        A persistent button in a bottom corner, on every page. Bottom right is
        the convention; if a chat widget already lives there, use bottom left
        rather than stacking them.
      </P>

      <P>
        The important word is <em>every</em>. Feedback links that live only on a
        contact page collect feedback from people motivated enough to go looking
        for a contact page, which is a narrow and unrepresentative group. The
        person who noticed something confusing on your pricing page will tell
        you if there is a button in front of them and will not if telling you
        requires navigation.
      </P>

      <H3 id="own-button">Using your own button instead</H3>

      <P>
        A floating button is not the only option and sometimes it is the wrong
        one. If your app already has a settled interface, putting
        &ldquo;Send feedback&rdquo; in your own menu is less intrusive and often
        gets used more, because it looks like part of the product rather than a
        bolted-on widget. Any decent tool lets you trigger the panel from your
        own element; in {site.name} that is a{" "}
        <Link href="/docs/triggers" className="text-ink underline underline-offset-2">
          data attribute or one function call
        </Link>
        .
      </P>

      <H2 id="what-to-ask">What to ask</H2>

      <P>As little as possible, in this order of value:</P>

      <UL>
        <LI>
          <strong className="text-ink">The message.</strong> One free-text box.
          This is the entire point and everything else is metadata around it.
        </LI>
        <LI>
          <strong className="text-ink">A type.</strong> Idea, issue, praise,
          question. Four buttons, one tap, and it makes the inbox sortable
          without anyone writing a subject line.
        </LI>
        <LI>
          <strong className="text-ink">A rating, optionally.</strong> Useful for
          trend lines over months. Useless in isolation, and worth skipping
          entirely if you are not going to chart it.
        </LI>
        <LI>
          <strong className="text-ink">An email, optionally.</strong> The only
          way to reply. Optional is doing real work in that sentence.
        </LI>
      </UL>

      <P>
        Everything you add past this trades completions for structure. That is
        sometimes a good trade, but make it deliberately: a form with six
        required fields does not produce six times the insight, it produces a
        fraction of the submissions.
      </P>

      <H2 id="context">Attach the context yourself</H2>

      <P>
        Anything you can capture without asking is information you get for free
        and a question you do not have to make someone answer. Which page they
        were on, which plan they are on, how long they have been a customer.
      </P>

      <P>
        The difference this makes is large. &ldquo;This is confusing&rdquo; is
        nearly useless. &ldquo;This is confusing&rdquo; attached to a specific
        page, from an account on their second day, is a finding about your
        onboarding.
      </P>

      <H2 id="timing">When to ask</H2>

      <P>
        Passive collection, a button that waits, is the baseline and should
        always exist. Prompting is the multiplier, and it works when it follows
        a real moment: a long task finishing, an error being hit, someone
        succeeding at the thing your product is for.
      </P>

      <P>
        Once. A prompt that appears after a meaningful moment reads as
        attentive. The same prompt on every page load reads as a pop-up, and
        people learn to dismiss it without reading, which costs you the
        attention permanently.
      </P>

      <H2 id="after">What happens after matters more than any of this</H2>

      <P>
        Collection is the easy half. The failure most teams actually hit is an
        inbox with four hundred messages nobody has read since March, which is
        worse than no feedback at all, because you are now making decisions
        while believing you have data.
      </P>

      <P>
        Decide up front who reads it and how often, and prefer a system that
        groups messages by the underlying problem rather than making a human
        tag them.{" "}
        <Link href="/blog/what-to-do-with-user-feedback" className="text-ink underline underline-offset-2">
          The next piece
        </Link>{" "}
        covers that part.
      </P>

      <H2 id="privacy">Say what you do with it</H2>

      <P>
        One line under the box is enough. People are more forthcoming when they
        know where their words are going, and if any part of your pipeline sends
        text to a model, that is worth stating plainly rather than burying in a
        policy nobody opens.
      </P>

      <H2 id="faq">Common questions</H2>
      <Faq items={faqs} />

      <ArticleCta />
      <RelatedPosts slug={post.slug} />
    </ArticleShell>
  );
}
