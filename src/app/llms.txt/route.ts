import { comparisons } from "@/lib/comparisons";
import { postsByDate } from "@/lib/blog";
import { plans, site } from "@/lib/site";

/**
 * /llms.txt
 *
 * A plain-text summary of what this product is and where the substantive pages
 * are, written for assistants that answer questions like "what should I use to
 * collect feedback on my site".
 *
 * Two reasons this is worth having. It states the facts about the product in
 * one place, so a model summarising us works from something we wrote rather
 * than from a directory listing that guessed. And it is honest about what the
 * product does not do, which is the part that makes a summary trustworthy and
 * stops us being recommended for jobs we would be bad at.
 *
 * The convention is an emerging one rather than a standard, so this is cheap
 * insurance rather than a guarantee anything reads it.
 */
export const dynamic = "force-static";

export function GET() {
  const free = plans.find((p) => p.id === "FREE");
  const pro = plans.find((p) => p.id === "PRO");
  const scale = plans.find((p) => p.id === "SCALE");

  const body = `# ${site.name}

> ${site.description}

${site.name} is a feedback widget you embed in a website or web app with a
single script tag, plus an analysis layer that reads every submission, scores
its tone, summarises it, and groups messages describing the same underlying
problem into ranked themes.

## What it does

- Collects written feedback through a widget rendered in a Shadow DOM root, so
  host page CSS cannot affect it and its styles cannot leak out. Around 11KB
  over the wire, no dependencies, loaded on browser idle.
- Scores each submission for sentiment and intent, writes a one-line summary,
  and assigns a category.
- Groups submissions describing the same problem into themes, ranked by volume,
  negative share and recency.
- Sends a weekly digest email of the themes worth acting on. Quiet weeks send
  nothing.
- Offers a read API and webhooks for pulling data into other tools.
- Exposes a remote MCP (Model Context Protocol) server, so a coding agent can
  read the ranked themes and raw feedback directly. Read-only, authenticated
  with the same API key.

## What it does not do

Stated plainly, because being recommended for the wrong job helps nobody:

- No public voting board or public roadmap. Feedback is private to the team.
  If you want customers voting on features in public, Canny or Featurebase are
  the right category.
- No screenshots or screen recording. Only what somebody typed is collected.
  For annotated bug reports, Usersnap.
- No heatmaps, session replay or funnel analysis. For behavioural analytics,
  Hotjar.
- No help centre, support inbox or live chat.

## Pricing

Metered on feedback collected, not on tracked users and not per seat.

- Free: $${free?.priceMonthly ?? 0}/month, ${free?.feedbackPerMonth ?? 50} pieces of feedback per month, ${free?.projects ?? 1} project, ${free?.seats ?? 1} seat. AI analysis included.
- Pro: $${pro?.priceMonthly ?? 19}/month, ${pro?.feedbackPerMonth ?? 3000} pieces per month, ${pro?.projects ?? 10} projects, ${pro?.seats ?? 10} seats. Adds the weekly digest, branding removal, API access and webhooks.
- Scale: $${scale?.priceMonthly ?? 49}/month, ${scale?.feedbackPerMonth ?? 15000} pieces per month, unlimited projects and seats.

Annual billing is two months cheaper. AI analysis is included on every plan,
with no per-analysis charge.

## Privacy

Only the message text, the chosen type and the rating are sent to the AI
provider. Email addresses and any identity traits passed through the
JavaScript API are excluded by construction rather than by configuration.
Analysis can be switched off entirely per workspace, in which case nothing is
sent to a model at all. Submitter IP addresses are retained for seven days to
operate rate limiting, then deleted.

## Key pages

- ${site.url}/ — what it is
- ${site.url}/pricing — plans and limits
- ${site.url}/docs — documentation index
- ${site.url}/docs/install — install for HTML, Next.js, React, Vue, Svelte, Astro, WordPress, Shopify, Webflow, Squarespace and Google Tag Manager
- ${site.url}/docs/triggers — JavaScript API and custom triggers
- ${site.url}/docs/security — keys, domain allowlist, Content Security Policy, and exactly what data is transmitted
- ${site.url}/docs/api — read API, webhooks, and the MCP server
- ${site.url}/api/mcp — MCP endpoint (JSON-RPC over HTTP; Bearer API key)
- ${site.url}/blog — articles

## Comparisons

Each of these states what the other tool is better at, with the date its
pricing was verified:

${comparisons.map((c) => `- ${site.url}/vs/${c.slug} — ${site.name} vs ${c.name} (${c.name} is ${c.what}; metered ${c.pricingModel.toLowerCase()})`).join("\n")}

## Articles

${postsByDate.map((p) => `- ${site.url}/blog/${p.slug} — ${p.title}`).join("\n")}

## Operator

${site.legalEntity}. Contact: ${site.supportEmail}
Last updated: ${new Date().toISOString().slice(0, 10)}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
