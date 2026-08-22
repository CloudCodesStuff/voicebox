import { site } from "@/lib/site";

/**
 * /openapi.json
 *
 * The machine-readable contract for the read API. Hand-written rather than
 * generated: four endpoints is below the threshold where codegen earns its
 * complexity, and writing it by hand keeps every description addressed to
 * the reader (an agent deciding which call to make), not to a schema dump.
 *
 * Every operation carries a unique operationId, typed parameters, and typed
 * responses, which is what LLM function-calling formats consume. If a v1
 * route changes shape, this file is part of the change or the change is
 * incomplete — scripts/smoke-agent.ts holds the two together.
 */
export const dynamic = "force-static";

const errorSchema = {
  type: "object",
  required: ["error"],
  properties: {
    error: {
      type: "object",
      required: ["code", "message"],
      properties: {
        code: {
          type: "string",
          description:
            "Stable machine-readable code, e.g. missing_key, invalid_key, upgrade_required, rate_limited, project_not_found, not_found, invalid_since, read_only.",
        },
        message: {
          type: "string",
          description: "Human-readable explanation with the fix when there is one.",
        },
        requiredPlan: {
          type: "string",
          description: "Present on upgrade_required: the plan that unlocks this surface.",
        },
        retryAfter: {
          type: "integer",
          description: "Present on rate_limited: seconds to wait before retrying.",
        },
      },
    },
  },
} as const;

const feedbackSchema = {
  type: "object",
  description: "One piece of feedback as submitted through the widget, with analysis fields.",
  properties: {
    id: { type: "string" },
    project_id: { type: "string" },
    body: { type: "string", description: "The text the user wrote." },
    type: { type: "string", enum: ["IDEA", "ISSUE", "PRAISE", "QUESTION", "OTHER"] },
    rating: { type: ["integer", "null"], minimum: 1, maximum: 5 },
    email: { type: ["string", "null"], description: "Submitter email if they provided one." },
    page_url: { type: ["string", "null"], description: "Page the widget was on." },
    locale: { type: ["string", "null"] },
    referrer: { type: ["string", "null"] },
    metadata: {
      type: ["object", "null"],
      description: "Traits passed via the widget identify() call, if any.",
    },
    sentiment: { type: ["string", "null"], enum: ["POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED", null] },
    sentiment_score: { type: ["number", "null"], description: "-1 (negative) to 1 (positive)." },
    category: { type: ["string", "null"], description: "Model-assigned category." },
    summary: { type: ["string", "null"], description: "One-line model-written summary." },
    theme: {
      type: ["object", "null"],
      properties: { id: { type: "string" }, title: { type: "string" } },
      description: "The theme this item was grouped into, once analyzed.",
    },
    status: { type: "string", enum: ["NEW", "REVIEWED", "ARCHIVED"] },
    analyzed_at: { type: ["string", "null"], format: "date-time" },
    created_at: { type: "string", format: "date-time" },
  },
} as const;

const themeSchema = {
  type: "object",
  description:
    "A group of feedback describing the same underlying problem, ranked by priority. The first theme in the default ordering is the thing to work on next.",
  properties: {
    id: { type: "string" },
    project_id: { type: "string" },
    title: { type: "string" },
    description: { type: ["string", "null"] },
    sentiment: { type: ["string", "null"], enum: ["POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED", null] },
    item_count: { type: "integer", description: "How many pieces of feedback are in the theme." },
    negative_share: { type: ["number", "null"], description: "0-1 share of negative items." },
    priority_score: { type: "number", description: "Volume x negativity x recency. Higher = fix sooner." },
    status: { type: "string", enum: ["ACTIVE", "RESOLVED", "IGNORED"] },
    trend: { type: ["array", "null"], items: { type: "number" }, description: "Recent weekly volumes." },
    first_seen_at: { type: "string", format: "date-time" },
    last_seen_at: { type: "string", format: "date-time" },
    updated_at: { type: "string", format: "date-time" },
  },
} as const;

const projectSchema = {
  type: "object",
  description: "A project is one site or app with its own widget key and its own themes.",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    url: { type: ["string", "null"] },
    key: {
      type: "string",
      description: "The publishable widget key (already public in the customer's HTML). Never the secret API key.",
    },
    allowed_domains: { type: "array", items: { type: "string" } },
    created_at: { type: "string", format: "date-time" },
  },
} as const;

const listMeta = (itemRef: string) =>
  ({
    type: "object",
    required: ["data"],
    properties: {
      data: { type: "array", items: { $ref: itemRef } },
      next_cursor: {
        type: ["string", "null"],
        description: "Pass as ?cursor= to fetch the next page. Null when there is no further page.",
      },
    },
  }) as const;

