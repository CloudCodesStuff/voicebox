import { comparisons } from "@/lib/comparisons";
import { postsByDate, getPost } from "@/lib/blog";
import { plans, site } from "@/lib/site";

/* ---------------------------------------------------------------------------
   Markdown renditions of the marketing pages, for content negotiation.

   A request with `Accept: text/markdown` on a marketing route is rewritten
   (see src/proxy.ts) to /agent-md/<path>, which serves what this module
   builds. Everything derives from the same data files the HTML renders from
   (site.ts, comparisons.ts, blog.ts), so the two representations cannot
   drift apart on facts. Pages whose substance lives in hand-written JSX
   (blog bodies, legal text) get an honest summary plus the canonical URL
   rather than a lossy re-narration.
--------------------------------------------------------------------------- */

const [free, pro, scale] = plans;

function page(title: string, body: string): string {
  return `# ${title}\n\n${body.trim()}\n\n---\nCanonical: ${site.url}\nMachine-readable: ${site.url}/llms.txt · ${site.url}/openapi.json · MCP at ${site.url}/api/mcp\n`;
}

const pricingMd = () =>
  page(
    `${site.name} pricing`,
    `Priced on feedback collected — never per seat, never per tracked user.
The analysis engine is on every plan, including Free.

| Plan | Price | Feedback/month | Scope |
|---|---|---|---|
| Free | $0 | ${free.feedbackPerMonth} | ${free.scope} |
| Pro | $${pro.priceMonthly}/mo ($${pro.priceAnnual}/yr) | ${pro.feedbackPerMonth.toLocaleString()} | ${pro.scope} |
| Scale | $${scale.priceMonthly}/mo ($${scale.priceAnnual}/yr) | ${scale.feedbackPerMonth.toLocaleString()} | Unlimited projects and seats |

Free includes: ${free.included.join("; ")}.
Pro adds: ${pro.adds.join("; ")}.
Scale adds: ${scale.adds.join("; ")}.

- What counts toward the limit: one submission. Analysis, regrouping,
  exports and dashboard use are unmetered.
- Over the limit: feedback is still accepted up to a hard ceiling; analysis
  on the excess pauses until the period resets or the plan changes.
- Cancel any time from the billing page; history is kept on the free plan.
- Annual billing costs ten months instead of twelve.

Full page: ${site.url}/pricing`,
  );

const homeMd = () =>
  page(
    `${site.name} — ${site.tagline}`,
    `${site.description}

## What it is

A feedback widget you embed with one script tag, plus an analysis layer.
The widget renders in a Shadow DOM root (~11KB gzipped, no dependencies,
loads on browser idle) and matches your site's colors, corner radius and
font automatically. Every submission is scored for sentiment, summarized,
categorized, and grouped with other submissions describing the same
underlying problem. Themes are ranked by volume, negative share and
recency: the top of the list is what to fix next.

## What it is not

No public voting board, no roadmap hosting, no screenshots or session
replay, no support inbox. Feedback is private to your team. For public
voting boards see Canny or Featurebase; ${site.name} complements or stands
alone.

## Facts

- Install: one script tag; works on ${"Next.js, React, Vue, Svelte, Rails, Laravel, Django, WordPress, Webflow, Framer, Shopify and plain HTML"}.
- Free plan: ${free.feedbackPerMonth} pieces of feedback a month, analysis included, no card.
- Paid: $${pro.priceMonthly}/mo (${pro.feedbackPerMonth.toLocaleString()}/mo) and $${scale.priceMonthly}/mo (${scale.feedbackPerMonth.toLocaleString()}/mo, unlimited projects and seats).
- MCP server on every plan: a coding agent can read ranked themes directly.
- Privacy: only the message text, type and rating reach the model. Emails
  and identify() traits are excluded by construction.

## Where to go

- Pricing: ${site.url}/pricing
- Docs: ${site.url}/docs (install: /docs/install, API + MCP: /docs/api)
- API spec: ${site.url}/openapi.json
- For agencies: ${site.url}/agencies
- About the company: ${site.url}/about · Contact: ${site.url}/contact
- Changelog: ${site.url}/changelog`,
  );

