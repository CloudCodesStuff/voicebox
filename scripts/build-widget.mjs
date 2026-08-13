/**
 * Build widget/widget.js -> public/widget.js
 *
 *   npm run build:widget          (also runs as part of `dev` and `build`)
 *
 * Files in public/ are served byte-for-byte; Next does not touch them. So the
 * widget shipped as its own commented source, and every customer paid for the
 * comments on every cold load. Two steps run here: esbuild minifies, then
 * javascript-obfuscator makes the result unreadable.
 *
 * ── What the obfuscation does, and does not, buy ──
 *
 * It hides the *source*: identifiers are mangled and string literals are moved
 * into an encoded array, so a casual "view source" reads as noise. It does NOT
 * hide *behaviour*. The widget's whole protocol is one POST to /api/ingest with
 * the message, type and rating, and that is visible in any browser's network
 * tab whatever this file looks like. So this raises the bar for reading the
 * code; it does not stop someone rebuilding a clone from watching it work, and
 * nobody should assume otherwise. There is deliberately nothing secret in here
 * to protect: the analysis that is the actual product runs on the server.
 *
 * We stay on the LIGHT setting on purpose (string array + name mangling, no
 * control-flow flattening, no self-defending wrapper). The heavier settings
 * 4-13x the file, and this script gets pasted into other companies' pages where
 * a bloated, actively-tamper-resistant blob is a normal reason for a security
 * review to reject a vendor. Light lands around where the un-minified original
 * already was, so it costs almost nothing over last week's baseline.
 *
 * The output is committed. It is generated, so that is not free, but a checkout
 * that serves a broken widget because someone ran `next dev` directly is worse
 * than a diff on a file nobody hand-edits.
 */

import { readFile, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";
import JsObf from "javascript-obfuscator";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "widget", "widget.js");
const OUT = join(root, "public", "widget.js");

/**
 * Prepended AFTER obfuscation, because the obfuscator strips comments. Someone
 * reading view-source needs a licence line and a place to ask what the widget
 * does. Deliberately NO link to the source repo: scrambling the code and then
 * linking the unscrambled original next to it defeats the point, and the repo
 * is not something to advertise from a file on every customer's page. The docs
 * page already says exactly what gets transmitted, which is the thing a
 * reviewer actually needs.
 */
const banner = `/*! Voicebox widget | (c) Arc Labs LLC | https://www.usevoicebox.dev
 * What this transmits: https://www.usevoicebox.dev/docs/security
 */`;

// Light preset. Every flag here is chosen against the size cost measured on
// this exact file; the ones left off (controlFlowFlattening, deadCodeInjection,
// selfDefending) are the ones that multiply it.
const OBFUSCATION = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  selfDefending: false, // would break if a CDN re-minifies, and bloats output
  numbersToExpressions: false,
  splitStrings: false,
  stringArray: true,
  stringArrayThreshold: 0.75,
  stringArrayEncoding: ["base64"],
  stringArrayRotate: true,
  stringArrayShuffle: true,
  identifierNamesGenerator: "mangled",
  // Leave global property names (window.Voicebox, the data-project attribute,
  // the /api/ingest path) untouched: renaming them would break the public API
  // and the host integration, and they are visible over the network anyway.
  renameGlobals: false,
  target: "browser",
};

const result = await build({
  entryPoints: [SRC],
  bundle: false,
  minify: true,
  // The widget runs on whatever the customer's visitors use, which is a much
  // wider set of browsers than the dashboard's. es2017 keeps the output plain
  // enough for anything still receiving security updates, and the source is
  // hand-written to that level anyway, so there is nothing to down-level.
  target: "es2017",
  legalComments: "none",
  logLevel: "warning",
  write: false,
});

if (result.errors.length) process.exit(1);

const minified = result.outputFiles[0].text;
const obfuscated = JsObf.obfuscate(minified, OBFUSCATION).getObfuscatedCode();
const published = `${banner}\n${obfuscated}`;

await writeFile(OUT, published, "utf8");

const source = await readFile(SRC);
const kb = (n) => (n / 1024).toFixed(1) + "KB";
const gz = (b) => gzipSync(typeof b === "string" ? Buffer.from(b) : b, { level: 9 }).length;

// The only number worth quoting anywhere is the gzipped one: every CDN in
// front of this compresses, so raw bytes are a figure nobody actually pays.
const wire = gz(published);

console.log(`
  source                ${kb(source.length).padStart(8)}   ${kb(gz(source)).padStart(8)} gzipped
  minified              ${kb(minified.length).padStart(8)}   ${kb(gz(minified)).padStart(8)} gzipped
  + obfuscated (light)  ${kb(published.length).padStart(8)}   ${kb(wire).padStart(8)} gzipped   <- what customers load
`);

// Guard the claim rather than the file size. "Around 11KB over the wire" is
// printed on the landing page, in the install docs, in llms.txt, on the
// comparison pages and on a Product Hunt slide; a commit that quietly breaks it
// should fail here rather than turn six public pages into an overstatement
// nobody re-reads. The ceiling carries headroom over the ~10.5KB the light
// preset produces today, so ordinary edits pass and a real regression (or an
// accidental jump to a heavier preset) trips it.
const CLAIM_CEILING = 13 * 1024;
if (wire > CLAIM_CEILING) {
  console.error(
    `  widget.js is ${kb(wire)} gzipped, over the ${kb(CLAIM_CEILING)} ceiling behind the\n` +
      `  "around 11KB" claim. Either trim it or update the claim everywhere it appears.\n`,
  );
  process.exit(1);
}
