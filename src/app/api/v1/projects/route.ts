import type { NextRequest } from "next/server";

import { db } from "@/server/db";
import {
  authenticateApi,
  isAuthFailure,
  jsonList,
} from "@/server/lib/api-auth";
import { serializeProject } from "@/server/lib/api-shapes";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/projects
 *
 * Unpaginated on purpose. The largest plan is measured in tens of projects,
 * so a cursor here would be ceremony, and callers need the full list to map
 * project ids onto their own systems anyway.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateApi(req);
  if (isAuthFailure(auth)) return auth.response;

  const projects = await db.project.findMany({
    where: { orgId: auth.orgId },
    orderBy: { createdAt: "asc" },
  });

  return jsonList(projects.map(serializeProject), { complete: true });
}
