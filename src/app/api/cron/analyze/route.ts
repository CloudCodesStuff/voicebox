import { NextResponse, type NextRequest } from "next/server";

import { Prisma } from "@prisma/client";

import { isAnalysisConfigured } from "@/server/ai/analyze";
import { analyzePending, runClustering } from "@/server/ai/pipeline";
import { db } from "@/server/db";
import { authorizeCron } from "@/server/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Scheduled analysis sweep.
 *
 * Two jobs, in order:
 *   1. Enrich anything that arrived while the ingest-time call was failing,
 *      timing out, or cut short by the serverless function ending.
 *   2. Re-cluster projects that have accumulated enough new analyzed feedback
 *      to be worth another pass.
 *
 * Clustering is threshold-driven rather than time-driven: a project with two
 * new comments doesn't need its themes recomputed, and a model call per
 * project per hour would be money set on fire.
 */

const CLUSTER_THRESHOLD = 10;
const MAX_PROJECTS_PER_RUN = 20;

/**
 * How long a submitter's IP is kept.
 *
 * The rate limiter only ever looks back one hour (see the ingest route), so
 * anything older serves no stated purpose. The privacy policy says the IP is
 * recorded "purely to enforce rate limits and detect abuse"; keeping it for the
 * life of the account would make that sentence false. Seven days leaves enough
 * room to investigate a burst of abuse after the weekend and no more.
 */
const IP_RETENTION_DAYS = 7;
const IP_PURGE_BATCH = 500;

/**
 * Drops `_ip` from metadata once it is past its retention window, leaving every
 * customer-supplied trait in place.
 *
 * Prisma cannot edit one key inside a JSON column, so this reads a bounded
 * batch and rewrites those rows. Batched rather than unbounded because this
 * shares a 60-second function with the analysis sweep.
 */
async function purgeExpiredIps(): Promise<number> {
  const cutoff = new Date(Date.now() - IP_RETENTION_DAYS * 86_400_000);

  const stale = await db.feedback.findMany({
    where: {
      createdAt: { lt: cutoff },
      metadata: { path: ["_ip"], not: Prisma.DbNull },
    },
    select: { id: true, metadata: true },
    take: IP_PURGE_BATCH,
  });

  let purged = 0;
  for (const row of stale) {
    if (!row.metadata || typeof row.metadata !== "object") continue;
    const { _ip, ...rest } = row.metadata as Record<string, unknown>;
    if (_ip === undefined) continue;

    await db.feedback.update({
      where: { id: row.id },
      data: {
        metadata:
          Object.keys(rest).length > 0
            ? (rest as Prisma.InputJsonObject)
            : Prisma.DbNull,
      },
    });
    purged += 1;
  }

  return purged;
}

export async function GET(req: NextRequest) {
  // Vercel Cron sends the secret as a bearer token. Constant-time, fail-closed.
  const denied = authorizeCron(req);
  if (denied) return denied;

  // Runs before the AI check, because retention is not conditional on the model
  // being configured.
  const ipsPurged = await purgeExpiredIps();

  if (!isAnalysisConfigured()) {
    return NextResponse.json({ ok: true, ipsPurged, skipped: "no DEEPSEEK_API_KEY" });
  }

  const projects = await db.project.findMany({
    select: { id: true, name: true },
    take: MAX_PROJECTS_PER_RUN,
  });

  const results: Array<{
    project: string;
    enriched: number;
    clustered: boolean;
  }> = [];

  for (const project of projects) {
    const enriched = await analyzePending(project.id, 25, db);

    // Count analyzed items that don't belong to a theme yet. Enough of them
    // means the existing clusters no longer describe the feedback.
    const unclustered = await db.feedback.count({
      where: {
        projectId: project.id,
        analyzedAt: { not: null },
        themeId: null,
      },
    });

    let clustered = false;
    if (unclustered >= CLUSTER_THRESHOLD) {
      clustered = Boolean(await runClustering(project.id, db));
    }

    if (enriched > 0 || clustered) {
      results.push({ project: project.name, enriched, clustered });
    }
  }

  return NextResponse.json({
    ok: true,
    projectsChecked: projects.length,
    changed: results,
    ipsPurged,
    ranAt: new Date().toISOString(),
  });
}
