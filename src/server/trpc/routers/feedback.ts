import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  orgProcedure,
} from "@/server/trpc/init";
import { analyzeOne, recomputeThemeStats } from "@/server/ai/pipeline";
import { stripInternalMetadata } from "@/server/lib/api-shapes";

/* Reads are orgProcedure (every member sees everything). Writes are
   adminProcedure: the invite screen promises a member "can read everything and
   change nothing", and that promise has to be enforced on the server, not just
   in the UI. */

const listInput = z.object({
  projectId: z.string(),
  status: z.enum(["NEW", "REVIEWED", "ARCHIVED", "ALL"]).default("ALL"),
  type: z.enum(["IDEA", "ISSUE", "PRAISE", "QUESTION", "OTHER"]).optional(),
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED"]).optional(),
  themeId: z.string().optional(),
  minRating: z.number().int().min(1).max(5).optional(),
  search: z.string().trim().max(120).optional(),
  days: z.number().int().min(1).max(365).optional(),
  cursor: z.string().nullish(),
  limit: z.number().int().min(1).max(100).default(50),
});

export const feedbackRouter = createTRPCRouter({
  list: orgProcedure.input(listInput).query(async ({ ctx, input }) => {
    const since = input.days
      ? new Date(Date.now() - input.days * 86_400_000)
      : undefined;

    const items = await ctx.db.feedback.findMany({
      where: {
        orgId: ctx.orgId, // tenant scope, never from input
        projectId: input.projectId,
        ...(input.status !== "ALL" ? { status: input.status } : {}),
        ...(input.type ? { type: input.type } : {}),
        ...(input.sentiment ? { sentiment: input.sentiment } : {}),
        ...(input.themeId ? { themeId: input.themeId } : {}),
        ...(input.minRating ? { rating: { gte: input.minRating } } : {}),
        ...(since ? { createdAt: { gte: since } } : {}),
        ...(input.search
          ? {
              OR: [
                { body: { contains: input.search, mode: "insensitive" as const } },
                { summary: { contains: input.search, mode: "insensitive" as const } },
                { aiCategory: { contains: input.search, mode: "insensitive" as const } },
                // Searchable so a "delete everything about me" request from an
                // end user can actually be located. Without this the deletion
                // right is unfulfillable: you cannot erase what you can't find.
                { email: { contains: input.search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      include: { theme: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > input.limit;
    const page = hasMore ? items.slice(0, input.limit) : items;

    return {
      items: page.map(stripInternalMetadata),
      nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    };
  }),

  byId: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.db.feedback.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        include: {
          theme: { select: { id: true, title: true } },
          project: { select: { id: true, name: true } },
        },
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      return stripInternalMetadata(item);
    }),

  counts: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [byStatus, bySentiment, byType] = await Promise.all([
        ctx.db.feedback.groupBy({
          by: ["status"],
          where: { orgId: ctx.orgId, projectId: input.projectId },
          _count: true,
        }),
        ctx.db.feedback.groupBy({
          by: ["sentiment"],
          where: { orgId: ctx.orgId, projectId: input.projectId },
          _count: true,
        }),
        ctx.db.feedback.groupBy({
          by: ["type"],
          where: { orgId: ctx.orgId, projectId: input.projectId },
          _count: true,
        }),
      ]);

      const toMap = <T extends string>(
        rows: Array<{ _count: number } & Record<string, unknown>>,
        key: string,
      ) =>
        Object.fromEntries(
          rows.map((r) => [String(r[key] ?? "UNKNOWN"), r._count]),
        ) as Record<T, number>;

      return {
        status: toMap(byStatus, "status"),
        sentiment: toMap(bySentiment, "sentiment"),
        type: toMap(byType, "type"),
      };
    }),

  setStatus: adminProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1).max(200),
        status: z.enum(["NEW", "REVIEWED", "ARCHIVED"]),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.feedback.updateMany({
        where: { id: { in: input.ids }, orgId: ctx.orgId },
        data: { status: input.status },
      }),
    ),

  /** Manual override when the model got a cluster wrong. */
  assignTheme: adminProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1).max(200),
        themeId: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.themeId) {
        const theme = await ctx.db.theme.findFirst({
          where: { id: input.themeId, orgId: ctx.orgId },
          select: { id: true, projectId: true },
        });
        if (!theme) throw new TRPCError({ code: "NOT_FOUND" });

        await ctx.db.feedback.updateMany({
          where: { id: { in: input.ids }, orgId: ctx.orgId },
          data: { themeId: theme.id },
        });
        await recomputeThemeStats(theme.projectId, ctx.db);
        return { ok: true as const };
      }

      const items = await ctx.db.feedback.findMany({
        where: { id: { in: input.ids }, orgId: ctx.orgId },
        select: { projectId: true },
        distinct: ["projectId"],
      });

      await ctx.db.feedback.updateMany({
        where: { id: { in: input.ids }, orgId: ctx.orgId },
        data: { themeId: null },
      });

      for (const { projectId } of items) {
        await recomputeThemeStats(projectId, ctx.db);
      }
      return { ok: true as const };
    }),

  /** Re-runs enrichment for one item, used when analysis failed. */
  reanalyze: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.feedback.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        select: { id: true },
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.feedback.update({
        where: { id: item.id },
        data: { analyzedAt: null, analysisAttempts: 0 },
      });

      const ok = await analyzeOne(item.id, ctx.db);
      return { ok };
    }),

  delete: adminProcedure
    .input(z.object({ ids: z.array(z.string()).min(1).max(200) }))
    .mutation(({ ctx, input }) =>
      ctx.db.feedback.deleteMany({
        where: { id: { in: input.ids }, orgId: ctx.orgId },
      }),
    ),
});
