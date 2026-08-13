import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "@/server/db";
import {
  serializeFeedback,
  serializeProject,
  serializeTheme,
} from "@/server/lib/api-shapes";

/* ---------------------------------------------------------------------------
   MCP tools
   ---------------------------------------------------------------------------
   The read side of the product, shaped for an assistant instead of a browser.
   A customer points their coding agent at /api/mcp with their API key, and the
   agent can pull the same ranked "what to work on" list the dashboard shows
   straight into wherever they are writing code.

   Everything here is READ-ONLY and scoped to one org, the one the API key
   belongs to. There is deliberately no create/update/delete tool: an agent that
   can silently resolve a theme or edit feedback is a footgun, and feedback is
   created by the widget, not by this. The tools reuse the exact serializers the
   HTTP API uses, so the MCP surface cannot drift from /api/v1 or accidentally
   ship an internal column (the `_ip` metadata key is stripped by those).

   Each tool is a plain object: a JSON-Schema input, and a `run` that takes the
   authenticated orgId plus parsed arguments and returns a plain value. The
   route layer turns that into MCP content; the tools know nothing about
   JSON-RPC, which keeps them unit-testable in isolation.
--------------------------------------------------------------------------- */

const LIMIT_DEFAULT = 25;
const LIMIT_MAX = 100;

function clampLimit(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return LIMIT_DEFAULT;
  return Math.min(Math.max(Math.trunc(n), 1), LIMIT_MAX);
}

/** A tool can throw this to return a clean, model-readable error. */
export class ToolError extends Error {}

/**
 * Confirm a project id belongs to the caller's org before it is used in any
 * `where`. Without this a valid key for org A could read org B's data by
 * passing B's project id, since the id alone is not a secret.
 */
async function assertProject(orgId: string, projectId: string): Promise<void> {
  const owned = await db.project.findFirst({
    where: { id: projectId, orgId },
    select: { id: true },
  });
  if (!owned) throw new ToolError(`No project with id "${projectId}" in this workspace.`);
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export type McpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  run: (orgId: string, args: Record<string, unknown>) => Promise<unknown>;
};

