import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth } from "@/server/auth";
import { db } from "@/server/db";

/* ---------------------------------------------------------------------------
   tRPC context
--------------------------------------------------------------------------- */

export async function createTRPCContext(opts: { headers: Headers }) {
  const session = await auth();
  return { db, session, headers: opts.headers };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // A raw 500 carries whatever the underlying throw said — a Prisma error
    // naming the model and column, a provider's internal text. That's a leak.
    // Replace the message for INTERNAL_SERVER_ERROR only; every deliberate
    // TRPCError we raise (NOT_FOUND, FORBIDDEN, BAD_REQUEST, validation) keeps
    // its message, since those are written to be read by the user.
    const isInternal = error.code === "INTERNAL_SERVER_ERROR";
    return {
      ...shape,
      message: isInternal ? "Something went wrong. Please try again." : shape.message,
      data: {
        ...shape.data,
        // Surface field-level validation so forms can highlight the offending
        // input instead of showing one generic message.
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

/* ---------------------------------------------------------------------------
   Procedures
--------------------------------------------------------------------------- */

/** No authentication. Used by the widget runtime config and health checks. */
export const publicProcedure = t.procedure;

/** Requires a signed-in user. Says nothing about which org they may touch. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({
    ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } },
  });
});

/**
 * The tenant boundary.
 *
 * `orgId` is resolved here from the session's membership rows and injected
 * into context. Procedures scope every query with `ctx.orgId` and must never
 * accept an organization identifier as input, a client-supplied tenant id is
 * the entire class of bug this procedure exists to make impossible.
 */
export const orgProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const membership = await ctx.db.membership.findFirst({
    where: { userId: ctx.session.user.id },
    orderBy: { createdAt: "asc" },
    include: { org: true },
  });

  if (!membership) {
    // Distinct from UNAUTHORIZED: signed in, but hasn't finished onboarding.
    throw new TRPCError({ code: "FORBIDDEN", message: "NO_ORG" });
  }

  return next({
    ctx: {
      ...ctx,
      orgId: membership.orgId,
      org: membership.org,
      role: membership.role,
    },
  });
});

/** Owner/admin actions: billing, team management, deleting things. */
export const adminProcedure = orgProcedure.use(({ ctx, next }) => {
  if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This action requires an admin.",
    });
  }
  return next({ ctx });
});

/** Owner-only: billing changes and destroying the organization. */
export const ownerProcedure = orgProcedure.use(({ ctx, next }) => {
  if (ctx.role !== "OWNER") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This action requires the organization owner.",
    });
  }
  return next({ ctx });
});
