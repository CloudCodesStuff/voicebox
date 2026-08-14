import { createHash } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/server/db";
import { hasFeature } from "@/server/lib/plan";
import { parseWidgetConfig } from "@/lib/widget-config";

export const dynamic = "force-dynamic";

/**
 * How long a saved change can take to reach a live widget.
 *
 * Deliberately NOT stale-while-revalidate. Under SWR the browser paints the
 * widget from the cached config the moment the freshness window has passed
 * and fetches the new one afterwards, so the FIRST page load after a save
 * showed the old design and only the load after that showed the new one.
 * From the studio that reads as "whatever I changed last didn't save", every
 * time, because the setting you just touched is the one that appears stale.
 *
 * Split evenly between the browser and the CDN so the worst case is the sum,
 * which is the minute the studio promises rather than the six that SWR
 * allowed.
 */
const MAX_AGE_SECONDS = 30;

/**
 * Public runtime config for a widget instance.
 *
 * Returns appearance only, never the org, never counts, never anything about
 * the customer's account. Branding removal is resolved here against the live
 * plan rather than trusting the stored flag, so a downgrade takes effect
 * immediately instead of whenever someone next opens the studio.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;

  const project = await db.project.findUnique({
    where: { key },
    select: {
      widgetConfig: true,
      org: { select: { subscription: { select: { plan: true } } } },
    },
  });

  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": `public, max-age=${MAX_AGE_SECONDS}, s-maxage=${MAX_AGE_SECONDS}`,
  };

  if (!project) {
    return NextResponse.json({ error: "Unknown project" }, { status: 404, headers });
  }

  const config = parseWidgetConfig(project.widgetConfig);
  const plan = project.org.subscription?.plan ?? "FREE";

  const payload = JSON.stringify({
    ...config,
    hideBranding: config.hideBranding && hasFeature(plan, "branding"),
  });

  // An ETag over exactly the bytes we would send. Dropping SWR means the
  // browser revalidates once the window passes instead of serving stale, and
  // this makes that revalidation a bodyless 304 whenever nothing has changed,
  // which is almost always.
  const etag = `W/"${createHash("sha1").update(payload).digest("base64url").slice(0, 22)}"`;
  const withEtag = { ...headers, ETag: etag, "Content-Type": "application/json" };

  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: withEtag });
  }

  return new NextResponse(payload, { headers: withEtag });
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
