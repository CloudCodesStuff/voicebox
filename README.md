# Voicebox

**Stop reading feedback. Start acting on it.**

An embeddable feedback widget plus an AI backend that turns hundreds of
scattered comments into a short, ranked list of exactly what to fix next.

The widget is the wedge, one script tag, Shadow DOM isolated, under 30KB.
The theme clustering is the value: sentiment alone is a pie chart, but
*"34 people are hitting the CSV export timeout, and they're angry"* is a roadmap.

---

## Quick start

```bash
npm install
cp .env.example .env      # fill in the CORE block
npm run env:check         # tells you exactly what's missing and where to get it
npm run db:push           # create the schema
npm run db:seed           # 25 realistic, clusterable feedback items
npm run analyze           # score + cluster them with DeepSeek
npm run dev
```

The marketing site runs with an **empty `.env`**, `npm run dev` and
<http://localhost:3000> works before you configure anything.

**Google OAuth redirect URI** (people always miss this one):
`http://localhost:3000/api/auth/callback/google`

## Testing the widget locally

```bash
npm run keys              # prints the install snippet for every project
npm run playground        # a foreign-origin host page on :3001
```

The playground runs on a different port on purpose. Loading the widget from a
page the app itself serves proves almost nothing: same origin, no preflight, no
allowlist check. Port 3001 exercises the path a real customer's site takes.
There's a hostile-CSS toggle on it too (`button { background: red !important }`
and friends); if the widget doesn't flinch, Shadow DOM isolation is working.

## Checking the API

```bash
npm run smoke:api         # needs the dev server running
```

Mints a temporary key against the database, exercises every `/api/v1` endpoint
over HTTP, checks that auth failures fail, that internal metadata is stripped,
that webhook signatures verify and tampered ones don't, then revokes the key
and deletes it.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run typecheck` / `lint` | `tsc --noEmit` / ESLint |
| `npm run env:check` | Environment doctor |
| `npm run db:push` / `db:migrate` / `db:studio` | Schema |
| `npm run db:seed` | Seed a demo org with clusterable feedback |
| `npm run analyze` | Run sentiment + clustering over every project |
| `npm run keys` | Print each project's install snippet |
| `npm run playground` | Cross-origin widget test page on :3001 |
| `npm run seed:owner` | Seed a real owned workspace (set `OWNER_EMAIL`) |
| `npm run inspect` | Last analysis runs, token spend, and errors |
| `npm run smoke:api` | End-to-end check of `/api/v1` and webhook signing |
| `npm run refresh:widget` | Backfill widget config defaults onto old projects |

## Stack

- **Next.js 16** (App Router) + React 19 · **tRPC 11** · **Prisma 7** + Postgres
- **Tailwind 4** + shadcn/ui · **Auth.js v5** (Google) · **Stripe** · **Resend**
- **Vercel AI SDK** → **DeepSeek** (`deepseek-v4-flash`) · **GSAP** ScrollTrigger
- Widget: vanilla TS, zero dependencies, no build step

> **Prisma 7 note.** The connection URL is no longer in `schema.prisma`. The CLI
> reads it from `prisma.config.ts`; the app supplies it at runtime through a
> driver adapter in `src/server/db.ts`.

## Architecture

```
src/
  app/
    (marketing)/       landing, product pages, docs, pricing, changelog, legal
    app/               dashboard, overview, inbox, themes, trends, widget, settings
    onboarding/        create org → install → live "waiting for first feedback"
    invite/[token]/    where an invite email lands
    api/
      ingest/          the widget's only endpoint (all the security lives here)
      widget/[key]/    public runtime config
      v1/              the read API: feedback, themes, projects
      cron/analyze/    hourly enrichment retry + threshold-driven clustering
      cron/digest/     the Monday morning email
  server/
    ai/analyze.ts      prompts + schemas (Vercel AI SDK generateObject)
    ai/pipeline.ts     orchestration, model output → database state
    trpc/init.ts       context + procedures (the tenant boundary)
    lib/plan.ts        plan limits and feature gates
    lib/api-auth.ts    bearer keys for /api/v1
    lib/api-shapes.ts  every field the public API is allowed to return
    lib/webhooks.ts    HMAC signing and delivery
    lib/emails/        invite and digest templates
  components/
    marketing/         motion primitives, product visuals, docs, legal
    app/               dashboard primitives, charts, project context
