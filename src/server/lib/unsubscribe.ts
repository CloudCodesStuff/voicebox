import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/* ---------------------------------------------------------------------------
   One-click unsubscribe tokens

   An unsubscribe link that requires signing in is not an unsubscribe link. The
   person who wants the mail to stop is often the person least willing to log
   in, and Gmail/Yahoo bulk-sender rules (and CAN-SPAM) expect the opt-out to
   work in one click from the message itself.

   So the link carries a signed membership id rather than a session. It is
   HMAC-SHA256 over the id with AUTH_SECRET, which means:
     • it cannot be forged or enumerated to unsubscribe someone else,
     • it grants exactly one capability (stop this org's digest for this
       person) and no read access to anything,
     • it needs no extra table and no expiry, because the capability stays
       valid for as long as the membership does and is harmless if replayed.
--------------------------------------------------------------------------- */

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is required to sign unsubscribe links");
  return value;
}

function sign(membershipId: string): string {
  return createHmac("sha256", secret())
    .update(`unsubscribe:${membershipId}`)
    .digest("base64url");
}

export function unsubscribeToken(membershipId: string): string {
  return `${membershipId}.${sign(membershipId)}`;
}

/** Returns the membership id, or null if the token is missing or forged. */
export function verifyUnsubscribeToken(token: string | null): string | null {
  if (!token) return null;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;

  const membershipId = token.slice(0, separator);
  const provided = token.slice(separator + 1);
  const expected = sign(membershipId);

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? membershipId : null;
}

export function unsubscribeUrl(appUrl: string, membershipId: string): string {
  return `${appUrl}/api/email/unsubscribe?t=${encodeURIComponent(unsubscribeToken(membershipId))}`;
}
