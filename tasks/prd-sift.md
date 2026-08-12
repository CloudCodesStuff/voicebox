# PRD: Sift. Feedback intelligence for product teams

> **One-liner:** A beautiful widget you embed in your app to collect feedback, and an AI backend that turns hundreds of raw comments into a ranked list of exactly what to fix next.

---

## 0. Why this exists

Every product team drowns in feedback and starves for insight. Feedback arrives as a thousand unstructured sentences across a widget, support email, and app-store reviews. Someone is supposed to read all of it, remember it, and decide what matters. Nobody does. So teams either build on gut, or pay an analyst to tag spreadsheets.

Sift does two jobs that are one product:

1. **Collect**, a drop-in widget (one script tag) that looks so good teams are happy to put it in their paid product.
2. **Understand**, every submission is scored for sentiment and intent the moment it lands, and clustered into named themes across all feedback, so the dashboard answers the only question that matters: **"What should we work on next?"**

The widget is the wedge (easy to demo, easy to install, spreads by being seen). The AI insight layer is the value (why they keep paying).

### Positioning

Not "a feedback form." Not "a sentiment pie chart", sentiment alone is table stakes. The product is **theme clustering + prioritization**: turning 400 comments into *"57 users are asking for dark mode; 34 are hitting a slow-export bug; churn-risk sentiment is concentrated in your onboarding."*

**Tagline:** *Stop reading feedback. Start acting on it.*

---

## 1. Target users & personas

| Persona | Who | Job to be done | The moment they convert |
| --- | --- | --- | --- |
| **Indie founder** (primary) | Solo/small SaaS, 100–5k users | "I don't have time to read every message but I can't fly blind." | Sees the "Top themes this week" view populated from their own data. |
| **PM at a startup** | 1–3 PMs, 10–50k users | "I need to defend the roadmap with evidence, not opinions." | Exports a theme with 40 verbatim quotes into a planning doc. |
| **Design/UX lead** | Runs research on the side | "I want passive continuous feedback, not just scheduled interviews." | Sees sentiment trend dip the week after a release. |
| **Agency/freelancer** | Builds sites for clients | "I want to hand clients a feedback channel that looks like mine." | White-labels the widget per client project. |

Secondary (the flip buyer): another indie hacker evaluating whether they can grow it. They screen for: obvious payer, embeddable (sticky), AI (hot), polished, clear growth lever, cheap to run. Every decision in this PRD should keep that buyer's checklist in mind.

---

## 2. Goals & success metrics

**Product goals**
- Install to first captured feedback in under 5 minutes.
- Widget adds < 30KB gzipped to the host page and renders in < 100ms.
- Every submission has sentiment + category within 10 seconds of arrival.
- The dashboard's home screen answers "what to work on" without the user clicking anything.

**Business/flip goals**
- Looks and feels like a funded product (Resend/Linear tier), not a weekend project.
- One obvious growth lever visible to a buyer: the "Powered by Sift" widget backlink loop + programmatic SEO.
- Near-zero run cost: Postgres + DeepSeek (pennies) + Resend.

**Measurable**
- Time-to-first-feedback < 5 min (onboarding funnel).
- Widget p75 load < 100ms, bundle < 30KB gz.
- ≥ 90% of feedback auto-categorized without manual correction.
- Dashboard "Insights" view usable at 10 items and at 10,000 items.

---

## 3. Information architecture (complete sitemap)