public/widget.js       the embeddable runtime
```

### Four rules the code depends on

**1. Tenancy is resolved server-side, never accepted from the client.**
`orgProcedure` in `src/server/trpc/init.ts` looks up the caller's membership and
injects `ctx.orgId`. An organization id must never appear in a procedure's input
schema, that's the entire class of bug this design prevents.

**2. The model never sees who wrote the feedback.** `enrichFeedback` and
`clusterFeedback` accept only the message text, type, and rating. Email
addresses and `identify()` traits are merged back in on our servers afterwards.
This is enforced by the shape of the functions, not by a policy comment.

**3. AI fields are additive and nullable.** Feedback is fully usable before it's
analyzed. A missing API key or a slow model degrades the product; it never
breaks it.

**4. Over-quota never discards a customer's users' feedback.** Ingest keeps
accepting up to a hard ceiling and pauses *analysis* instead. Throwing away
someone's words because of a billing state is the wrong trade.

**5. The public API returns named fields, never a spread row.**
`src/server/lib/api-shapes.ts` lists every key that leaves the building. A row
spread into a response is how the internal `_ip` in the metadata blob becomes a
public contract nobody meant to make.

**6. Side effects never fail the thing that triggered them.** A bounced invite
email doesn't undo the invite; a customer's dead webhook endpoint doesn't fail
their user's submission. Email and webhook calls return results instead of
throwing, and delivery happens off the request path.

## Status

`npm run build`, `typecheck`, and `lint` all pass clean.

**Working end to end**, verified in a browser against a live Neon database:

- Widget: Shadow DOM isolation, four positions, light/dark/auto, full copy
  customization, keyboard support, reduced-motion aware, `Voicebox('open'|'identify')`
- Ingest: domain allowlist, per-IP rate limiting, honeypot + timing bot checks
- Analysis: sentiment, score, category, and summary within seconds of arrival
- Clustering: groups by underlying problem, not keyword, verified that
  *"export spins forever"*, *"times out"*, and *"fails silently"* land in one theme
- Priority ranking: `volume × negativeShare × recencyDecay`
- Dashboard: Overview, Inbox (+ detail drawer), Themes (+ detail), Trends,
  Widget Studio, Projects, Team, Developers, Billing, General
- First run: the install snippet is on the empty Overview itself, polling live
  for the first submission instead of linking you somewhere else to find it
- **Read API**: `/api/v1/feedback`, `/api/v1/feedback/:id`, `/api/v1/themes`,
  `/api/v1/projects`. Bearer keys hashed at rest, shown once, cursor paged,
  plan gated, verified end to end by `npm run smoke:api`
- **Webhooks**: `feedback.created`, `feedback.analyzed`, `theme.created`, signed
  with Stripe's `t=…,v1=…` scheme so a captured request can't be replayed.
  Test-send button, and a dead endpoint gets switched off rather than hammered
- **Invites**: sent through Resend, redeemable at `/invite/[token]`, bound to
  the address they were sent to, with a copyable link when email is off
- **Weekly digest**: three themes, the volume change, and quotes worth reading.
  Per-org toggle plus a "send me this week's now" button so it can be seen
  without waiting until Monday
- Marketing: landing with GSAP scroll animation, two product pages, four docs
  pages, pricing, changelog, terms, privacy, sitemap, robots, OG image

**Not wired yet**

- **Stripe checkout.** Plan limits and feature gates are enforced server-side and
  the billing UI is built, but no `STRIPE_*` keys means upgrades are disabled.
  This is the only unfinished part of the product.

## Product spec

Full PRD, every page, feature, and user story, is in
[`tasks/prd-sift.md`](tasks/prd-sift.md).
