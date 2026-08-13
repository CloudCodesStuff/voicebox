import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { relatedPosts, type Post } from "@/lib/blog";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Shared furniture for long-form pages.
 *
 * Two audiences read these: a person, and a machine deciding whether to cite
 * them. The components below serve both without pulling in a markdown
 * pipeline, so every page stays a plain React file that a person can edit and
 * TypeScript can check.
 */

export function ArticleHeader({
  category,
  title,
  description,
  published,
  updated,
  readingMinutes,
}: {
  category: string;
  title: string;
  description: string;
  published: string;
  updated: string;
  readingMinutes: number;
}) {
  return (
    <header className="border-b border-line pb-8">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.78rem] text-steel">
        <Link href="/blog" className="text-mint-deep hover:underline">
          Blog
        </Link>
        <span aria-hidden="true">·</span>
        <span>{category}</span>
        <span aria-hidden="true">·</span>
        <span>{readingMinutes} min read</span>
      </div>

      <h1 className="mt-4 text-[2rem] leading-[1.1] font-bold tracking-[-0.03em] text-ink md:text-[2.6rem]">
        {title}
      </h1>

      <p className="mt-4 max-w-[68ch] text-[1.05rem] leading-relaxed text-ink/80">
        {description}
      </p>

      {/* Both dates, stated plainly. A reader deciding whether to trust a
          pricing figure wants to know when it was last checked, and so does a
          search engine deciding whether the page is still current. */}
      <p className="mt-5 text-[0.78rem] text-steel">
        Published{" "}
        <time dateTime={published}>{formatDate(published)}</time>
        {updated !== published && (
          <>
            {" · Last updated "}
            <time dateTime={updated}>{formatDate(updated)}</time>
          </>
        )}
      </p>
    </header>
  );
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Body text at a comfortable measure. */
export function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 max-w-[68ch] text-[1rem] leading-[1.75] text-steel">
      {children}
    </p>
  );
}

/** Section heading with a stable id, so every section can be linked and cited. */
export function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="mt-14 scroll-mt-24 text-[1.45rem] font-bold tracking-[-0.02em] text-ink"
    >
      {children}
    </h2>
  );
}

export function H3({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3
      id={id}
      className="mt-9 scroll-mt-24 text-[1.1rem] font-semibold tracking-[-0.01em] text-ink"
    >
      {children}
    </h3>
  );
}

export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-5 max-w-[68ch] space-y-2.5 text-[1rem] leading-[1.7] text-steel">
      {children}
    </ul>
  );
}

export function LI({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden="true" className="mt-[0.6em] size-1 shrink-0 rounded-full bg-line-strong" />
      <span className="min-w-0">{children}</span>
    </li>
  );
}

/** A pull-out that carries the answer, for readers and snippet extraction. */
export function KeyPoint({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 max-w-[68ch] rounded-xl border-l-2 border-mint bg-mint-wash p-5">
      <p className="text-[0.98rem] leading-relaxed font-medium text-ink">
        {children}
      </p>
    </div>
  );
}

/** Where a factual claim came from. Used wherever a number appears. */
export function Sources({
  items,
}: {
  items: Array<{ label: string; url: string }>;
}) {
  return (
    <div className="mt-12 max-w-[68ch] rounded-xl border border-line bg-paper-2 p-5">
      <h2 className="label">Sources</h2>
      <ul className="mt-3 space-y-1.5">
        {items.map((s) => (
          <li key={s.url}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener nofollow"
              className="text-[0.86rem] text-steel underline underline-offset-2 hover:text-ink"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.78rem] leading-relaxed text-faint">
        Competitor pricing changes. Figures were checked on the dates shown and
        are not fetched live, so verify anything you are about to spend money on
        against the vendor&apos;s own page.
      </p>
    </div>
  );
}

export function ArticleCta() {
  return (
    <div className="mt-14 max-w-[68ch] rounded-2xl border border-line bg-paper-2 p-6 sm:p-8">
      <h2 className="text-[1.2rem] font-bold tracking-tight text-ink">
        Try it on your own site
      </h2>
      <p className="mt-2 text-[0.94rem] leading-relaxed text-steel">
        One script tag, free for 25 pieces of feedback a month, no card. Every
        submission is scored and grouped automatically, on every plan.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/signin"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-mint px-5 text-[0.92rem] font-semibold text-mint-ink"
        >
          Start free
          <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/docs/install"
          className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-[0.92rem] font-medium text-steel hover:text-ink"
        >
          See the install
        </Link>
      </div>
    </div>
  );
}

export function RelatedPosts({ slug }: { slug: string }) {
  const related = relatedPosts(slug);
  if (related.length === 0) return null;

  return (
    <nav aria-label="Related reading" className="mt-14 border-t border-line pt-8">
      <h2 className="label">Keep reading</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {related.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/blog/${p.slug}`}
              className="group block h-full rounded-xl border border-line bg-paper-2 p-4 transition-colors hover:border-steel"
            >
              <span className="label">{p.category}</span>
              <span className="mt-1.5 block text-[0.92rem] font-semibold leading-snug text-ink">
                {p.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Page shell: consistent measure and rhythm for every long-form page. */
export function ArticleShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("mx-auto max-w-3xl px-4 py-14 sm:px-6", className)}>
      {children}
    </article>
  );
}

/* --------------------------------------------------------------- structured data */

/**
 * JSON-LD for an article.
 *
 * This is the difference between a page a machine has to infer things about
 * and one that states them: who wrote it, when it was last revised, what it is
 * about. Assistants summarising "best feedback widget" pick up the explicit
 * version far more reliably.
 */
export function ArticleJsonLd({ post }: { post: Post }) {
  const url = `${site.url}/blog/${post.slug}`;

  const json = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.published,
    dateModified: post.updated,
    inLanguage: "en",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    author: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
    isAccessibleForFree: true,
  };

  return <JsonLd data={json} />;
}

/** Breadcrumbs, so search results show the path rather than a bare URL. */
export function BreadcrumbJsonLd({
  trail,
}: {
  trail: Array<{ name: string; path: string }>;
}) {
  const json = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${site.url}${t.path}`,
    })),
  };
  return <JsonLd data={json} />;
}

/**
 * FAQ markup.
 *
 * Only ever wrap questions that are genuinely answered in the visible page.
 * Marking up an answer that isn't on screen is the exact thing Google's
 * structured-data guidelines call out, and it gets the whole site's rich
 * results withdrawn rather than just the one page.
 */
export function FaqJsonLd({
  items,
}: {
  items: Array<{ q: string; a: string }>;
}) {
  const json = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return <JsonLd data={json} />;
}

function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // Serialised server-side from our own typed objects, never from user
      // input, and `<` is escaped so a stray value cannot close the tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/**
 * Questions rendered visibly AND marked up, from one source.
 *
 * Keeping them together is what stops the two drifting apart, which is how
 * sites end up with FAQ markup describing answers a reader cannot find.
 */
export function Faq({ items }: { items: Array<{ q: string; a: string }> }) {
  return (
    <>
      <FaqJsonLd items={items} />
      <div className="mt-6 max-w-[68ch] divide-y divide-line border-y border-line">
        {items.map((f) => (
          <div key={f.q} className="py-5">
            <h3 className="text-[1rem] font-semibold text-ink">{f.q}</h3>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-steel">
              {f.a}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