const agenciesMd = () =>
  page(
    `${site.name} for agencies and studios`,
    `One feedback widget on every client site, one dashboard for all of them.

- A project per client: its own widget key, themes and trends.
- The widget matches each client's brand automatically — no per-client
  design pass.
- From the Pro plan up the widget carries your branding, not ours.
- Scale is $${scale.priceMonthly}/mo for unlimited projects and seats:
  ten clients is $${(scale.priceMonthly / 10).toFixed(2)} per client.
- Clients don't need accounts; export CSV or send the digest.

Full page: ${site.url}/agencies`,
  );

const docsIndexMd = () =>
  page(
    `${site.name} documentation`,
    `- Install the widget (${site.url}/docs/install): one script tag; guides
  for HTML, Next.js, React, Vue, Svelte, Astro, WordPress, Shopify,
  Webflow, Squarespace, Google Tag Manager.
- Customize (${site.url}/docs/customize): brand matching, launcher shape,
  position, size, fields.
- Triggers & JS API (${site.url}/docs/triggers): open programmatically,
  identify() traits, data-voicebox-trigger.
- Security & privacy (${site.url}/docs/security): keys, domain allowlist,
  CSP, exactly what data is transmitted.
- API & MCP (${site.url}/docs/api): read API, webhooks, MCP server.
- Troubleshooting (${site.url}/docs/troubleshooting).

Machine-readable API spec: ${site.url}/openapi.json`,
  );

const docsApiMd = () =>
  page(
    `${site.name} API, webhooks and MCP`,
    `## Read API (Pro plan and above)

Base URL ${site.url}/api/v1 · Auth: \`Authorization: Bearer sk_...\`
(create keys in Settings → Developers; shown once). Rate limit 120
requests/minute per key. Read-only — the widget writes feedback, the API
never does. Errors are JSON: \`{ "error": { "code", "message" } }\`.

- GET /api/v1/projects — all projects (operationId listProjects)
- GET /api/v1/feedback — newest first, cursor-paginated; filters: project_id,
  status, type, sentiment, since (listFeedback)
- GET /api/v1/feedback/{id} — one item (getFeedbackItem)
- GET /api/v1/themes — ranked by priority, highest first (listThemes)

OpenAPI 3.1 spec: ${site.url}/openapi.json

## MCP server (every plan, including Free)

Streamable HTTP endpoint at ${site.url}/api/mcp, authenticated with the
same Bearer API key. Read-only tools over projects, feedback and themes,
so a coding agent can pull the ranked fix list directly.

## Webhooks (Pro plan and above)

Configured in Settings → Developers; signed payloads on new feedback and
theme changes.

Full docs: ${site.url}/docs/api`,
  );

const aboutMd = () =>
  page(
    `About ${site.name}`,
    `${site.name} is built and operated by ${site.legalEntity}, a New Jersey
company. One product: a feedback widget plus an analysis engine that turns
raw user feedback into a ranked list of what to fix. Support:
${site.supportEmail}. Full page: ${site.url}/about`,
  );

const contactMd = () =>
  page(
    `Contact ${site.name}`,
    `- Support and everything else: ${site.supportEmail} (a human founder
  reads it; replies typically within one business day)
- X: ${site.twitter}
- Security reports: ${site.supportEmail} with "security" in the subject.
- Legal entity: ${site.legalEntity}. Notice is served by email, per the
  Terms (${site.url}/terms).

Full page: ${site.url}/contact`,
  );

/** Pages whose full text is only in JSX get a pointer, not a re-narration. */
const stub = (title: string, path: string, summary: string) =>
  page(title, `${summary}\n\nFull text: ${site.url}${path}`);

