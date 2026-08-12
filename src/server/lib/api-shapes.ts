import "server-only";

import type { Feedback, Project, Theme } from "@prisma/client";

/* ---------------------------------------------------------------------------
   Public API response shapes
   ---------------------------------------------------------------------------
   Every field the API returns is named here, explicitly. Spreading a Prisma
   row into a response is how internal columns leak: `_ip` lives inside the
   metadata blob, and one added column later becomes a public contract nobody
   meant to make.

   snake_case on the way out, because that is what an HTTP API reads like even
   though the database is camelCase.
--------------------------------------------------------------------------- */

/** Widget-captured context is internal bookkeeping; strip it before it ships. */
const INTERNAL_METADATA_KEYS = new Set(["_ip"]);

/**
 * Same filter, exported for the dashboard's own tRPC reads.
 *
 * The privacy policy says the stored IP is used "purely to enforce rate limits
 * and detect abuse". Shipping it to every team member's browser, even hidden
 * behind a UI filter, would make that false — the value is on the wire either
 * way. Stripping it server-side is what makes the sentence true.
 */
export function stripInternalMetadata<T extends { metadata: unknown }>(
  item: T,
): T {
  return { ...item, metadata: publicMetadata(item.metadata) };
}

function publicMetadata(metadata: unknown): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const entries = Object.entries(metadata as Record<string, unknown>).filter(
    ([key]) => !INTERNAL_METADATA_KEYS.has(key),
  );
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

export function serializeFeedback(
  item: Feedback & { theme?: { id: string; title: string } | null },
) {
  return {
    id: item.id,
    project_id: item.projectId,
    body: item.body,
    type: item.type,
    rating: item.rating,
    email: item.email,
    page_url: item.pageUrl,
    locale: item.locale,
    referrer: item.referrer,
    metadata: publicMetadata(item.metadata),
    sentiment: item.sentiment,
    sentiment_score: item.sentimentScore,
    category: item.aiCategory,
    summary: item.summary,
    theme: item.theme ? { id: item.theme.id, title: item.theme.title } : null,
    status: item.status,
    analyzed_at: item.analyzedAt?.toISOString() ?? null,
    created_at: item.createdAt.toISOString(),
  };
}

export function serializeTheme(item: Theme) {
  return {
    id: item.id,
    project_id: item.projectId,
    title: item.title,
    description: item.description,
    sentiment: item.sentiment,
    item_count: item.itemCount,
    negative_share: item.negativeShare,
    priority_score: item.priorityScore,
    status: item.status,
    trend: item.trend ?? null,
    first_seen_at: item.firstSeenAt.toISOString(),
    last_seen_at: item.lastSeenAt.toISOString(),
    updated_at: item.updatedAt.toISOString(),
  };
}

export function serializeProject(item: Project) {
  return {
    id: item.id,
    name: item.name,
    url: item.url,
    // The publishable widget key, safe to expose: it is already in the
    // customer's own HTML. The secret API key is never returned anywhere.
    key: item.key,
    allowed_domains: item.allowedDomains,
    created_at: item.createdAt.toISOString(),
  };
}