```
PUBLIC (marketing)
  /                      Landing page (GSAP, live widget demo)
  /product/collect       Deep-dive: the widget & collection
  /product/analyze       Deep-dive: AI themes & insights
  /pricing               Plans + comparison table + FAQ
  /docs                  Docs home
  /docs/install          Install guide (script tag, React, etc.)
  /docs/customize        Widget customization reference
  /docs/api              Ingest & data API reference
  /changelog             What's new (also a widget-dogfood surface)
  /customers             (placeholder / social proof, optional)
  /terms
  /privacy
  /signin

APP (authenticated, /app)
  /app                   Overview, the "what to work on" home
  /app/inbox             Feedback inbox (list + detail drawer)
  /app/inbox/[id]        Deep link to a single feedback item
  /app/themes            Themes, clustered insights, ranked
  /app/themes/[id]       One theme: quotes, trend, linked items
  /app/trends            Sentiment & volume analytics over time
  /app/widget            Widget studio, customize + live preview + install
  /app/projects          Projects (sites) list + create
  /app/settings          Settings shell
  /app/settings/general       Org name, timezone
  /app/settings/projects      Per-project config, domains, delete
  /app/settings/team          Members + invites + roles
  /app/settings/billing       Plan, usage, Stripe portal
  /app/settings/api           API keys, webhooks
  /onboarding            First-run: create org → project → install → verify

WIDGET (public runtime)
  /widget.js             The loader script (cached, versioned)
  /w/[projectKey]        Iframe/host for the widget panel (isolated styles)
  /api/ingest            POST endpoint the widget submits to

SYSTEM
  /api/trpc/[trpc]       App API
  /api/auth/[...]        Auth.js
  /api/webhooks/stripe   Billing sync
  /api/cron/analyze      Theme clustering + digest runner
  /api/health
  /sitemap.xml /robots.txt /opengraph-image
```

---

## 4. Data model (Prisma)

```
User            id, name, email, image, createdAt
Membership      userId, orgId, role (OWNER|ADMIN|MEMBER)
Organization    id, slug, name, timezone, plan fields, stripeCustomerId
Subscription    orgId, plan, status, periodEnd, feedbackUsedThisPeriod, usageResetAt

Project         id, orgId, key (public, unguessable), name, url
                widgetConfig (Json: color, position, mode, copy, logo, triggerText)
                allowedDomains (String[])   // CORS + anti-abuse
                createdAt

Feedback        id, orgId, projectId
                body (Text)                 // the raw message
                type (IDEA|ISSUE|PRAISE|QUESTION|OTHER)  // user-chosen at capture
                rating (Int?)               // optional 1-5 or emoji scale
                email (String?)             // optional contact
                pageUrl, userAgent, locale  // context captured by widget
                metadata (Json?)            // host-passed identify() traits

                // --- AI-derived (nullable until analyzed) ---
                sentiment (POSITIVE|NEUTRAL|NEGATIVE|MIXED)?
                sentimentScore (Float?)     // -1..1
                aiCategory (String?)        // model's own intent label
                summary (String?)           // one-line normalization
                themeId (String?)           // assigned cluster
                analyzedAt (DateTime?)
                status (NEW|REVIEWED|ARCHIVED)
                createdAt

Theme           id, orgId, projectId
                title                       // "Slow CSV export"
                description                 // what it's about
                sentiment                   // dominant sentiment of the cluster
                itemCount (Int)             // denormalized for ranking
                negativeShare (Float)       // for priority scoring
                priorityScore (Float)       // itemCount x negativeShare x recency
                trend (Json)                // weekly counts for sparkline
                status (ACTIVE|RESOLVED|IGNORED)
                firstSeenAt, lastSeenAt, updatedAt

AnalysisRun     id, orgId, projectId, kind (INGEST|CLUSTER|DIGEST)
                itemsProcessed, tokensUsed, model, status, error, ranAt
                // audit + cost visibility + idempotency

ApiKey          id, orgId, name, hashedKey, lastUsedAt, createdAt
Webhook         id, orgId, url, secret, events[], active
Invite          id, orgId, email, role, token, expiresAt
```

**Rules that the code depends on**
- `orgId` on every domain row; every query scoped by session-derived org, never client input.
- `Project.key` is the only public identifier; it's unguessable and rate-limited.
- AI fields are additive and nullable, feedback is fully usable before analysis; analysis enriches.
- Ratings/scores stored raw; format only at the edges.