export function pageMarkdown(path: string): string | null {
  const p = path.replace(/\/+$/, "") || "/";

  switch (p) {
    case "/":
      return homeMd();
    case "/pricing":
      return pricingMd();
    case "/agencies":
      return agenciesMd();
    case "/docs":
      return docsIndexMd();
    case "/docs/api":
      return docsApiMd();
    case "/about":
      return aboutMd();
    case "/contact":
      return contactMd();
    case "/docs/install":
      return stub(
        "Install the Voicebox widget",
        p,
        "One script tag before </body>. Platform guides for HTML, Next.js, React, Vue, Svelte, Astro, WordPress, Shopify, Webflow, Squarespace and Google Tag Manager. The widget is ~11KB gzipped, dependency-free, loads on idle, renders in a Shadow DOM root.",
      );
    case "/docs/customize":
      return stub(
        "Customize the widget",
        p,
        "Brand matching reads your site's colors, corner radius and font automatically; every part is overridable — launcher shape, icon, size, position, offset, fields, copy.",
      );
    case "/docs/triggers":
      return stub(
        "Triggers and the JavaScript API",
        p,
        "Open the widget from your own UI with data-voicebox-trigger or window.voicebox.open(); attach account traits with identify() (traits never reach the model).",
      );
    case "/docs/security":
      return stub(
        "Security and privacy",
        p,
        "Publishable widget key vs secret API key, domain allowlist, CSP directives, and exactly which fields are transmitted and stored. Only body, type and rating reach the analysis model.",
      );
    case "/docs/troubleshooting":
      return stub(
        "Troubleshooting",
        p,
        "Widget not appearing, domain allowlist mismatches, CSP blocks, ad blockers, and how to verify the embed with curl.",
      );
    case "/changelog":
      return stub(
        `${site.name} changelog`,
        p,
        "Dated releases of what shipped, most recent first.",
      );
    case "/privacy":
      return stub(`${site.name} privacy policy`, p, "What is collected, what reaches the AI model (message text, type, rating — never emails or traits), retention windows, and every subprocessor.");
    case "/terms":
      return stub(`${site.name} terms of service`, p, `The contract with ${site.legalEntity}, governed by the law of ${site.governingLaw}.`);
    case "/dpa":
      return stub(`${site.name} data processing addendum`, p, "Processor terms, subprocessor list and international transfer posture, incorporated into the Terms for customers who need a DPA.");
    case "/vs":
      return page(
        `${site.name} comparisons`,
        comparisons
          .map((c) => `- ${site.url}/vs/${c.slug} — vs ${c.name}: ${c.what}`)
          .join("\n"),
      );
    case "/blog":
      return page(
        `${site.name} blog`,
        postsByDate
          .map((post) => `- ${site.url}/blog/${post.slug} — ${post.title} (${post.category}, updated ${post.updated})`)
          .join("\n"),
      );
  }

  const vs = /^\/vs\/([a-z0-9-]+)$/.exec(p);
  if (vs) {
    const c = comparisons.find((x) => x.slug === vs[1]);
    if (!c) return null;
    return page(
      c.title,
      `${c.name} is ${c.what}. ${c.description}

## ${c.name} pricing (verified ${c.verifiedOn})

Metered: ${c.pricingModel}. ${c.pricingDetail}

## ${c.name} is better at

${c.theyreBetterAt.map((s) => `- ${s}`).join("\n")}

## ${site.name} does differently

${c.weDoDifferently.map((s) => `- ${s}`).join("\n")}

Pick ${c.name} if: ${c.pickThemIf}
Pick ${site.name} if: ${c.pickUsIf}

Full page: ${site.url}/vs/${c.slug}`,
    );
  }

  const blog = /^\/blog\/([a-z0-9-]+)$/.exec(p);
  if (blog) {
    const post = getPost(blog[1]);
    if (!post) return null;
    return stub(
      post.title,
      p,
      `${post.description} (${post.category}; published ${post.published}, updated ${post.updated}; ~${post.readingMinutes} min.)`,
    );
  }

  return null;
}

/** The markdown body a lost agent gets with a 404. */
export function notFoundMarkdown(path: string): string {
  return `# 404 — nothing at ${path}

That path doesn't exist on ${site.url}. Where to look instead:

- Site map: ${site.url}/sitemap.xml
- Orientation for agents: ${site.url}/llms.txt
- Docs index: ${site.url}/docs
- API spec: ${site.url}/openapi.json
- Pricing: ${site.url}/pricing
`;
}
