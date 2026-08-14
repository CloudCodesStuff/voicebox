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

  // The favicon outranks frequency, which is what the order at the top of this
  // file says and what confidenceFor() already encodes (favicon medium,
  // frequency low). The code did the opposite: it only ever looked at the
  // favicon when pickColor found nothing at all, so a single stray hex in a
  // utility class beat a logo drawn in the brand colour on purpose.
  const weakest = !color.hex || color.source === "frequency";
  const favicon = weakest ? await faviconColor(html, baseUrl) : null;

  const finalColor = favicon
    ? { hex: favicon, source: "favicon" as const }
    : color.hex
      ? color
      : null;

  return {
    color: finalColor?.hex ?? null,
    colorSource: finalColor?.source ?? null,
    colorConfidence: finalColor ? confidenceFor(finalColor.source) : null,
    font: pickFont(html, parsed.fontFamilies),
    theme: pickTheme(html, parsed.globalBackground),
    radius: pickRadius(parsed.radii, parsed.radiusToken),
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
  /** A `--radius` design token, which outranks anything inferred from rules. */
  radiusToken: number | null;
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

/**
 * A selector list counts as global if ANY of its parts is.
 *
 * Anchored at the head of the whole list, this missed `:host,html{...}`, which
 * is exactly what Tailwind v4's preflight ships, and `body,html{...}`, which
 * half the resets on the internet ship. On those sites the page's own
 * font-family and background were never read at all, so the typeface and the
 * light/dark guess came back empty on the most common stack there is.
 */
function isGlobalSelector(selector: string): boolean {
  return splitTop(selector, ",").some((part) => GLOBAL_SELECTOR.test(part.trim()));
}
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
    radiusToken: null,
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
    const isGlobal = isGlobalSelector(selector);

    rule.walkDecls((decl) => {
      const prop = decl.prop.toLowerCase();
      const value = resolveValue(decl.value, vars);

      // The base radius token, exactly `--radius`. shadcn ships it by that
      // name and Tailwind's own `--radius-sm/md/lg` are derived from it, so
      // the unsuffixed one is the site's actual choice rather than a step on
      // a scale. Read here because on a utility-first site no rule the
      // ROLE_SELECTOR would recognise ever sets border-radius directly:
      // `.rounded-lg{border-radius:var(--radius)}` is not a button.
      if (prop === "--radius" && result.radiusToken === null) {
        const px = toPx(value);
        if (px !== null) result.radiusToken = px;
        return;
      }

      if (CUSTOM_PROP_NAME.test(prop) && !STATE_COLOR_NAME.test(prop)) {
        const hex = cssColorToHex(value);
        if (hex) result.customPropColors.push({ hex, name: prop });
        return;
      }

      if (isRole && COLOR_PROP.test(prop)) {
        const hex = cssColorToHex(value);
        const weight = hex ? roleWeight(selector, prop) : null;
        if (hex && weight !== null) {
          result.roleColors.set(hex, (result.roleColors.get(hex) ?? 0) + weight);
        }
        return;
      }

      if (isGlobal && (prop === "background" || prop === "background-color") && !result.globalBackground) {
        const hex = cssColorToHex(value);
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
  const themeHex = cssColorToHex(themeColor);
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
    const hex = cssColorToHex(m[0]);
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

function pickRadius(radii: number[], token: number | null): number | null {
  // A declared token beats a median of whatever rules happened to be readable.
  if (token !== null) return Math.round(Math.min(24, Math.max(0, token)));
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

/* ------------------------------------------------------- colour conversion */

/**
 * Modern CSS colour syntax, converted to sRGB.
 *
 * This is not a nicety, it is the difference between the algorithm working
 * and not. Tailwind v4 ships its entire palette in oklch, and every design
 * token on a site built with it is written that way. A parser that reads only
 * hex and rgb() sees NONE of the strong signals on such a site: not the
 * --primary token, not the colour its own buttons are painted with. It falls
 * all the way through to counting hex literals as text, where the only things
 * left to count are one-off arbitrary values like `bg-[#006400]/10` on a
 * decorative chip. That is exactly how withlanci.com, whose brand colour is
 * oklch(66.42% .1784 254.12), came back dark green.
 */

/** Splits on `sep` at paren depth 0, so nested colour functions survive. */
function splitTop(input: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === sep && depth === 0) {
      out.push(input.slice(start, i));
      start = i + 1;
    }
  }
  out.push(input.slice(start));
  return out;
}

/** Arguments of `name(...)`, alpha dropped: it says nothing about the hue. */
function fnArgs(value: string, name: string): string[] | null {
  const v = value.trim();
  const open = name.length + 1;
  if (!v.toLowerCase().startsWith(`${name}(`) || !v.endsWith(")")) return null;
  const inner = v.slice(open, -1);
  return splitTop(inner, "/")[0]!
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
}

/**
 * One component. `pct` is what 100% means for this channel, which differs per
 * space: 100% is 0.4 chroma in oklch but 150 in lch, and the spec says so.
 */
function component(token: string | undefined, pct: number): number | null {
  if (token === undefined) return null;
  const t = token.trim().toLowerCase();
  if (t === "none") return 0;
  const m = t.match(/^([+-]?(?:\d*\.)?\d+)(%)?$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return m[2] ? (n / 100) * pct : n;
}

function angle(token: string | undefined): number | null {
  if (token === undefined) return null;
  const t = token.trim().toLowerCase();
  if (t === "none") return 0;
  const m = t.match(/^([+-]?(?:\d*\.)?\d+)(deg|rad|grad|turn)?$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  if (m[2] === "rad") return (n * 180) / Math.PI;
  if (m[2] === "grad") return n * 0.9;
  if (m[2] === "turn") return n * 360;
  return n;
}

/** Linear-light channel to an 8-bit sRGB value, gamma and clamping included. */
function encodeChannel(c: number): number {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, v)) * 255);
}

function hexOf(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** Ottosson's Oklab, the space Tailwind v4 and every modern token system use. */
function oklabToHex(L: number, a: number, b: number): string {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return hexOf(
    encodeChannel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    encodeChannel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    encodeChannel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  );
}

/**
 * CIE Lab to sRGB.
 *
 * The whitepoint is D50, not D65. CSS Color 4 defines lab() and lch() against
 * D50 and leaves the adaptation to sRGB's D65 to the implementation, so a D65
 * whitepoint here looks almost right and is wrong by about 6/255 on saturated
 * reds. The matrix below is XYZ(D50) straight to linear sRGB, Bradford
 * adaptation already folded in. Checked against Chrome: lab(54.29 80.8 69.89)
 * is exactly #FF0000 with this, and #FF0500 with D65.
 */
const D50 = { X: 0.3457 / 0.3585, Y: 1, Z: (1 - 0.3457 - 0.3585) / 0.3585 };

function labToHex(L: number, a: number, b: number): string {
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const d = 6 / 29;
  const inv = (t: number) => (t > d ? t * t * t : 3 * d * d * (t - 4 / 29));

  const X = D50.X * inv(fx);
  const Y = D50.Y * inv(fy);
  const Z = D50.Z * inv(fz);

  return hexOf(
    encodeChannel(X * 3.1341359569958707 + Y * -1.6173863321612538 + Z * -0.4906619460083532),
    encodeChannel(X * -0.978795502912089 + Y * 1.9161604866085181 + Z * 0.03344459287401481),
    encodeChannel(X * 0.07195537988411677 + Y * -0.2289768264158322 + Z * 1.405386058324125),
  );
}

/** h in degrees, s and l as 0-1. Returns 0-1 channels, not encoded. */
function hslChannels(h: number, s: number, l: number): [number, number, number] {
  const hp = (((h % 360) + 360) % 360) / 60;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = l - c / 2;
  const t: [number, number, number] =
    hp < 1 ? [c, x, 0]
    : hp < 2 ? [x, c, 0]
    : hp < 3 ? [0, c, x]
    : hp < 4 ? [0, x, c]
    : hp < 5 ? [x, 0, c]
    : [c, 0, x];
  return [t[0] + m, t[1] + m, t[2] + m];
}

const CLAMP_255 = (n: number) => Math.round(Math.min(255, Math.max(0, n)));

/**
 * The full CSS named colours. Rare in a design system, but `darkgreen` or
 * `rebeccapurple` on a hero is a real declaration and dropping it silently is
 * how a colour goes missing.
 */
const NAMED_COLORS: Record<string, string> = {
  aliceblue: "#F0F8FF", antiquewhite: "#FAEBD7", aqua: "#00FFFF", aquamarine: "#7FFFD4",
  azure: "#F0FFFF", beige: "#F5F5DC", bisque: "#FFE4C4", black: "#000000",
  blanchedalmond: "#FFEBCD", blue: "#0000FF", blueviolet: "#8A2BE2", brown: "#A52A2A",
  burlywood: "#DEB887", cadetblue: "#5F9EA0", chartreuse: "#7FFF00", chocolate: "#D2691E",
  coral: "#FF7F50", cornflowerblue: "#6495ED", cornsilk: "#FFF8DC", crimson: "#DC143C",
  cyan: "#00FFFF", darkblue: "#00008B", darkcyan: "#008B8B", darkgoldenrod: "#B8860B",
  darkgray: "#A9A9A9", darkgreen: "#006400", darkgrey: "#A9A9A9", darkkhaki: "#BDB76B",
  darkmagenta: "#8B008B", darkolivegreen: "#556B2F", darkorange: "#FF8C00",
  darkorchid: "#9932CC", darkred: "#8B0000", darksalmon: "#E9967A", darkseagreen: "#8FBC8F",
  darkslateblue: "#483D8B", darkslategray: "#2F4F4F", darkslategrey: "#2F4F4F",
  darkturquoise: "#00CED1", darkviolet: "#9400D3", deeppink: "#FF1493",
  deepskyblue: "#00BFFF", dimgray: "#696969", dimgrey: "#696969", dodgerblue: "#1E90FF",
  firebrick: "#B22222", floralwhite: "#FFFAF0", forestgreen: "#228B22", fuchsia: "#FF00FF",
  gainsboro: "#DCDCDC", ghostwhite: "#F8F8FF", gold: "#FFD700", goldenrod: "#DAA520",
  gray: "#808080", green: "#008000", greenyellow: "#ADFF2F", grey: "#808080",
  honeydew: "#F0FFF0", hotpink: "#FF69B4", indianred: "#CD5C5C", indigo: "#4B0082",
  ivory: "#FFFFF0", khaki: "#F0E68C", lavender: "#E6E6FA", lavenderblush: "#FFF0F5",
  lawngreen: "#7CFC00", lemonchiffon: "#FFFACD", lightblue: "#ADD8E6", lightcoral: "#F08080",
  lightcyan: "#E0FFFF", lightgoldenrodyellow: "#FAFAD2", lightgray: "#D3D3D3",
  lightgreen: "#90EE90", lightgrey: "#D3D3D3", lightpink: "#FFB6C1", lightsalmon: "#FFA07A",
  lightseagreen: "#20B2AA", lightskyblue: "#87CEFA", lightslategray: "#778899",
  lightslategrey: "#778899", lightsteelblue: "#B0C4DE", lightyellow: "#FFFFE0",
  lime: "#00FF00", limegreen: "#32CD32", linen: "#FAF0E6", magenta: "#FF00FF",
  maroon: "#800000", mediumaquamarine: "#66CDAA", mediumblue: "#0000CD",
  mediumorchid: "#BA55D3", mediumpurple: "#9370DB", mediumseagreen: "#3CB371",
  mediumslateblue: "#7B68EE", mediumspringgreen: "#00FA9A", mediumturquoise: "#48D1CC",
  mediumvioletred: "#C71585", midnightblue: "#191970", mintcream: "#F5FFFA",
  mistyrose: "#FFE4E1", moccasin: "#FFE4B5", navajowhite: "#FFDEAD", navy: "#000080",
  oldlace: "#FDF5E6", olive: "#808000", olivedrab: "#6B8E23", orange: "#FFA500",
  orangered: "#FF4500", orchid: "#DA70D6", palegoldenrod: "#EEE8AA", palegreen: "#98FB98",
  paleturquoise: "#AFEEEE", palevioletred: "#DB7093", papayawhip: "#FFEFD5",
  peachpuff: "#FFDAB9", peru: "#CD853F", pink: "#FFC0CB", plum: "#DDA0DD",
  powderblue: "#B0E0E6", purple: "#800080", rebeccapurple: "#663399", red: "#FF0000",
  rosybrown: "#BC8F8F", royalblue: "#4169E1", saddlebrown: "#8B4513", salmon: "#FA8072",
  sandybrown: "#F4A460", seagreen: "#2E8B57", seashell: "#FFF5EE", sienna: "#A0522D",
  silver: "#C0C0C0", skyblue: "#87CEEB", slateblue: "#6A5ACD", slategray: "#708090",
  slategrey: "#708090", snow: "#FFFAFA", springgreen: "#00FF7F", steelblue: "#4682B4",
  tan: "#D2B48C", teal: "#008080", thistle: "#D8BFD8", tomato: "#FF6347",
  turquoise: "#40E0D0", violet: "#EE82EE", wheat: "#F5DEB3", white: "#FFFFFF",
  whitesmoke: "#F5F5F5", yellow: "#FFFF00", yellowgreen: "#9ACD32",
};

/**
 * Any CSS colour to #RRGGBB, or null when it genuinely isn't one.
 *
 * Alpha is deliberately discarded rather than blended: a half-transparent
 * brand colour is still the brand colour, and there is no background here to
 * composite it against.
 */
export function cssColorToHex(
  value: string | undefined,
  depth = 0,
): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v || depth > 3) return null;
  const lower = v.toLowerCase();

  const named = NAMED_COLORS[lower];
  if (named) return named;

  if (v.startsWith("#")) {
    const hex = v.match(/^#([0-9a-fA-F]{3,8})$/);
    if (!hex) return null;
    let h = hex[1]!;
    if (h.length === 3 || h.length === 4) {
      h = h.slice(0, 3).split("").map((c) => c + c).join("");
    }
    if (h.length === 8) h = h.slice(0, 6);
    if (h.length !== 6) return null;
    return `#${h.toUpperCase()}`;
  }

  // rgb() takes 0-255 or percentages, and modern syntax allows both spellings
  // with or without commas.
  const rgb = fnArgs(v, "rgb") ?? fnArgs(v, "rgba");
  if (rgb) {
    const [r, g, b] = [component(rgb[0], 255), component(rgb[1], 255), component(rgb[2], 255)];
    if (r === null || g === null || b === null) return null;
    return hexOf(CLAMP_255(r), CLAMP_255(g), CLAMP_255(b));
  }

  const hsl = fnArgs(v, "hsl") ?? fnArgs(v, "hsla");
  if (hsl) {
    const h = angle(hsl[0]);
    const s = component(hsl[1], 1);
    const l = component(hsl[2], 1);
    if (h === null || s === null || l === null) return null;
    const [r, g, b] = hslChannels(h, Math.min(1, Math.max(0, s)), Math.min(1, Math.max(0, l)));
    return hexOf(CLAMP_255(r * 255), CLAMP_255(g * 255), CLAMP_255(b * 255));
  }

  const hwb = fnArgs(v, "hwb");
  if (hwb) {
    const h = angle(hwb[0]);
    let w = component(hwb[1], 1);
    let b2 = component(hwb[2], 1);
    if (h === null || w === null || b2 === null) return null;
    if (w + b2 > 1) {
      const sum = w + b2;
      w /= sum;
      b2 /= sum;
    }
    const [r, g, b] = hslChannels(h, 1, 0.5).map((c) => c * (1 - w - b2!) + w) as [number, number, number];
    return hexOf(CLAMP_255(r * 255), CLAMP_255(g * 255), CLAMP_255(b * 255));
  }

  // 100% is 0.4 chroma in oklch and 0.4 on the oklab axes, per spec.
  const oklch = fnArgs(v, "oklch");
  if (oklch) {
    const L = component(oklch[0], 1);
    const C = component(oklch[1], 0.4);
    const H = angle(oklch[2]);
    if (L === null || C === null || H === null) return null;
    const rad = (H * Math.PI) / 180;
    return oklabToHex(L, C * Math.cos(rad), C * Math.sin(rad));
  }

  const oklab = fnArgs(v, "oklab");
  if (oklab) {
    const L = component(oklab[0], 1);
    const a = component(oklab[1], 0.4);
    const b = component(oklab[2], 0.4);
    if (L === null || a === null || b === null) return null;
    return oklabToHex(L, a, b);
  }

  // CIE lch()/lab(): 100% is 150 chroma and 125 on the a/b axes.
  const lch = fnArgs(v, "lch");
  if (lch) {
    const L = component(lch[0], 100);
    const C = component(lch[1], 150);
    const H = angle(lch[2]);
    if (L === null || C === null || H === null) return null;
    const rad = (H * Math.PI) / 180;
    return labToHex(L, C * Math.cos(rad), C * Math.sin(rad));
  }

  const lab = fnArgs(v, "lab");
  if (lab) {
    const L = component(lab[0], 100);
    const a = component(lab[1], 125);
    const b = component(lab[2], 125);
    if (L === null || a === null || b === null) return null;
    return labToHex(L, a, b);
  }

  // color-mix(in oklab, <brand> 10%, transparent) is how Tailwind writes an
  // opacity modifier. Mixing a colour with transparent does not change its
  // hue, so the other argument IS the colour. Any other mix is two real
  // colours making a third, which we have no business guessing at.
  if (lower.startsWith("color-mix(")) {
    const inner = v.slice("color-mix(".length, -1);
    const parts = splitTop(inner, ",").map((p) => p.trim());
    const colors = parts
      .slice(1)
      .map((p) => p.replace(/\s+[\d.]+%\s*$/, "").trim())
      .filter(Boolean);
    if (colors.length === 2) {
      const transparentAt = colors.findIndex((c) => c.toLowerCase() === "transparent");
      if (transparentAt !== -1) return cssColorToHex(colors[1 - transparentAt], depth + 1);
    }
    return null;
  }

  return null;
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
