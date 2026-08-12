import { NextResponse } from "next/server";

import { features } from "@/env";

export const dynamic = "force-dynamic";

/**
 * Liveness + configuration probe.
 *
 * Reports which integrations are wired so a fresh deploy can be verified at a
 * glance. It deliberately reports booleans only, never key material, never
 * partial secrets.
 */
export async function GET() {
  let database: "ok" | "unreachable" | "not_configured" = "not_configured";

  if (process.env.DATABASE_URL) {
    try {
      const { db } = await import("@/server/db");
      await db.$queryRaw`SELECT 1`;
      database = "ok";
    } catch {
      database = "unreachable";
    }
  }

  const body = {
    status: "ok" as const,
    database,
    integrations: {
      email: features.email,
      ai: features.ai,
      billing: features.billing,
      cron: features.cron,
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: database === "unreachable" ? 503 : 200,
  });
}
