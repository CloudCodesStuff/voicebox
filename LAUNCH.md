# Launch checklist

What's built, what's genuinely missing, and what someone taking this over has to
do before real users arrive. Written to be honest rather than reassuring: the
things in **Blockers** will bite on day one if skipped.

Verified state at time of writing: `tsc` clean, `eslint` clean, `next build`
passes 31/31 pages, AI pipeline confirmed working against the live provider
(61/61 rows analyzed, zero failed runs).

---

## Blockers — do not put this in front of users until these are done

### 1. Fill in the legal identity

`npm run env:check` fails while these are placeholders, on purpose.

```
NEXT_PUBLIC_LEGAL_ENTITY="Your Company Ltd (company no. …)"
NEXT_PUBLIC_POSTAL_ADDRESS="…"
NEXT_PUBLIC_GOVERNING_LAW="England and Wales"
NEXT_PUBLIC_VENUE="London, England"
```

These are interpolated into the Terms, Privacy Policy, DPA, and the footer of
every email. A contract naming a brand rather than a registered company binds
nobody, Terms with no governing law are hard to enforce, and commercial email
without a postal address breaches CAN-SPAM §7704(a)(5).

### 2. Replace the placeholder testimonials

`src/components/marketing/social-proof.tsx` ships with three invented quotes,
attributed to roles rather than names, with initials instead of faces, and
`attributed = false`.

**They are placeholders and must be replaced with real, permissioned quotes.**
Publishing invented testimonials as though they were real customers is
prohibited by the FTC Rule on Consumer Reviews and Testimonials (16 CFR Part
465) and the UK CAP Code, and the liability falls on whoever runs the site. Get
three real users, ask in writing, then set `attributed = true` and use their
names.

Until then the section is honest: it describes the kind of team the product is
for, without claiming a specific person said it.

### 3. Wire Stripe, or remove the paid plans

Nothing in `src/` imports Stripe. `billingConfigured = false` in
`src/app/app/settings/billing/page.tsx`, every upgrade button is disabled, and
there is no `/api/webhooks/stripe`. Pricing pages and the Terms describe billing
that cannot currently happen, which is fine while nobody can reach checkout and
not fine the moment they can.

Needed: checkout session creation, a webhook handler that moves
`Subscription.plan` and `status`, a customer portal link, and the
`STRIPE_PRICE_*` ids. The plan gate itself (`src/server/lib/plan.ts`,
`assertFeature`) is already enforced server-side and needs no changes.

### 4. Verify a sending domain in Resend

`EMAIL_FROM` currently uses a shared test sender, which Resend only delivers to
the account owner. Every invite and digest to anyone else fails with a 403.
Verify a domain at resend.com/domains, set `EMAIL_FROM` to it, add SPF/DKIM, and
re-run `npm run env:check` (it probes Resend live and will tell you).

### 5. Have a lawyer read the legal pages

The Terms, Privacy Policy, and DPA are written to match what the code actually
does, clause by clause, and every factual claim in them was verified against the
implementation. That is the engineering half. It is not legal advice, and the
governing-law, liability, and indemnity clauses in particular deserve a
professional read for your jurisdiction and risk appetite.

---

## Before real traffic

- **Custom domain + `NEXT_PUBLIC_APP_URL`.** It is baked into the widget install
  snippet, so it must be the URL customers will actually load from.
- **`CRON_SECRET` in production.** Both cron routes fail closed (503) without
  it, so digests and the analysis sweep silently never run.
- **Google OAuth verification.** An unverified consent screen caps you at 100
  users and shows a scary warning. Submitting takes days, so start early.
- **Error monitoring.** There is none. A caught-and-swallowed failure in the
  analysis pipeline or webhook delivery is currently invisible. Sentry or
  similar, before you have users rather than after.
- **Uptime check** against `/api/health` (already cache-friendly and cheap).
- **Confirm Neon backups** and, once, actually restore one somewhere else. An
  untested backup is a hypothesis.
- **Monitor `support@`.** The privacy policy promises a 30-day response to data
  subject requests and points several flows at that inbox.

---

## Known gaps, deliberately left

- **CSP has no `script-src`.** The current policy covers `frame-ancestors`,
  `base-uri`, `object-src`, and `form-action`. A full script policy needs
  per-request nonces via middleware; shipping a half-done one white-screens the
  app (it did, during this work, and was caught in the browser). Worth doing,
  not worth guessing at.
- **Rate limits are per-instance.** The durable limits that matter (widget
  ingest, reclustering) are backed by the database and are exact. The cheap
  in-memory layer on top of the tRPC endpoints resets on cold start and is
  per-serverless-instance. Fine at launch scale; move to Redis/Upstash if
  abuse becomes real.
- **No analytics of any kind.** Deliberate, and the reason the site needs no
  cookie banner. If you add any, you will need one, plus a cookie-consent gate
  before the script loads, and the Cookies clause in the privacy policy must be
  updated to match.
- **Single-org accounts.** A user belongs to one organization in practice; the
  context resolves the earliest membership. Accepting a second invite consumes
  it without granting reachable access. Fine for the current product, a real
  fix before selling to agencies.
- **No soft delete anywhere.** Project deletion and organization deletion are
  immediate and cascade. Deliberate for the erasure right, worth an undo window
  if support load ever justifies it.

---

## What is already done

Because it is as easy to over-build as to under-ship, these need no further
work:

**Product.** Widget with shadow-DOM isolation, live customization studio,
AI sentiment and theme clustering with priority ranking, inbox with filters and
search, trends, weekly digest, public read API with cursor paging, signed
webhooks with auto-disable, team invites with expiry, onboarding with a live
connection check and a one-click test submission, and a four-stop first-run tour.

**Security** (three parallel audits, findings verified and fixed): tenant
isolation with `orgId` never client-supplied; SSRF guard resolving DNS and
re-checking every redirect hop for both outbound fetchers; ingest origin
allowlist that refuses missing `Origin`; rate limits keyed on the proxy-set IP
rather than a spoofable header; CSV formula-injection escaping; open-redirect
fix; members genuinely read-only; webhook secrets masked from non-admins;
constant-time cron auth; internal error messages masked; HSTS, COOP, and partial
CSP.

**Compliance** (three more audits): every factual claim in the legal pages
verified against the implementation; self-serve full export and organization
deletion; per-person digest opt-out with RFC 8058 one-click unsubscribe; AI
processing opt-out that actually stops the transfer; submitter IPs auto-purged
after seven days; `_ip` stripped from every response including tRPC; end-user
email searchable so an erasure request can be located; cookie disclosure
matching the real four-cookie inventory; DPA published; China transfer named
explicitly with a mechanism and an opt-out.

---

## Growth, once it's live

Not required to launch, listed so they aren't rediscovered later: per-page OG
images, a real changelog cadence, docs for the identify API, a public roadmap
fed by Sift's own widget (the product dogfoods well), and an onboarding email
sequence. The digest is the natural retention hook and it already exists.
