import type { NextRequest } from "next/server";

import { notFoundMarkdown, pageMarkdown } from "@/lib/agent-md";

/**
 * Serves the markdown rendition of a marketing page.
 *
 * Reached two ways, both via src/proxy.ts: an `Accept: text/markdown`
 * request on a marketing route is rewritten here, and a direct hit (an
 * agent that learned the URL) works too. `Vary: Accept` is load-bearing —
 * without it a CDN can hand the cached HTML variant to an agent asking for
 * markdown, or the markdown to a browser, whichever landed in cache first.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params;
  const path = "/" + (slug?.join("/") ?? "");

  const md = pageMarkdown(path);

  if (!md) {
    return new Response(notFoundMarkdown(path), {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        Vary: "Accept",
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
