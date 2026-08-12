import "server-only";

import type { PrismaClient, Sentiment } from "@prisma/client";

import {
  MODEL_ID,
  clusterFeedback,
  dominantSentiment,
  enrichFeedback,
  isAnalysisConfigured,
  priorityScore,
  type ClusterItem,
} from "@/server/ai/analyze";
import { db as defaultDb } from "@/server/db";
import { serializeFeedback, serializeTheme } from "@/server/lib/api-shapes";
import { dispatchWebhookInBackground } from "@/server/lib/webhooks";

/* ---------------------------------------------------------------------------
   Orchestration, turning model output into database state.
   Kept separate from analyze.ts so the prompts and the persistence can be
   reasoned about (and tested) independently.
--------------------------------------------------------------------------- */

const MAX_ANALYSIS_ATTEMPTS = 3;

/** Enrich a single item. Safe to call repeatedly; no-ops once analyzed. */
export async function analyzeOne(
  feedbackId: string,
  db: PrismaClient = defaultDb,
): Promise<boolean> {
  if (!isAnalysisConfigured()) return false;

  const item = await db.feedback.findUnique({
    where: { id: feedbackId },
    select: {
      id: true,
      orgId: true,
      body: true,
      type: true,
      rating: true,
      analyzedAt: true,
      analysisAttempts: true,
      org: { select: { analysisEnabled: true } },
    },
  });

  if (!item || item.analyzedAt) return false;
  if (item.analysisAttempts >= MAX_ANALYSIS_ATTEMPTS) return false;

  // The org's own opt-out. The privacy policy offers customers a way to decline
  // model processing entirely, and this is where that promise is kept: the
  // submission is still stored and shown, it just never leaves for the provider.
  if (!item.org.analysisEnabled) return false;

  // Note what leaves the building: body, type, rating. Never email, never
  // metadata. See the privacy rule in analyze.ts.
  const outcome = await enrichFeedback({
    body: item.body,
    type: item.type,
    rating: item.rating,
  });

  if (!outcome) {
    await db.feedback.update({
      where: { id: item.id },
      data: { analysisAttempts: { increment: 1 } },
    });
    return false;
  }

  const analyzed = await db.feedback.update({
    where: { id: item.id },
    data: {
      sentiment: outcome.result.sentiment as Sentiment,
      sentimentScore: outcome.result.sentimentScore,
      aiCategory: outcome.result.category,
      summary: outcome.result.summary,
      analyzedAt: new Date(),
      analysisAttempts: { increment: 1 },
    },
    include: { theme: { select: { id: true, title: true } } },
  });

  dispatchWebhookInBackground(
    item.orgId,
    "feedback.analyzed",
    serializeFeedback(analyzed),
  );

  await db.analysisRun.create({
    data: {
      orgId: item.orgId,
      kind: "INGEST",
      status: "DONE",
      itemsProcessed: 1,
      tokensUsed: outcome.tokens,
      model: MODEL_ID,
      finishedAt: new Date(),
    },
  });

  return true;
}

