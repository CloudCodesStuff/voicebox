import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { analyzeOne } from "@/server/ai/pipeline";
import { db } from "@/server/db";
import { serializeFeedback } from "@/server/lib/api-shapes";
import { ensureUsageWindow, ingestDecision } from "@/server/lib/plan";
import { dispatchWebhookInBackground } from "@/server/lib/webhooks";

export const dynamic = "force-dynamic";

/* ---------------------------------------------------------------------------
   Widget ingest
   ---------------------------------------------------------------------------
   The only endpoint the widget talks to, and the only place untrusted input
   from the open internet enters the system. Every guard lives here:

     • project key must exist
     • Origin must match the project's allowlist
     • per-IP and per-project rate limits
     • honeypot + submission timing to catch bots without a captcha
     • hard size caps

   Deliberately no captcha: it would halve the submission rate, and the value
   of the product is volume of honest feedback.
--------------------------------------------------------------------------- */

const MAX_METADATA_KEYS = 30;
const MAX_METADATA_BYTES = 4_000;

/**
 * Fits metadata inside the storage cap, keeping as much as will fit.
 *
 * Keys are taken in insertion order, which for an `identify()` call is the
 * order the developer wrote them, so the traits they thought of first survive.
 * Returns null rather than an empty object when nothing fits, since a `{}` on
 * the record would suggest the visitor was identified when they weren't.
 */
function trimMetadata(
  raw: Record<string, unknown>,
): Record<string, unknown> | null {
  const kept: Record<string, unknown> = {};

  for (const key of Object.keys(raw).slice(0, MAX_METADATA_KEYS)) {
    const candidate = { ...kept, [key]: raw[key] };
    if (JSON.stringify(candidate).length > MAX_METADATA_BYTES) break;
    kept[key] = raw[key];
  }

  return Object.keys(kept).length > 0 ? kept : null;
}

const ingestSchema = z.object({
  key: z.string().min(8).max(64),
  body: z.string().trim().min(1).max(5_000),
  type: z.enum(["IDEA", "ISSUE", "PRAISE", "QUESTION", "OTHER"]).default("OTHER"),
  rating: z.number().int().min(1).max(5).nullish(),
  email: z.string().trim().email().max(200).nullish().or(z.literal("")),
  // Stored and later rendered as a clickable link in the dashboard. React
  // already neutralises javascript: URLs, but pinning the scheme at the door
  // means only http/https is ever persisted, so no other surface (an export, a
  // Slack unfurl) can be handed a hostile scheme later.
  pageUrl: z
    .string()
    .max(2_000)
    .nullish()
    .refine(
      (v) => !v || /^https?:\/\//i.test(v),
      "pageUrl must be http(s)",
    ),
  locale: z.string().max(20).nullish(),
  referrer: z
    .string()
    .max(2_000)
    .nullish()
    .refine(
      (v) => !v || /^https?:\/\//i.test(v),
      "referrer must be http(s)",
    ),
  metadata: z
    .record(z.string(), z.unknown())
    // Traits are a convenience, not a document store. Cap the shape so a
    // single submission can't write a multi-megabyte blob into the JSON column
    // (body/pageUrl/referrer are already capped; this was the one hole).
    //
    // Trimmed rather than rejected, deliberately. These caps used to be
    // `refine`, which failed the whole request: one `identify()` call with too
    // many traits meant every piece of feedback that visitor ever wrote was
    // thrown away, and the only signal was "Couldn't send that" in the widget.
    // The person typing has no idea a developer over-filled a metadata object,
    // and their words are the part worth keeping. Enforce the storage limit by
    // dropping traits, never by discarding the message.
    .transform(trimMetadata)
    .nullish(),
  /** Hidden field. Any value means a bot filled the form. */
  _hp: z.string().max(200).nullish(),
  /** Milliseconds the panel was open before submit. */
  _elapsed: z.number().nonnegative().nullish(),
});

const MIN_HUMAN_MS = 1_200;
const RATE_LIMIT_PER_IP_PER_HOUR = 10;

