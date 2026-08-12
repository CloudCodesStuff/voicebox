import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { db } from "@/server/db";
import { safeFetch, SsrfError } from "@/server/lib/net-guard";

/* ---------------------------------------------------------------------------
   Outbound webhooks
   ---------------------------------------------------------------------------
   Signed, timeout-bounded, and never able to break the thing that triggered
   them. A customer's endpoint going down must not stop feedback being
   collected, so every failure is recorded on the webhook row and swallowed.

   Signature scheme is Stripe's, because it is the one integrators already
   know how to verify and it is genuinely good: the timestamp is inside the
   signed payload, so a captured request cannot be replayed later.

       Voicebox-Signature: t=1723406400,v1=<hex hmac of "t.body">
--------------------------------------------------------------------------- */

import type { WebhookEvent } from "@/lib/webhook-events";

export {
  WEBHOOK_EVENTS,
  WEBHOOK_EVENT_LABELS,
  type WebhookEvent,
} from "@/lib/webhook-events";

const TIMEOUT_MS = 8_000;

/** Consecutive failures after which we stop knocking. */
const DISABLE_AFTER_FAILURES = 12;

export function signWebhook(
  secret: string,
  timestamp: number,
  body: string,
): string {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
}

/**
 * Constant-time comparison for anyone verifying on our side. Exported mostly
 * so the docs page can point at a real implementation rather than pseudocode.
 */
export function verifyWebhook(
  secret: string,
  header: string,
  body: string,
  toleranceSeconds = 300,
): boolean {
  const parts = Object.fromEntries(
    header.split(",").map((p) => p.split("=") as [string, string]),
  );
  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp) || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false;

  const expected = Buffer.from(signWebhook(secret, timestamp, body), "hex");
  const received = Buffer.from(parts.v1, "hex");
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export type DeliveryResult = {
  ok: boolean;
  status: number | null;
  error: string | null;
};

/** One POST to one endpoint. Never throws. */
export async function deliverOnce(
  webhook: { id: string; url: string; secret: string; failureCount: number },
  event: WebhookEvent,
  data: unknown,
): Promise<DeliveryResult> {
  const timestamp = Math.floor(Date.now() / 1000);
  const body = JSON.stringify({
    event,
    createdAt: new Date(timestamp * 1000).toISOString(),
    data,
  });

  let status: number | null = null;
  let error: string | null = null;

  try {
    // safeFetch, not fetch: the URL passed validation when it was saved, but a
    // DNS record can be repointed at an internal address afterwards, and a 3xx
    // could bounce this signed POST (307/308 keep the body) into the private
    // network. The guard re-resolves and re-checks every hop at delivery time.
    const response = await safeFetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Voicebox-Webhooks/1.0",
        "Voicebox-Event": event,
        "Voicebox-Signature": `t=${timestamp},v1=${signWebhook(webhook.secret, timestamp, body)}`,
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    status = response.status;
    if (!response.ok) error = `Endpoint responded ${response.status}`;
  } catch (cause) {
    error =
      cause instanceof SsrfError
        ? "Endpoint resolved to a disallowed address"
        : cause instanceof Error
          ? cause.name === "TimeoutError"
            ? `No response within ${TIMEOUT_MS / 1000}s`
            : cause.message
          : "Delivery failed";
  }

  const succeeded = error === null;

  await db.webhook
    .update({
      where: { id: webhook.id },
      data: {
        lastFiredAt: new Date(),
        lastStatus: status,
        failureCount: succeeded ? 0 : { increment: 1 },
        // A dead endpoint is eventually left alone rather than retried
        // forever. It stays in the list, switched off, with the last status
        // visible, so the customer can see why and turn it back on.
        ...(succeeded || webhook.failureCount + 1 < DISABLE_AFTER_FAILURES
          ? {}
          : { active: false }),
      },
    })
    .catch(() => {});

  return { ok: succeeded, status, error };
}

/**
 * Fan an event out to every active subscriber in an organization.
 *
 * Fire and forget by design: callers are request handlers whose latency
 * belongs to the customer's user, not to the customer's webhook endpoint.
 */
export async function dispatchWebhook(
  orgId: string,
  event: WebhookEvent,
  data: unknown,
): Promise<void> {
  const webhooks = await db.webhook
    .findMany({
      where: { orgId, active: true, events: { has: event } },
      select: { id: true, url: true, secret: true, failureCount: true },
    })
    .catch(() => []);

  if (webhooks.length === 0) return;

  await Promise.all(webhooks.map((w) => deliverOnce(w, event, data)));
}

/** Same as above but explicitly detached, for use inside request handlers. */
export function dispatchWebhookInBackground(
  orgId: string,
  event: WebhookEvent,
  data: unknown,
): void {
  void dispatchWebhook(orgId, event, data).catch(() => {});
}