export const MCP_TOOLS: McpTool[] = [
  {
    name: "list_projects",
    description:
      "List the projects (products/sites) in this workspace. Call this first to get a project_id for the other tools. Returns id, name, url and the public widget key.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    async run(orgId) {
      const projects = await db.project.findMany({
        where: { orgId },
        orderBy: { createdAt: "asc" },
      });
      return { data: projects.map(serializeProject) };
    },
  },

  {
    name: "list_themes",
    description:
      "The ranked list of what to work on. Themes are groups of feedback describing the same underlying problem, ordered by priority (volume x negative share x recency) so the FIRST item is the most important thing to fix next. Each theme has a title, description, item_count, negative_share and a weekly trend. Start here.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "Limit to one project. Omit to span every project in the workspace.",
        },
        status: {
          type: "string",
          enum: ["ACTIVE", "RESOLVED", "IGNORED"],
          description: "Defaults to ACTIVE, the open work.",
        },
        limit: { type: "integer", minimum: 1, maximum: LIMIT_MAX, default: LIMIT_DEFAULT },
      },
      additionalProperties: false,
    },
    async run(orgId, args) {
      const projectId = str(args.project_id);
      if (projectId) await assertProject(orgId, projectId);

      const status = str(args.status)?.toUpperCase();
      const validStatus =
        status && ["ACTIVE", "RESOLVED", "IGNORED"].includes(status)
          ? (status as "ACTIVE" | "RESOLVED" | "IGNORED")
          : "ACTIVE";

      const themes = await db.theme.findMany({
        where: { orgId, ...(projectId ? { projectId } : {}), status: validStatus },
        orderBy: [{ priorityScore: "desc" }, { id: "desc" }],
        take: clampLimit(args.limit),
      });
      return { data: themes.map(serializeTheme) };
    },
  },

  {
    name: "get_theme",
    description:
      "One theme in full, plus a handful of the actual feedback messages behind it, so you can read what users really said in their own words before acting on it.",
    inputSchema: {
      type: "object",
      properties: {
        theme_id: { type: "string", description: "The theme id from list_themes." },
        examples: {
          type: "integer",
          minimum: 0,
          maximum: 20,
          default: 5,
          description: "How many representative feedback items to include.",
        },
      },
      required: ["theme_id"],
      additionalProperties: false,
    },
    async run(orgId, args) {
      const themeId = str(args.theme_id);
      if (!themeId) throw new ToolError("theme_id is required.");

      const theme = await db.theme.findFirst({ where: { id: themeId, orgId } });
      if (!theme) throw new ToolError(`No theme with id "${themeId}" in this workspace.`);

      const take = Math.min(Math.max(Number(args.examples ?? 5) || 0, 0), 20);
      const examples = take
        ? await db.feedback.findMany({
            where: { themeId, orgId },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take,
            include: { theme: { select: { id: true, title: true } } },
          })
        : [];

      return {
        theme: serializeTheme(theme),
        examples: examples.map(serializeFeedback),
      };
    },
  },

  {
    name: "list_feedback",
    description:
      "Raw feedback messages, newest first, with each one's sentiment, category, summary and the theme it belongs to. Use it to drill into a specific type or sentiment, or to read the latest arrivals. Cursor-paginated via next_cursor.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        type: {
          type: "string",
          enum: ["IDEA", "ISSUE", "PRAISE", "QUESTION", "OTHER"],
        },
        sentiment: {
          type: "string",
          enum: ["POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED"],
        },
        since: {
          type: "string",
          description: "ISO 8601 timestamp; only feedback at or after this time.",
        },
        limit: { type: "integer", minimum: 1, maximum: LIMIT_MAX, default: LIMIT_DEFAULT },
        cursor: { type: "string", description: "next_cursor from a previous call." },
      },
      additionalProperties: false,
    },
    async run(orgId, args) {
      const projectId = str(args.project_id);
      if (projectId) await assertProject(orgId, projectId);

      const type = str(args.type)?.toUpperCase();
      const sentiment = str(args.sentiment)?.toUpperCase();
      const since = str(args.since);
      if (since && Number.isNaN(Date.parse(since))) {
        throw new ToolError("`since` must be an ISO 8601 timestamp, e.g. 2026-08-01T00:00:00Z.");
      }

      const limit = clampLimit(args.limit);
      const cursor = str(args.cursor);

      const where: Prisma.FeedbackWhereInput = {
        orgId,
        ...(projectId ? { projectId } : {}),
        ...(type && ["IDEA", "ISSUE", "PRAISE", "QUESTION", "OTHER"].includes(type)
          ? { type: type as Prisma.FeedbackWhereInput["type"] }
          : {}),
        ...(sentiment && ["POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED"].includes(sentiment)
          ? { sentiment: sentiment as Prisma.FeedbackWhereInput["sentiment"] }
          : {}),
        ...(since ? { createdAt: { gte: new Date(since) } } : {}),
      };

      const items = await db.feedback.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: { theme: { select: { id: true, title: true } } },
      });

      const full = items.length === limit;
      return {
        data: items.map(serializeFeedback),
        has_more: full,
        next_cursor: full ? (items.at(-1)?.id ?? null) : null,
      };
    },
  },

  {
    name: "project_overview",
    description:
      "Headline numbers for a project over a window: total feedback, how much is analyzed, the sentiment breakdown, the negative share, and the active theme count. The same figures the dashboard shows at the top.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        days: {
          type: "integer",
          minimum: 1,
          maximum: 365,
          default: 30,
          description: "Window size in days, counting back from now.",
        },
      },
      required: ["project_id"],
      additionalProperties: false,
    },
    async run(orgId, args) {
      const projectId = str(args.project_id);
      if (!projectId) throw new ToolError("project_id is required.");
      await assertProject(orgId, projectId);

      const days = Math.min(Math.max(Number(args.days ?? 30) || 30, 1), 365);
      const since = new Date(Date.now() - days * 86_400_000);
      const scope = { orgId, projectId };

      const [windowTotal, allTime, analyzed, bySentiment, themes] = await Promise.all([
        db.feedback.count({ where: { ...scope, createdAt: { gte: since } } }),
        db.feedback.count({ where: scope }),
        db.feedback.count({ where: { ...scope, sentiment: { not: null } } }),
        db.feedback.groupBy({
          by: ["sentiment"],
          where: { ...scope, sentiment: { not: null } },
          _count: true,
        }),
        db.theme.count({ where: { ...scope, status: "ACTIVE" } }),
      ]);

      const sentiment = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0, MIXED: 0 };
      for (const row of bySentiment) {
        if (row.sentiment) sentiment[row.sentiment] = row._count;
      }

      return {
        project_id: projectId,
        window_days: days,
        feedback_in_window: windowTotal,
        feedback_all_time: allTime,
        analyzed,
        unanalyzed: allTime - analyzed,
        sentiment,
        negative_share: analyzed ? sentiment.NEGATIVE / analyzed : 0,
        active_themes: themes,
      };
    },
  },
];

export const MCP_TOOLS_BY_NAME = new Map(MCP_TOOLS.map((t) => [t.name, t]));
