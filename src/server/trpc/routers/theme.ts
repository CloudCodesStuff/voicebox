import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  orgProcedure,
} from "@/server/trpc/init";
import { recomputeThemeStats, runClustering } from "@/server/ai/pipeline";
import { isAnalysisConfigured } from "@/server/ai/analyze";
import { assertRate } from "@/server/lib/rate-limit";

export const themeRouter = createTRPCRouter({
  list: orgProcedure
    .input(
      z.object({
        projectId: z.string(),
        status: z.enum(["ACTIVE", "RESOLVED", "IGNORED", "ALL"]).default("ACTIVE"),
        sort: z
          .enum(["priority", "volume", "recent", "sentiment"])
          .default("priority"),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(({ ctx, input }) => {
      const orderBy =
        input.sort === "volume"
          ? { itemCount: "desc" as const }
          : input.sort === "recent"
            ? { lastSeenAt: "desc" as const }
            : input.sort === "sentiment"
              ? { negativeShare: "desc" as const }
              : { priorityScore: "desc" as const };

      return ctx.db.theme.findMany({
        where: {
          orgId: ctx.orgId,
          projectId: input.projectId,
          ...(input.status !== "ALL" ? { status: input.status } : {}),
        },
        orderBy,
        take: input.limit,
      });
    }),

  byId: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const theme = await ctx.db.theme.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        include: {
          project: { select: { id: true, name: true } },
          feedback: {
            orderBy: { createdAt: "desc" },
            take: 200,
            select: {
              id: true,
              body: true,
              summary: true,
              sentiment: true,
              sentimentScore: true,
              type: true,
              rating: true,
              createdAt: true,
              pageUrl: true,
            },
          },
        },
      });
      if (!theme) throw new TRPCError({ code: "NOT_FOUND" });
      return theme;
    }),

  setStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["ACTIVE", "RESOLVED", "IGNORED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const theme = await ctx.db.theme.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        select: { id: true },
      });
      if (!theme) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.theme.update({
        where: { id: theme.id },
        data: { status: input.status },
      });
    }),

  rename: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().trim().min(1).max(60),
        description: z.string().trim().max(240).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const theme = await ctx.db.theme.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        select: { id: true },
      });
      if (!theme) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.theme.update({
        where: { id: theme.id },
        data: { title: input.title, description: input.description },
      });
    }),

  /**
   * On-demand clustering. Runs inline so the user sees the result immediately;
   * the cron sweep handles the routine case.
   */
  recluster: adminProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, orgId: ctx.orgId },
        select: { id: true },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      if (!isAnalysisConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          // Reaches the customer as a toast, so it names no environment
          // variable: they cannot set one on a server they don't run.
          message:
            "Theme grouping is unavailable right now. Your feedback is still being collected.",
        });
      }

      // Clustering is a 150-second model call billed to our own key. Two gates
      // stop a held button turning into unbounded spend: a durable one (no
      // second cluster run within 45s, survives instance restarts) and the
      // cheap in-memory limiter on top.
      assertRate(`recluster:${ctx.orgId}`, 3, 60_000);
      const recentRun = await ctx.db.analysisRun.findFirst({
        where: {
          orgId: ctx.orgId,
          projectId: project.id,
          kind: "CLUSTER",
          startedAt: { gte: new Date(Date.now() - 45_000) },
        },
        select: { id: true },
      });
      if (recentRun) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "A grouping run just happened. Give it a moment.",
        });
      }

      const result = await runClustering(project.id, ctx.db);
      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Clustering didn't return anything usable. Try again.",
        });
      }
      return result;
    }),

  /** Cheap arithmetic refresh with no model call. */
  refreshStats: adminProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, orgId: ctx.orgId },
        select: { id: true },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      await recomputeThemeStats(project.id, ctx.db);
      return { ok: true as const };
    }),

  /** Last few analysis runs, powers the "analysis status" strip. */
  runs: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.db.analysisRun.findMany({
        where: { orgId: ctx.orgId, projectId: input.projectId },
        orderBy: { startedAt: "desc" },
        take: 5,
      }),
    ),

  configured: orgProcedure.query(() => ({ ok: isAnalysisConfigured() })),
});
