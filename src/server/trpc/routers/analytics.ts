import { z } from "zod";

import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";

const rangeInput = z.object({
  projectId: z.string(),
  days: z.number().int().min(1).max(365).default(30),
});

/** Inclusive day buckets, oldest first, with zeros filled in. */
function dayBuckets(days: number) {
  const out: Array<{ date: string; start: Date; end: Date }> = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const start = new Date(today);
    start.setDate(start.getDate() - i);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    out.push({ date: start.toISOString().slice(0, 10), start, end });
  }
  return out;
}

export const analyticsRouter = createTRPCRouter({
  /**
   * The Overview header. One query set that answers "how are we doing",
   * volume, sentiment mix, and whether it's moving in the right direction.
   */
  overview: orgProcedure.input(rangeInput).query(async ({ ctx, input }) => {
    const now = Date.now();
    const since = new Date(now - input.days * 86_400_000);
    const previousSince = new Date(now - input.days * 2 * 86_400_000);

    const scope = { orgId: ctx.orgId, projectId: input.projectId };

    const [total, current, previous, sentiment, unanalyzed, latest] =
      await Promise.all([
        ctx.db.feedback.count({ where: scope }),
        ctx.db.feedback.count({ where: { ...scope, createdAt: { gte: since } } }),
        ctx.db.feedback.count({
          where: { ...scope, createdAt: { gte: previousSince, lt: since } },
        }),
        ctx.db.feedback.groupBy({
          by: ["sentiment"],
          where: { ...scope, createdAt: { gte: since } },
          _count: true,
        }),
        ctx.db.feedback.count({ where: { ...scope, analyzedAt: null } }),
        ctx.db.feedback.findMany({
          where: scope,
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            body: true,
            summary: true,
            sentiment: true,
            type: true,
            createdAt: true,
          },
        }),
      ]);

    const mix = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0, MIXED: 0 };
    for (const row of sentiment) {
      if (row.sentiment) mix[row.sentiment] = row._count;
    }

    const analyzed = mix.POSITIVE + mix.NEUTRAL + mix.NEGATIVE + mix.MIXED;

    return {
      total,
      current,
      previous,
      changePercent:
        previous === 0
          ? current > 0
            ? 100
            : 0
          : Math.round(((current - previous) / previous) * 100),
      sentiment: mix,
      analyzed,
      unanalyzed,
      // Share of analyzed feedback that's negative, the single number a team
      // should watch week to week.
      negativeShare: analyzed === 0 ? 0 : mix.NEGATIVE / analyzed,
      latest,
    };
  }),

  /** Daily volume split by sentiment. Powers the trend chart. */
  trend: orgProcedure.input(rangeInput).query(async ({ ctx, input }) => {
    const buckets = dayBuckets(input.days);
    const since = buckets[0]!.start;

    const rows = await ctx.db.feedback.findMany({
      where: {
        orgId: ctx.orgId,
        projectId: input.projectId,
        createdAt: { gte: since },
      },
      select: { createdAt: true, sentiment: true, type: true, rating: true },
    });

    return buckets.map((b) => {
      const inBucket = rows.filter(
        (r) => r.createdAt >= b.start && r.createdAt < b.end,
      );
      const ratings = inBucket
        .map((r) => r.rating)
        .filter((r): r is number => r != null);

      return {
        date: b.date,
        total: inBucket.length,
        positive: inBucket.filter((r) => r.sentiment === "POSITIVE").length,
        neutral: inBucket.filter((r) => r.sentiment === "NEUTRAL").length,
        negative: inBucket.filter((r) => r.sentiment === "NEGATIVE").length,
        mixed: inBucket.filter((r) => r.sentiment === "MIXED").length,
        avgRating:
          ratings.length === 0
            ? null
            : Number(
                (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2),
              ),
      };
    });
  }),

  /** Volume by feedback type over the range, the second chart on Trends. */
  byType: orgProcedure.input(rangeInput).query(async ({ ctx, input }) => {
    const since = new Date(Date.now() - input.days * 86_400_000);
    const rows = await ctx.db.feedback.groupBy({
      by: ["type"],
      where: {
        orgId: ctx.orgId,
        projectId: input.projectId,
        createdAt: { gte: since },
      },
      _count: true,
    });

    return rows.map((r) => ({ type: r.type, count: r._count }));
  }),

  /** Themes ranked for the "what to work on" block on the Overview. */
  topThemes: orgProcedure
    .input(z.object({ projectId: z.string(), limit: z.number().int().min(1).max(10).default(5) }))
    .query(async ({ ctx, input }) => {
      const themes = await ctx.db.theme.findMany({
        where: {
          orgId: ctx.orgId,
          projectId: input.projectId,
          status: "ACTIVE",
          itemCount: { gt: 0 },
        },
        orderBy: { priorityScore: "desc" },
        take: input.limit,
      });

      // One representative quote per theme, the most negative item reads as
      // the most useful illustration of why the theme matters.
      const withQuotes = await Promise.all(
        themes.map(async (theme) => {
          const quote = await ctx.db.feedback.findFirst({
            where: { themeId: theme.id },
            orderBy: [{ sentimentScore: "asc" }, { createdAt: "desc" }],
            select: { id: true, body: true, sentiment: true },
          });
          return { ...theme, quote };
        }),
      );

      return withQuotes;
    }),
});
