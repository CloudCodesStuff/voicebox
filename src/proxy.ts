import { NextResponse, type NextRequest } from "next/server";

/**
 * Content negotiation for agents (acceptmarkdown.com).
 *
 * A GET on a marketing route with `Accept: text/markdown` is rewritten to
 * /agent-md/<path>, which serves a markdown rendition of the same page
 * (src/lib/agent-md.ts) with `Content-Type: text/markdown`. Everything else
 * passes through, with `Accept` appended to `Vary` so caches keep the HTML
 * and markdown variants apart.
 *
 * The matcher covers every public marketing path — including nonexistent
 * ones, so a markdown-preferring agent that hits a dead link gets a
 * markdown 404 with recovery links (from the agent-md route) instead of
 * the HTML shell. App, API, auth and asset paths are excluded.
 */
export function proxy(req: NextRequest) {
  const accept = req.headers.get("accept") ?? "";

  if (
    req.method === "GET" &&
    accept.includes("text/markdown") &&
    // A browser's Accept lists text/html first; only reroute callers that
    // actually prefer markdown over html.
    (!accept.includes("text/html") ||
      accept.indexOf("text/markdown") < accept.indexOf("text/html"))
  ) {
    const target = req.nextUrl.clone();
    target.pathname = `/agent-md${req.nextUrl.pathname === "/" ? "" : req.nextUrl.pathname}`;
    const res = NextResponse.rewrite(target);
    res.headers.append("Vary", "Accept");
    return res;
  }

  const res = NextResponse.next();
  res.headers.append("Vary", "Accept");
  return res;
}

export const config = {
  matcher: [
    "/((?!api|app|admin|signin|invite|onboarding|t/|agent-md|_next|.*\\..*).*)",
  ],
};
