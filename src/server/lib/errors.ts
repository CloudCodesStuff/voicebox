import { createHash } from "node:crypto";

import { db } from "@/server/db";

/**
 * Error capture.
 *
 * There is no Sentry here. Errors go into a table in the database you already
 * pay for, and the admin dashboard reads them back. That trade buys no source
 * maps and no release tracking, and avoids a vendor, a bill, and a new
 * subprocessor entry in the DPA.
 *
 * Three rules this file exists to enforce:
 *
 *   1. It can never throw. An error reporter that breaks the request it is
 *      reporting on has made things worse than reporting nothing.
 *   2. It never stores what a customer's users wrote. Error trackers are where
 *      personal data quietly accumulates in a place nobody audits, so the
 *      redaction below runs before anything is written.
 *   3. It groups. One fault occurring ten thousand times is one row with a
 *      counter, not ten thousand rows.
 */

export type ErrorSource =
  | "trpc"
  | "ingest"
  | "cron"
  | "stripe"
  | "email"
  | "analysis"
  | "widget";

type CaptureInput = {
  source: ErrorSource;
  error: unknown;
  /** Operational breadcrumbs only: route, org id, job name. Never content. */
  context?: Record<string, unknown>;
  level?: "error" | "warn";
};

const MAX_MESSAGE = 1_000;
const MAX_STACK = 4_000;
const MAX_CONTEXT_BYTES = 2_000;

/**
 * Anything that looks like an address, replaced before storage.
 *
 * A stack trace or a provider error routinely quotes the input that caused it,
 * and for this product that input is frequently somebody's email.
 */
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

/** Long opaque tokens: keys, secrets, signatures that leaked into a message. */
const TOKEN_RE = /\b(sk|pk|whsec|re)_[A-Za-z0-9_-]{8,}/g;

function redact(text: string): string {
  return text.replace(EMAIL_RE, "[email]").replace(TOKEN_RE, "$1_[redacted]");
}

/**
 * Strips the parts of a message that vary between occurrences of one fault, so
 * they group together.
 *
 * "Project cmsq1 not found" and "Project cmsq2 not found" are the same bug;
 * without this they are two rows and neither looks urgent.
 */
function normalise(message: string): string {
  return (
    message
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "<uuid>")
      // A range, not an exact length. Pinning this to 25 characters looked
      // right against a sample cuid and silently failed to group anything a
      // character shorter, which turns one fault into a row per occurrence:
      // exactly the flood this normalisation exists to prevent.
      .replace(/\bc[a-z0-9]{16,30}\b/gi, "<id>")
      // Any other long opaque token: hashes, request ids, keys already
      // redacted to a prefix.
      .replace(/\b[a-z0-9]{24,}\b/gi, "<token>")
      .replace(/\b\d{4,}\b/g, "<n>")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300)
  );
}

function describe(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message || error.name, stack: error.stack };
  }
  if (typeof error === "string") return { message: error };
  try {
    return { message: JSON.stringify(error).slice(0, MAX_MESSAGE) };
  } catch {
    return { message: "Unserialisable error value" };
  }
}

/**
 * Keeps the context object small and free of anything customer-written.
 *
 * Returns a Prisma JSON value rather than a plain record: every entry is
 * stringified on the way in, so what comes out is always a flat string map and
 * satisfies `InputJsonObject` without a cast that would let a non-serialisable
 * value through.
 */
function safeContext(
  context: Record<string, unknown> | undefined,
): Record<string, string | boolean> | null {
  if (!context) return null;
  try {
    const cleaned: Record<string, string | boolean> = {};
    for (const [k, v] of Object.entries(context)) {
      if (v === undefined || v === null) continue;
      const asText = typeof v === "string" ? v : JSON.stringify(v);
      if (asText === undefined) continue;
      cleaned[k] = redact(asText).slice(0, 300);
    }
    const serialised = JSON.stringify(cleaned);
    if (serialised.length > MAX_CONTEXT_BYTES) {
      return { truncated: true };
    }
    return cleaned;
  } catch {
    return null;
  }
}

