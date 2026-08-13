/**
 * Product Hunt gallery + thumbnail.
 *
 *   node scripts/product-hunt-images.mjs
 *
 * Writes PNGs to marketing/product-hunt/. Re-runnable; overwrites in place.
 *
 * Why generated rather than drawn by hand: every colour below is lifted from
 * src/app/globals.css and every number from what the product actually produces,
 * so when a token moves or a price changes, this regenerates instead of quietly
 * going stale on a listing nobody re-reads. Marketing images that disagree with
 * the product are the cheapest possible way to look untrustworthy.
 *
 * Rendering is SVG through sharp (already a dependency, for the OG route). That
 * fixes the output at exactly 1270x760, which is Product Hunt's gallery size, so
 * nothing is up- or down-scaled on the way in.
 *
 * Type is Helvetica Neue and Menlo rather than the app's Inter and JetBrains
 * Mono. sharp rasterises through the system font stack and neither webfont is
 * installed here; Helvetica is the neo-grotesque Inter descends from, so the
 * register holds. If these ever need to be pixel-identical to the UI, render
 * them in a browser instead.
 */

import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "marketing", "product-hunt");

const W = 1270;
const H = 760;
const M = 76; // outer margin, held on every slide

/* Tokens, copied from globals.css. ------------------------------------- */
const C = {
  slab: "#0a0d0c",
  slabRaise: "#111615", // a card on the dark ground
  slabLine: "#212b28",
  slabFg: "#ecf1ef",
  slabMuted: "#9fada7",
  slabSubtle: "#6d7c76",

  paper: "#ffffff",
  subtle: "#fafafa",
  sunken: "#f4f4f5",
  ink: "#09090b",
  muted: "#62626b",
  faint: "#8f8f98",
  line: "#ebebed",
  lineStrong: "#dcdce0",

  mint: "#00c48c", // fills and graphics
  mintDeep: "#00785a", // 5.4:1 on white, safe as text
  mintBright: "#00e5a0", // the dark-ground accent
  mintWash: "#e6f9f1",
  mintLine: "#b4ead8",
  mintInk: "#04231b", // the only text colour allowed on a mint fill, 7.4:1

  negative: "#d33c33",
  negativeWash: "#fdeceb",
  mixed: "#b0770e",
  positiveWash: "#e6f9f1",
};

const SANS = "Helvetica Neue";
const MONO = "Menlo";

/* Primitives. ----------------------------------------------------------- */

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function text(x, y, s, o = {}) {
  const {
    size = 18,
    weight = 400,
    fill = C.ink,
    family = SANS,
    track = 0,
    anchor = "start",
    opacity = 1,
  } = o;
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" letter-spacing="${track}" text-anchor="${anchor}" opacity="${opacity}">${esc(s)}</text>`;
}

/** Stacked lines with a fixed leading. Copy is hand-broken, never auto-wrapped. */
function lines(x, y, arr, o = {}) {
  const lead = o.lead ?? (o.size ?? 18) * 1.45;
  return arr.map((s, i) => text(x, y + i * lead, s, o)).join("");
}

/** The uppercase micro-label the app uses for column headers. */
const label = (x, y, s, o = {}) =>
  text(x, y, s.toUpperCase(), {
    size: 12,
    weight: 500,
    track: 1.5,
    fill: C.faint,
    ...o,
  });

const rect = (x, y, w, h, o = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 0}" fill="${o.fill ?? "none"}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw ?? 1}"` : ""}${o.opacity ? ` opacity="${o.opacity}"` : ""}/>`;

const hairline = (x1, y, x2, stroke = C.line) =>
  `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${stroke}" stroke-width="1"/>`;

/**
 * The mark: three bars narrowing downward. Many comments in, few themes out.
 * Same path as src/components/marketing/brand.tsx, scaled.
 */
function mark(x, y, size, color) {
  const s = size / 24;
  return `<g transform="translate(${x} ${y}) scale(${s})" stroke="${color}" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M3 5h18M6 12h12M10 19h4"/></g>`;
}

