/**
 * Build widget/widget.js -> public/widget.js
 *
 *   npm run build:widget          (also runs as part of `dev` and `build`)
 *
 * Files in public/ are served byte-for-byte; Next does not touch them. So the
 * widget shipped as its own commented source, and every customer paid for the
 * comments on every cold load. Minifying first halves what goes over the wire.
 *
 * ── Why minify and not obfuscate ──
 *
 * Name mangling is the only obfuscation that pays for itself. The heavier
 * techniques (control-flow flattening, string arrays, self-defending wrappers)
 * inflate the output several times over, which attacks the one number this
 * widget is sold on, and they protect nothing: the code executes in a browser
 * the reader controls, so anyone motivated has the logic back in minutes.
 *
 * They also cost something specific here. This script gets pasted into other
 * companies' pages, where somebody's security review reads it. Third-party
 * JavaScript that looks deliberately unreadable is a normal reason to reject a
 * vendor, and it sits badly next to a docs page that tells people exactly what
 * the widget transmits. Small and legible is the better trade.
 *
 * The output is committed. It is generated, so that is not free, but a checkout
 * that serves a broken widget because someone ran `next dev` directly is worse
 * than a diff on a file nobody hand-edits.
 */

import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "widget", "widget.js");
const OUT = join(root, "public", "widget.js");

/**
 * Kept through minification. Someone reading view-source needs to land
 * somewhere, and the licence line has to survive.
 */
const banner = `/*! Voicebox widget | (c) Arc Labs LLC | https://www.usevoicebox.dev
 * Readable source: https://github.com/CloudCodesStuff/voicebox/blob/main/widget/widget.js
 * What this transmits: https://www.usevoicebox.dev/docs/security
 */`;

const result = await build({
  entryPoints: [SRC],
  outfile: OUT,
  bundle: false,
  minify: true,
  // The widget runs on whatever the customer's visitors use, which is a much
  // wider set of browsers than the dashboard's. es2017 keeps the output plain
  // enough for anything still receiving security updates, and the source is
  // hand-written to that level anyway, so there is nothing to down-level.
  target: "es2017",
  legalComments: "none",
  banner: { js: banner },
  logLevel: "warning",
  metafile: true,
});

if (result.errors.length) process.exit(1);

const [before, after] = await Promise.all([readFile(SRC), readFile(OUT)]);
const kb = (n) => (n / 1024).toFixed(1) + "KB";
const gz = (b) => gzipSync(b, { level: 9 }).length;

// The only number worth quoting anywhere is the gzipped one: every CDN in
// front of this compresses, so raw bytes are a figure nobody actually pays.
const wire = gz(after);

console.log(`
  source     ${kb(before.length).padStart(7)}   ${kb(gz(before)).padStart(7)} gzipped
  published  ${kb(after.length).padStart(7)}   ${kb(wire).padStart(7)} gzipped   <- what customers load

  ${Math.round((1 - wire / gz(before)) * 100)}% smaller over the wire.
`);

// Guard the claim rather than the file size. "Under 6KB over the wire" is
// printed on the pricing page, in llms.txt, on the comparison pages and on a
// Product Hunt slide; a commit that quietly breaks it should fail here rather
// than turn four public pages into an overstatement nobody re-reads.
const CLAIM_BYTES = 6 * 1024;
if (wire > CLAIM_BYTES) {
  console.error(
    `  widget.js is ${kb(wire)} gzipped, over the ${kb(CLAIM_BYTES)} claimed publicly.\n` +
      `  Either trim it or update the claim everywhere it appears.\n`,
  );
  process.exit(1);
}
