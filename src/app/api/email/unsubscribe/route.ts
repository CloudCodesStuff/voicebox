import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/server/db";
import { site } from "@/lib/site";
import { verifyUnsubscribeToken } from "@/server/lib/unsubscribe";

export const dynamic = "force-dynamic";

/* ---------------------------------------------------------------------------
   One-click unsubscribe

   POST is the one that matters: RFC 8058 (List-Unsubscribe-Post) has the mail
   client fire a POST when the reader clicks "Unsubscribe" in Gmail's own UI,
   with no page load and no session. GET exists so the link in the message body
   also works when a human clicks it, and it returns a small confirmation page
   rather than JSON, because a human is looking at it.

   Deliberately unauthenticated: the signed token IS the authorization, and
   requiring a login here would defeat the entire purpose.
--------------------------------------------------------------------------- */

async function optOut(token: string | null): Promise<boolean> {
  const membershipId = verifyUnsubscribeToken(token);
  if (!membershipId) return false;

  // updateMany rather than update: a stale link for a membership that has
  // since been removed should read as "already unsubscribed", not a 500.
  await db.membership
    .updateMany({ where: { id: membershipId }, data: { digestOptOut: true } })
    .catch(() => undefined);

  return true;
}

export async function POST(req: NextRequest) {
  const ok = await optOut(req.nextUrl.searchParams.get("t"));
  return NextResponse.json(
    ok ? { ok: true } : { error: "Invalid unsubscribe link" },
    { status: ok ? 200 : 400 },
  );
}

export async function GET(req: NextRequest) {
  const ok = await optOut(req.nextUrl.searchParams.get("t"));

  const message = ok
    ? {
        title: "You're unsubscribed.",
        body: "You won't get the weekly digest any more. Your account and your team's feedback are untouched.",
      }
    : {
        title: "That link didn't work.",
        body: "It may have been altered in transit. You can turn digests off from Settings once you're signed in.",
      };

  // Self-contained HTML: this page is reached from an email client, often in a
  // stripped-down in-app browser, so it should not depend on the app shell.
  return new NextResponse(
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${message.title}</title>
<style>
  :root { color-scheme: dark }
  body { margin:0; min-height:100vh; display:grid; place-items:center;
         background:#080a0a; color:#ecf1ef; padding:24px;
         font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif }
  main { max-width:32rem; text-align:center }
  h1 { font-size:1.5rem; letter-spacing:-0.03em; margin:0 0 12px }
  p { color:#9fada7; line-height:1.65; margin:0 }
  .mark { color:#00e5a0; font-weight:700; letter-spacing:-0.02em; margin-bottom:28px; display:block }
</style>
</head>
<body>
  <main>
    <span class="mark">&#8801;&nbsp;${site.name}</span>
    <h1>${message.title}</h1>
    <p>${message.body}</p>
  </main>
</body>
</html>`,
    {
      status: ok ? 200 : 400,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    },
  );
}
