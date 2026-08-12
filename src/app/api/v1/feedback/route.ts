import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/server/db";
import {
  apiError,
  authenticateApi,
  isAuthFailure,
  jsonList,
  readPaging,
} from "@/server/lib/api-auth";
import { serializeFeedback } from "@/server/lib/api-shapes";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/feedback
 *
 * Cursor pagination on `id` rather than an offset. Feedback arrives
 * continuously, so an offset would skip or repeat rows for anyone paging
 * through while new items land. Ordering is (createdAt desc, id desc) and the
 * cursor is the last id, which is stable under inserts.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateApi(req);
  if (isAuthFailure(auth)) return auth.response;

  const params = req.nextUrl.searchParams;
  const { limit, cursor } = readPaging(req);

  const projectId = params.get("project_id");
  if (projectId) {
    const owned = await db.project.findFirst({
      where: { id: projectId, orgId: auth.orgId },
      select: { id: true },
    });
    if (!owned) {
      return apiError(404, "project_not_found", "No project with that id.");
    }
  }

  const status = params.get("status")?.toUpperCase();
  const type = params.get("type")?.toUpperCase();
  const sentiment = params.get("sentiment")?.toUpperCase();
  const since = params.get("since");

  if (since && Number.isNaN(Date.parse(since))) {
    return apiError(
      400,
      "invalid_since",
      "`since` must be an ISO 8601 timestamp, for example 2026-08-01T00:00:00Z.",
    );
  }

  const items = await db.feedback.findMany({
    where: {
      orgId: auth.orgId,
      ...(projectId ? { projectId } : {}),
      ...(status && ["NEW", "REVIEWED", "ARCHIVED"].includes(status)
        ? { status: status as "NEW" | "REVIEWED" | "ARCHIVED" }
        : {}),
      ...(type &&
      ["IDEA", "ISSUE", "PRAISE", "QUESTION", "OTHER"].includes(type)
        ? { type: type as "IDEA" | "ISSUE" | "PRAISE" | "QUESTION" | "OTHER" }
        : {}),
      ...(sentiment &&
      ["POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED"].includes(sentiment)
        ? { sentiment: sentiment as "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "MIXED" }
        : {}),
      ...(since ? { createdAt: { gte: new Date(since) } } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: { theme: { select: { id: true, title: true } } },
  });

  return jsonList(items.map(serializeFeedback), {
    limit,
    lastId: items.at(-1)?.id ?? null,
  });
}

export function POST() {
  return NextResponse.json(
    {
      error: {
        code: "read_only",
        message:
          "The v1 API is read-only. Feedback is created by the widget, which posts to /api/ingest with your public project key.",
      },
    },
    { status: 405, headers: { Allow: "GET" } },
  );
}
