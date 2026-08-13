import type { Metadata } from "next";

import { site } from "@/lib/site";

/**
 * One place that builds a page's metadata.
 *
 * Next merges `metadata` objects shallowly, which is a trap worth stating
 * plainly because it bit every page on this site at once:
 *
 *   • A page that sets `title` and `description` but no `openGraph` does NOT
 *     get those values in its og: tags. It inherits the parent's whole
 *     openGraph object, so every docs and pricing page was sharing as
 *     "Voicebox, Stop reading feedback. Start acting on it."
 *   • A page that sets `openGraph` without `images` REPLACES the inherited
 *     object, image included, so the blog posts had no social image at all.
 *   • `twitter` behaves the same way independently, so a page could have the
 *     right og: tags and the wrong twitter: ones. The blog posts did.
 *
 * Building all four from one input makes those three failures impossible
 * rather than merely fixed.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  published,
  modified,
  ogSlug,
  noindex,
}: {
  title: string;
  description: string;
  /** Absolute path from the site root, e.g. "/docs/install". */
  path: string;
  type?: "website" | "article";
  published?: string;
  modified?: string;
  /** Renders a title-specific social card. Falls back to the default one. */
  ogSlug?: string;
  noindex?: boolean;
}): Metadata {
  const url = `${site.url}${path}`;
  const image = ogSlug
    ? `${site.url}/api/og?slug=${encodeURIComponent(ogSlug)}`
    : `${site.url}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: path },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type,
      title,
      description,
      url,
      siteName: site.name,
      locale: "en_US",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      ...(type === "article" && published
        ? { publishedTime: published, modifiedTime: modified ?? published }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: site.twitter,
      images: [image],
    },
  };
}
