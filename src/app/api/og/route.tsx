import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { getPost } from "@/lib/blog";
import { getComparison } from "@/lib/comparisons";
import { site } from "@/lib/site";

export const runtime = "nodejs";

/**
 * Per-page social cards.
 *
 * Takes a slug, never a title. Accepting arbitrary text would let anyone
 * render whatever words they liked onto an image served from this domain,
 * which is a phishing primitive dressed up as a convenience: a card that looks
 * official because the URL genuinely is. Looking the title up from our own
 * registries means the only text this can ever draw is text we published.
 *
 * An unknown slug falls through to the generic card rather than erroring, so a
 * renamed post degrades to a plain image instead of a broken one.
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") ?? "";

  const post = getPost(slug);
  const comparison = getComparison(slug);

  const title = post?.title ?? comparison?.title ?? site.tagline;
  const kicker = post
    ? post.category
    : comparison
      ? "Comparison"
      : site.name;
  const subtitle =
    post?.description ?? comparison?.description ?? site.description;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#09090B",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "#00C48C",
              display: "flex",
            }}
          />
          <div
            style={{
              color: "#FAFAFA",
              fontSize: "30px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              display: "flex",
            }}
          >
            {site.name}
          </div>
          <div
            style={{
              color: "#71717A",
              fontSize: "22px",
              marginLeft: "8px",
              display: "flex",
            }}
          >
            {kicker}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div
            style={{
              color: "#FAFAFA",
              fontSize: title.length > 70 ? "52px" : "62px",
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: "-0.035em",
              display: "flex",
              maxWidth: "1000px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: "#A1A1AA",
              fontSize: "26px",
              lineHeight: 1.4,
              display: "flex",
              maxWidth: "940px",
            }}
          >
            {subtitle.length > 150 ? `${subtitle.slice(0, 150)}…` : subtitle}
          </div>
        </div>

        <div
          style={{
            color: "#71717A",
            fontSize: "22px",
            display: "flex",
          }}
        >
          {new URL(site.url).host}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // Deterministic for a given slug, so it can be cached hard. Social
        // scrapers fetch this repeatedly and rendering it every time is waste.
        "Cache-Control": "public, max-age=3600, s-maxage=86400, immutable",
      },
    },
  );
}
