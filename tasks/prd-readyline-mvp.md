# PRD: Readyline MVP (Full v1)

## 1. Introduction / Overview

Readyline is a multi-tenant SaaS for repair and service shops (auto, bike, jewelry, computer, tailor, guitar, small-engine, etc.). Shops create a job ticket in seconds; the customer gets a no-login status page (link + QR on a claim ticket) and email updates at every stage. This eliminates the constant "is it ready yet?" phone calls, gets finished work picked up and paid faster, and creates a timestamped written record of repair approvals.

The product replaces: phone-tag, paper claim tickets with no status, verbal approvals, and manual "your item is ready" reminders.

One-liner: **Your customers watch the job instead of calling about it.**

This PRD covers the full v1: tickets, job board, customer status pages, email notifications, QR claim tickets, AI-drafted customer messages, approval requests, pay-on-ready (Stripe Connect), pickup escalation, and self-serve subscription billing.

## 2. Goals

- A shop can sign up, configure stages, and create its first ticket in under 10 minutes with zero human onboarding.
- Creating a ticket takes under 15 seconds on a phone.
- Advancing a job's status takes exactly one tap plus optional note.
- Customers never need an account, app, or password, a tokenized link is the entire customer experience.
- Every status change sends a branded email within 60 seconds.
- Approval requests produce a permanent, timestamped approved/declined record.
- Shops can collect payment on the status page when a job is Ready (funds go to the shop's Stripe account).
- Jobs stuck in "Ready" automatically send escalating pickup reminders (day 3, day 7).
- Plan limits (Free/Starter/Pro/Shop) are enforced automatically via Stripe subscriptions.

## 3. User Stories

Personas:
- **Owner**, shop owner/manager; signs up, configures, watches the board, manages billing.
- **Customer**, the shop's customer; interacts only via the public status page and email.
- **Developer**, us.

---

### Epic A. Foundation

### US-001: Project scaffold
**Description:** As a developer, I need the base app scaffolded so all later stories have a home.
**Acceptance Criteria:**
- [ ] Next.js (App Router, TypeScript) with tRPC, Prisma (Postgres), Tailwind + shadcn/ui installed and wired together
- [ ] `pnpm dev` boots; `pnpm typecheck` and `pnpm lint` pass on the clean scaffold
- [ ] `.env.example` lists every required env var (DATABASE_URL, Google OAuth, Stripe, Resend, DeepSeek/AI, app URL)
- [ ] Health-check route returns 200

### US-002: Database schema
**Description:** As a developer, I need the core multi-tenant schema so every feature stores data correctly.
**Acceptance Criteria:**
- [ ] Prisma models: `User`, `Shop`, `Membership`, `Customer`, `Ticket`, `TicketEvent`, `ApprovalRequest`, `Payment`, `ScheduledJob`, `Subscription` (fields per §7 Technical Considerations)
- [ ] Every tenant-owned table carries `shopId`; all queries in later stories filter by it
- [ ] `Ticket.publicToken` is a unique, unguessable token (≥ 128 bits)
- [ ] Migration generates and applies cleanly to a fresh database
- [ ] Seed script creates a demo shop, 3 customers, 6 tickets across different stages
- [ ] Typecheck passes

### US-003: Google sign-in
**Description:** As an owner, I want to sign in with Google so I don't manage another password.
**Acceptance Criteria:**
- [ ] Auth.js (NextAuth) with Google provider; sessions persist in the database
- [ ] Signing in for the first time creates a `User`
- [ ] Unauthenticated visits to any `/app/*` route redirect to sign-in
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Shop onboarding
**Description:** As a new owner, I want to create my shop and pick my stages so the product matches how my shop works.
**Acceptance Criteria:**
- [ ] After first sign-in with no shop, user lands on a create-shop flow: shop name, shop type (dropdown: Auto, Bike, Jewelry, Computer, Tailor/Alterations, Guitar/Music, Small engine, Other), reply-to email, accent color, optional logo upload
- [ ] Shop type pre-fills an editable stage template (default: Received → Diagnosing → Waiting on parts → In progress → Ready → Picked up)
- [ ] Stages can be renamed, added, removed, reordered; "Ready" and a terminal "Picked up" stage are required and flagged (`isReady`, `isTerminal`)
- [ ] Creating the shop creates a `Membership` (role OWNER) and starts the shop on the Free plan
- [ ] Shop slug is generated and unique
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Epic B. Tickets & Job Board

### US-005: Create a ticket
**Description:** As an owner, I want to create a job ticket in under 15 seconds so intake never slows down the counter.
**Acceptance Criteria:**
- [ ] "New ticket" form: customer name (required), customer email (optional but prompted), phone (optional, stored only), item description (required), optional note, optional photo(s)
- [ ] Typing an existing customer's name/email offers to reuse that customer record
- [ ] Submitting creates `Customer` (or links existing), `Ticket` at stage 0, and a `TicketEvent` of type `CREATED`
- [ ] If customer email present, a "job received" email sends with the status link
- [ ] Form is usable one-handed on a 375px viewport; primary fields visible without scrolling
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Job board
**Description:** As an owner, I want every open job on one screen so I can run the shop from my phone.
**Acceptance Criteria:**
- [ ] Board lists open (non-terminal) tickets as cards: customer name, item, current stage, days in current stage
- [ ] Filter tabs by stage; search by customer name or item
- [ ] Tickets in a `Ready` stage ≥ 3 days show a visual "awaiting pickup" warning
- [ ] Closed (terminal) tickets live under a separate "Completed" filter
- [ ] Empty state explains how to create the first ticket
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Advance status
**Description:** As an owner, I want to move a job to the next stage with one tap so updating is faster than answering a call.
**Acceptance Criteria:**
- [ ] Ticket card/detail has a one-tap "advance to [next stage]" action plus a picker for jumping to any stage
- [ ] Optional note field appears before confirming (skippable)
- [ ] Change writes a `STATUS_CHANGED` TicketEvent and triggers the customer email (US-011)
- [ ] Stage history (who, when, note) is visible on the ticket detail
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Ticket detail
**Description:** As an owner, I want one screen with everything about a job, timeline, messages, approvals, payment state.
**Acceptance Criteria:**
- [ ] Detail view shows: customer info, item, photos, full event timeline (newest first), current stage, status-page link with copy button
- [ ] Actions available: advance status, request approval (Pro), request payment (Pro), add note, resend last email, cancel ticket
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: QR claim ticket
**Description:** As an owner, I want a printable claim ticket with a QR code so even customers without email can check status instead of calling.
**Acceptance Criteria:**
- [ ] "Print claim ticket" on ticket detail opens a print-formatted page: shop name/logo, ticket short-code, item, QR code to the status page, and the short URL printed as text
- [ ] Prints legibly in black and white on a standard receipt-size and letter-size layout
- [ ] QR resolves to the public status page
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Epic C. Customer Status Page & Email

### US-010: Public status page
**Description:** As a customer, I want to see my repair's live status at a link, with no login, so I never have to call.
**Acceptance Criteria:**
- [ ] `GET /t/[publicToken]` renders with no auth: shop branding (logo, accent color), item description, tracker-style progress bar of the shop's stages with current stage highlighted, timeline of customer-visible updates, shop contact info
- [ ] Internal notes are never rendered; only customer-facing messages
- [ ] Invalid/unknown token renders a friendly 404
- [ ] Page is responsive and legible on mobile; "powered by Readyline" footer links to marketing site
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Status-change emails
**Description:** As a customer, I want an email each time my job's status changes so I'm informed without checking anything.
**Acceptance Criteria:**
- [ ] Every stage change (and approval request / payment request) sends a branded email via Resend: shop name as friendly-from, reply-to set to the shop's email, status link button, current stage, message body
- [ ] Emails render correctly in Gmail (dark and light preview at minimum)
- [ ] Every send is recorded as an `EMAIL_SENT` TicketEvent with delivery status from the Resend webhook
- [ ] No email is attempted when the customer has no email address (no errors thrown)
- [ ] Typecheck passes

### US-012: Customer replies
**Description:** As a customer, I want to ask a question from the status page so I don't have to find the shop's phone number.
**Acceptance Criteria:**
- [ ] Status page has a message box; submitting writes a `CUSTOMER_MESSAGE` TicketEvent and emails the shop's reply-to address with a link to the ticket
- [ ] Shop can reply from the ticket detail; reply is emailed to the customer and appears on the status page
- [ ] Rate-limited (max 5 messages/hour per token) to prevent abuse
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Epic D. AI Drafting (Starter+)

### US-013: AI message drafting
**Description:** As an owner, I want my two-word shorthand turned into a polished customer message so I never have to write emails.
**Acceptance Criteria:**
- [ ] When advancing status or replying with a note, an "AI polish" action rewrites the shorthand into a friendly, complete, customer-facing message (via Vercel AI SDK → DeepSeek)
- [ ] Draft is shown for edit/approve before sending, never auto-sent
- [ ] Prompt includes shop name, item, stage, and tone instructions; output ≤ 120 words, no invented facts (ETA only if present in the shorthand)
- [ ] Falls back gracefully (raw note is used) if the AI call fails or times out (5s)
- [ ] Feature is gated to Starter plan and above; Free users see an upgrade hint
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Epic E. Approvals (Pro+)

### US-014: Request approval
**Description:** As an owner, I want to request written approval for additional work so I never eat an "I never authorized that" dispute.
**Acceptance Criteria:**
- [ ] From ticket detail: description of work (required) + amount in dollars (optional) creates an `ApprovalRequest` (status PENDING) and emails the customer
- [ ] Ticket detail shows pending approvals prominently; board card shows an "awaiting approval" badge
- [ ] Only one PENDING approval per ticket at a time
- [ ] Gated to Pro plan and above
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-015: Customer approves or declines
**Description:** As a customer, I want to approve or decline extra work with one tap so the shop can proceed immediately.
**Acceptance Criteria:**
- [ ] Status page shows the pending request (description, amount) with Approve and Decline buttons
- [ ] Responding stamps `respondedAt`, records IP and user-agent, writes an `APPROVAL_RESPONDED` TicketEvent, and emails the shop
- [ ] The decision renders permanently on both the status page and ticket timeline ("Approved $180. Jun 3, 2:41 PM")
- [ ] A responded request cannot be re-answered (idempotent; second submit shows the recorded outcome)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Epic F. Pay-on-Ready (Pro+)

### US-016: Shop connects Stripe
**Description:** As an owner, I want to connect my Stripe account so customer payments land in my account.
**Acceptance Criteria:**
- [ ] Settings → Payments starts a Stripe Connect (Express) onboarding flow; completion stores the connected account id on `Shop`
- [ ] UI shows connection state (not connected / pending / active) driven by Stripe account status
- [ ] Gated to Pro plan and above
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-017: Request and collect payment
**Description:** As a customer, I want to pay from the status page when my job is ready so pickup takes 30 seconds.
**Acceptance Criteria:**
- [ ] Shop sets an amount on the ticket ("request payment"); status page then shows a Pay button when a payment is due
- [ ] Pay button opens Stripe Checkout against the shop's connected account (destination charge, no application fee in v1)
- [ ] Successful payment (via webhook) records a `Payment`, writes a `PAYMENT_RECEIVED` TicketEvent, marks the ticket paid on board + detail, and emails a receipt confirmation
- [ ] Paid state renders on the status page ("Paid $212.50. Jun 4")
- [ ] Webhook handler is idempotent (duplicate events do not double-record)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Epic G. Automation

### US-018: Scheduled job runner
**Description:** As a developer, I need a Postgres-backed job queue so scheduled emails survive at scale without new vendors.
**Acceptance Criteria:**
- [ ] `ScheduledJob` table (type, payload, runAt, status, attempts); a Vercel Cron route claims due jobs (row-locked) and executes them
- [ ] Failed jobs retry up to 3 times with backoff, then mark FAILED
- [ ] Cron route is protected (secret header) and safe to invoke concurrently
- [ ] Typecheck passes

### US-019: Pickup escalation
**Description:** As an owner, I want automatic reminders when finished work isn't picked up so shelf space and cash stop sitting.
**Acceptance Criteria:**
- [ ] Entering a `Ready` stage schedules reminder emails at +3 days and +7 days (skipped if customer has no email)
- [ ] Reminders cancel automatically when the ticket reaches a terminal stage or is cancelled
- [ ] Reminder timing is configurable per shop in settings (defaults 3/7); either can be disabled
- [ ] Day-7 email supports an optional shop-configured storage-fee warning line
- [ ] Typecheck passes

### US-020: Stale-job nudge
**Description:** As an owner, I want a nudge when jobs haven't moved so my board stays truthful.
**Acceptance Criteria:**
- [ ] Daily digest email to the owner listing open tickets unchanged for ≥ 4 days (threshold configurable; digest can be disabled)
- [ ] No email sent on days with nothing stale
- [ ] Typecheck passes

---

### Epic H. Billing & Plans

### US-021: Subscription tiers
**Description:** As an owner, I want to subscribe self-serve so I can upgrade the moment I hit a limit.
**Acceptance Criteria:**
- [ ] Plans: Free (15 jobs/mo), Starter $29 (150 jobs/mo, AI drafting), Pro $59 (600 jobs/mo, + approvals, payments, custom branding), Shop $119 (unlimited); monthly and annual (2 months free) prices
- [ ] Billing page shows current plan, usage this month (tickets created), and upgrade/downgrade via Stripe Checkout + customer portal
- [ ] Stripe webhooks keep `Subscription` in sync (created, updated, cancelled, payment failed)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-022: Plan enforcement
**Description:** As a developer, I need limits enforced server-side so plans mean something.
**Acceptance Criteria:**
- [ ] Ticket creation beyond the monthly quota is blocked server-side with a clear upgrade message (existing tickets keep working; nothing is ever deleted)
- [ ] AI drafting (Starter+), approvals/payments/branding (Pro+) enforced in tRPC procedures, not just hidden in UI
- [ ] Monthly usage counter resets on the shop's billing cycle
- [ ] Unit tests cover: quota block, feature gates per plan, reset boundary
- [ ] Typecheck passes

---

### Epic I. Marketing Shell

### US-023: Landing page + signup
**Description:** As a prospect who saw "powered by Readyline," I want to understand and sign up in one minute.
**Acceptance Criteria:**
- [ ] Public landing page: one-liner, 3 benefit blocks (quiet phone / faster pickup / approvals in writing), pricing table, CTA to Google sign-in
- [ ] Status-page footer links here
- [ ] Responsive, no horizontal scroll at 375px
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## 4. Functional Requirements

- FR-1: The system must be multi-tenant: every Customer, Ticket, TicketEvent, ApprovalRequest, Payment, and ScheduledJob belongs to exactly one Shop, and every query is scoped by `shopId` derived from the session, never from client input.
- FR-2: Owners authenticate only via Google OAuth; one OWNER membership per shop in v1.
- FR-3: Shops define an ordered list of stages; exactly one stage is flagged `isReady` and one `isTerminal`.
- FR-4: Tickets move through stages; every change is an immutable `TicketEvent` recording actor, timestamp, and optional note.
- FR-5: Each ticket has a unique unguessable `publicToken`; the status page at `/t/[token]` requires no authentication and never exposes internal notes, other tickets, or other customers.
- FR-6: Every stage change with a customer email on file must send a branded email within 60 seconds, with shop reply-to and delivery status recorded.
- FR-7: The claim ticket must render a scannable QR code resolving to the status page and print legibly in black and white.
- FR-8: AI drafting must always present a draft for human approval before sending, must not invent facts (prices, ETAs) absent from the input, and must fall back to the raw note on failure.
- FR-9: Approval requests must permanently record description, optional amount, decision, decision timestamp, IP, and user-agent; decisions are immutable once made.
- FR-10: Payments run through Stripe Checkout against the shop's connected Stripe account; Readyline never touches card data; webhooks must be idempotent.
- FR-11: Tickets entering the Ready stage schedule pickup reminders at configurable offsets; reminders cancel on pickup/cancellation.
- FR-12: Plan quotas and feature gates are enforced in server-side procedures; hitting a quota blocks new ticket creation with an upgrade path but never degrades existing data.
- FR-13: Cancelling a subscription downgrades to Free at period end; no data is ever deleted for billing reasons.
- FR-14: All customer-facing write endpoints on the public status page (messages, approvals) are rate-limited per token.

## 5. Non-Goals (Out of Scope for v1)

- No SMS/text notifications (email + QR status link only; Twilio explicitly excluded)
- No team seats/roles beyond the single owner (schema supports it; UI does not)
- No multi-location management (Shop tier sells "unlimited jobs," not multi-location, at launch)
- No custom sending domains or custom status-page domains (Resend sends from Readyline's domain with shop friendly-from)
- No native mobile app (responsive web only)
- No inventory, parts ordering, invoicing/line-items, or estimates, payment is a single amount per ticket
- No customer accounts or customer login of any kind
- No application fee on connected payments in v1 (flat subscription only)
- No public API or integrations (no POS/QuickBooks sync)
- No i18n; English only

## 6. Design Considerations

- Shop side: high-contrast, large touch targets (min 44px), one-handed phone use; assume gloves, sunlight, and a cracked screen protector. No whimsy in copy, shop-floor plain.
- Customer side: calm, premium, tracker-style progress bar (the Domino's mental model); the shop's logo and accent color dominate, Readyline appears only in the footer.
- shadcn/ui components throughout; accent color applied via CSS variable per shop on the public page.
- Email templates: single-column, button-first, legible at a glance; React Email for templates.
- The "powered by Readyline" footer is the growth loop, it must be tasteful enough that shops don't ask to remove it (removal can later be a paid perk, not v1).

## 7. Technical Considerations

- Stack: Next.js App Router + TypeScript, tRPC, Prisma + Postgres, Auth.js (Google), shadcn/ui + Tailwind, Stripe (Billing + Connect Express), Resend (+ React Email), Vercel AI SDK with DeepSeek provider, Vercel Cron.
- Schema sketch: `Shop` (name, slug, type, stages Json, accentColor, logoUrl, replyToEmail, stripeAccountId, plan fields, reminder config) · `Ticket` (shopId, customerId, item, publicToken, currentStageIndex, readyAt, paidAt, cancelledAt) · `TicketEvent` (shopId, ticketId, type enum, actor, message, customerVisible boolean, meta Json) · `ApprovalRequest` (shopId, ticketId, description, amountCents, status, respondedAt, responderIp, responderUa) · `Payment` (shopId, ticketId, stripeSessionId, amountCents, status) · `ScheduledJob` (shopId, type, payload Json, runAt, status, attempts) · `Subscription` (shopId, stripeCustomerId, stripeSubscriptionId, plan, periodEnd, ticketsUsedThisPeriod).
- Public token: `crypto.randomBytes(16)` base64url minimum; short-code on claim ticket is display-only, never an access credential.
- Photo uploads: store via UploadThing or S3-compatible bucket (decide at implementation; abstract behind one module).
- Email deliverability: SPF/DKIM-verified Readyline sending domain, friendly-from `"{Shop Name} via Readyline"`, reply-to shop email, one-click unsubscribe honored for non-transactional sends (digest/nudges); status/approval/payment emails are transactional.
- All money stored as integer cents.
- Stripe webhook endpoints: one for Billing, one for Connect; both verify signatures and are idempotent by event id.
- AI calls have a 5s timeout and a hard max-token cap; DeepSeek cost is negligible (<$0.001/message), no usage metering needed in v1.
- Rate limiting on public endpoints via a simple Postgres or in-memory token bucket (no Redis dependency in v1).

## 8. Success Metrics

- Time from signup → first ticket created < 10 minutes, unassisted
- Ticket creation < 15 seconds; status advance ≤ 2 taps
- ≥ 60% of tickets have a customer email captured (proxy: notifications actually flowing)
- Status page opened by customers on ≥ 50% of tickets with email (link engagement = calls avoided)
- Median time-in-Ready drops after week 2 for active shops (pickup escalation working)
- ≥ 1 approval request per active Pro shop per week (the sticky feature is being used)
- Zero cross-tenant data exposure; zero unauthenticated access to shop-side routes

## 9. Open Questions

- Storage-fee warning copy: legal phrasing varies by state, ship as free-text the shop writes, or provide a template with a disclaimer?
- Should the Free plan include AI drafting as a taste (e.g., 10 drafts/mo) to drive upgrades, or stay strictly gated?
- Claim-ticket printing: is receipt-printer (58/80mm) support needed for v1, or is letter-size + phone-display enough for founding customers?
- Do we want a "kiosk/counter mode" (locked-down ticket-create screen for staff) in v1.1?
- Application fee on Connect payments later (0.5–1%), revisit after founding cohort feedback.
- Annual pricing display: gross price or "$X/mo billed annually"?