---

## 5. The widget (the wedge, spec in detail)

### 5.1 Design bar
Must look better than the host app it lives in. This is the single most important surface for both adoption and the flip. Reference feel: Linear's command menu, Vercel's toasts, crisp, fast, weightless.

### 5.2 Loading & isolation
- Single tag: `<script async src="https://sift.app/widget.js" data-project="pk_live_..."></script>`.
- Loader injects a **Shadow DOM** root so host CSS can never leak in or out. No iframe for the trigger (keeps it light); the panel renders in the same shadow root.
- Zero dependencies, vanilla TS, tree-shaken, target < 30KB gzipped.
- Async, non-blocking; nothing renders until idle.

### 5.3 Trigger
- Floating button (default), or attach to any element via `data-sift-trigger` selector, or programmatic `window.Sift.open()`.
- Position configurable: bottom-right / bottom-left / custom.
- Respects `prefers-reduced-motion`.

### 5.4 Capture flow (the panel)
1. **Type select**. Idea / Issue / Praise / Question (icons, one tap). Configurable which types are enabled.
2. **Message**, autosize textarea, placeholder tuned per type ("What's broken?" vs "What would you love to see?").
3. **Rating** (optional per project), 5-star or 5-emoji.
4. **Email** (optional). "Want a reply? (optional)".
5. **Screenshot** (Pro, later), optional annotated screenshot capture.
6. **Success state**, branded thank-you, subtle confetti (reduced-motion aware), auto-close.

### 5.5 Context captured silently
`pageUrl`, `userAgent`, `locale`, referrer, and any traits passed via `window.Sift('identify', { plan, userId, ... })`. Never captures keystrokes or PII beyond what the user types.

### 5.6 Customization (from Widget Studio)
Accent color, position, corner radius, light/dark/auto, trigger label, panel heading & subcopy, enabled types, rating on/off, email on/off, logo, and "remove Sift branding" (paid).

### 5.7 Ingest security
- POST to `/api/ingest` with project key.
- **Domain allowlist** per project (Origin check), rejects submissions from unlisted domains.
- Rate limit per key + per IP (token bucket, Postgres-backed, no Redis dep).
- Honeypot field + timing check for bots. No captcha (kills conversion).
- Size caps; strip/escape on render.

### 5.8 Framework snippets (docs)
Plain HTML, Next.js (Script component), React hook (`useSift`), and a programmatic API. All copy-paste.

---

## 6. AI pipeline (Vercel AI SDK + DeepSeek)

All model calls go through the **Vercel AI SDK** (`ai` + `@ai-sdk/deepseek`) using `generateObject` with Zod schemas so outputs are validated structured data, never parsed strings. Degrades gracefully: with no `DEEPSEEK_API_KEY`, feedback still ingests and displays; AI fields stay null and the UI shows "Analysis paused, add your key."

### 6.1 Stage 1, per-item enrichment (on ingest, async)
Fires right after a submission is stored. One `generateObject` call:
- **sentiment** (enum) + **sentimentScore** (-1..1)
- **aiCategory**, model's free intent label (e.g. "billing confusion")
- **summary**, one neutral sentence normalizing the message
- Prompt includes the message + type + rating; **never** the email or identify traits (privacy).
- Timeout 8s, one retry, then leave null and mark for the batch pass.

### 6.2 Stage 2, theme clustering (batched, via cron)
The differentiator. Runs on a schedule and on-demand:
1. Pull recent + unclustered feedback for a project.
2. Feed summaries (not full bodies, cheaper, tighter) to the model with existing theme titles as context, asking it to (a) assign each item to an existing theme or (b) propose a new theme.
3. Upsert themes; recompute `itemCount`, `negativeShare`, `trend`, and `priorityScore`.
4. Store an `AnalysisRun` with token usage for cost visibility.
- Idempotent via run keys; safe to re-run; clusters are stable (existing titles bias reassignment).

