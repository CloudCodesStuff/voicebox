import { ImageResponse } from "next/og";

import { site } from "@/lib/site";

export const runtime = "nodejs";
export const alt = `${site.name}, ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default social card, rendered at request time by next/og. No design tool in
 * the loop, so it can never drift from the brand tokens.
 *
 * Satori requires explicit `display: flex` on any element with more than one
 * child, a silent build failure otherwise.
 */
export default function OpengraphImage() {
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
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 5h18M6 12h12M10 19h4"
              stroke="#00C48C"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
          <div
            style={{
              display: "flex",
              marginLeft: 14,
              fontSize: 32,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
            }}
          >
            {site.name}
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 940 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#FFFFFF",
              lineHeight: 1.06,
              letterSpacing: "-0.035em",
            }}
          >
            Stop reading feedback. Start acting on it.
          </div>
          <div
            style={{
              marginTop: 26,
              fontSize: 26,
              color: "rgba(251,251,250,0.5)",
              lineHeight: 1.45,
            }}
          >
            A feedback widget you embed in one line, and an AI that tells you
            what to fix next.
          </div>
        </div>

        {/* 412 → 6, the product in two numbers */}
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 700, color: "rgba(251,251,250,0.22)" }}>
            412 comments
          </div>
          <div style={{ display: "flex", fontSize: 44, color: "rgba(251,251,250,0.2)", margin: "0 22px" }}>
            →
          </div>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 700, color: "#00C48C" }}>
            6 themes
          </div>
        </div>
      </div>
    ),
    size,
  );
}
