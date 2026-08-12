import "server-only";

import postcss from "postcss";
import sharp from "sharp";

import { dominantVividColor } from "@/lib/image-color";
import type { FontKey } from "@/lib/widget-config";
import {
  readCappedBuffer,
  readCappedText,
  safeFetch,
  SsrfError,
} from "@/server/lib/net-guard";

/* ---------------------------------------------------------------------------
   Guessing a brand from a site, not just a colour from its markup.

   The old version only ever looked at the HTML document itself, which is the
   wrong place to look: on almost every real site, the palette lives in a
   linked stylesheet, not inline. It also picked a colour by counting how
   often a hex code appeared as raw text anywhere in the page, which finds
   whichever shade of border-grey happens to repeat the most, not the one
   color the whole site is designed around.

   This version:
     1. Fetches the linked stylesheets too, not just the HTML, and actually
        parses the combined CSS with a real parser instead of regexing text.
     2. Scores colours by WHERE they're used, not how often they appear.
        A colour on `.btn-primary { background: ... }` is the brand colour.
        A colour that happens to appear five times in border shorthand isn't.
     3. Pulls the favicon and asks what colour it actually is, by decoding the
        image and clustering its pixels — logos are deliberately designed to
        BE the brand colour, which makes this the single most reliable signal
        available, when it's usable at all.
     4. Goes beyond colour: typeface (from an explicit Google Fonts link or a
        real `font-family` declaration, classified into one of the widget's
        four stacks), light/dark theme, and a representative corner radius.

   Order of trust for colour, best signal first:
     1. <meta name="theme-color">                     an explicit choice
     2. --brand/--primary/--accent CSS custom property another explicit choice
     3. Colour used on a button/CTA/primary-labelled rule the site's own usage
     4. The favicon's dominant vivid colour                a designed asset
     5. Whatever vivid colour appears most anywhere          last resort

   Everything is filtered through the same "is this actually a brand colour"
   test throughout: greys, near-blacks, near-whites, and the handful of
   framework defaults that appear on half the internet are discarded.
--------------------------------------------------------------------------- */

const FETCH_TIMEOUT_MS = 8_000;
const MAX_HTML_BYTES = 600_000;
const MAX_CSS_FILES = 4;
const MAX_CSS_BYTES_EACH = 250_000;
const MAX_CSS_BYTES_TOTAL = 700_000;
const MAX_FAVICON_BYTES = 300_000;

export type ColorSource = "theme-color" | "css-variable" | "role" | "favicon" | "frequency";

export type BrandGuess = {
  color: string | null;
  colorSource: ColorSource | null;
  colorConfidence: "high" | "medium" | "low" | null;
  font: FontKey | null;
  theme: "light" | "dark" | null;
  /** px, 0-24, matching the widget's own radius slider range. */
  radius: number | null;
};

export async function guessBrand(rawUrl: string): Promise<BrandGuess | null> {
  const url = normalizeUrl(rawUrl);
  if (!url) return null;

  let html: string;
  let baseUrl: string;
  try {
    // safeFetch re-validates the host on every redirect hop against the private
    // network (DNS-resolved, v4+v6), so a 302 to 169.254.169.254 or a
    // rebinding name like 127.0.0.1.nip.io can't reach an internal target.
    const res = await safeFetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": BROWSER_UA, Accept: "text/html,application/xhtml+xml" },
    });
    if (!res.ok) return null;

    // Cap during download, not after: a hostile endpoint streaming gigabytes
    // can't buffer the function out of memory.
    html = await readCappedText(res, MAX_HTML_BYTES);
    // res.url reflects wherever safeFetch actually landed after redirects;
    // relative hrefs (stylesheets, icons) must resolve against that, not the
    // URL the customer originally typed.
    baseUrl = res.url || url;
  } catch (err) {
    if (err instanceof SsrfError) return null;
    return null;
  }

  const inlineCss = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((m) => m[1] ?? "")
    .join("\n");

  const externalCss = await fetchStylesheets(html, baseUrl);
  const cssCorpus = [inlineCss, ...externalCss].join("\n").slice(0, MAX_CSS_BYTES_TOTAL);

  const parsed = parseCss(cssCorpus);

  const color = pickColor(html, cssCorpus, parsed);
  const favicon = color.source !== "theme-color" ? await faviconColor(html, baseUrl) : null;
  const finalColor = color.hex ? color : favicon ? { hex: favicon, source: "favicon" as const } : null;

  return {
    color: finalColor?.hex ?? null,
    colorSource: finalColor?.source ?? null,
    colorConfidence: finalColor ? confidenceFor(finalColor.source) : null,
    font: pickFont(html, parsed.fontFamilies),
    theme: pickTheme(html, parsed.globalBackground),
    radius: pickRadius(parsed.radii),
  };
}

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function confidenceFor(source: ColorSource): "high" | "medium" | "low" {
  if (source === "theme-color" || source === "css-variable") return "high";
  if (source === "role" || source === "favicon") return "medium";
  return "low";
}