### 6.3 Stage 3, prioritization
`priorityScore = volume × negativeShare × recencyDecay`. This drives the "What to work on" ordering. Surfaced plainly: "34 people, mostly frustrated, in the last 2 weeks."

### 6.4 Stage 4, weekly digest (cron + Resend)
Emailed summary per project: top 3 rising themes, sentiment trend vs last week, notable verbatim quotes, and a "since you last logged in" count. This is a retention driver and a re-engagement hook.

### 6.5 Assistant query (Pro, stretch)
"Ask your feedback" box: natural-language question → SDK tool call over the feedback set → grounded answer with cited quotes. Clearly stretch; spec'd so the schema supports it.

### 6.6 Cost & guardrails
DeepSeek is ~$0.0007/short call; a heavy project (2k items/mo) costs cents. Still: per-org monthly token budget, batched clustering, summaries over full bodies, and `AnalysisRun` visibility so the buyer can see it's cheap.

---

## 7. App pages (detailed specs + user stories)

Story format: `US-###` · Description · **Acceptance criteria**. UI stories include "Verify in browser."

### 7.1 Onboarding, `/onboarding`
Guided, 4 steps, progress rail. The 5-minutes-to-value path.

**US-101 Create organization & first project**
- Org name + first project (name + site URL).
- **AC:** creates Org, OWNER membership, Project with generated `key`; redirects to install step; typecheck passes; verify in browser.

**US-102 Install the widget**
- Shows the script tag with the real project key, copy button, and framework tabs (HTML/Next/React).
- A **live "waiting for first feedback…"** state that polls and flips to success the instant a submission lands.
- **AC:** copy works; polling detects first ingest within 5s; success advances step; verify in browser.

**US-103 Seed / try it**
- "Send test feedback" button that submits sample items so the dashboard isn't empty on first view (clearly labeled test data, one-click cl:earable).
- **AC:** creates sample feedback flagged `metadata.demo=true`; dashboard renders; can be purged; verify in browser.

### 7.2 Overview, `/app` (the home; NOT just a list)
The screen that answers "what to work on" with zero clicks. Sections, top to bottom:
1. **Header stat row**, total feedback (period), sentiment split, % change vs previous period, response volume sparkline.
2. **What to work on**, top 3–5 themes by priorityScore, each a card: title, count, sentiment bar, 7-day trend sparkline, one representative quote, → theme.
3. **Sentiment trend**, area chart over selectable range (7/30/90d).
4. **Latest feedback**, 5 most recent, sentiment-tagged, → inbox.
5. **Empty state**, if no data, a strong illustrated prompt back to install.

**US-110** dashboard renders all sections with live data; range switcher works; loading skeletons; empty state; verify in browser.

### 7.3 Feedback inbox, `/app/inbox`
- Virtualized list; each row: sentiment dot, type icon, truncated body, theme chip, time, rating.
- **Filters:** type, sentiment, theme, rating, status (new/reviewed/archived), date range, search.
- **Detail drawer** (`/app/inbox/[id]`): full body, AI summary, sentiment + score, assigned theme (editable), context (page, UA, locale, identify traits), email (if given), status actions, "reply via email" (mailto/Resend).
- Bulk actions: mark reviewed, archive, reassign theme.

**US-120** list + filters + search; **US-121** detail drawer with all fields; **US-122** manual theme reassignment updates counts; **US-123** bulk actions. Each: AC + verify in browser.

### 7.4 Themes, `/app/themes`
- Ranked list of clustered themes: title, count, sentiment bar, trend sparkline, priorityScore badge, status.
- Sort by priority / volume / recency / sentiment.
- Filter active/resolved/ignored.
- **Theme detail** (`/app/themes/[id]`): description, full trend chart, sentiment breakdown, every linked feedback item, "mark resolved/ignored," export (CSV / copy quotes for a planning doc).

