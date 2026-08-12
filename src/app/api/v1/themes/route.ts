import type { NextRequest } from "next/server";

import { db } from "@/server/db";
import {
  apiError,
  authenticateApi,
  isAuthFailure,
  jsonList,
  readPaging,
} from "@/server/lib/api-auth";
import { serializeTheme } from "@/server/lib/api-shapes";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/themes
 *
 * Ordered by priority, which is the whole point of the product: the first
 * item in this response is the thing to work on next. Anyone building a
 * Slack digest or a Linear sync wants exactly this order, so it is the
 * default rather than an option.
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

  const items = await db.theme.findMany({
    where: {
      orgId: auth.orgId,
      ...(projectId ? { projectId } : {}),
      ...(status && ["ACTIVE", "RESOLVED", "IGNORED"].includes(status)
        ? { status: status as "ACTIVE" | "RESOLVED" | "IGNORED" }
        : { status: "ACTIVE" as const }),
    },
    orderBy: [{ priorityScore: "desc" }, { id: "desc" }],
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  return jsonList(items.map(serializeTheme), {
    limit,
    lastId: items.at(-1)?.id ?? null,
  });
}
