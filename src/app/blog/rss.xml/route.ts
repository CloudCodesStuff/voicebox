import { postsByDate } from "@/lib/blog";
import { site } from "@/lib/site";

/**
 * RSS for the blog.
 *
 * Still how aggregators, newsletter tools and a good number of developers
 * follow a site, and it costs one file. A blog without a feed is one people
 * have to remember to come back to.
 */
export const dynamic = "force-static";

/** RSS is XML: an unescaped `&` in a title is a parse error, not a typo. */
function xml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const items = postsByDate
    .map((p) => {
      const url = `${site.url}/blog/${p.slug}`;
      return `    <item>
      <title>${xml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${xml(p.description)}</description>
      <category>${xml(p.category)}</category>
      <pubDate>${new Date(`${p.published}T00:00:00Z`).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(site.name)} Blog</title>
    <link>${site.url}/blog</link>
    <description>${xml(site.description)}</description>
    <language>en</language>
    <lastBuildDate>${new Date(`${postsByDate[0]?.updated ?? "2026-01-01"}T00:00:00Z`).toUTCString()}</lastBuildDate>
    <atom:link href="${site.url}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
