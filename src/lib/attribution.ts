/* ---------------------------------------------------------------------------
   Signup attribution

   One question this answers: which post produced a paying customer.

   Deliberately not analytics. Nothing here observes browsing, nothing is sent
   to a third party, and no identifier is created for a visitor who never signs
   up. A single first-party cookie holds one short slug taken from `?ref=`, and
   it is read exactly once, at the moment a user row is created, then never
   again. That is why this needs no consent gate and why the privacy policy's
   "no analytics" position survives it: a channel label on a customer record is
   the same category of data as the plan they are on.

   First touch rather than last touch, because the interesting question is
   which channel found them, not which link they happened to click on the way
   back. A cookie already holding a value is never overwritten.

   This module is imported by `proxy.ts`, so it must stay pure: no `next/*`
   imports, no database, no `server-only`.
--------------------------------------------------------------------------- */

/**
 * Cookie name. Short and obviously ours, so it is recognisable in devtools by
 * anyone wondering what we set.
 *
 * The matcher in `proxy.ts` repeats this literal, because Next requires
 * matcher values to be statically analysable constants and will silently
 * ignore an imported one. Change it in both places.
 */
export const REF_COOKIE = "vb_ref";

/** The query parameter marketing links carry. */
export const REF_PARAM = "ref";

/**
 * 90 days, which is one quarter.
 *
 * Long enough that someone who reads a Show HN post, forgets about it, and
 * signs up six weeks later is still credited to it. Not so long that a stale
 * label outlives the campaign that earned it.
 */
export const REF_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

/** Longest slug stored. A channel tag is a label, not a payload. */
const MAX_LENGTH = 32;

/**
 * Reduces an arbitrary query value to a safe slug, or null.
 *
 * `?ref=` is attacker-controlled input that ends up in a database column and
 * on an operator's screen, so it is filtered to a conservative alphabet rather
 * than escaped later. Anything containing a character outside `a-z 0-9 - _` is
 * rejected outright instead of being stripped down to something misleading:
 * a tag we cannot read exactly is worth less than no tag at all.
 */
export function normalizeRef(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length === 0 || trimmed.length > MAX_LENGTH) return null;
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(trimmed)) return null;
  return trimmed;
}

/**
 * The tags this plan uses, and what each one means.
 *
 * Not a whitelist. An unknown tag is still recorded, because inventing a tag
 * mid-launch should not silently lose the attribution. This exists so the
 * admin dashboard can label a row and so there is one place that spells the
 * slugs the same way the links do.
 */
export const REF_CHANNELS: Record<string, string> = {
  hn: "Show HN",
  ph: "Product Hunt",
  widget: "Powered-by badge on a customer's site",

  "r-sideproject": "Reddit / r/SideProject",
  "r-alphabeta": "Reddit / r/alphaandbetausers",
  "r-webdev": "Reddit / r/webdev",
  "r-microsaas": "Reddit / r/microsaas",
  "r-saas": "Reddit / r/SaaS",
  "r-ih": "Reddit / r/indiehackers",
  "r-shopifydev": "Reddit / r/shopifyDev",
  "r-lovable": "Reddit / r/lovable",

  "mcp-smithery": "MCP directory / Smithery",
  "mcp-pulse": "MCP directory / PulseMCP",
  "mcp-so": "MCP directory / mcp.so",
  "mcp-cursor": "MCP directory / Cursor",
  "mcp-glama": "MCP directory / Glama",

  "dm-t1": "Outbound / SaaS with no feedback stack",
  "dm-t2": "Outbound / agencies and studios",
  x: "X / Twitter",
  discord: "Discord community",
};

/** Human label for a stored slug, falling back to the slug itself. */
export function refLabel(slug: string): string {
  return REF_CHANNELS[slug] ?? slug;
}