**US-130** ranked themes; **US-131** theme detail with linked items + export; **US-132** status changes; **US-133** "recluster now" triggers Stage 2 on demand. AC + verify.

### 7.5 Trends, `/app/trends`
- Sentiment over time (stacked area).
- Volume over time by type.
- Rating average trend (if enabled).
- Theme emergence timeline (when themes first appeared / spiked).
- Release-marker annotations (manual pins to correlate a deploy with sentiment shift).
- Range + per-project filters.

**US-140** all charts render, respond to range/project, export PNG/CSV. AC + verify.

### 7.6 Widget Studio, `/app/widget`
The customization + install surface. Two-pane: controls left, **live widget preview** right (renders the actual widget bound to config in real time).
- Controls: color, position, radius, theme (light/dark/auto), trigger text, headings/subcopy per type, enabled types, rating toggle, email toggle, logo upload, remove-branding (paid gate).
- Install panel: script tag with key, framework tabs, "test connection" ping.
- Save persists `widgetConfig`; changes reflect in live preview instantly.

**US-150** live preview reflects controls; **US-151** save persists + widget in the wild picks up config; **US-152** remove-branding gated to plan; **US-153** install snippets copy correctly. AC + verify.

### 7.7 Projects, `/app/projects`
- Grid of projects (sites); each: name, URL, feedback count, last activity.
- Create/rename/delete; switch active project (drives all other pages).

**US-160** CRUD + project switcher persists across pages. AC + verify.

### 7.8 Settings
- **General** (`/settings/general`), org name, timezone.
- **Projects** (`/settings/projects`), per-project: domains allowlist, delete, regenerate key.
- **Team** (`/settings/team`), members list, invite by email, role management (OWNER/ADMIN/MEMBER), remove.
- **Billing** (`/settings/billing`), current plan, usage meter (feedback this period), upgrade/downgrade via Stripe Checkout + portal.
- **API** (`/settings/api`), create/revoke API keys (shown once), webhook endpoints + secret + event toggles, test-fire.

**US-170..174** one story per settings page with AC + verify.

