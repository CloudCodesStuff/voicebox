import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/server/db";
import { hasFeature } from "@/server/lib/plan";
import { parseWidgetConfig } from "@/lib/widget-config";

export const dynamic = "force-dynamic";

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

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  };

  if (!project) {
    return NextResponse.json({ error: "Unknown project" }, { status: 404, headers });
  }

  const config = parseWidgetConfig(project.widgetConfig);
  const plan = project.org.subscription?.plan ?? "FREE";

  return NextResponse.json(
    { ...config, hideBranding: config.hideBranding && hasFeature(plan, "branding") },
    { headers },
  );
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
