import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/app/",
          "/signin",
          // Customer status pages are unlisted by design. The token in the URL
          // is unguessable, but they must never end up in a search index.
          "/t/",
        ],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
