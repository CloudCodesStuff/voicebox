import { NextResponse, type NextRequest } from "next/server";

import { authenticateApi, isAuthFailure } from "@/server/lib/api-auth";
import { MCP_TOOLS, MCP_TOOLS_BY_NAME, ToolError } from "@/server/lib/mcp";

export const dynamic = "force-dynamic";

/* ---------------------------------------------------------------------------
   Model Context Protocol endpoint (Streamable HTTP, stateless)
   ---------------------------------------------------------------------------
   A remote MCP server a customer adds to their coding agent:

     claude mcp add --transport http voicebox https://www.usevoicebox.dev/api/mcp \
       --header "Authorization: Bearer vb_live_..."

   The agent can then read the ranked themes and raw feedback through the tools
   in server/lib/mcp.ts.

   Hand-rolled rather than pulled from an SDK. MCP over HTTP is JSON-RPC 2.0 on
   one POST, and the handful of methods a client actually calls (initialize,
   tools/list, tools/call, ping, plus the initialized notification) are less
   code than wiring a Node-transport SDK into a Web-Request route handler would
   be, with nothing extra to keep patched. This matches how the rest of the repo
   avoids a dependency it can write in forty lines.

   Stateless on purpose: no Mcp-Session-Id is issued, so every POST stands
   alone. That is what lets it run on serverless with no shared memory, and the
   auth key on each request is the only state that matters. Server-initiated
   streaming (the GET/SSE half of the transport) is intentionally unsupported;
   these tools are request/response, so GET returns 405 as the spec allows.

   Auth reuses the public-API bearer key, so MCP is automatically behind the
   same paid-plan gate and per-key rate limit as /api/v1, and a revoked key
   loses MCP access at the same instant. A bad key fails the whole POST at the
   HTTP layer with 401; once past that, tool problems come back as JSON-RPC
   errors, not HTTP errors, which is what an MCP client expects.
--------------------------------------------------------------------------- */

const SERVER_INFO = { name: "voicebox", title: "Voicebox", version: "1.0.0" };
const LATEST_PROTOCOL = "2025-06-18";
const SUPPORTED_PROTOCOLS = new Set(["2025-06-18", "2025-03-26", "2024-11-05"]);

const INSTRUCTIONS =
  "Voicebox holds this product's user feedback, already grouped into themes. " +
  "Call list_projects to get a project_id, then list_themes: it returns the " +
  "ranked list of what to fix, most important first. Use get_theme to read the " +
  "actual messages behind a theme before acting. Everything is read-only.";

// MCP clients are native apps and desktop/web hosts; a permissive CORS policy
// lets the browser-based ones (custom connectors) reach the endpoint. Only the
// bearer key grants data access, so this exposes nothing on its own.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, MCP-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

type JsonRpcId = string | number | null;

function ok(id: JsonRpcId, result: unknown) {
  return { jsonrpc: "2.0" as const, id, result };
}

function err(id: JsonRpcId, code: number, message: string) {
  return { jsonrpc: "2.0" as const, id, error: { code, message } };
}

/** Dispatch one JSON-RPC message. Returns null for notifications (no reply). */
async function handleRpc(
  message: unknown,
  orgId: string,
): Promise<object | null> {
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    return err(null, -32600, "Invalid Request");
  }

  const { id = null, method, params } = message as {
    id?: JsonRpcId;
    method?: unknown;
    params?: unknown;
  };
  const isNotification = !("id" in (message as object));
  const p = (params ?? {}) as Record<string, unknown>;

  if (typeof method !== "string") {
    return isNotification ? null : err(id, -32600, "Invalid Request");
  }

  // Notifications never get a response, whatever they are.
  if (method.startsWith("notifications/")) return null;

  switch (method) {
    case "initialize": {
      const requested = typeof p.protocolVersion === "string" ? p.protocolVersion : "";
      return ok(id, {
        protocolVersion: SUPPORTED_PROTOCOLS.has(requested) ? requested : LATEST_PROTOCOL,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    }

    case "ping":
      return ok(id, {});

    case "tools/list":
      return ok(id, {
        tools: MCP_TOOLS.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      });

    case "tools/call": {
      const name = typeof p.name === "string" ? p.name : "";
      const tool = MCP_TOOLS_BY_NAME.get(name);
      if (!tool) return err(id, -32602, `Unknown tool: ${name || "(none)"}`);

      const args =
        p.arguments && typeof p.arguments === "object" && !Array.isArray(p.arguments)
          ? (p.arguments as Record<string, unknown>)
          : {};

      try {
        const result = await tool.run(orgId, args);
        // Text content is the universally-supported shape; a JSON string is
        // what the model reads best. isError:false is implicit on success.
        return ok(id, {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        });
      } catch (e) {
        // A tool-level failure is reported as an unsuccessful tool result, NOT
        // a JSON-RPC error: the call reached the tool, the tool declined. That
        // is the distinction MCP draws, and it lets the model see the reason
        // and adjust rather than treating it as a transport fault.
        const message =
          e instanceof ToolError
            ? e.message
            : "The tool failed to run. Please try again.";
        if (!(e instanceof ToolError)) console.error("[mcp] tool error", e);
        return ok(id, {
          content: [{ type: "text", text: message }],
          isError: true,
        });
      }
    }

    default:
      return isNotification ? null : err(id, -32601, `Method not found: ${method}`);
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateApi(req);
  if (isAuthFailure(auth)) {
    // Carry CORS onto the auth failure too, so a browser client sees the 401
    // body instead of an opaque CORS error.
    for (const [k, v] of Object.entries(CORS)) auth.response.headers.set(k, v);
    return auth.response;
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(err(null, -32700, "Parse error"), {
      status: 200,
      headers: CORS,
    });
  }

  // A JSON-RPC batch is an array; a single call is one object. Notifications
  // drop out (null), so a batch of only notifications yields an empty reply.
  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return NextResponse.json(err(null, -32600, "Invalid Request"), {
        status: 200,
        headers: CORS,
      });
    }
    const replies = (
      await Promise.all(payload.map((m) => handleRpc(m, auth.orgId)))
    ).filter((r): r is object => r !== null);
    return replies.length === 0
      ? new NextResponse(null, { status: 202, headers: CORS })
      : NextResponse.json(replies, { headers: CORS });
  }

  const reply = await handleRpc(payload, auth.orgId);
  return reply === null
    ? new NextResponse(null, { status: 202, headers: CORS })
    : NextResponse.json(reply, { headers: CORS });
}

/**
 * The transport's GET is for opening a server-to-client SSE stream. This server
 * never initiates messages, so it declines, which the spec explicitly permits.
 */
export function GET() {
  return NextResponse.json(
    {
      error: {
        code: "method_not_allowed",
        message:
          "This is an MCP endpoint. POST JSON-RPC here with Authorization: Bearer <your API key>.",
      },
    },
    { status: 405, headers: { ...CORS, Allow: "POST, OPTIONS" } },
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
