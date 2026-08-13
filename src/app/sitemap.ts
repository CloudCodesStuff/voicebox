import type { MetadataRoute } from "next";

import { comparisons } from "@/lib/comparisons";
import { posts } from "@/lib/blog";
import { site } from "@/lib/site";

/**
 * Static routes, hand-weighted. Content routes are appended from their
 * registries below, so adding a post or a comparison never means remembering
 * to come back here.
 */
const staticRoutes: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
  { path: "/docs", priority: 0.8, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/vs", priority: 0.8, changeFrequency: "monthly" },
  { path: "/docs/install", priority: 0.7, changeFrequency: "monthly" },
  { path: "/docs/triggers", priority: 0.7, changeFrequency: "monthly" },
  { path: "/docs/customize", priority: 0.7, changeFrequency: "monthly" },
  { path: "/docs/security", priority: 0.7, changeFrequency: "monthly" },
  { path: "/docs/troubleshooting", priority: 0.6, changeFrequency: "monthly" },
  { path: "/docs/api", priority: 0.7, changeFrequency: "monthly" },
  { path: "/changelog", priority: 0.5, changeFrequency: "weekly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/dpa", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries = staticRoutes.map((r) => ({
    url: `${site.url}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // `lastModified` is the post's own updated date, not the deploy time. A
  // sitemap that claims every page changed on every deploy trains crawlers to
  // ignore the field.
  const postEntries = posts.map((p) => ({
    url: `${site.url}/blog/${p.slug}`,
    lastModified: new Date(`${p.updated}T00:00:00Z`),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const comparisonEntries = comparisons.map((c) => ({
    url: `${site.url}/vs/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  return [...staticEntries, ...postEntries, ...comparisonEntries];
}
