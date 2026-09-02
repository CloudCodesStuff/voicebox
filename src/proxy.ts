import { NextResponse, type NextRequest } from "next/server";

import { REF_COOKIE, REF_PARAM, REF_MAX_AGE_SECONDS, normalizeRef } from "@/lib/attribution";

/**
 * Two jobs, both of which have to happen before a route renders.
 *
 * 1. Content negotiation for agents (acceptmarkdown.com).
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
 *
 * 2. First-touch signup attribution.
 *
 * A visitor arriving on a link that carries `?ref=` gets that tag written to
 * a first-party cookie, which is read once at user creation so a signup can
 * be credited to the post that earned it. See src/lib/attribution.ts for why
 * that is attribution rather than analytics.
 *
 * It rides along in this file because a server component cannot set a cookie
 * and this is the only code that sees the entry request. It needs no matcher
 * of its own: every marketing page a campaign link can point at is already in
 * scope below, and the excluded paths (/app, /admin, /signin) are not places
 * a campaign link sends a stranger.
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
    // Deliberately no cookie on this branch. An agent fetching markdown is
    // not a visitor who might sign up, and tagging it would credit a channel
    // for a crawl.
    return res;
  }

  const res = NextResponse.next();
  res.headers.append("Vary", "Accept");

  tagFirstTouch(req, res);

  return res;
}

/**
 * Writes the channel tag, once, on the first tagged request from this browser.
 *
 * First touch rather than last: a cookie that already holds a value is never
 * overwritten, so the channel that found someone keeps the credit even if they
 * come back later through a different link.
 */
function tagFirstTouch(req: NextRequest, res: NextResponse): void {
  if (req.cookies.has(REF_COOKIE)) return;

  const ref = normalizeRef(req.nextUrl.searchParams.get(REF_PARAM));
  if (!ref) return;

  res.cookies.set({
    name: REF_COOKIE,
    value: ref,
    // Read only on the server, at user creation. Nothing in the browser has
    // any reason to see it, and httpOnly keeps it out of reach of any script
    // that ends up on the page.
    httpOnly: true,
    // `lax`, not `strict`, and this is the line the feature depends on. The
    // user row is created on the OAuth callback, which arrives as a top-level
    // GET navigation from accounts.google.com — a cross-site request. `strict`
    // would withhold the cookie on exactly that request, so every signup
    // would read as untagged and the whole thing would look like it worked.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REF_MAX_AGE_SECONDS,
  });
}

export const config = {
  matcher: [
    "/((?!api|app|admin|signin|invite|onboarding|t/|agent-md|_next|.*\\..*).*)",
  ],
};
