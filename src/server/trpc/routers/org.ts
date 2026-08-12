import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { features } from "@/env";

import {
  adminProcedure,
  createTRPCRouter,
  orgProcedure,
  ownerProcedure,
  protectedProcedure,
  publicProcedure,
} from "@/server/trpc/init";
import { projectKey, slugify, withSuffix } from "@/server/lib/ids";
import {
  assertFeature,
  describeUsage,
  ensureUsageWindow,
  planRules,
} from "@/server/lib/plan";
import { assertRate } from "@/server/lib/rate-limit";
import { defaultWidgetConfig } from "@/lib/widget-config";

export const orgRouter = createTRPCRouter({
  /** Does the signed-in user belong to an org yet? Drives the onboarding redirect. */
  mine: protectedProcedure.query(async ({ ctx }) => {
    const membership = await ctx.db.membership.findFirst({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "asc" },
      include: { org: { include: { subscription: true } } },
    });
    return membership?.org ?? null;
  }),

  /** Creates the org, the first project, and the free subscription in one go. */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(2).max(60),
        projectName: z.string().trim().min(1).max(60),
        projectUrl: z.string().trim().url().or(z.literal("")).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.membership.findFirst({
        where: { userId: ctx.session.user.id },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already belong to an organization.",
        });
      }

      const preferred = slugify(input.name);
      const taken = preferred
        ? await ctx.db.organization.findUnique({
            where: { slug: preferred },
            select: { id: true },
          })
        : true;

      const org = await ctx.db.organization.create({
        data: {
          name: input.name,
          slug: taken || !preferred ? withSuffix(preferred) : preferred,
          memberships: { create: { userId: ctx.session.user.id, role: "OWNER" } },
          subscription: { create: { plan: "FREE", status: "ACTIVE" } },
          projects: {
            create: {
              name: input.projectName,
              url: input.projectUrl || null,
              key: projectKey(),
              widgetConfig: defaultWidgetConfig,
            },
          },
        },
        include: { projects: true },
      });

      return org;
    }),

  /** Everything the app shell needs: identity, plan, usage, projects. */
  current: orgProcedure.query(async ({ ctx }) => {
    const [subscription, projects] = await Promise.all([
      ensureUsageWindow(ctx.db, ctx.orgId),
      ctx.db.project.findMany({
        where: { orgId: ctx.orgId },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, key: true, url: true },
      }),
    ]);

    return {
      org: ctx.org,
      role: ctx.role,
      projects,
      subscription,
      usage: describeUsage(subscription),
      limits: planRules[subscription.plan],
      // A plain boolean, not the underlying env check: `features.billing`
      // reads process.env directly, which is undefined in a client bundle
      // for anything not NEXT_PUBLIC_-prefixed, so the client can't compute
      // this itself. The server can, and there's nothing secret in the
      // answer to "is billing turned on".
      billingConfigured: features.billing,
    };
  }),

  update: adminProcedure
    .input(
      z.object({
        name: z.string().trim().min(2).max(60).optional(),
        timezone: z.string().trim().max(60).optional(),
        digestEnabled: z.boolean().optional(),
        analysisEnabled: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.organization.update({ where: { id: ctx.orgId }, data: input }),
    ),

  /**
   * The caller's own digest preference.
   *
   * Separate from `update` on purpose: the org-wide switch is an admin
   * setting, but an individual must always be able to stop their own mail
   * without asking anyone. Same effect as the one-click link in the email
   * footer, just from inside the app.
   */
  setMyDigestPreference: orgProcedure
    .input(z.object({ optOut: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.membership.updateMany({
        where: { userId: ctx.session.user.id, orgId: ctx.orgId },
        data: { digestOptOut: input.optOut },
      });
      return { ok: true as const };
    }),

  myDigestPreference: orgProcedure.query(async ({ ctx }) => {
    const membership = await ctx.db.membership.findFirst({
      where: { userId: ctx.session.user.id, orgId: ctx.orgId },
      select: { digestOptOut: true },
    });
    return { optOut: membership?.digestOptOut ?? false };
  }),

  /**
   * Sends this week's digest to the caller, right now.
   *
   * A weekly email you cannot see until next Monday is a feature nobody can
   * evaluate, so this renders the real thing with real data and mails it to
   * the person who asked, without touching digestLastSentAt.
   */
  sendDigestPreview: orgProcedure.mutation(async ({ ctx }) => {
    // Self-directed (only ever mails the caller) but each call is a multi-query
    // build plus a provider send, so cap the loop.
    assertRate(`digestPreview:${ctx.orgId}`, 3, 60_000);
    const subscription = await ensureUsageWindow(ctx.db, ctx.orgId);
    assertFeature(subscription.plan, "digest");

    const email = ctx.session.user.email;
    if (!email) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Your account has no email address to send to.",
      });
    }

    const { buildDigest, sendDigest } = await import(
      "@/server/lib/emails/digest"
    );

    const digest = await buildDigest(ctx.db, ctx.orgId);
    if (!digest) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "There's no activity in the last seven days, so there's nothing to put in a digest yet.",
      });
    }

    const result = await sendDigest(email, digest);
    if (!result.ok) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error });
    }

    return { to: email, delivered: result.delivered };
  }),

  /* ----------------------------------------------------------------- team */

  members: orgProcedure.query(({ ctx }) =>
    ctx.db.membership.findMany({
      where: { orgId: ctx.orgId },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
  ),

  invites: orgProcedure.query(({ ctx }) =>
    ctx.db.invite.findMany({
      where: { orgId: ctx.orgId },
      orderBy: { createdAt: "desc" },
    }),
  ),

  /**
   * Invites one or more people.
   *
   * Takes a list because inviting a team is the normal case and doing it one
   * at a time is busywork. The client splits whatever was pasted; this checks
   * the seat limit against the whole batch before creating anything, so you
   * can't half-invite a team and then hit the wall.
   */
  invite: adminProcedure
    .input(
      z.object({
        emails: z.array(z.string().trim().email()).min(1).max(25),
        role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Each invite is outbound mail from our verified domain with an
      // attacker-controllable org name in the subject. The seat cap counts
      // Invite rows but those can be revoked and recreated, so a separate rate
      // limit stops invite→revoke→repeat becoming an unmetered mailer.
      assertRate(`invite:${ctx.orgId}`, 6, 60_000);

      const emails = [...new Set(input.emails.map((e) => e.toLowerCase()))];

      const subscription = await ensureUsageWindow(ctx.db, ctx.orgId);
      const seatLimit = planRules[subscription.plan].seats;

      if (seatLimit !== null) {
        const [members, pending] = await Promise.all([
          ctx.db.membership.count({ where: { orgId: ctx.orgId } }),
          ctx.db.invite.count({ where: { orgId: ctx.orgId } }),
        ]);
        if (members + pending + emails.length > seatLimit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `SEAT_LIMIT:${seatLimit}`,
          });
        }
      }

      const existingMembers = await ctx.db.membership.findMany({
        where: { orgId: ctx.orgId, user: { email: { in: emails } } },
        select: { user: { select: { email: true } } },
      });
      const alreadyIn = new Set(
        existingMembers.map((m) => m.user.email?.toLowerCase()).filter(Boolean),
      );

      const { inviteToken } = await import("@/server/lib/ids");
      const { sendInviteEmail } = await import("@/server/lib/emails/invite");

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14);

      const results: Array<{
        email: string;
        status: "sent" | "created" | "already-member";
        /** Why the email didn't go out, when it didn't. */
        reason?: string;
      }> = [];

      for (const email of emails) {
        if (alreadyIn.has(email)) {
          results.push({ email, status: "already-member" });
          continue;
        }

        const invite = await ctx.db.invite.upsert({
          where: { orgId_email: { orgId: ctx.orgId, email } },
          create: {
            orgId: ctx.orgId,
            email,
            role: input.role,
            token: inviteToken(),
            expiresAt,
          },
          update: { role: input.role, token: inviteToken(), expiresAt },
        });

        // Delivery is reported, never thrown. The invite row is the source of
        // truth and its link can always be copied by hand, so a refused email
        // must not undo a successful invite.
        const sent = await sendInviteEmail({
          to: invite.email,
          orgName: ctx.org.name,
          inviterName: ctx.session.user.name ?? null,
          inviterEmail: ctx.session.user.email ?? null,
          token: invite.token,
          expiresAt: invite.expiresAt,
        });

        results.push({
          email,
          status: sent.ok && sent.delivered ? "sent" : "created",
          reason: sent.ok
            ? sent.delivered
              ? undefined
              : "Email isn't configured on this deployment."
            : sent.error,
        });
      }

      return { results };
    }),

  /**
   * Public lookup for the accept-invite page. Returns the org name and whether
   * the token is still good, and nothing else, so an enumerated token leaks no
   * member list, no email addresses, and no project keys.
   */
  inviteByToken: publicProcedure
    .input(z.object({ token: z.string().min(10) }))
    .query(async ({ ctx, input }) => {
      const invite = await ctx.db.invite.findUnique({
        where: { token: input.token },
        select: {
          email: true,
          role: true,
          expiresAt: true,
          org: { select: { name: true } },
        },
      });

      if (!invite) return { status: "unknown" as const };
      if (invite.expiresAt < new Date()) {
        return { status: "expired" as const, orgName: invite.org.name };
      }

      return {
        status: "valid" as const,
        orgName: invite.org.name,
        email: invite.email,
        role: invite.role,
      };
    }),

  /** Redeems an invite for the signed-in user. */
  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string().min(10) }))
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.db.invite.findUnique({
        where: { token: input.token },
        include: { org: { select: { id: true, name: true } } },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "That invite link isn't valid.",
        });
      }
      if (invite.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That invite has expired. Ask for a fresh one.",
        });
      }

      // Bound to the address it was sent to. Without this check anyone holding
      // the link is a member, which makes the token a password for the org.
      const userEmail = ctx.session.user.email?.toLowerCase() ?? "";
      if (userEmail !== invite.email.toLowerCase()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `This invite was sent to ${invite.email}. Sign in with that address to accept it.`,
        });
      }

      const existing = await ctx.db.membership.findUnique({
        where: {
          userId_orgId: { userId: ctx.session.user.id, orgId: invite.orgId },
        },
      });

      if (!existing) {
        await ctx.db.membership.create({
          data: {
            userId: ctx.session.user.id,
            orgId: invite.orgId,
            role: invite.role,
          },
        });
      }

      await ctx.db.invite.delete({ where: { id: invite.id } });

      return { orgName: invite.org.name };
    }),

  revokeInvite: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.invite.deleteMany({ where: { id: input.id, orgId: ctx.orgId } }),
    ),

  removeMember: adminProcedure
    .input(z.object({ membershipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.membership.findFirst({
        where: { id: input.membershipId, orgId: ctx.orgId },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      // An org without an owner is unrecoverable, so the last one can't leave.
      if (target.role === "OWNER") {
        const owners = await ctx.db.membership.count({
          where: { orgId: ctx.orgId, role: "OWNER" },
        });
        if (owners <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "An organization must keep at least one owner.",
          });
        }
      }

      return ctx.db.membership.delete({ where: { id: target.id } });
    }),

  /* ------------------------------------------------------- data subject rights

     The privacy policy promises export and deletion. Both have to be real
     features rather than an inbox somebody remembers to action, otherwise the
     promise is the only thing that exists.
  --------------------------------------------------------------------------- */

  /**
   * Everything this organization holds, as one JSON document.
   *
   * Deliberately available on every plan and to every member. This is the
   * portability right, and gating it behind an upgrade would mean the people
   * most likely to want their data out (someone leaving) are the ones who
   * cannot have it. The paid API is for ongoing programmatic access; this is
   * a one-off "give me everything".
   */
  exportData: orgProcedure.mutation(async ({ ctx }) => {
    assertRate(`export:${ctx.orgId}`, 3, 60_000);

    const [org, projects, feedback, themes, members, invites, subscription] =
      await Promise.all([
        ctx.db.organization.findUniqueOrThrow({
          where: { id: ctx.orgId },
          select: {
            id: true,
            name: true,
            slug: true,
            timezone: true,
            digestEnabled: true,
            analysisEnabled: true,
            createdAt: true,
          },
        }),
        ctx.db.project.findMany({
          where: { orgId: ctx.orgId },
          select: {
            id: true,
            name: true,
            key: true,
            url: true,
            allowedDomains: true,
            widgetConfig: true,
            createdAt: true,
          },
        }),
        ctx.db.feedback.findMany({
          where: { orgId: ctx.orgId },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            projectId: true,
            themeId: true,
            body: true,
            type: true,
            status: true,
            rating: true,
            email: true,
            sentiment: true,
            sentimentScore: true,
            summary: true,
            aiCategory: true,
            pageUrl: true,
            referrer: true,
            locale: true,
            userAgent: true,
            metadata: true,
            createdAt: true,
          },
        }),
        ctx.db.theme.findMany({
          where: { orgId: ctx.orgId },
          select: {
            id: true,
            projectId: true,
            title: true,
            description: true,
            status: true,
            itemCount: true,
            negativeShare: true,
            priorityScore: true,
            firstSeenAt: true,
            lastSeenAt: true,
          },
        }),
        ctx.db.membership.findMany({
          where: { orgId: ctx.orgId },
          select: {
            role: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
          },
        }),
        ctx.db.invite.findMany({
          where: { orgId: ctx.orgId },
          select: { email: true, role: true, expiresAt: true, createdAt: true },
        }),
        ctx.db.subscription.findUnique({
          where: { orgId: ctx.orgId },
          select: { plan: true, status: true, currentPeriodEnd: true },
        }),
      ]);

    return {
      exportedAt: new Date(),
      format: "voicebox.export.v1",
      organization: org,
      subscription,
      members,
      invites,
      projects,
      themes,
      // `_ip` is kept here, unlike in the public API: this is the controller
      // asking for their own complete record, and hiding a field from an
      // export that claims to be everything would make the export a lie.
      feedback,
    };
  }),

  /**
   * Deletes the organization and everything belonging to it.
   *
   * Owner-only, and requires typing the org name, because there is no undo:
   * every project, every piece of end-user feedback, and every theme goes.
   * The schema cascades from Organization, so one delete removes all of it.
   *
   * The caller's own User row goes too when this was their only organization.
   * Leaving it would keep their name, email, and Google refresh token on file
   * after they asked to be forgotten, which is exactly what the erasure right
   * is about. Members who belong to other orgs keep their accounts.
   */
  deleteOrganization: ownerProcedure
    .input(z.object({ confirmName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.confirmName.trim() !== ctx.org.name.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The name you typed doesn't match this organization.",
        });
      }

      const memberIds = (
        await ctx.db.membership.findMany({
          where: { orgId: ctx.orgId },
          select: { userId: true },
        })
      ).map((m) => m.userId);

      await ctx.db.organization.delete({ where: { id: ctx.orgId } });

      // Anyone whose membership rows are now all gone has no way back into the
      // product, so their account is deleted with it (Account and Session
      // cascade from User).
      for (const userId of memberIds) {
        const remaining = await ctx.db.membership.count({ where: { userId } });
        if (remaining === 0) {
          await ctx.db.user.delete({ where: { id: userId } }).catch(() => undefined);
        }
      }

      return { ok: true as const };
    }),
});
