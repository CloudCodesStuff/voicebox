import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  orgProcedure,
} from "@/server/trpc/init";
import { analyzePending, recomputeThemeStats, runClustering } from "@/server/ai/pipeline";
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

      // Score whatever is still waiting before grouping. Clustering only
      // considers analyzed items, and until 21 Sep 2026 production ingest was
      // losing its analysis call to the function ending (see the ingest
      // route), so a project could hold twenty submissions and Regroup would
      // report "grouped 0 items into 0 themes" as a success. Whatever the
      // ingest path does in future, the button that promises themes should
      // never depend on it having worked: scoring here makes the button
      // self-sufficient, and a batch of 25 is a few seconds on the current
      // provider.
      const scored = await analyzePending(project.id, 25, ctx.db);

      const result = await runClustering(project.id, ctx.db);
      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Clustering didn't return anything usable. Try again.",
        });
      }

      // Still nothing to group after scoring: say so, rather than toasting
      // a success with two zeros in it.
      if (result.items === 0) {
        const unscored = await ctx.db.feedback.count({
          where: { projectId: project.id, analyzedAt: null },
        });
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            unscored > 0
              ? `${unscored} submissions could not be scored, so there is nothing to group yet. Try again in a moment.`
              : "No analyzed feedback to group yet.",
        });
      }

      return { ...result, scored };
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
