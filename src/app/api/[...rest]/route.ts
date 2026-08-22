import { NextResponse, type NextRequest } from "next/server";

import { site } from "@/lib/site";

/**
 * JSON 404 for every /api path that no real handler claims.
 *
 * Without this, an agent probing /api/nonexistent gets the HTML app-shell
 * 404 and concludes the API can't be parsed. Real routes always win over a
 * catch-all in the App Router, so this only ever answers for paths that
 * genuinely do not exist.
 */
function notFound(req: NextRequest) {
  return NextResponse.json(
    {
      error: {
        code: "not_found",
        message: `No API route at ${req.nextUrl.pathname}.`,
        hint: "The read API lives under /api/v1 (projects, feedback, themes). The machine-readable spec is at /openapi.json; human docs at /docs/api; MCP server at /api/mcp.",
        spec: `${site.url}/openapi.json`,
        docs: `${site.url}/docs/api`,
      },
    },
    { status: 404, headers: { "Cache-Control": "no-store" } },
  );
}

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
export const HEAD = notFound;
export const OPTIONS = notFound;
