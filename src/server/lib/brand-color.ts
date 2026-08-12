import "server-only";

import { readCappedText, safeFetch, SsrfError } from "@/server/lib/net-guard";

/* ---------------------------------------------------------------------------
   Guessing a site's brand colour from its markup.

   Order of trust, best signal first:
     1. <meta name="theme-color"> , someone chose this deliberately
     2. CSS custom properties whose name says brand/primary/accent
     3. The most common vivid colour anywhere in the markup

   Everything is filtered through a "is this actually a brand colour" test:
     greys, near-blacks, near-whites, and the handful of framework defaults
     that appear on half the internet are discarded. A brand colour is
     saturated and mid-lightness; #f8f9fa is a background.
--------------------------------------------------------------------------- */

const FETCH_TIMEOUT_MS = 8_000;
const MAX_BYTES = 600_000;

export type ColorGuess = {
  color: string;
  source: "theme-color" | "css-variable" | "frequency";
  confidence: "high" | "medium" | "low";
};

export async function guessBrandColor(
  rawUrl: string,
): Promise<ColorGuess | null> {
  const url = normalizeUrl(rawUrl);
  if (!url) return null;

  let html: string;
  try {
    // safeFetch re-validates the host on every redirect hop against the private
    // network (DNS-resolved, v4+v6), so a 302 to 169.254.169.254 or a
    // rebinding name like 127.0.0.1.nip.io can't reach an internal target.
    const res = await safeFetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        // Some sites serve a stripped page to unknown agents; look like a browser.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;

    // Cap during download, not after: a hostile endpoint streaming gigabytes
    // can't buffer the function out of memory.
    html = await readCappedText(res, MAX_BYTES);
  } catch (err) {
    if (err instanceof SsrfError) return null;
    return null;
  }

  // 1. theme-color, an explicit choice, so trust it even if it's muted.
  const themeColor = html.match(
    /<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i,
  )?.[1];
  const themeHex = toHex(themeColor);
  if (themeHex && !isNeutral(themeHex)) {
    return { color: themeHex, source: "theme-color", confidence: "high" };
  }

  // 2. Custom properties that name themselves.
  const varMatches = html.matchAll(
    /--(?:[\w-]*(?:brand|primary|accent|theme)[\w-]*)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/gi,
  );
  for (const m of varMatches) {
    const hex = toHex(m[1]);
    if (hex && !isNeutral(hex)) {
      return { color: hex, source: "css-variable", confidence: "high" };
    }
  }

  // 3. Fall back to whatever vivid colour shows up most.
  const counts = new Map<string, number>();
  for (const m of html.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) {
    const hex = toHex(m[0]);
    if (!hex || isNeutral(hex) || isCommonDefault(hex)) continue;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }

  if (counts.size === 0) return null;

  const [best, hits] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]!;
  return {
    color: best,
    source: "frequency",
    confidence: hits >= 3 ? "medium" : "low",
  };
}

function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    // Don't let a URL field become a way to probe the private network.
    const host = url.hostname.toLowerCase();
    const blocked =
      host === "localhost" ||
      host === "0.0.0.0" ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host);
    if (blocked) return null;

    return url.toString();
  } catch {
    return null;
  }
}

/** Accepts #abc, #aabbcc, #aabbccdd, rgb(), rgba(). Returns #rrggbb. */
function toHex(value: string | undefined): string | null {
  if (!value) return null;
  const v = value.trim();

  const rgb = v.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  if (rgb) {
    const [r, g, b] = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
    if ([r, g, b].some((n) => n > 255)) return null;
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
  }

  const hex = v.match(/^#([0-9a-fA-F]{3,8})$/);
  if (!hex) return null;

  let h = hex[1]!;
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length === 8) h = h.slice(0, 6);
  if (h.length !== 6) return null;

  return `#${h.toUpperCase()}`;
}

function toHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) return { h: 0, s: 0, l };

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return { h: h * 360, s, l };
}

/** Greys, near-blacks and near-whites are chrome, not brand. */
function isNeutral(hex: string): boolean {
  const { s, l } = toHsl(hex);
  return s < 0.25 || l < 0.12 || l > 0.9;
}

/** Colours that appear on half the internet and mean nothing about the brand. */
function isCommonDefault(hex: string): boolean {
  return ["#FFFFFF", "#000000", "#FF0000", "#0000FF", "#00FF00"].includes(hex);
}