### 7.9 Plan enforcement (server-side)
- Feedback ingest beyond monthly quota: keep accepting up to a hard cap but flag over-limit and prompt upgrade (never silently drop a customer's users' feedback, that's their data). Configurable: soft warn vs hard block per plan.
- AI analysis, remove-branding, team seats, API access, webhooks, gated by plan in tRPC procedures, not just hidden UI.
- Lazy monthly usage-window reset (same pattern as prior build).

**US-180** quota + feature gates enforced server-side with clear upgrade errors; unit tests for gate + reset boundary.

---

## 8. Marketing site (Resend-level, GSAP)

### 8.1 Landing `/`
Sections, each with scroll-reveal (see §10):
1. **Hero**, headline, subcopy, primary CTA, and a **live, real Sift widget** on the page (visitors can actually submit, dogfood + demo). Word-reveal headline, parallax product visual.
2. **Logo/vertical strip**. "for SaaS, apps, agencies."
3. **Problem**. "You're drowning in feedback and guessing at priorities." Animated counter (e.g. "412 comments → 6 themes").
4. **How it works**, 3 steps: Embed → Collect → Understand. Staggered reveal.
5. **The widget**, interactive customizer preview (change color/position live).
6. **The insight layer**, animated dashboard mock: feedback flowing in → themes forming → priority list. This is the "wow."
7. **Feature grid**, sentiment, themes, trends, digest, API, white-label.
8. **Live demo**, the animated "raw comments cluster into themes" sequence, scrubbed by scroll.
9. **Pricing preview**, tiers, link to /pricing.
10. **FAQ**, accordion.
11. **Final CTA**. "Stop reading feedback. Start acting on it."
- SoftwareApplication + FAQ JSON-LD.

### 8.2 Product deep-dives
- `/product/collect`, the widget story, install simplicity, customization, security.
- `/product/analyze`, the AI story, themes, prioritization, digest.
Each is its own SEO surface with its own OG.

### 8.3 Docs `/docs/*`
- Install (HTML/Next/React/programmatic), Customize reference, API reference (ingest + data + webhooks), identify() traits.
- Clean docs layout, sidebar nav, code blocks with copy.

### 8.4 Pricing `/pricing`
- Toggle monthly/annual, 4-tier cards, full comparison table, billing FAQ.

### 8.5 Changelog `/changelog`
- Dogfood surface; also its own widget instance.

### 8.6 Legal
- Terms, Privacy. Privacy must disclose: feedback text sent to DeepSeek for analysis (outside US), that email/identify traits are NOT sent to the model, subprocessors (Vercel, Neon, Resend, DeepSeek, Stripe), and that the customer is controller / Sift is processor for their end-users' feedback.

---

## 9. Pricing (draft)

| | Free | Starter $19 | Pro $49 | Scale $99 |
| --- | --- | --- | --- | --- |
| Feedback / mo | 50 | 500 | 3,000 | 15,000 |
| Projects | 1 | 3 | 10 | Unlimited |
| Sentiment + inbox | ✓ | ✓ | ✓ | ✓ |
| AI themes & prioritization |, | ✓ | ✓ | ✓ |
| Weekly digest |, | ✓ | ✓ | ✓ |
| Remove Sift branding |, |, | ✓ | ✓ |
| API + webhooks |, |, | ✓ | ✓ |
| Team seats | 1 | 3 | 10 | Unlimited |
| Ask-your-feedback (AI query) |, |, | ✓ | ✓ |

Metered on feedback volume (tracks their scale). Annual = 2 months free. Free tier real enough to spread the widget (and the backlink).

---

## 10. Design & motion direction (Resend-level)

**Principles:** restraint, precision, speed. Lots of whitespace, one accent color, crisp typography, hairline borders, soft shadows, no gradient soup.

**Type:** display face for headings (tight tracking), clean grotesk for body, mono for data/code/metrics.

**Color:** neutral paper/ink base + a single confident accent; sentiment palette (green/amber/red) used *only* for sentiment, so it always reads. Full light/dark with `prefers-color-scheme` + manual toggle.

**GSAP motion (marketing only):**
- One gesture language, fade-up ~18px, `power2.out`, ~0.7s, runs **once**, all wrapped in `gsap.matchMedia` so reduced-motion users get final state instantly.
- `ScrollTrigger` for section reveals + staggered grids.
- Word-reveal hero headline (accessible: full string in an sr-only node, spans aria-hidden).
- One scrubbed sequence: the "comments → themes" clustering animation on the insight section.
- Count-up for the one hero statistic.
- Parallax on the hero product visual (desktop only; disabled on touch).
- Never animate on every scroll-in; never block reading.

**App UI:** calm, dense-but-legible, keyboard-friendly, skeletons over spinners, optimistic updates, toasts for confirmations. shadcn/ui as the component base, retuned to the Sift tokens.

**Widget:** the jewel, see §5.1.

---

## 11. Functional requirements (numbered)

- **FR-1** Multi-tenant: every domain row carries `orgId`; all queries scoped by session-derived org; org id never accepted from client.
- **FR-2** Widget loads via one script tag, isolates via Shadow DOM, < 30KB gz, async, non-blocking.
- **FR-3** Ingest validates project key + Origin against the project's domain allowlist, rate-limits per key/IP, and rejects bots via honeypot/timing.
- **FR-4** Feedback is stored and displayable independent of AI; analysis fields are additive.
- **FR-5** Every ingested item is enriched (sentiment, score, category, summary) via Vercel AI SDK `generateObject` with a Zod schema; failures leave nulls and are retried in the batch pass.
- **FR-6** Email and identify traits are never sent to the model.
- **FR-7** Theme clustering runs on schedule and on demand, is idempotent, reuses existing theme titles for stability, and recomputes counts/priority/trend.
- **FR-8** Priority = volume × negativeShare × recency; drives the Overview and Themes ordering.
- **FR-9** Weekly digest email per project via Resend; unsubscribe honored.
- **FR-10** Widget appearance and behavior are fully configurable from Widget Studio and reflected live in preview and in production.
- **FR-11** Plan quotas and feature gates enforced in server procedures; over-quota prompts upgrade without discarding customer data.
- **FR-12** API keys are hashed at rest, shown once; webhooks signed with a per-endpoint secret.
- **FR-13** With no DEEPSEEK_API_KEY, the app runs fully minus AI, with an explicit "analysis paused" state.
- **FR-14** All money in integer cents; all model runs logged in AnalysisRun with token usage.
- **FR-15** Marketing site renders on an empty `.env`; app features degrade per missing integration (email/AI/billing) with clear messaging.

---

## 12. Non-goals (v1)

- No native mobile SDKs (web widget only).
- No in-widget threaded conversations / support inbox (it's feedback capture, not a helpdesk).
- No public roadmap/voting board (adjacent product; don't scope-creep).
- No SSO/SAML, no SOC2 (out of scope for this tier).
- No real-time collaboration on the dashboard.
- No multi-language AI analysis tuning in v1 (accept any language in, analyze best-effort).
- No screenshot annotation in v1 (spec'd as Pro/later).

---

## 13. Technical architecture

- **Next.js 16** App Router + React 19, **tRPC 11**, **Prisma 7** (driver adapter) + Postgres (Neon), **Auth.js v5** (Google), **Tailwind 4** + shadcn/ui, **Stripe** (Billing), **Resend** + React-Email-style templates, **Vercel AI SDK** (`ai`) + **`@ai-sdk/deepseek`**, **GSAP** ScrollTrigger, **Vercel Cron** + Postgres job table for clustering & digests.
- **Widget** built as a separate vanilla-TS bundle (its own tiny build), served from `/widget.js`, versioned & cached; no React on the host page.
- Reuses the existing repo foundation (auth, tenancy pattern, env/feature-gating, marketing primitives, design tokens), retheme + reskin, not rebuild.
- Lazy env validation; feature flags via presence of keys (`features.ai`, `features.email`, `features.billing`).

---

## 14. Build sequence

1. **Core**, schema, org/project/tenancy, project keys, health.
2. **Widget + ingest**, the bundle, Shadow DOM panel, ingest endpoint with security. (Demoable.)
3. **AI Stage 1**, per-item enrichment via Vercel AI SDK + DeepSeek.
4. **Inbox**, list, filters, detail drawer.
5. **AI Stage 2/3**, clustering + prioritization + cron.
6. **Overview + Themes + Trends**, the insight surfaces.
7. **Widget Studio**, customization + live preview + install.
8. **Settings**, projects/team/API/webhooks.
9. **Billing**, plans + enforcement.
10. **Digest**, weekly Resend email.
11. **Marketing site**, landing (GSAP), product pages, docs, pricing, legal.

Phases 1–4 are the demo you can film and show a buyer. 5–6 are the "wow." 7–11 make it sellable.

---

## 15. Open questions

- Free-tier AI: give a taste (analyze first 50) or gate entirely to Starter? (Leaning: analyze everything on Free up to the 50 cap, the AI *is* the hook.)
- Widget: Shadow DOM only, or offer an iframe mode for hostile-CSS sites? (Leaning Shadow DOM v1, iframe fallback later.)
- Clustering cadence: hourly cron vs on-ingest-threshold (every N new items)? (Leaning: threshold + nightly sweep.)
- Digest: per-project or per-org rollup? (Leaning per-project, with an org rollup for owners.)
- Data retention / export on cancel: keep accessible on Free tier (don't hostage their data).
