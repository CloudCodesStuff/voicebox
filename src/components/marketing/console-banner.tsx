"use client";

import { useEffect } from "react";

/* ---------------------------------------------------------------------------
   Console banner

   Prints a wordmark into devtools for the people who open devtools. That is a
   narrower audience than the page has, and a much better matched one: the
   buyer here is a developer with a shipped product, and anyone inspecting a
   feedback widget's own site is already curious about how it works.

   Two decisions worth stating, because both look arbitrary and neither is.

   The gradient runs mint to white, and white text is invisible on a
   light-themed console. Chrome's devtools default to light. So every line
   carries `--slab` as its background: that token exists precisely because the
   palette needed one surface that stays dark in both themes (see the comment
   on it in globals.css, which calls out code blocks and terminal frames). The
   banner reads as one dark block either way.

   And it fires once per page load, not once per mount. The App Router
   remounts layout children on client navigation, so a `useEffect` alone would
   reprint the banner every time someone clicked from /pricing to /docs. The
   module-scope flag survives navigation and dies with the page, which is the
   lifetime that matches "greet me when I arrive".
--------------------------------------------------------------------------- */

/** Letterforms on a fixed 5-row grid, each column padded to a constant width. */
const GLYPHS: Record<string, string[]> = {
  V: ["██   ██", "██   ██", "██   ██", " ██ ██ ", "  ███  "],
  O: [" █████ ", "██   ██", "██   ██", "██   ██", " █████ "],
  I: ["██", "██", "██", "██", "██"],
  C: [" █████ ", "██     ", "██     ", "██     ", " █████ "],
  E: ["██████", "██    ", "█████ ", "██    ", "██████"],
  B: ["██████ ", "██   ██", "██████ ", "██   ██", "██████ "],
  X: ["██   ██", " ██ ██ ", "  ███  ", " ██ ██ ", "██   ██"],
};

/** mint → white, one step per row. */
const RAMP = ["#00c48c", "#3ed3a8", "#7de0c4", "#bdeee1", "#ffffff"];

const SLAB = "#0a0d0c";

function rows(word: string): string[] {
  const letters = [...word].map((ch) => GLYPHS[ch]).filter(Boolean) as string[][];
  return RAMP.map((_, row) =>
    letters.map((glyph) => glyph[row]).join(" "),
  );
}

let printed = false;

export function ConsoleBanner() {
  useEffect(() => {
    if (printed) return;
    printed = true;

    const art = rows("VOICEBOX");

    // One console.log rather than one per line, so it lands as a single entry.
    // Format specifiers consume the trailing args in order: each %c takes a
    // style string and each %s takes the row it styles.
    const format = art.map(() => "%c %s ").join("\n");
    const args = art.flatMap((row, i) => [
      `background:${SLAB};color:${RAMP[i]};font-weight:bold;line-height:1.15`,
      row,
    ]);

    console.log(format, ...args);

    console.log(
      "%c feedback in. fix list out. ",
      `background:${SLAB};color:#e4eae8;line-height:1.6`,
    );
    console.log(
      "%c usevoicebox.dev ",
      `background:${SLAB};color:${RAMP[0]};line-height:1.6`,
    );
  }, []);

  return null;
}
