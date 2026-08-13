# Launch checklist

Written to be honest rather than reassuring. Everything below was verified on
**13 August 2026** against the running app, the live database, the live Stripe
account and the deployed site, not from memory.

**Verified state:** `tsc` clean, `eslint` clean, `next build` passes with 61
routes. Analysis pipeline running in production (last CLUSTER run completed
13 Aug). Security headers confirmed live: HSTS with preload, CSP, COOP,
`X-Content-Type-Options`, `Referrer-Policy`.

---

## Answer to "are we ready?"

**Ready to take signups: yes.** People are already signing up and the product
works end to end for them.

**Ready to take money: not proven.** See blocker 1. Everything else below is
smaller.

---

## Blockers

### 1. Nobody has ever successfully paid

Live Stripe, checked 13 Aug 2026:

- **5 checkout sessions created. All `open` / `unpaid`. 0 subscriptions.**
- Sessions came from your own address, `vasubhatt60@gmail.com`, and one genuine
  third party, `gardentcg@gmail.com`, who reached checkout on 12 Aug and did not
  finish.
- Two organizations (`guhg`, `My team`) have a `stripeCustomerId` but are still
  on FREE, which is the shape you would expect from an abandoned checkout.

The wiring itself checks out. The webhook endpoint at
`https://www.usevoicebox.dev/api/webhooks/stripe` is enabled and subscribed to
exactly the four events the handler implements (`checkout.session.completed`,
`customer.subscription.updated`, `customer.subscription.deleted`,
`invoice.payment_failed`), with no drift in either direction.

So this is **untested, not known-broken**. That distinction matters, and it is
not a distinction you want to discover on a paying customer.

**Do this:** put a real card through the live Pro checkout yourself, confirm the
workspace flips to PRO, confirm the Billing page shows it, then refund
yourself in Stripe. Half an hour, and it converts the single largest unknown
into a fact.

### 2. Every project is open to any domain

All 8 projects in production have an empty allowed-domains list. That is the
default, and it means anyone who reads a project key out of a page source can
post feedback into that workspace from their own site.

This is not hypothetical here. Submissions have already arrived from
`fiddle.jshell.net` and `seleniumbase.io`, which are not customer domains.

The large amber warning now shipping under each project key exists for exactly
this. Set the domains on your own projects, and treat the warning as the thing
that protects new customers who will otherwise never think about it.

### 3. Confirm `EMAIL_FROM` in Vercel

Local is correct (`Voicebox <hello@mail.usevoicebox.dev>`, domain verified in
Resend). I could not verify the Vercel environment from here. If it is still
Resend's shared `onboarding@resend.dev`, every invite and digest to anyone who
is not the Resend account owner fails with a 403, which is what caused the
digest 500 on 12 Aug.

`npm run env:check` probes Resend live and will say.

### 4. Two commits are unpushed

`main` is 2 ahead of `origin/main`. The blog, the comparison pages and
`llms.txt` are not deployed (`/blog` returns 404 in production), nor are the
settings headers and the landing-page hero changes.

```bash
git push
```

### 5. Have a lawyer read the legal pages

Unchanged and still true. The Terms, Privacy Policy and DPA were written to
match what the code does, clause by clause, and every factual claim in them was
verified against the implementation. That is the engineering half. The
governing-law, liability and indemnity clauses deserve a professional read for
your jurisdiction.

---

## Before you push on growth

- **Error monitoring. There is still none.** A swallowed failure in the
  analysis pipeline or in webhook delivery is invisible right now. This is the
  gap most likely to hurt you once strangers are using it, because you will
  find out from a customer rather than from a dashboard. Sentry, before volume.
- **Google OAuth verification.** An unverified consent screen caps you at 100
  users and shows a warning. You have 8 workspaces; the cap is closer than it
  looks and verification takes days.
- **Uptime check** against `/api/health`.
- **Confirm Neon backups**, and once, actually restore one somewhere else. An
  untested backup is a hypothesis.
- **Monitor `support@`.** The privacy policy promises a 30-day response to data
  subject requests and several flows point there.
- **Re-check competitor pricing** on `/vs/*` pages. Each renders the month it
  was verified (August 2026) and `src/lib/comparisons.ts` holds the rules. Stale
  figures about another company are a real liability, not a tidiness issue.

---

## If you are selling this

- **The Stripe account is shared.** It also serves `withlanci.com` and
  `trystaged.com`. A buyer cannot take it over, so the handover involves them
  creating their own account, their own products and prices, and swapping six
  environment variables. Worth saying up front rather than at diligence.
- **Legal identity is Arc Labs LLC**, defaulted in `src/lib/site.ts` rather than
  set per environment. A buyer changes it in one file or overrides three env
  vars.
- **No customer revenue exists.** Signups yes, payments no. Price accordingly
  and do not imply otherwise.

---

## Known gaps, deliberately left

- **CSP has no `script-src`.** Current policy covers `frame-ancestors`,
  `base-uri`, `object-src`, `form-action` and `upgrade-insecure-requests`. A
  full script policy needs per-request nonces via middleware; a half-done one
  white-screens the app, which happened once during this work and was caught in
  the browser.
- **Rate limits are partly per-instance.** The ones that matter (widget ingest,
  reclustering) are database-backed and exact. The in-memory layer on the tRPC
  endpoints resets on cold start. Fine at this scale; Redis if abuse becomes
  real.
- **No analytics of any kind.** Deliberate, and the reason the site needs no
  cookie banner. Adding any means adding a consent gate before the script loads
  and updating the Cookies clause.
- **No soft delete.** Project and workspace deletion are immediate and cascade.
  Deliberate for the erasure right; worth an undo window if support load ever
  justifies it.
- **Free-workspace cap is 2.** Enforced server-side and verified with a direct
  API call that bypassed the UI (403 `FREE_WORKSPACE_LIMIT:2`). The overall cap
  is 10.

---

## What is done and needs no further work

**Product.** Widget with shadow-DOM isolation and a queued trigger that survives
being clicked before boot; customization studio with live preview, responsive on
phones; AI sentiment and theme clustering with priority ranking; inbox with
filters and search; trends; weekly digest; read API with cursor paging; signed
webhooks with auto-disable; multi-workspace membership with switching, roles,
ownership transfer and self-service leaving; onboarding with a live connection
check and one-click test submission; first-run tour.

**Security.** Tenant isolation with `orgId` never client-supplied; SSRF guard
that resolves DNS and re-checks every redirect hop; ingest origin allowlist that
refuses a missing `Origin`; rate limits keyed on the proxy-set IP; CSV
formula-injection escaping; open-redirect fix; webhook secrets masked from
non-admins; constant-time cron auth; internal errors masked; oversized metadata
trimmed rather than rejecting the submission.

**Compliance.** Legal claims verified against the implementation; self-serve
export and deletion; per-person digest opt-out with RFC 8058 one-click
unsubscribe; AI opt-out that genuinely stops the transfer; submitter IPs purged
after 7 days; `_ip` stripped from every response; DPA published; no postal
address rendered anywhere by design.

**Content and SEO.** Seven docs pages covering eleven install targets, CSP and
troubleshooting; six blog articles; four comparison pages with sourced,
dated competitor figures; `llms.txt`; JSON-LD (`BlogPosting`, `FAQPage`,
`BreadcrumbList`); sitemap generated from the content registries.
