/**
 * The blog index, in one place.
 *
 * Every post is a real page under `src/app/(marketing)/blog/<slug>/page.tsx`.
 * This file is the registry those pages are listed from: the index page, the
 * sitemap, the previous/next pager and the related-posts block all read it, so
 * a post added here is linked from everywhere without touching four files.
 *
 * `updated` matters more than `published` for search: a page that says it was
 * last reviewed this month and is telling the truth outranks one that quietly
 * rotted. Update it when you actually revise the post, not on every deploy.
 */
export type PostCategory = "Guide" | "Comparison" | "Opinion" | "Reference";

export type Post = {
  slug: string;
  title: string;
  /** Used as the meta description and the index card blurb. Keep under 155. */
  description: string;
  category: PostCategory;
  published: string;
  updated: string;
  /** Minutes. Honest estimate, not padded. */
  readingMinutes: number;
  /** Search intent this page is written for, for whoever maintains it later. */
  targets: string[];
};

export const posts: Post[] = [
  {
    slug: "best-feedback-widget-reddit",
    title: "The best feedback widget, according to the questions Reddit keeps asking",
    description:
      "People ask for a website feedback widget on Reddit constantly. Here is a straight comparison of the real options, what each is actually good at, and when to pick none of them.",
    category: "Comparison",
    published: "2026-08-13",
    updated: "2026-08-13",
    readingMinutes: 9,
    targets: [
      "best feedback widget reddit",
      "website feedback tool reddit",
      "feedback widget recommendations",
    ],
  },
  {
    slug: "canny-alternatives-reddit",
    title: "Canny alternatives: what people on Reddit are actually asking for",
    description:
      "Canny prices on tracked users, which surprises teams as they grow. Here is what the alternatives cost, how their pricing models differ, and which one fits which situation.",
    category: "Comparison",
    published: "2026-08-13",
    updated: "2026-08-13",
    readingMinutes: 8,
    targets: [
      "canny alternatives reddit",
      "canny alternative",
      "cheaper than canny",
    ],
  },
  {
    slug: "how-to-collect-user-feedback-on-your-website",
    title: "How to collect user feedback on your website without annoying anyone",
    description:
      "Where to put the button, what to ask, how many questions is too many, and what to do with the replies once they arrive. A practical guide with the tradeoffs stated.",
    category: "Guide",
    published: "2026-08-13",
    updated: "2026-08-13",
    readingMinutes: 10,
    targets: [
      "how to collect user feedback on website",
      "website feedback best practices",
      "in-app feedback",
    ],
  },
  {
    slug: "tracked-user-pricing-is-a-trap",
    title: "Why tracked-user pricing punishes you for succeeding",
    description:
      "Feedback tools that bill per tracked user charge you more the better your product does. Here is the arithmetic, with real 2026 numbers, and what to look for instead.",
    category: "Opinion",
    published: "2026-08-13",
    updated: "2026-08-13",
    readingMinutes: 6,
    targets: [
      "tracked user pricing",
      "canny pricing explained",
      "feedback tool pricing comparison",
    ],
  },
  {
    slug: "what-to-do-with-user-feedback",
    title: "You have 400 pieces of feedback. Now what?",
    description:
      "Reading everything does not scale and tagging by keyword misses the point. How to group feedback by the underlying problem and rank what to fix first.",
    category: "Guide",
    published: "2026-08-13",
    updated: "2026-08-13",
    readingMinutes: 8,
    targets: [
      "what to do with user feedback",
      "how to prioritize user feedback",
      "feedback analysis",
    ],
  },
  {
    slug: "feedback-widget-vs-survey-tool",
    title: "Feedback widget vs survey tool: which one do you actually need?",
    description:
      "Surveys ask everyone the same question at a moment you chose. Widgets wait for the moment they chose. The difference decides which answers you get.",
    category: "Guide",
    published: "2026-08-13",
    updated: "2026-08-13",
    readingMinutes: 7,
    targets: [
      "feedback widget vs survey",
      "nps vs open feedback",
      "when to use a feedback widget",
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

/** Newest first, for the index. */
export const postsByDate = [...posts].sort((a, b) =>
  b.published.localeCompare(a.published),
);

/**
 * Three others to read next, preferring the same category.
 *
 * A dead end at the bottom of an article is a wasted session and a wasted
 * crawl: internal links are how the rest of these pages get discovered.
 */
export function relatedPosts(slug: string, limit = 3): Post[] {
  const current = getPost(slug);
  if (!current) return postsByDate.slice(0, limit);

  const others = postsByDate.filter((p) => p.slug !== slug);
  const sameCategory = others.filter((p) => p.category === current.category);
  const rest = others.filter((p) => p.category !== current.category);

  return [...sameCategory, ...rest].slice(0, limit);
}
