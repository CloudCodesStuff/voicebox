/**
 * Pull a brand colour out of a screenshot, entirely in the browser.
 *
 * No upload, no server, no third-party service: the image is drawn to a canvas
 * the user's own tab owns and never leaves the device. That's the right default
 * for something people will feed private product screenshots to.
 *
 * The approach is bucket-and-count rather than average. Averaging a screenshot
 * gives you mud, because most of any interface is white, grey, and text. So we
 * throw away everything that isn't vivid, group what's left by hue, and return
 * the most-used vivid hue at its most representative lightness.
 */

export type ExtractedColor = { color: string; coverage: number };

const MAX_DIMENSION = 240;

export async function extractBrandColor(
  file: File,
): Promise<ExtractedColor | null> {
  const bitmap = await loadBitmap(file);
  if (!bitmap) return null;

  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
  );
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(bitmap, 0, 0, w, h);
  if ("close" in bitmap) bitmap.close();

  let pixels: Uint8ClampedArray;
  try {
    pixels = ctx.getImageData(0, 0, w, h).data;
  } catch {
    // Tainted canvas: only possible with a cross-origin source, which we
    // never use, but fail quietly rather than throwing at the user.
    return null;
  }

  return dominantVividColor(pixels);
}

/**
 * Bucket-and-count the dominant vivid hue in a flat RGBA byte buffer.
 *
 * Pure, so it works on any source of pixels: canvas `ImageData.data` here in
 * the browser, or a decoded image buffer on the server (see
 * `server/lib/brand-color.ts`, which pulls a colour out of a site's favicon
 * the same way). One algorithm, because "what counts as a brand colour in a
 * bitmap" shouldn't have two different answers depending on which side of the
 * network drew the pixels.
 *
 * Bucketing beats averaging: most of any real image is white, grey, and text,
 * so an average comes out mud. 24 hue buckets (15° each) group what's left,
 * fine enough to separate blue from purple, coarse enough that anti-aliasing
 * doesn't shatter one colour into ten.
 */
export function dominantVividColor(
  pixels: ArrayLike<number>,
): ExtractedColor | null {
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
  let considered = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3]!;
    if (a < 200) continue;

    const r = pixels[i]!;
    const g = pixels[i + 1]!;
    const b = pixels[i + 2]!;
    considered++;

    const { h: hue, s, l } = rgbToHsl(r, g, b);
    // The same "is this a brand colour" test the server-side page guesser uses.
    if (s < 0.3 || l < 0.15 || l > 0.88) continue;

    const key = Math.floor(hue / 15);
    const entry = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    entry.count++;
    entry.r += r;
    entry.g += g;
    entry.b += b;
    buckets.set(key, entry);
  }

  if (buckets.size === 0 || considered === 0) return null;

  const [, best] = [...buckets.entries()].sort(
    (a, b) => b[1].count - a[1].count,
  )[0]!;

  const color = rgbToHex(
    Math.round(best.r / best.count),
    Math.round(best.g / best.count),
    Math.round(best.b / best.count),
  );

  return { color, coverage: best.count / considered };
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement | null> {
  try {
    if ("createImageBitmap" in window) {
      return await createImageBitmap(file);
    }
  } catch {
    // Fall through to the <img> path.
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) return { h: 0, s: 0, l };

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;

  return { h: h * 360, s, l };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/**
 * White or near-black, whichever will actually be readable on the accent.
 * Used to preview button text without guessing.
 */
export function readableOn(hex: string): "#FFFFFF" | "#18181B" {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.45 ? "#18181B" : "#FFFFFF";
}