/* ------------------------------------------------------------- stylesheets */

/** Best-effort: a stylesheet that 404s or times out just isn't part of the corpus. */
async function fetchStylesheets(html: string, baseUrl: string): Promise<string[]> {
  const hrefs = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((tag) => /rel=["'][^"']*stylesheet[^"']*["']/i.test(tag))
    .map((tag) => tag.match(/href=["']([^"']+)["']/i)?.[1])
    .filter((href): href is string => Boolean(href))
    .map((href) => resolveUrl(href, baseUrl))
    .filter((href): href is string => Boolean(href))
    .slice(0, MAX_CSS_FILES);

  const results = await Promise.allSettled(hrefs.map((href) => fetchCss(href)));
  return results
    .filter((r): r is PromiseFulfilledResult<string | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((v): v is string => Boolean(v));
}

async function fetchCss(href: string): Promise<string | null> {
  try {
    const res = await safeFetch(href, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": BROWSER_UA, Accept: "text/css" },
    });
    if (!res.ok) return null;
    return await readCappedText(res, MAX_CSS_BYTES_EACH);
  } catch {
    return null;
  }
}

function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------- CSS walk */

type ParsedCss = {
  /** hex -> accumulated weight, so a colour used on three different button rules beats one used once. */
  roleColors: Map<string, number>;
  /** Kept with the variable's own name, not just its colour: a design system usually
   * defines several brand-ish-sounding tokens, and which one is THE brand colour
   * depends on which one the buttons actually use — see pickColor. */
  customPropColors: Array<{ hex: string; name: string }>;
  fontFamilies: string[];
  radii: number[];
  globalBackground: string | null;
};

const ROLE_SELECTOR = /\b(btn|button|primary|brand|cta|accent)\b/i;
// Real design systems name their button plenty of things, but almost never
// any of these. A selector matching ROLE_SELECTOR that ALSO matches this is
// nearly always decorative art (a hero illustration, a doc example, an avatar
// placeholder) that happens to contain the word "cta" or "accent" as part of
// a longer component name, not an actual clickable button.
const DECORATIVE_SELECTOR = /graphic|illustration|icon|badge|logo|demo|example|mock|avatar|placeholder|thumbnail/i;
const CANONICAL_ROLE_SELECTOR = /^[.>\s]*(btn|button)(?:[-_](primary|cta|accent))?[.\s]*$/i;
const GLOBAL_SELECTOR = /^\s*(:root|html|body)\b/i;
const COLOR_PROP = /^(background|background-color|border-color|color|fill|stroke)$/;
// Deliberately NOT "theme": that word namespaces a token by what varies
// between light/dark mode, not by what the brand is. "--fig-theme-form-error"
// matches on substring alone and is an error-state red, not Figma's brand
// colour — confirmed against Figma's own shipped CSS while building this.
const CUSTOM_PROP_NAME = /--[\w-]*(brand|primary|accent)[\w-]*/i;
// A brand-ish-named token still isn't safe if it's actually a state colour;
// design systems routinely ship "--brand-error" or "--primary-warning".
const STATE_COLOR_NAME = /error|warning|danger|destructive|success|alert|invalid/i;
const MAX_VAR_RESOLUTION_DEPTH = 5;

/**
 * How much a role-color match is worth. Two things push a candidate up:
 * whether the declaration sets a background (a button's fill is a stronger
 * brand signal than the border colour of some unrelated card), and whether
 * the selector itself looks like an actual, generic button rather than one
 * specific component buried three BEM segments deep. A selector matching
 * DECORATIVE_SELECTOR is excluded outright, weight or no weight — no amount
 * of frequency should promote a hero illustration's stroke colour to "brand".
 */
function roleWeight(selector: string, prop: string): number | null {
  if (DECORATIVE_SELECTOR.test(selector)) return null;

  const propWeight = prop.includes("background") ? 3 : 1;
  const trimmed = selector.trim();
  const selectorBonus = CANONICAL_ROLE_SELECTOR.test(trimmed)
    ? 5
    : trimmed.length <= 24
      ? 2
      : 0;

  return propWeight + selectorBonus;
}

/**
 * `var(--name)` / `var(--name, fallback)`, resolved against every custom
 * property this stylesheet defines, recursively (a variable can itself be
 * defined in terms of another). Most real design systems route their button
 * colour through a token rather than writing the hex literally on the rule
 * that uses it, so skipping this step would mean the actual brand colour is
 * usually sitting one level of indirection below whatever gets seen.
 */
function resolveValue(
  value: string,
  vars: Map<string, string>,
  depth = 0,
): string {
  if (depth >= MAX_VAR_RESOLUTION_DEPTH) return value;

  const match = value.trim().match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]+))?\)$/i);
  if (!match) return value;

  const [, name, fallback] = match;
  const resolved = vars.get(name!);
  if (resolved) return resolveValue(resolved, vars, depth + 1);
  if (fallback) return resolveValue(fallback, vars, depth + 1);
  return value;
}

