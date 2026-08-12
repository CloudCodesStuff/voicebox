import "server-only";

import { TRPCError } from "@trpc/server";

/* ---------------------------------------------------------------------------
   Best-effort rate limiting.

   A fixed-window counter held in process memory. This is deliberately the
   modest version: on a serverless platform each instance keeps its own map, so
   the effective limit is (configured limit × live instances), and a cold start
   forgets everything. That is fine for what it defends — expensive or abusable
   actions (outbound fetches, LLM calls, mailer sends) where the goal is to stop
   one client hammering one instance in a tight loop, not to meter billing.

   The durable limits that must be exact live in the database instead: the
   widget ingest counter is a row count, and reclustering is gated on the last
   run's timestamp. This is the cheap layer on top.
--------------------------------------------------------------------------- */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

// Keep the map from growing without bound on a long-lived instance: once it's
// large, drop everything already past its reset.
function prune(now: number) {
  if (windows.size < 5_000) return;
  for (const [key, w] of windows) {
    if (w.resetAt <= now) windows.delete(key);
  }
}

export function checkRate(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const w = windows.get(key);

  if (!w || w.resetAt <= now) {
    prune(now);
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }
  if (w.count >= limit) {
    return { ok: false, retryAfterMs: w.resetAt - now };
  }
  w.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

/** tRPC-flavoured: throws TOO_MANY_REQUESTS when the window is spent. */
export function assertRate(key: string, limit: number, windowMs: number): void {
  const { ok, retryAfterMs } = checkRate(key, limit, windowMs);
  if (!ok) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Too many requests. Try again in ${Math.ceil(retryAfterMs / 1000)}s.`,
    });
  }
}
