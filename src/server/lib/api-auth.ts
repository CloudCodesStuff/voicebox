import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/server/db";
import { hashApiKey } from "@/server/lib/ids";
import {
  ensureUsageWindow,
  hasFeature,
  planLabels,
  requiredPlanFor,
  type Feature,
} from "@/server/lib/plan";
import { checkRate } from "@/server/lib/rate-limit";

const RATE_LIMIT_PER_MINUTE = 120;

/* ---------------------------------------------------------------------------
   Public API authentication
   ---------------------------------------------------------------------------
   Bearer keys, hashed at rest. The plaintext is shown once at creation and
   never again, so a leaked database gives an attacker nothing to replay.

   Lookup is by hash rather than by prefix-then-compare: the hash column is
   unique and indexed, so it is one exact-match query with no scan and no
   opportunity for a timing side channel on our side.
--------------------------------------------------------------------------- */

export type ApiIdentity = { orgId: string; keyId: string; keyName: string };

export type ApiAuthFailure = { response: NextResponse };

export function apiError(
  status: number,
  code: string,
  message: string,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...extra } },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

/**
 * Resolves the caller, or returns the response to send back.
 *
 * Returning the failure response rather than throwing keeps route handlers
 * free of try/catch and makes it impossible to accidentally continue past a
 * failed check: you cannot read `orgId` off the failure shape.
 */
export async function authenticateApi(
  req: NextRequest,
  /**
   * Which plan feature this surface needs. The REST endpoints require "api"
   * (paid); the MCP endpoint requires "mcp" (every plan). Same key, same rate
   * limit, different gate, so a Free key can drive an agent through MCP but
   * gets a clean upgrade prompt from /api/v1.
   */
  requiredFeature: Feature = "api",
): Promise<ApiIdentity | ApiAuthFailure> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token) {
    return {
      response: apiError(
        401,
        "missing_key",
        "Send your API key as `Authorization: Bearer sk_...`. Create one in Settings, Developers.",
      ),
    };
  }

  const key = await db.apiKey.findUnique({
    where: { hashedKey: hashApiKey(token) },
    select: { id: true, name: true, orgId: true, revokedAt: true },
  });

  if (!key || key.revokedAt) {
    return {
      response: apiError(
        401,
        "invalid_key",
        key ? "That API key has been revoked." : "That API key is not valid.",
      ),
    };
  }

  // The gate lives here rather than in the UI so downgrading actually closes
  // the door. Which feature is required depends on the surface (see the param).
  const subscription = await ensureUsageWindow(db, key.orgId);
  if (!hasFeature(subscription.plan, requiredFeature)) {
    const needed = requiredPlanFor(requiredFeature);
    return {
      response: apiError(
        403,
        "upgrade_required",
        `This is available on the ${planLabels[needed]} plan and above.`,
        { requiredPlan: needed },
      ),
    };
  }

  // Per-key throttle. Stops a leaked key exfiltrating the whole corpus at line
  // rate and stops the lastUsedAt write below becoming a row-lock hammer.
  const rate = checkRate(`api:${key.id}`, RATE_LIMIT_PER_MINUTE, 60_000);
  if (!rate.ok) {
    return {
      response: apiError(
        429,
        "rate_limited",
        `Rate limit is ${RATE_LIMIT_PER_MINUTE} requests/minute. Retry in ${Math.ceil(rate.retryAfterMs / 1000)}s.`,
        { retryAfter: Math.ceil(rate.retryAfterMs / 1000) },
      ),
    };
  }

  // Best effort. A failed bookkeeping write must not fail the request.
  void db.apiKey
    .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return { orgId: key.orgId, keyId: key.id, keyName: key.name };
}

export function isAuthFailure(
  result: ApiIdentity | ApiAuthFailure,
): result is ApiAuthFailure {
  return "response" in result;
}

/** Shared list-query parsing so every collection endpoint behaves the same. */
export function readPaging(req: NextRequest): {
  limit: number;
  cursor: string | null;
} {
  const params = req.nextUrl.searchParams;
  const raw = Number(params.get("limit"));
  const limit = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 100) : 25;
  return { limit, cursor: params.get("cursor") };
}

/**
 * A full page means there is probably another one. Handing back a cursor only
 * when the page is full avoids the extra count query, at the cost of one
 * final empty page for callers who page to the very end.
 */
export function jsonList<T>(
  items: T[],
  page: { limit: number; lastId?: string | null } | { complete: true },
): NextResponse {
  const full = "complete" in page ? false : items.length === page.limit;

  return NextResponse.json(
    {
      data: items,
      has_more: full,
      next_cursor: full ? ("lastId" in page ? (page.lastId ?? null) : null) : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