/** Shared chrome, so the six read as one deck rather than six posters. */
function frame(index, footer, dark) {
  const fg = dark ? C.slabFg : C.ink;
  const dim = dark ? C.slabSubtle : C.faint;
  const rule = dark ? C.slabLine : C.line;
  return [
    mark(M, 42, 22, dark ? C.mintBright : C.mintDeep),
    text(M + 32, 60, "Voicebox", { size: 17, weight: 700, fill: fg, track: -0.3 }),
    text(W - M, 60, `${index} / 6`, {
      size: 13,
      family: MONO,
      fill: dim,
      anchor: "end",
    }),
    hairline(M, 88, W - M, rule),
    hairline(M, H - 88, W - M, rule),
    text(M, H - 56, footer, { size: 14, fill: dim }),
    text(W - M, H - 56, "usevoicebox.dev", {
      size: 14,
      fill: dark ? C.mintBright : C.mintDeep,
      anchor: "end",
    }),
  ].join("");
}

const svg = (body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${bg}"/>${body}</svg>`;

/* ----------------------------------------------------------------------
   1. Hero. One job: say what this is before anyone decides to scroll on.
---------------------------------------------------------------------- */
function slide1() {
  // The mark itself, blown up to fill the right half. Drawn through the same
  // helper rather than as three hand-placed bars: bars positioned by hand read
  // as a staircase, because what makes this shape legible is that all three are
  // centred on one axis and narrow toward it.
  const wash = `<g opacity="0.24">${mark(790, 210, 400, C.mint)}</g>`;

  return svg(
    [
      wash,
      frame(1, "Free for 50 pieces of feedback a month, AI included.", true),
      text(M, 210, "FEEDBACK, GROUPED", {
        size: 13,
        family: MONO,
        fill: C.mintBright,
        track: 2.4,
      }),
      lines(
        M,
        320,
        ["Feedback in.", "Fix list out."],
        { size: 104, weight: 700, fill: C.slabFg, track: -4.5, lead: 108 },
      ),
      lines(
        M,
        500,
        [
          "A widget you install with one script tag, and an AI",
          "that turns every reply into a ranked list of what to",
          "fix next. Not an inbox you keep meaning to read.",
        ],
        { size: 25, fill: C.slabMuted, lead: 40 },
      ),
    ].join(""),
    C.slab,
  );
}

/* ----------------------------------------------------------------------
   2. The transformation. The one idea the whole product rests on, so it
   gets the most literal possible picture: the wall on the left is what
   arrives, the short list on the right is what you read.
---------------------------------------------------------------------- */
function slide2() {
  const colY = 252;
  const barH = 9;
  const gap = 15;
  // Deterministic widths: a random-looking wall that regenerates identically.
  // Count is set by the frame, not by taste: any more and the stack runs under
  // the footer rule, which reads as a bug rather than as "it keeps going".
  const widths = [
    218, 262, 176, 244, 199, 271, 152, 236, 208, 189, 255, 167, 229, 246, 181,
  ];

  const wall = [
    widths
      .map((w, i) =>
        rect(M, colY + i * (barH + gap), w, barH, {
          r: 4,
          fill: C.lineStrong,
          opacity: 0.85,
        }),
      )
      .join(""),
    text(M, colY + widths.length * (barH + gap) + 26, "+ 385 more", {
      size: 15,
      family: MONO,
      fill: C.faint,
    }),
  ].join("");

  const themes = [
    ["Onboarding leaves people stuck", 5, C.negative],
    ["The dashboard is slow to load", 5, C.negative],
    ["Mobile layout breaks", 7, C.negative],
    ["Export to CSV or Excel", 7, C.mint],
    ["Slack and Zapier", 4, C.mint],
    ["Praise", 5, C.mint],
  ];

  const rightX = 700;
  const rowH = 76;
  const list = themes
    .map(([title, n, dot], i) => {
      const y = colY + i * rowH;
      return [
        rect(rightX, y - 22, W - M - rightX, 60, {
          r: 10,
          fill: C.paper,
          stroke: C.line,
        }),
        `<circle cx="${rightX + 26}" cy="${y + 8}" r="5" fill="${dot}"/>`,
        text(rightX + 46, y + 14, title, { size: 18, weight: 500, fill: C.ink }),
        text(W - M - 24, y + 15, String(n), {
          size: 22,
          weight: 700,
          fill: C.ink,
          family: MONO,
          anchor: "end",
        }),
      ].join("");
    })
    .join("");

  return svg(
    [
      frame(2, "Grouped on the problem underneath, not on keywords.", false),
      text(M, 168, "400 messages. Six things to fix.", {
        size: 48,
        weight: 700,
        track: -1.8,
      }),
      label(M, 218, "What arrives"),
      label(rightX, 218, "What you read"),
      wall,
      // The mark, at the pinch point between the two columns.
      mark(500, 420, 120, C.mint),
      text(560, 560, "grouped", {
        size: 14,
        family: MONO,
        fill: C.faint,
        anchor: "middle",
      }),
      list,
    ].join(""),
    C.subtle,
  );
}

/* ----------------------------------------------------------------------
   3. The ranked list, drawn the way the app draws it. Titles and numbers
   below are verbatim output from a real run, not written for the slide.
---------------------------------------------------------------------- */
function slide3() {
  const rows = [
    {
      title: "Improve onboarding and initial guidance",
      body: "Users struggle with empty screens, setup flow confusion, and difficulty discovering features.",
      n: 5,
      neg: 1.0,
      seen: "2d ago",
      trend: [0, 0, 0, 1, 1, 2, 4, 3],
      tone: "Negative",
    },
    {
      title: "Speed up loading and enhance search",
      body: "Slow loading on dashboards, reports and filters, plus no typo tolerance in search.",
      n: 5,
      neg: 1.0,
      seen: "1d ago",
      trend: [0, 0, 1, 1, 0, 2, 3, 4],
      tone: "Negative",
    },
    {
      title: "Improve mobile usability and customization",
      body: "Theming issues, mobile layout problems, and requests for dark mode and date defaults.",
      n: 7,
      neg: 0.57,
      seen: "3d ago",
      trend: [0, 1, 0, 2, 2, 1, 3, 2],
      tone: "Negative",
    },
    {
      title: "Expand data export and integrations",
      body: "Requests for CSV and Excel export, plus Slack, Zapier and API access.",
      n: 7,
      neg: 0.14,
      seen: "2d ago",
      trend: [0, 0, 1, 1, 2, 1, 3, 4],
      tone: "Positive",
    },
  ];

  const cardX = M;
  const cardW = W - M * 2;
  const cardH = 100;
  const top = 210;

  const card = (r, i) => {
    const y = top + i * (cardH + 10);
    const toneNeg = r.tone === "Negative";
    const badgeW = toneNeg ? 74 : 68;
    // Helvetica semibold runs ~0.52em per glyph, which is close enough to sit
    // a badge after a known title. Only ever used for that.
    const titleEnd = cardX + 26 + r.title.length * 9.9;

    // Sparkline, drawn from the trend the theme actually carries.
    const sw = 84;
    const sh = 24;
    const sx = cardW + cardX - 232;
    const sy = y + 30;
    const max = Math.max(...r.trend, 1);
    const pts = r.trend
      .map(
        (v, k) =>
          `${sx + (k / (r.trend.length - 1)) * sw},${sy + sh - (v / max) * sh}`,
      )
      .join(" ");

    // Sentiment bar. The app builds this out of flex children whose shares can
    // sum past 1 (neutral floors at zero while positive stays at 0.12), and
    // flex quietly absorbs that. Drawing it by hand does not, so normalise:
    // at 100% negative the untreated version overran its own track by 12%
    // and printed the label on top of itself.
    const barW = 240;
    const pos = 0.12;
    const neu = Math.max(0, 1 - r.neg - pos);
    const totalShare = r.neg + neu + pos;
    const negW = Math.round((barW * r.neg) / totalShare);
    const neuW = Math.round((barW * neu) / totalShare);
    const posW = barW - negW - neuW;

    return [
      rect(cardX, y, cardW, cardH, { r: 12, fill: C.paper, stroke: C.line }),
      text(cardX + 24, y + 32, r.title, { size: 19, weight: 600, fill: C.ink }),
      rect(titleEnd, y + 16, badgeW, 22, {
        r: 11,
        fill: toneNeg ? C.negativeWash : C.positiveWash,
      }),
      text(titleEnd + badgeW / 2, y + 31, r.tone, {
        size: 12,
        weight: 500,
        fill: toneNeg ? C.negative : C.mintDeep,
        anchor: "middle",
      }),
      text(cardX + 24, y + 56, r.body, { size: 14.5, fill: C.muted }),

      `<polyline points="${pts}" fill="none" stroke="${C.faint}" stroke-width="1.6" stroke-linejoin="round"/>`,
      text(cardX + cardW - 24, y + 38, String(r.n), {
        size: 26,
        weight: 700,
        fill: C.ink,
        anchor: "end",
      }),
      label(cardX + cardW - 24, y + 56, "items", { anchor: "end", size: 11 }),

      rect(cardX + 24, y + 76, negW, 6, { r: 3, fill: C.negative }),
      rect(cardX + 24 + negW, y + 76, neuW, 6, { fill: C.lineStrong }),
      rect(cardX + 24 + negW + neuW, y + 76, posW, 6, { r: 3, fill: C.mint }),
      text(cardX + 24 + barW + 18, y + 84, `${Math.round(r.neg * 100)}% negative`, {
        size: 12.5,
        fill: C.muted,
        family: MONO,
      }),
      text(cardX + cardW - 24, y + 84, `last seen ${r.seen}`, {
        size: 12.5,
        fill: C.faint,
        family: MONO,
        anchor: "end",
      }),
    ].join("");
  };

  return svg(
    [
      frame(3, "Ranked by volume, negative share and recency. Arithmetic you can check.", false),
      text(M, 150, "Sorted by what actually needs fixing.", {
        size: 42,
        weight: 700,
        track: -1.5,
      }),
      text(M, 182, "Real output. Nobody tagged, merged or triaged anything.", {
        size: 17,
        fill: C.muted,
      }),
      rows.map(card).join(""),
    ].join(""),
    C.subtle,
  );
}

/* ----------------------------------------------------------------------
   4. Install. The objection this answers is "how long will this take me".
---------------------------------------------------------------------- */
function slide4() {
  // One <text> with coloured <tspan> children, so the runs flow. An earlier
  // version positioned each run at a computed x using Menlo's advance width;
  // the rounding error accumulated left to right until words collided at the
  // start of the line and the closing tag pushed out through the slab.
  const snippet = [
    ["&lt;script", C.mintBright],
    [" async src=", C.slabMuted],
    ['"https://www.usevoicebox.dev/widget.js"', C.slabFg],
    [" data-project=", C.slabMuted],
    ['"pk_4Kd9RtYw2Bx7LmQz"', C.slabFg],
    ["&gt;&lt;/script&gt;", C.mintBright],
  ];
  // xml:space="preserve" is load-bearing: without it the renderer strips the
  // leading space from each tspan and the snippet comes out as "<scriptasync".
  const code = `<text xml:space="preserve" x="${M + 36}" y="${358}" font-family="${MONO}" font-size="17" fill="${C.slabFg}">${snippet
    .map(([t, c]) => `<tspan fill="${c}">${t}</tspan>`)
    .join("")}</text>`;

  const facts = [
    ["5.9KB", "over the wire, gzipped"],
    ["0", "dependencies, no build step"],
    ["Shadow DOM", "your CSS and ours never meet"],
  ];

  const colW = (W - M * 2) / 3;
  const factRow = facts
    .map(([big, small], i) => {
      const x = M + i * colW;
      return [
        hairline(x, 490, x + colW - 40, C.slabLine),
        text(x, 544, big, { size: 34, weight: 700, fill: C.mintBright, track: -1 }),
        text(x, 576, small, { size: 15, fill: C.slabMuted }),
      ].join("");
    })
    .join("");

  return svg(
    [
      frame(4, "HTML, Next.js, React, Vue, Svelte, Astro, WordPress, Shopify, Webflow, GTM.", true),
      text(M, 176, "One script tag. Four minutes.", {
        size: 48,
        weight: 700,
        fill: C.slabFg,
        track: -1.8,
      }),
      text(M, 212, "No package to install, and nothing that blocks your page.", {
        size: 18,
        fill: C.slabMuted,
      }),
      rect(M, 310, W - M * 2, 76, { r: 12, fill: C.slabRaise, stroke: C.slabLine }),
      code,
      factRow,
    ].join(""),
    C.slab,
  );
}

/* ----------------------------------------------------------------------
   5. The widget itself, drawn the way it renders. This is the only part of
   the product a customer's users ever see, so it earns a slide.
---------------------------------------------------------------------- */
function slide5() {
  const px = 700;
  const py = 196;
  const pw = 380;
  const ph = 464;

  const types = ["Idea", "Issue", "Praise", "Question"];
  const typeGrid = types
    .map((t, i) => {
      const col = i % 2;
      const row = (i / 2) | 0;
      const bw = (pw - 48 - 8) / 2;
      const x = px + 24 + col * (bw + 8);
      const y = py + 92 + row * 42;
      const active = i === 1;
      return [
        rect(x, y, bw, 34, {
          r: 8,
          fill: active ? C.mintWash : C.paper,
          stroke: active ? C.mint : C.line,
        }),
        text(x + bw / 2, y + 22, t, {
          size: 14,
          weight: active ? 600 : 400,
          fill: active ? C.mintDeep : C.muted,
          anchor: "middle",
        }),
      ].join("");
    })
    .join("");

  const stars = Array.from({ length: 5 }, (_, i) => {
    const on = i < 4;
    const cx = px + 34 + i * 32;
    return `<path transform="translate(${cx - 11} ${py + 210}) scale(0.92)" d="M12 2l2.9 6.1 6.6.9-4.8 4.7 1.2 6.6L12 17.2 6.1 20.3l1.2-6.6L2.5 9l6.6-.9z" fill="${on ? C.mint : "none"}" stroke="${on ? C.mint : C.lineStrong}" stroke-width="1.4" stroke-linejoin="round"/>`;
  }).join("");

  // The submit button belongs inside the panel: in the real widget the body
  // scrolls and the action stays pinned to the bottom of the same surface.
  const panel = [
    rect(px, py, pw, ph, { r: 14, fill: C.paper, stroke: C.lineStrong }),
    text(px + 24, py + 44, "Share your feedback", { size: 19, weight: 700 }),
    text(px + 24, py + 68, "We read every one of these.", { size: 14, fill: C.muted }),
    typeGrid,
    label(px + 24, py + 200, "How was it?"),
    stars,
    rect(px + 24, py + 244, pw - 48, 88, { r: 10, fill: C.subtle, stroke: C.line }),
    text(px + 38, py + 270, "What went wrong?", { size: 14, fill: C.faint }),
    rect(px + 24, py + 344, pw - 48, 38, { r: 10, fill: C.paper, stroke: C.line }),
    text(px + 38, py + 368, "you@company.com  (optional)", { size: 13.5, fill: C.faint }),
    rect(px + 24, py + 396, pw - 48, 46, { r: 10, fill: C.mint }),
    text(px + pw / 2, py + 425, "Send feedback", {
      size: 15,
      weight: 600,
      fill: C.mintInk,
      anchor: "middle",
    }),
  ].join("");

  const controls = [
    ["Accent colour", "any hex you like"],
    ["Heading and prompt", "your words, not ours"],
    ["Which questions", "type, rating, email, each optional"],
    ["Corner radius", "0 to 24"],
    ["Light, dark or auto", "follows the host page"],
  ]
    .map(([k, v], i) => {
      const y = 254 + i * 76;
      return [
        text(M, y, k, { size: 18, weight: 600 }),
        text(M, y + 24, v, { size: 15, fill: C.muted }),
      ].join("");
    })
    .join("");

  return svg(
    [
      frame(5, "Renders in a Shadow DOM root, so host CSS cannot reach in and nothing leaks out.", false),
      text(M, 168, "It looks like your site, not ours.", {
        size: 42,
        weight: 700,
        track: -1.5,
      }),
      controls,
      panel,
    ].join(""),
    C.subtle,
  );
}

/* ----------------------------------------------------------------------
   6. Pricing. The wedge: this is the reason people leave the incumbents.
---------------------------------------------------------------------- */
function slide6() {
  const plans = [
    { name: "Free", price: "$0", vol: "50 a month", scope: "1 project, 1 seat", note: "AI included" },
    { name: "Pro", price: "$19", vol: "3,000 a month", scope: "10 projects, 10 seats", note: "Digest, API, webhooks" },
    { name: "Scale", price: "$49", vol: "15,000 a month", scope: "Unlimited projects and seats", note: "Priority support" },
  ];

  const cw = (W - M * 2 - 24 * 2) / 3;
  const cy = 300;
  const ch = 250;

  const cards = plans
    .map((p, i) => {
      const x = M + i * (cw + 24);
      const featured = i === 1;
      return [
        rect(x, cy, cw, ch, {
          r: 14,
          fill: featured ? C.slabRaise : "none",
          stroke: featured ? C.mintBright : C.slabLine,
        }),
        text(x + 28, cy + 44, p.name, {
          size: 16,
          weight: 600,
          fill: featured ? C.mintBright : C.slabMuted,
        }),
        text(x + 28, cy + 106, p.price, {
          size: 52,
          weight: 700,
          fill: C.slabFg,
          track: -2,
        }),
        text(x + 28 + (p.price.length * 30), cy + 106, "/mo", {
          size: 17,
          fill: C.slabSubtle,
        }),
        hairline(x + 28, cy + 134, x + cw - 28, C.slabLine),
        text(x + 28, cy + 168, p.vol, { size: 17, weight: 500, fill: C.slabFg }),
        text(x + 28, cy + 196, p.scope, { size: 15, fill: C.slabMuted }),
        text(x + 28, cy + 222, p.note, { size: 15, fill: C.slabMuted }),
      ].join("");
    })
    .join("");

  return svg(
    [
      frame(6, "No public voting board. If that is what you need, Canny and Featurebase do it properly.", true),
      text(M, 176, "Priced on feedback, not on people.", {
        size: 48,
        weight: 700,
        fill: C.slabFg,
        track: -1.8,
      }),
      lines(
        M,
        216,
        [
          "Metering on tracked users means a good month costs you money. Adding a",
          "teammate who just wants to read the inbox should not change the bill either.",
        ],
        { size: 18, fill: C.slabMuted, lead: 28 },
      ),
      cards,
      text(M, 610, "AI analysis on every plan, including free. Annual is two months off.", {
        size: 17,
        fill: C.mintBright,
      }),
    ].join(""),
    C.slab,
  );
}

/* ----------------------------------------------------------------------
   Thumbnail. Shown at roughly 48px in the feed, so it is the mark and
   nothing else. Any word set here would render as a smudge.
---------------------------------------------------------------------- */
function thumbnail() {
  const S = 512;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <rect width="${S}" height="${S}" fill="${C.slab}"/>
  <g stroke="${C.mintBright}" stroke-width="34" stroke-linecap="round" fill="none">
    <path d="M96 168h320"/>
    <path d="M160 256h192"/>
    <path d="M224 344h64"/>
  </g>
</svg>`;
}

/* --------------------------------------------------------------------- */

const files = [
  ["01-hero.png", slide1()],
  ["02-what-it-does.png", slide2()],
  ["03-ranked-themes.png", slide3()],
  ["04-install.png", slide4()],
  ["05-widget.png", slide5()],
  ["06-pricing.png", slide6()],
  ["thumbnail.png", thumbnail()],
];

await mkdir(OUT, { recursive: true });

for (const [name, body] of files) {
  await sharp(Buffer.from(body)).png({ compressionLevel: 9 }).toFile(join(OUT, name));
  console.log(`  ${name}`);
}

console.log(`\n${files.length} files in marketing/product-hunt/\n`);
