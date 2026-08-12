import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/server/db";
import { apiError, authenticateApi, isAuthFailure } from "@/server/lib/api-auth";
import { serializeFeedback } from "@/server/lib/api-shapes";

export const dynamic = "force-dynamic";

/** GET /api/v1/feedback/:id */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateApi(req);
  if (isAuthFailure(auth)) return auth.response;

  const { id } = await params;

  // orgId is part of the where clause, not checked afterwards: a row from
  // another tenant is simply not found, which is also the right thing to tell
  // the caller.
  const item = await db.feedback.findFirst({
    where: { id, orgId: auth.orgId },
    include: { theme: { select: { id: true, title: true } } },
  });

  if (!item) {
    return apiError(404, "not_found", "No feedback with that id.");
  }

  return NextResponse.json(
    { data: serializeFeedback(item) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