const pagingParams = [
  {
    name: "limit",
    in: "query",
    required: false,
    schema: { type: "integer", minimum: 1, maximum: 100, default: 25 },
    description: "Page size, 1-100.",
  },
  {
    name: "cursor",
    in: "query",
    required: false,
    schema: { type: "string" },
    description: "Cursor from the previous page's next_cursor.",
  },
  {
    name: "project_id",
    in: "query",
    required: false,
    schema: { type: "string" },
    description: "Restrict to one project. 404 project_not_found if the id is not yours.",
  },
] as const;

const errorResponses = {
  "401": {
    description: "Missing, invalid, or revoked API key.",
    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
  },
  "403": {
    description: "The key's plan does not include REST API access (code upgrade_required).",
    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
  },
  "429": {
    description: "Rate limited: 120 requests/minute per key. Retry after error.retryAfter seconds.",
    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
  },
} as const;

export function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: `${site.name} API`,
      version: "1.0.0",
      description:
        `Read-only API over the feedback ${site.name} collects and the ranked themes its analysis produces. ` +
        `Authenticate with an API key (Settings → Developers) as \`Authorization: Bearer sk_...\`. ` +
        `Rate limit: 120 requests/minute per key. Feedback is written by the embedded widget, never through this API. ` +
        `Agents that prefer tools over raw HTTP can use the MCP server at ${site.url}/api/mcp (Streamable HTTP, same Bearer key, available on every plan).`,
      contact: { name: `${site.name} support`, email: site.supportEmail, url: `${site.url}/contact` },
      termsOfService: `${site.url}/terms`,
    },
    servers: [{ url: site.url }],
    security: [{ bearerAuth: [] }],
    paths: {
      "/api/v1/projects": {
        get: {
          operationId: "listProjects",
          summary: "List projects",
          description:
            "Every project in the workspace, oldest first. Unpaginated: the largest plans hold tens of projects. Use the ids to scope feedback and theme queries.",
          responses: {
            "200": {
              description: "All projects.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["data"],
                    properties: { data: { type: "array", items: { $ref: "#/components/schemas/Project" } } },
                  },
                },
              },
            },
            ...errorResponses,
          },
        },
      },
      "/api/v1/feedback": {
        get: {
          operationId: "listFeedback",
          summary: "List feedback",
          description:
            "Feedback newest first, cursor-paginated (stable under concurrent inserts). Filter by project, status, type, sentiment, or time.",
          parameters: [
            ...pagingParams,
            {
              name: "status",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["NEW", "REVIEWED", "ARCHIVED"] },
              description: "Filter by triage status.",
            },
            {
              name: "type",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["IDEA", "ISSUE", "PRAISE", "QUESTION", "OTHER"] },
              description: "Filter by the type the submitter chose.",
            },
            {
              name: "sentiment",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED"] },
              description: "Filter by analyzed sentiment.",
            },
            {
              name: "since",
              in: "query",
              required: false,
              schema: { type: "string", format: "date-time" },
              description: "Only items created at or after this ISO 8601 timestamp (400 invalid_since otherwise).",
            },
          ],
          responses: {
            "200": {
              description: "A page of feedback.",
              content: { "application/json": { schema: listMeta("#/components/schemas/Feedback") } },
            },
            "400": {
              description: "Malformed filter, e.g. invalid_since.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            "404": {
              description: "project_id does not belong to this workspace (code project_not_found).",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            ...errorResponses,
          },
        },
      },
      "/api/v1/feedback/{id}": {
        get: {
          operationId: "getFeedbackItem",
          summary: "Get one piece of feedback",
          description: "A single feedback item by id, including its theme once analyzed.",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Feedback id from listFeedback.",
            },
          ],
          responses: {
            "200": {
              description: "The item.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["data"],
                    properties: { data: { $ref: "#/components/schemas/Feedback" } },
                  },
                },
              },
            },
            "404": {
              description: "No feedback with that id in this workspace (code not_found).",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            ...errorResponses,
          },
        },
      },
      "/api/v1/themes": {
        get: {
          operationId: "listThemes",
          summary: "List themes ranked by priority",
          description:
            "Themes ordered by priority score, highest first — the first item is the thing to fix next. Defaults to ACTIVE themes; pass status to see resolved or ignored ones.",
          parameters: [
            ...pagingParams,
            {
              name: "status",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["ACTIVE", "RESOLVED", "IGNORED"], default: "ACTIVE" },
              description: "Filter by theme status.",
            },
          ],
          responses: {
            "200": {
              description: "A page of themes, priority order.",
              content: { "application/json": { schema: listMeta("#/components/schemas/Theme") } },
            },
            "404": {
              description: "project_id does not belong to this workspace (code project_not_found).",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            ...errorResponses,
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description:
            "API key from Settings → Developers, shown once at creation. REST requires the Pro plan or above; the MCP server accepts the same key on every plan.",
        },
      },
      schemas: {
        Error: errorSchema,
        Feedback: feedbackSchema,
        Theme: themeSchema,
        Project: projectSchema,
      },
    },
  };

  return Response.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
