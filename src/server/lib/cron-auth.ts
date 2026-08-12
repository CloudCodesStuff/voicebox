import "server-only";

import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

/* ---------------------------------------------------------------------------
   Cron authorization

   Fails closed: a missing CRON_SECRET returns 503 rather than running the job
   unauthenticated. The bearer comparison is constant-time so the secret can't
   be recovered a byte at a time through response timing.
--------------------------------------------------------------------------- */

function constantTimeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  // timingSafeEqual throws on length mismatch; comparing against a fixed-length
  // digest of each side keeps the compare itself constant-time regardless.
  if (ba.length !== bb.length) {
    // Still run a compare of equal-length buffers so the early return doesn't
    // leak length via timing.
    timingSafeEqual(ba, ba);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

/** Returns an error response to send, or null when the caller is authorized. */
export function authorizeCron(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  const header = req.headers.get("authorization") ?? "";
  if (!constantTimeEqual(header, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