/**
 * Records an error and, the first time a given fault is seen, emails the
 * operator once.
 *
 * Always returns; never rejects. Callers can `void captureError(...)` inside a
 * catch block without adding a second failure path to the thing that already
 * failed.
 */
export async function captureError(input: CaptureInput): Promise<void> {
  try {
    const { message, stack } = describe(input.error);
    const cleanMessage = redact(message).slice(0, MAX_MESSAGE);
    const fingerprint = createHash("sha256")
      .update(`${input.source}:${normalise(cleanMessage)}`)
      .digest("hex")
      .slice(0, 32);

    const now = new Date();

    const event = await db.errorEvent.upsert({
      where: { fingerprint },
      create: {
        fingerprint,
        source: input.source,
        level: input.level ?? "error",
        message: cleanMessage,
        stack: stack ? redact(stack).slice(0, MAX_STACK) : null,
        context: safeContext(input.context) ?? undefined,
        firstSeenAt: now,
        lastSeenAt: now,
      },
      update: {
        count: { increment: 1 },
        lastSeenAt: now,
        // Newest wording wins, so a message that gained detail is not hidden
        // behind the first version ever seen.
        message: cleanMessage,
        stack: stack ? redact(stack).slice(0, MAX_STACK) : undefined,
        // A recurrence un-resolves it. Marking something fixed and having it
        // come back silently is how a dashboard starts lying.
        resolvedAt: null,
      },
      select: { id: true, count: true, notifiedAt: true, source: true, message: true },
    });

    if (!event.notifiedAt) {
      await notifyOnce(event.id, event.source, event.message);
    }
  } catch {
    // Deliberately silent. Capture must never surface a second failure on top
    // of the one being reported.
  }
}

/**
 * One email per distinct fault, ever.
 *
 * Alerting on every occurrence trains you to filter the alerts, which is the
 * same as having none. `notifiedAt` is set first so a burst cannot race into
 * a hundred emails.
 */
async function notifyOnce(
  id: string,
  source: string,
  message: string,
): Promise<void> {
  try {
    const claimed = await db.errorEvent.updateMany({
      where: { id, notifiedAt: null },
      data: { notifiedAt: new Date() },
    });
    if (claimed.count === 0) return;

    const { adminEmails } = await import("@/server/lib/admin");
    const recipients = adminEmails();
    if (recipients.length === 0) return;

    const { sendEmail, emailShell } = await import("@/server/lib/email");
    const { clientEnv } = await import("@/env");
    const url = `${clientEnv.NEXT_PUBLIC_APP_URL}/admin/errors`;

    for (const to of recipients) {
      await sendEmail({
        to,
        subject: `New error in ${source}: ${message.slice(0, 80)}`,
        html: emailShell({
          title: "A new error appeared",
          preview: message.slice(0, 120),
          body: `<p style="margin:0 0 12px"><strong>${escapeHtml(source)}</strong></p>
<p style="margin:0 0 16px;font-family:ui-monospace,monospace;font-size:13px">${escapeHtml(message.slice(0, 400))}</p>
<p style="margin:0">This is the first time this particular error has been seen. Repeats will not email you again.</p>
<p style="margin:16px 0 0"><a href="${url}">Open the error log</a></p>`,
        }),
        text: `New error in ${source}\n\n${message}\n\nFirst occurrence. Repeats will not email again.\n\n${url}`,
      });
    }
  } catch {
    /* Alerting is best effort. */
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => {
    return (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        ch
      ] ?? ch
    );
  });
}

/** Retention. Called from the analyze cron alongside the IP purge. */
export async function purgeOldErrors(days = 30): Promise<number> {
  const cutoff = new Date(Date.now() - days * 86_400_000);
  const { count } = await db.errorEvent.deleteMany({
    where: { lastSeenAt: { lt: cutoff } },
  });
  return count;
}
