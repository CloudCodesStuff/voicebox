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
import {
  clearActiveOrgCookie,
  setActiveOrgCookie,
} from "@/server/lib/active-org";
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

  /**
   * Every workspace this person belongs to, with their role in each.
   *
   * `protectedProcedure`, not `orgProcedure`: this is the list you choose an
   * active org *from*, so it can't require one to already be chosen.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.membership.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        org: { select: { id: true, name: true, slug: true } },
      },
    });

    return memberships.map((m) => ({
      membershipId: m.id,
      role: m.role,
      id: m.org.id,
      name: m.org.name,
      slug: m.org.slug,
    }));
  }),

  /**
   * Creates the org, the first project, and the free subscription in one go,
   * then makes it the active one.
   *
   * Deliberately allowed even when the caller already belongs to somewhere.
   * Joining a team used to be a one-way door: accept an invite before you'd
   * made your own workspace and you could never make one, because this
   * refused anyone with an existing membership. Your account belonged to
   * whoever invited you first.
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(2).max(60),
        projectName: z.string().trim().min(1).max(60),
        projectUrl: z.string().trim().url().or(z.literal("")).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Each workspace carries its own free plan and its own monthly quota,
      // so unlimited creation is unlimited free tier. A person juggling more
      // than a handful of workspaces is not the case this product serves.
      assertRate(`createOrg:${ctx.session.user.id}`, 5, 60_000);

      const owned = await ctx.db.membership.count({
        where: { userId: ctx.session.user.id, role: "OWNER" },
      });
      if (owned >= 10) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You've reached the limit of 10 workspaces. Delete one you no longer use, or get in touch.",
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

      // Land in the thing you just made. Without this the dashboard would keep
      // showing whichever workspace was already active and creating one would
      // look like it silently failed.
      await setActiveOrgCookie(org.id);

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
      // Identifies the caller inside the member list, so the team screen can
      // grey out your own row instead of offering to demote or remove you.
      me: {
        membershipId: ctx.membershipId,
        userId: ctx.session.user.id,
        role: ctx.role,
      },
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
      // A refused send is a configuration problem, not a crash, and it must
      // not arrive as an opaque 500: `errorFormatter` replaces the message on
      // INTERNAL_SERVER_ERROR, so throwing that code would discard the one
      // sentence explaining what to fix and leave a log dive as the only way
      // to find out. This cost a real debugging session: EMAIL_FROM was still
      // Resend's shared onboarding@resend.dev sender, which silently only
      // delivers to the address that owns the Resend account.
      console.error("[digest preview] send failed:", result.error);

      // The provider's own text is logged but not returned. Resend's 403 for
      // the shared sender names the account owner's email address, and that is
      // not something to echo to whoever clicked the button.
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "The email provider refused the message. Check that EMAIL_FROM uses a domain verified in Resend. The full reason is in the server logs.",
      });
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

      // Switch to the workspace they just joined. Accepting used to be
      // invisible for anyone who already had one: the membership was created,
      // but the dashboard resolved to their oldest org and the team they'd
      // just joined was nowhere in the interface.
      await setActiveOrgCookie(invite.orgId);

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

      // An org without an owner is unrecoverable, and there is exactly one at
      // a time, so the owner is never removable from here. Handing the
      // workspace over is `transferOwnership`; getting rid of it is `delete`.
      if (target.role === "OWNER") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "The owner can't be removed. Transfer ownership first, or delete the workspace.",
        });
      }

      // Removing yourself through the member list would work, but it reads as
      // an admin action taken on someone else. `leave` is the honest verb and
      // it says what happens next.
      if (target.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Use Leave workspace to remove yourself.",
        });
      }

      return ctx.db.membership.delete({ where: { id: target.id } });
    }),

  /**
   * Changes what someone can do here. Admins can promote and demote; the
   * owner's role is only ever moved by `transferOwnership`.
   */
  updateMemberRole: adminProcedure
    .input(
      z.object({
        membershipId: z.string(),
        role: z.enum(["ADMIN", "MEMBER"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.membership.findFirst({
        where: { id: input.membershipId, orgId: ctx.orgId },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      if (target.role === "OWNER") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The owner's role can only change by transferring ownership.",
        });
      }

      // An admin demoting themselves is a one-way trip out of this screen,
      // usually by misclick. Ask an owner.
      if (target.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't change your own role.",
        });
      }

      return ctx.db.membership.update({
        where: { id: target.id },
        data: { role: input.role },
      });
    }),

  /**
   * Hands the workspace to someone else and steps down to admin.
   *
   * The only way an owner can ever leave. Without it the person who created
   * the workspace is stuck with it forever: they can't be removed, they can't
   * leave, and their only exit is destroying everyone's data.
   *
   * A swap rather than a second promotion, so there is always exactly one
   * owner and "who is responsible for billing here" has one answer.
   */
  transferOwnership: ownerProcedure
    .input(z.object({ membershipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.membership.findFirst({
        where: { id: input.membershipId, orgId: ctx.orgId },
        include: { user: { select: { name: true, email: true } } },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      if (target.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already own this workspace.",
        });
      }

      // One transaction: a half-applied swap leaves the org with two owners or
      // none, and the none case locks everybody out permanently.
      await ctx.db.$transaction([
        ctx.db.membership.updateMany({
          where: { orgId: ctx.orgId, userId: ctx.session.user.id },
          data: { role: "ADMIN" },
        }),
        ctx.db.membership.update({
          where: { id: target.id },
          data: { role: "OWNER" },
        }),
      ]);

      return { newOwner: target.user.name || target.user.email || "them" };
    }),

  /**
   * Leaves a workspace you were invited to.
   *
   * The counterpart to accepting an invite, and the thing that makes joining
   * a team safe: nobody can add you to something you can't walk away from.
   * Admins can remove members, but a member who wants out should never have
   * to ask the person they want out from.
   *
   * The owner is the one exception, and it isn't a lock so much as an order of
   * operations: hand the workspace over first, then leave.
   */
  leave: orgProcedure.mutation(async ({ ctx }) => {
    const membership = await ctx.db.membership.findUnique({
      where: { userId_orgId: { userId: ctx.session.user.id, orgId: ctx.orgId } },
    });
    if (!membership) throw new TRPCError({ code: "NOT_FOUND" });

    if (membership.role === "OWNER") {
      const others = await ctx.db.membership.count({
        where: { orgId: ctx.orgId, userId: { not: ctx.session.user.id } },
      });

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: others
          ? "You own this workspace. Transfer it to someone else first, then you can leave."
          : "You're the only person here, so leaving would strand the data. Delete the workspace instead.",
      });
    }

    await ctx.db.membership.delete({ where: { id: membership.id } });

    // Drop the pointer rather than picking their next workspace for them; the
    // next request resolves to the oldest one they still have.
    await clearActiveOrgCookie();

    const remaining = await ctx.db.membership.count({
      where: { userId: ctx.session.user.id },
    });

    return { orgName: ctx.org.name, remaining };
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
   * The caller's own User row goes too when this was their only workspace.
   * Leaving it would keep their name, email, and Google refresh token on file
   * after they asked to be forgotten, which is exactly what the erasure right
   * is about.
   *
   * Teammates keep their accounts either way. An earlier version deleted the
   * account of every member who had no other workspace, which meant one
   * person's decision about their own org silently destroyed other people's
   * logins. Erasure is a right you exercise over your own data, not one an
   * owner exercises on your behalf; they land on onboarding and make or join
   * something else.
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

      await ctx.db.organization.delete({ where: { id: ctx.orgId } });
      await clearActiveOrgCookie();

      const remaining = await ctx.db.membership.count({
        where: { userId: ctx.session.user.id },
      });

      // Nothing left to sign in to, so the account itself goes (Account and
      // Session cascade from User).
      if (remaining === 0) {
        await ctx.db.user
          .delete({ where: { id: ctx.session.user.id } })
          .catch(() => undefined);
      }

      return { ok: true as const, remaining };
    }),
});
