import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }> = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
    { path: "/docs", priority: 0.8, changeFrequency: "weekly" },
    { path: "/docs/install", priority: 0.7, changeFrequency: "monthly" },
    { path: "/docs/customize", priority: 0.7, changeFrequency: "monthly" },
    { path: "/docs/api", priority: 0.7, changeFrequency: "monthly" },
    { path: "/changelog", priority: 0.5, changeFrequency: "weekly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/dpa", priority: 0.3, changeFrequency: "yearly" },
  ];

  return routes.map((r) => ({
    url: `${site.url}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