/** Sweep unanalyzed items for a project. Used by cron to catch failures. */
export async function analyzePending(
  projectId: string,
  limit = 25,
  db: PrismaClient = defaultDb,
): Promise<number> {
  if (!isAnalysisConfigured()) return 0;

  const pending = await db.feedback.findMany({
    where: {
      projectId,
      analyzedAt: null,
      analysisAttempts: { lt: MAX_ANALYSIS_ATTEMPTS },
      // Skip orgs that opted out of model processing. Filtering here as well as
      // in analyzeOne keeps the cron from loading work it will only discard.
      org: { analysisEnabled: true },
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  let done = 0;
  for (const item of pending) {
    if (await analyzeOne(item.id, db)) done++;
  }
  return done;
}

/* --------------------------------------------------------------------------
   Clustering
-------------------------------------------------------------------------- */

/** How many items we hand the model in one clustering pass. */
const CLUSTER_BATCH = 120;

/**
 * Re-clusters a project's feedback and recomputes theme statistics.
 *
 * Existing theme titles are passed to the model so clusters stay stable across
 * runs, otherwise a theme's history resets every time and the trend line,
 * which is half the value, becomes noise.
 */
export async function runClustering(
  projectId: string,
  db: PrismaClient = defaultDb,
): Promise<{ themes: number; items: number } | null> {
  if (!isAnalysisConfigured()) return null;

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, orgId: true, org: { select: { analysisEnabled: true } } },
  });
  if (!project) return null;
  if (!project.org.analysisEnabled) return null;

  const run = await db.analysisRun.create({
    data: { orgId: project.orgId, projectId, kind: "CLUSTER", model: MODEL_ID },
  });

  try {
    // Cluster analyzed items only, the summary is what we send, and it's much
    // cheaper and tighter than the raw body.
    const items = await db.feedback.findMany({
      where: { projectId, analyzedAt: { not: null } },
      select: { id: true, summary: true, body: true, sentiment: true },
      orderBy: { createdAt: "desc" },
      take: CLUSTER_BATCH,
    });

    if (items.length === 0) {
      await db.analysisRun.update({
        where: { id: run.id },
        data: { status: "DONE", finishedAt: new Date() },
      });
      return { themes: 0, items: 0 };
    }

    const existing = await db.theme.findMany({
      where: { projectId, status: "ACTIVE" },
      select: { id: true, title: true },
    });

    const payload: ClusterItem[] = items.map((i) => ({
      id: i.id,
      text: i.summary ?? i.body.slice(0, 240),
      sentiment: i.sentiment,
    }));

    const outcome = await clusterFeedback(
      payload,
      existing.map((t) => t.title),
    );

    if (!outcome) {
      await db.analysisRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          error: "Model returned no usable clustering",
          finishedAt: new Date(),
        },
      });
      return null;
    }

    const byTitle = new Map(existing.map((t) => [t.title.toLowerCase(), t.id]));
    let themeCount = 0;
    let assigned = 0;
    const created: string[] = [];

    // Ids are already validated against what we sent, inside clusterFeedback.
    for (const theme of outcome.themes) {
      const memberIds = theme.itemIds;
      const existingId = byTitle.get(theme.title.toLowerCase());

      const themeRow = existingId
        ? await db.theme.update({
            where: { id: existingId },
            data: { description: theme.description },
          })
        : await db.theme.create({
            data: {
              orgId: project.orgId,
              projectId,
              title: theme.title,
              description: theme.description,
            },
          });

      if (!existingId) created.push(themeRow.id);

      await db.feedback.updateMany({
        where: { id: { in: memberIds }, projectId },
        data: { themeId: themeRow.id },
      });

      themeCount++;
      assigned += memberIds.length;
    }

    await recomputeThemeStats(projectId, db);

    // Fired after stats, not before: a theme.created payload with itemCount 0
    // and priorityScore 0 would be technically true and completely useless.
    if (created.length > 0) {
      const fresh = await db.theme.findMany({ where: { id: { in: created } } });
      for (const theme of fresh) {
        dispatchWebhookInBackground(
          project.orgId,
          "theme.created",
          serializeTheme(theme),
        );
      }
    }

    await db.analysisRun.update({
      where: { id: run.id },
      data: {
        status: "DONE",
        itemsProcessed: assigned,
        tokensUsed: outcome.tokens,
        finishedAt: new Date(),
      },
    });

    return { themes: themeCount, items: assigned };
  } catch (error) {
    await db.analysisRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
        finishedAt: new Date(),
      },
    });
    return null;
  }
}

/**
 * Recomputes counts, sentiment mix, trend buckets, and priority for every
 * theme in a project. Pure arithmetic over rows we already have, no model
 * call, so it's cheap enough to run after any mutation.
 */
export async function recomputeThemeStats(
  projectId: string,
  db: PrismaClient = defaultDb,
): Promise<void> {
  const themes = await db.theme.findMany({
    where: { projectId },
    select: { id: true },
  });

  for (const { id } of themes) {
    const items = await db.feedback.findMany({
      where: { themeId: id },
      select: { sentiment: true, createdAt: true },
    });

    if (items.length === 0) {
      await db.theme.update({
        where: { id },
        data: { itemCount: 0, negativeShare: 0, priorityScore: 0, trend: [] },
      });
      continue;
    }

    const counts: Record<string, number> = {};
    for (const i of items) {
      if (i.sentiment) counts[i.sentiment] = (counts[i.sentiment] ?? 0) + 1;
    }

    const negative = counts.NEGATIVE ?? 0;
    const negativeShare = negative / items.length;

    const dates = items.map((i) => i.createdAt.getTime());
    const firstSeenAt = new Date(Math.min(...dates));
    const lastSeenAt = new Date(Math.max(...dates));

    await db.theme.update({
      where: { id },
      data: {
        itemCount: items.length,
        negativeShare,
        sentiment: dominantSentiment(counts),
        firstSeenAt,
        lastSeenAt,
        trend: weeklyTrend(items.map((i) => i.createdAt)),
        priorityScore: priorityScore({
          itemCount: items.length,
          negativeShare,
          lastSeenAt,
        }),
      },
    });
  }
}

/** Twelve weekly buckets, oldest first, the shape the sparkline expects. */
function weeklyTrend(dates: Date[]): Array<{ week: string; count: number }> {
  const now = new Date();
  const buckets: Array<{ week: string; count: number }> = [];

  for (let i = 11; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - i * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    buckets.push({
      week: start.toISOString().slice(0, 10),
      count: dates.filter((d) => d >= start && d < end).length,
    });
  }

  return buckets;
}
