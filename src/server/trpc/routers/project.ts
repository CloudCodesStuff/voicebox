import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  orgProcedure,
} from "@/server/trpc/init";
import { projectKey } from "@/server/lib/ids";
import { ensureUsageWindow, hasFeature, planRules } from "@/server/lib/plan";
import { assertRate } from "@/server/lib/rate-limit";
import {
  defaultWidgetConfig,
  parseWidgetConfig,
  widgetConfigSchema,
} from "@/lib/widget-config";

/** Confirms a project belongs to the caller's org before anything touches it. */
async function ownedProject(
  db: typeof import("@/server/db").db,
  orgId: string,
  projectId: string,
) {
  const project = await db.project.findFirst({
    where: { id: projectId, orgId },
  });
  if (!project) throw new TRPCError({ code: "NOT_FOUND" });
  return project;
}

export const projectRouter = createTRPCRouter({
  list: orgProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.project.findMany({
      where: { orgId: ctx.orgId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { feedback: true, themes: true } } },
    });

    // Last activity per project, for the card subtitle.
    const latest = await ctx.db.feedback.groupBy({
      by: ["projectId"],
      where: { orgId: ctx.orgId },
      _max: { createdAt: true },
    });
    const lastByProject = new Map(
      latest.map((l) => [l.projectId, l._max.createdAt]),
    );

    return projects.map((p) => ({
      ...p,
      widgetConfig: parseWidgetConfig(p.widgetConfig),
      lastActivityAt: lastByProject.get(p.id) ?? null,
    }));
  }),

  byId: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ownedProject(ctx.db, ctx.orgId, input.id);
      return { ...project, widgetConfig: parseWidgetConfig(project.widgetConfig) };
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(60),
        url: z.string().trim().url().or(z.literal("")).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const subscription = await ensureUsageWindow(ctx.db, ctx.orgId);
      const limit = planRules[subscription.plan].projects;

      if (limit !== null) {
        const count = await ctx.db.project.count({ where: { orgId: ctx.orgId } });
        if (count >= limit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `PROJECT_LIMIT:${limit}`,
          });
        }
      }

      return ctx.db.project.create({
        data: {
          orgId: ctx.orgId,
          name: input.name,
          url: input.url || null,
          key: projectKey(),
          widgetConfig: defaultWidgetConfig,
        },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().trim().min(1).max(60).optional(),
        url: z.string().trim().url().nullable().or(z.literal("")).optional(),
        allowedDomains: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ownedProject(ctx.db, ctx.orgId, input.id);
      const { id, ...data } = input;
      return ctx.db.project.update({
        where: { id },
        data: {
          ...data,
          url: data.url === "" ? null : data.url,
        },
      });
    }),

  /** Persists widget appearance. Branding removal is gated to the paid plan. */
  updateWidgetConfig: adminProcedure
    .input(z.object({ id: z.string(), config: widgetConfigSchema }))
    .mutation(async ({ ctx, input }) => {
      await ownedProject(ctx.db, ctx.orgId, input.id);
      const subscription = await ensureUsageWindow(ctx.db, ctx.orgId);

      const config = {
        ...input.config,
        // Silently correct rather than erroring, the studio shows the lock,
        // and a stale client shouldn't be able to flip a paid flag.
        hideBranding:
          input.config.hideBranding && hasFeature(subscription.plan, "branding"),
      };

      const project = await ctx.db.project.update({
        where: { id: input.id },
        data: { widgetConfig: config },
      });

      return { ...project, widgetConfig: parseWidgetConfig(project.widgetConfig) };
    }),

  /** Invalidates the old key immediately, used when a key leaks. */
  regenerateKey: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ownedProject(ctx.db, ctx.orgId, input.id);
      return ctx.db.project.update({
        where: { id: input.id },
        data: { key: projectKey() },
        select: { id: true, key: true },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ownedProject(ctx.db, ctx.orgId, input.id);

      const count = await ctx.db.project.count({ where: { orgId: ctx.orgId } });
      if (count <= 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You need at least one project.",
        });
      }

      return ctx.db.project.delete({ where: { id: input.id } });
    }),

  /**
   * Guesses a brand colour from a public URL so nobody has to hunt for their
   * own hex code. Returns null rather than throwing when a site can't be read
   * or has nothing usable in it; the studio just says so and moves on.
   */
  suggestColor: orgProcedure
    .input(z.object({ url: z.string().trim().min(3).max(300) }))
    .mutation(async ({ ctx, input }) => {
      // Each call is an outbound fetch from our egress IP. Cap it so a member
      // can't turn N parallel calls into a port scanner or a DDoS reflector.
      assertRate(`suggestColor:${ctx.orgId}`, 10, 60_000);
      const { guessBrandColor } = await import("@/server/lib/brand-color");
      return guessBrandColor(input.url);
    }),

  /** Polled by onboarding to detect the first real submission. */
  hasFeedback: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      await ownedProject(ctx.db, ctx.orgId, input.id);
      const count = await ctx.db.feedback.count({
        where: { projectId: input.id },
      });
      return { count, connected: count > 0 };
    }),
});
