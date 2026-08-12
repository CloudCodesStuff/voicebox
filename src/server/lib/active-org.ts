import { cookies } from "next/headers";

import type { db as Database } from "@/server/db";

/**
 * Which organization the user is currently looking at.
 *
 * A person can belong to several: their own workspace plus every team that
 * invited them. Something has to say which one the dashboard is showing, and
 * that choice has to survive a page load, so it lives in a cookie.
 *
 * The cookie is a *hint and nothing more*. Every read below re-checks that the
 * user actually has a membership in the org it names, so pasting somebody
 * else's org id in devtools resolves to nothing and falls back to an org they
 * really belong to. The tenant boundary stays where it was: membership rows.
 */
export const ACTIVE_ORG_COOKIE = "voicebox.org";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * The membership the request should be scoped to, or null when the user hasn't
 * joined or created anything yet.
 *
 * Falls back to the oldest membership so the answer is stable: no cookie, a
 * stale cookie, and a cookie for an org they were just removed from all land
 * on the same org rather than shuffling between them.
 */
export async function resolveActiveMembership(
  db: typeof Database,
  userId: string,
) {
  const preferred = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;

  if (preferred) {
    const chosen = await db.membership.findUnique({
      where: { userId_orgId: { userId, orgId: preferred } },
      include: { org: true },
    });
    // Not an error when it misses. They may have left the org, been removed
    // from it, or the org may be gone; either way the fallback is correct.
    if (chosen) return chosen;
  }

  return db.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { org: true },
  });
}

/**
 * Points the session at an org.
 *
 * Only callable from a Server Function or Route Handler, which is where every
 * caller lives (the switcher action, and the mutations that create or join an
 * org). Callers must have verified membership first, this only writes.
 */
export async function setActiveOrgCookie(orgId: string) {
  (await cookies()).set(ACTIVE_ORG_COOKIE, orgId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
}

/** Used after leaving an org, so the next request re-picks from what's left. */
export async function clearActiveOrgCookie() {
  (await cookies()).delete(ACTIVE_ORG_COOKIE);
}
