import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Default is bottom-left, which sits directly on the hero's primary CTA
  // during local development and in every screenshot.
  devIndicators: {
    position: "bottom-right",
  },

  images: {
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    // A deliberately conservative CSP: only the directives that cannot break
    // Next's inline hydration scripts, Tailwind's injected styles, self-hosted
    // fonts, or Google avatar images. It still shuts down clickjacking
    // (frame-ancestors, stronger than X-Frame-Options), <base> injection,
    // plugin/object embedding, and form hijacking. A full script-src policy
    // needs per-request nonces via middleware — a worthwhile follow-up, but not
    // something to ship half-done in a way that white-screens the app.
    // Deliberately NO `default-src`: that would cascade onto script-src and
    // style-src, and Next hydrates with inline scripts and injects inline
    // styles, so a self-only default white-screens the app. These four
    // directives have no default-src fallback interaction — each governs only
    // its own thing — so they add real protection (clickjacking, <base>
    // injection, plugin embedding, form hijacking) without touching how
    // scripts, styles, images, or fonts load. A full script-src policy needs
    // per-request nonces via middleware, tracked as a follow-up.
    const csp = [
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            // Force HTTPS for two years, including subdomains. Ignored by
            // browsers over http/localhost, so it's safe in every environment.
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
      {
        // The loader is a static file that fetches live config separately at
        // runtime, so it can be cached without making config changes stale. No
        // versioned URL yet, hence revalidation rather than immutable.
        source: "/widget.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=3600",
          },
        ],
      },
      {
        // Let the CDN absorb health-check floods instead of the database.
        source: "/api/health",
        headers: [
          { key: "Cache-Control", value: "public, max-age=5, s-maxage=10" },
        ],
      },
    ];
  },
};

export default nextConfig;