/** Never throws: a real parser on possibly-malformed third-party CSS still has to degrade gracefully. */
function parseCss(cssText: string): ParsedCss {
  const result: ParsedCss = {
    roleColors: new Map(),
    customPropColors: [],
    fontFamilies: [],
    radii: [],
    globalBackground: null,
  };
  if (!cssText.trim()) return result;

  let root: postcss.Root;
  try {
    root = postcss.parse(cssText);
  } catch {
    return result;
  }

  // Pass 1: every custom property this stylesheet defines, anywhere, so a
  // var() reference encountered in pass 2 has something to resolve against
  // regardless of which rule actually declared it.
  const vars = new Map<string, string>();
  root.walkDecls(/^--/, (decl) => {
    vars.set(decl.prop, decl.value);
  });

  root.walkRules((rule) => {
    const selector = rule.selector ?? "";
    const isRole = ROLE_SELECTOR.test(selector);
    const isGlobal = GLOBAL_SELECTOR.test(selector);

    rule.walkDecls((decl) => {
      const prop = decl.prop.toLowerCase();
      const value = resolveValue(decl.value, vars);

      if (CUSTOM_PROP_NAME.test(prop) && !STATE_COLOR_NAME.test(prop)) {
        const hex = toHex(value);
        if (hex) result.customPropColors.push({ hex, name: prop });
        return;
      }

      if (isRole && COLOR_PROP.test(prop)) {
        const hex = toHex(value);
        const weight = hex ? roleWeight(selector, prop) : null;
        if (hex && weight !== null) {
          result.roleColors.set(hex, (result.roleColors.get(hex) ?? 0) + weight);
        }
        return;
      }

      if (isGlobal && (prop === "background" || prop === "background-color") && !result.globalBackground) {
        const hex = toHex(value);
        if (hex) result.globalBackground = hex;
        return;
      }

      if (isGlobal && prop === "font-family") {
        const first = value.split(",")[0]?.trim().replace(/["']/g, "");
        if (first) result.fontFamilies.push(first);
        return;
      }

      if (isRole && prop === "border-radius") {
        const px = toPx(value);
        if (px !== null) result.radii.push(px);
      }
    });
  });

  return result;
}

/** "primary"/"cta" name a main-action colour specifically; "accent"/"theme" are vaguer. */
function nameStrength(name: string): number {
  if (/primary|cta/i.test(name)) return 2;
  if (/brand/i.test(name)) return 1;
  return 0;
}

/* -------------------------------------------------------------- colour pick */

function pickColor(
  html: string,
  cssCorpus: string,
  parsed: ParsedCss,
): { hex: string; source: ColorSource } | { hex: null; source: null } {
  // 1. theme-color, an explicit choice, so trust it even if it's muted.
  const themeColor = html.match(
    /<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i,
  )?.[1];
  const themeHex = toHex(themeColor);
  if (themeHex && !isNeutral(themeHex)) return { hex: themeHex, source: "theme-color" };

  // 2. Custom properties that name themselves. A design system usually
  // defines several brand-ish tokens (an error red can easily be named
  // "--color-primary-error"), so a name match alone isn't proof; preferring
  // whichever one is ALSO the strongest role-colour confirms the token is
  // actually what the buttons use, not just a plausible-sounding name.
  const namedColors = parsed.customPropColors.filter(({ hex }) => !isNeutral(hex));
  const roleConfirmed = namedColors.find(({ hex }) => parsed.roleColors.has(hex));
  if (roleConfirmed) return { hex: roleConfirmed.hex, source: "css-variable" };

  // No cross-confirmation available: "primary"/"cta" in the name is a
  // stronger claim to being the main action colour than "accent" or "theme".
  const byNameStrength = [...namedColors].sort(
    (a, b) => nameStrength(b.name) - nameStrength(a.name),
  )[0];
  if (byNameStrength) return { hex: byNameStrength.hex, source: "css-variable" };

  // 3. Whatever the site itself uses on a button/CTA/primary-labelled rule,
  // picking the one with the most accumulated weight rather than the first.
  const roleBest = [...parsed.roleColors.entries()]
    .filter(([hex]) => !isNeutral(hex) && !isCommonDefault(hex))
    .sort((a, b) => b[1] - a[1])[0];
  if (roleBest) return { hex: roleBest[0], source: "role" };

  // 4. Last resort: whatever vivid colour shows up most anywhere, across both
  // the markup and every stylesheet fetched, not just the HTML.
  const counts = new Map<string, number>();
  for (const m of `${html}\n${cssCorpus}`.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) {
    const hex = toHex(m[0]);
    if (!hex || isNeutral(hex) || isCommonDefault(hex)) continue;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  if (counts.size === 0) return { hex: null, source: null };
  const [best] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return { hex: best![0], source: "frequency" };
}

/* ---------------------------------------------------------------- favicon */

/** Only tried when nothing more explicit was found; failures here are silent by design. */
async function faviconColor(html: string, baseUrl: string): Promise<string | null> {
  const iconTag = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((m) => m[0])
    .find((tag) => /rel=["'](?:shortcut icon|icon|apple-touch-icon)["']/i.test(tag));
  const iconHref = iconTag?.match(/href=["']([^"']+)["']/i)?.[1];
  const resolved = resolveUrl(iconHref ?? "/favicon.ico", baseUrl);
  if (!resolved) return null;

  try {
    const res = await safeFetch(resolved, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": BROWSER_UA },
    });
    if (!res.ok) return null;

    const bytes = await readCappedBuffer(res, MAX_FAVICON_BYTES);
    if (bytes.byteLength === 0) return null;

    // Classic .ico containers aren't a format sharp decodes; every other
    // shape a favicon comes in today (PNG, SVG, WebP) it handles fine. A
    // decode failure here just means this signal is unavailable, not an error.
    const { data } = await sharp(Buffer.from(bytes))
      .resize(48, 48, { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    return dominantVividColor(data)?.color ?? null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------- font */

const GENERIC_FAMILIES = new Set([
  "sans-serif",
  "serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
  "ui-rounded",
  "inherit",
]);

const MONO_NAMES = /mono|code|consolas|courier|jetbrains|fira code|source code/i;
const SERIF_NAMES = /georgia|times|garamond|playfair|merriweather|lora|baskerville|pt serif/i;
const ROUNDED_NAMES = /quicksand|nunito|comfortaa|baloo|fredoka|varela round|century gothic/i;

function classifyFont(name: string): FontKey {
  if (MONO_NAMES.test(name)) return "mono";
  if (/serif/i.test(name) && !/sans-serif/i.test(name)) return "serif";
  if (SERIF_NAMES.test(name)) return "serif";
  if (ROUNDED_NAMES.test(name)) return "rounded";
  return "sans";
}

function pickFont(html: string, cssFamilies: string[]): FontKey | null {
  // An explicit Google Fonts link is the most reliable signal there is: the
  // site chose this family on purpose, by name, in a URL we can just read.
  const gfont = html.match(/fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/i)?.[1];
  if (gfont) {
    const family = decodeURIComponent(gfont).split(":")[0]?.replace(/\+/g, " ");
    if (family) return classifyFont(family);
  }

  const family = cssFamilies.find((f) => !GENERIC_FAMILIES.has(f.toLowerCase()));
  return family ? classifyFont(family) : null;
}

/* ------------------------------------------------------------------ theme */

function pickTheme(html: string, globalBackground: string | null): "light" | "dark" | null {
  const colorScheme = html
    .match(/<meta[^>]+name=["']color-scheme["'][^>]+content=["']([^"']+)["']/i)?.[1]
    ?.toLowerCase();
  if (colorScheme) {
    const hasDark = colorScheme.includes("dark");
    const hasLight = colorScheme.includes("light");
    if (hasDark && !hasLight) return "dark";
    if (hasLight && !hasDark) return "light";
  }

  if (globalBackground) {
    const { l } = toHsl(globalBackground);
    if (l < 0.18) return "dark";
    if (l > 0.92) return "light";
  }

  // No confident signal either way: leave it unset rather than force a guess
  // onto someone who may genuinely want "auto".
  return null;
}

/* ----------------------------------------------------------------- radius */

function pickRadius(radii: number[]): number | null {
  if (radii.length === 0) return null;
  const sorted = [...radii].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
  return Math.round(Math.min(24, Math.max(0, median)));
}

function toPx(value: string): number | null {
  // Shorthand like "8px 8px 0 0" describes individually-cut corners, not a
  // single radius; only a single-value declaration maps cleanly to our slider.
  const v = value.trim();
  if (/\s/.test(v)) return null;

  const rem = v.match(/^(\d*\.?\d+)rem$/);
  if (rem) return parseFloat(rem[1]!) * 16;

  const px = v.match(/^(\d*\.?\d+)px$/);
  if (px) return Math.min(24, parseFloat(px[1]!));

  // A pill shape (large radius or 50%+) is the fully-rounded end of our own
  // slider, not a value to average in on its own numeric terms.
  const pct = v.match(/^(\d*\.?\d+)%$/);
  if (pct && parseFloat(pct[1]!) >= 50) return 24;

  return null;
}

/* ------------------------------------------------------------------ shared */

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
