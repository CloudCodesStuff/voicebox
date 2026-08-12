import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { setActiveOrgCookie } from "@/server/lib/active-org";

/**
 * Points the dashboard at a different workspace.
 *
 * A plain form POST to a route handler rather than a Server Function, and the
 * distinction matters: a Server Function redirect is a soft RSC navigation, so
 * the React Query cache survives it. The layout would correctly re-render with
 * the new workspace's name while the project switcher, the usage meter and
 * every list on the page went on showing the *previous* workspace's data until
 * something happened to refetch. Nothing leaks (the server rejects the queries
 * that matter), but a screen that mixes two tenants is indefensible either way.
 *
 * A form POST answered with a 303 makes the browser fetch a fresh document, so
 * every scrap of client state from the old tenant is gone. It also means the
 * switcher works with JavaScript off.
 *
 * CSRF: the session cookie is SameSite=Lax, so a cross-site POST arrives with
 * no session and lands on /signin. And the worst a forged request could do is
 * move someone between two workspaces they already belong to.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/signin", req.url), 303);
  }

  const form = await req.formData();
  const orgId = String(form.get("orgId") ?? "");

  // The only check that counts: the cookie is written for an org the user
  // holds a membership in, or not at all.
  const membership = await db.membership.findUnique({
    where: { userId_orgId: { userId: session.user.id, orgId } },
    select: { id: true },
  });

  if (membership) await setActiveOrgCookie(orgId);

  return NextResponse.redirect(new URL("/app", req.url), 303);
}