function corsHeaders(origin: string | null) {
  return {
    // The allowlist is enforced below against the project's own domains; the
    // wildcard here only permits the browser to make the request at all.
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers });
  }

  const parsed = ingestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission" },
      { status: 400, headers },
    );
  }

  const input = parsed.data;

  // Bot checks. Both fail silently with a 200 so a scripted submitter gets no
  // signal about which guard caught it.
  if (input._hp) return NextResponse.json({ ok: true }, { headers });
  if (input._elapsed != null && input._elapsed < MIN_HUMAN_MS) {
    return NextResponse.json({ ok: true }, { headers });
  }

  const project = await db.project.findUnique({
    where: { key: input.key },
    select: { id: true, orgId: true, allowedDomains: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Unknown project" }, { status: 404, headers });
  }

  // Origin allowlist. An empty list means "any origin", a deliberate
  // convenience for local development that the settings UI warns about. But
  // once a list is set it is the ONLY integrity control on who can write into
  // a project (the pk_ key is public, it sits in the customer's page source),
  // so a request that carries no Origin at all must be refused rather than
  // waved through. A real browser always sends Origin on a cross-origin POST;
  // a curl script trying to skip the check does not.
  if (project.allowedDomains.length > 0) {
    if (!origin) {
      return NextResponse.json(
        { error: "Origin required for this project" },
        { status: 403, headers },
      );
    }

    let host: string;
    try {
      host = new URL(origin).hostname;
    } catch {
      return NextResponse.json({ error: "Bad origin" }, { status: 403, headers });
    }

    const allowed = project.allowedDomains.some((domain) => {
      const d = domain.trim().toLowerCase().replace(/^\*\./, "");
      return host === d || host.endsWith(`.${d}`);
    });

    if (!allowed) {
      return NextResponse.json(
        { error: "Origin not allowed for this project" },
        { status: 403, headers },
      );
    }
  }

  // Rate limit per IP. Counting existing rows avoids a second store; the
  // index on (projectId, createdAt) makes it cheap.
  //
  // Trust `x-real-ip` first: on the deployment platform (Vercel) it is set by
  // the proxy to the real client address and cannot be spoofed by the client.
  // `x-forwarded-for` is a client-appendable list, so its leftmost element is
  // attacker-controlled — keying the limit on it let a submitter reset their
  // own counter with a rotating header. It stays only as a last-resort
  // fallback, and we take the RIGHTMOST hop (closest to us), not the leftmost.
  const xff = req.headers.get("x-forwarded-for");
  const ip =
    req.headers.get("x-real-ip")?.trim() ||
    xff?.split(",").pop()?.trim() ||
    "unknown";

  const anHourAgo = new Date(Date.now() - 3_600_000);
  const recentFromIp = await db.feedback.count({
    where: {
      projectId: project.id,
      createdAt: { gte: anHourAgo },
      metadata: { path: ["_ip"], equals: ip },
    },
  });

  if (recentFromIp >= RATE_LIMIT_PER_IP_PER_HOUR) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429, headers },
    );
  }

  // Quota. Feedback belongs to the customer's users, so being over plan slows
  // analysis rather than discarding data, see ingestDecision.
  const subscription = await ensureUsageWindow(db, project.orgId);
  const decision = ingestDecision(subscription);

  if (!decision.accept) {
    return NextResponse.json(
      { error: "This project is not accepting feedback right now." },
      { status: 429, headers },
    );
  }

  const feedback = await db.feedback.create({
    data: {
      orgId: project.orgId,
      projectId: project.id,
      body: input.body,
      type: input.type,
      rating: input.rating ?? null,
      email: input.email || null,
      pageUrl: input.pageUrl ?? null,
      referrer: input.referrer ?? null,
      locale: input.locale ?? null,
      userAgent: req.headers.get("user-agent")?.slice(0, 1_000) ?? null,
      metadata: { ...(input.metadata ?? {}), _ip: ip },
    },
    include: { theme: { select: { id: true, title: true } } },
  });

  await db.subscription.update({
    where: { orgId: project.orgId },
    data: { feedbackUsedThisPeriod: { increment: 1 } },
  });

  // Notify subscribers. Detached, because the person who just clicked Send is
  // waiting on this response and their latency is not the customer's webhook
  // endpoint's to spend.
  dispatchWebhookInBackground(
    project.orgId,
    "feedback.created",
    serializeFeedback(feedback),
  );

  // Enrich without making the submitter wait. The cron sweep catches anything
  // that fails or gets cut short by the function ending.
  if (decision.analyze) {
    void analyzeOne(feedback.id).catch(() => {});
  }

  return NextResponse.json({ ok: true, id: feedback.id }, { headers });
}
