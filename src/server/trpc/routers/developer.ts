import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, createTRPCRouter, orgProcedure } from "@/server/trpc/init";
import { apiKey as newApiKey, webhookSecret } from "@/server/lib/ids";
import { assertFeature, ensureUsageWindow } from "@/server/lib/plan";
import {
  WEBHOOK_EVENTS,
  deliverOnce,
  type WebhookEvent,
} from "@/server/lib/webhooks";

/* ---------------------------------------------------------------------------
   API keys and webhooks
   ---------------------------------------------------------------------------
   Every mutation is admin-only and gated on the `api` plan feature. The gate
   lives on the server so removing the nav item is a courtesy rather than the
   security model.
--------------------------------------------------------------------------- */

const MAX_KEYS = 10;
const MAX_WEBHOOKS = 5;

const eventEnum = z.enum(WEBHOOK_EVENTS);

/** Rejects anything that isn't a public HTTPS endpoint we could plausibly reach. */
const webhookUrl = z
  .string()
  .trim()
  .url()
  .max(400)
  .refine((value) => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return false;
    }
    if (url.protocol !== "https:") return false;

    // Fast, synchronous pre-check at save time so obviously-internal URLs are
    // rejected in the form with a clear message. It is NOT the security
    // boundary: DNS names and rebinding are only defeatable at delivery time,
    // which safeFetch (net-guard) now does on every hop. Keep the two in sync.
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "0.0.0.0" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host.startsWith("[") || // any IPv6 literal — delivery-time guard judges it properly
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host)
    ) {
      return false;
    }
    return true;
  }, "Use a public https:// URL. Local and private addresses are rejected.");

async function requireFeature(
  ctx: { db: Parameters<typeof ensureUsageWindow>[0]; orgId: string },
  feature: "api" | "mcp",
) {
  const subscription = await ensureUsageWindow(ctx.db, ctx.orgId);
  assertFeature(subscription.plan, feature);
}

export const developerRouter = createTRPCRouter({
  /* --------------------------------------------------------------- API keys */

  keys: orgProcedure.query(({ ctx }) =>
    ctx.db.apiKey.findMany({
      where: { orgId: ctx.orgId, revokedAt: null },
      orderBy: { createdAt: "desc" },
      // hashedKey is never selected. There is nothing useful a client can do
      // with it and every reason not to move it around.
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        createdAt: true,
      },
    }),
  ),

  createKey: adminProcedure
    .input(z.object({ name: z.string().trim().min(1).max(40) }))
    .mutation(async ({ ctx, input }) => {
      // Keys are gated on "mcp", which every plan has, so a Free user can mint a
      // key to connect their agent. The key still gets 403 from the paid REST
      // endpoints until they upgrade; the gate that matters lives in api-auth.
      await requireFeature(ctx, "mcp");

      const count = await ctx.db.apiKey.count({
        where: { orgId: ctx.orgId, revokedAt: null },
      });
      if (count >= MAX_KEYS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `You can have ${MAX_KEYS} active keys. Revoke one first.`,
        });
      }

      const generated = newApiKey();
      const record = await ctx.db.apiKey.create({
        data: {
          orgId: ctx.orgId,
          name: input.name,
          hashedKey: generated.hashed,
          prefix: generated.prefix,
        },
        select: { id: true, name: true, prefix: true, createdAt: true },
      });

      // The only time the plaintext exists outside the caller's clipboard.
      return { ...record, plaintext: generated.plaintext };
    }),

  revokeKey: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Soft revoke: the row stays so `lastUsedAt` still answers "was this key
      // being used when we killed it", which is the first question after a leak.
      const result = await ctx.db.apiKey.updateMany({
        where: { id: input.id, orgId: ctx.orgId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (result.count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true };
    }),

  /* --------------------------------------------------------------- webhooks */

  webhooks: orgProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.webhook.findMany({
      where: { orgId: ctx.orgId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        url: true,
        events: true,
        active: true,
        secret: true,
        lastFiredAt: true,
        lastStatus: true,
        failureCount: true,
        createdAt: true,
      },
    });

    // The signing secret forges deliveries into the customer's own systems, so
    // it's an admin credential, not a read. Members see the endpoint exists but
    // never the secret. (Every webhook mutation is already adminProcedure.)
    const isAdmin = ctx.role === "OWNER" || ctx.role === "ADMIN";
    return rows.map((w) => (isAdmin ? w : { ...w, secret: "" }));
  }),

  createWebhook: adminProcedure
    .input(
      z.object({
        url: webhookUrl,
        events: z.array(eventEnum).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Webhooks stay on the paid "api" feature.
      await requireFeature(ctx, "api");

      const count = await ctx.db.webhook.count({ where: { orgId: ctx.orgId } });
      if (count >= MAX_WEBHOOKS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `You can have ${MAX_WEBHOOKS} endpoints. Delete one first.`,
        });
      }

      return ctx.db.webhook.create({
        data: {
          orgId: ctx.orgId,
          url: input.url,
          events: input.events,
          secret: webhookSecret(),
        },
      });
    }),

  updateWebhook: adminProcedure
    .input(
      z.object({
        id: z.string(),
        events: z.array(eventEnum).min(1).optional(),
        active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const result = await ctx.db.webhook.updateMany({
        where: { id, orgId: ctx.orgId },
        // Re-enabling clears the failure count, otherwise an endpoint that was
        // auto-disabled would be one bad response away from disabling again.
        data: data.active === true ? { ...data, failureCount: 0 } : data,
      });
      if (result.count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true };
    }),

  deleteWebhook: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.webhook.deleteMany({ where: { id: input.id, orgId: ctx.orgId } });
      return { ok: true };
    }),

  /** Sends a real, signed request so integrators can verify before going live. */
  testWebhook: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const webhook = await ctx.db.webhook.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        select: { id: true, url: true, secret: true, failureCount: true, events: true },
      });
      if (!webhook) throw new TRPCError({ code: "NOT_FOUND" });

      const event = (webhook.events[0] ?? "feedback.created") as WebhookEvent;

      const result = await deliverOnce(webhook, event, {
        id: "fb_test_0000000000",
        project_id: "prj_test",
        body: "This is a test delivery from Voicebox. Nothing was actually submitted.",
        type: "IDEA",
        sentiment: "POSITIVE",
        test: true,
      });

      return result;
    }),
});
