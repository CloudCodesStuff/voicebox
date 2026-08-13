/**
 * Brand strings and marketing constants. Copy that appears in more than one
 * place lives here so the landing page, metadata, emails, docs, and legal
 * pages can't drift apart.
 */

import { clientEnv } from "@/env";

export const site = {
  name: "Voicebox",
  tagline: "Feedback in. Fix list out.",
  description:
    "A feedback widget for your site, and an AI that groups every reply into a ranked list of what to fix next.",
  // Read through the validated env module, not process.env directly: a
  // malformed value (someone pastes a markdown link instead of a bare URL,
  // say) then fails fast with the variable's name in the message, rather than
  // shipping a bad string that crashes `new URL(site.url)` deep in layout.tsx
  // with an error that never mentions NEXT_PUBLIC_APP_URL.
  url: clientEnv.NEXT_PUBLIC_APP_URL,
  supportEmail: "support@usevoicebox.dev",
  twitter: "@usevoicebox",

  /* -----------------------------------------------------------------------
     REQUIRED BEFORE LAUNCH, and legally load-bearing.

     These four strings are interpolated into the Terms, the Privacy Policy,
     the DPA, and the footer of every email. They are not decoration:

       legalEntity   the party the contract is actually with. A brand name is
                     not a legal person, so a contract with a product name
                     binds nobody. This is the registered company.
       governingLaw  the law the Terms are read under. Without it, the
                     liability cap and every other clause are of uncertain
                     enforceability.
       venue         where disputes are heard.

     There is deliberately no postal address here, and nothing in the app
     renders one. Every address a one-person company has to hand is a home
     address, and these strings publish to three legal pages and the footer of
     every email, which cannot be un-published. Notice is served by email
     instead, which the Terms say explicitly so it is actually binding.

     CAN-SPAM §7704(a)(5) does require a physical address, but only in
     *commercial* email. Everything sent from here is transactional or
     relationship mail to existing users, invites and the digest they switched
     on, so the requirement isn't triggered. Adding marketing email later means
     adding an address back, on that mail at least.

     All three default to the real values rather than to placeholders. They are
     public information that already renders in the footer, there is nothing
     secret to protect by keeping them in env, and a forgotten variable on a
     new deployment would otherwise ship legal pages that name no party. The
     env vars still override, for a fork under a different company.
  ----------------------------------------------------------------------- */
  legalEntity: process.env.NEXT_PUBLIC_LEGAL_ENTITY ?? "Arc Labs LLC",
  governingLaw: process.env.NEXT_PUBLIC_GOVERNING_LAW ?? "the State of New Jersey",
  venue:
    process.env.NEXT_PUBLIC_VENUE ?? "the state and federal courts of New Jersey",
} as const;

/** True when the legal placeholders above have been filled in. */
export const legalConfigured =
  !site.legalEntity.startsWith("[") && !site.governingLaw.startsWith("[");

/**
 * Three plans, described by what changes between them.
 *
 * `included` is only filled in on Free, because it is what every plan gets.
 * The other two list `adds`: the short answer to "why would I move up".
 * STARTER still exists in the database enum for anyone historically on it,
 * but it is no longer sold.
 */
export const plans = [
  {
    id: "FREE",
    name: "Free",
    priceMonthly: 0,
    priceAnnual: 0,
    feedbackPerMonth: 25,
    projects: 1,
    seats: 1,
    volume: "25 pieces of feedback a month",
    scope: "1 project, 1 seat",
    included: [
      "The widget, fully customizable",
      "Sentiment on every submission",
      "AI themes and priority ranking",
      "MCP server for your coding agent",
      "Trends and CSV export",
    ],
    adds: [],
  },
  {
    id: "PRO",
    name: "Pro",
    priceMonthly: 19,
    priceAnnual: 190,
    feedbackPerMonth: 3000,
    projects: 10,
    seats: 10,
    popular: true,
    volume: "3,000 pieces of feedback a month",
    scope: "10 projects, 10 seats",
    included: [],
    adds: [
      "Weekly digest email",
      "Your branding, not ours",
      "REST API and webhooks",
    ],
  },
  {
    id: "SCALE",
    name: "Scale",
    priceMonthly: 49,
    priceAnnual: 490,
    feedbackPerMonth: 15000,
    projects: null,
    seats: null,
    volume: "15,000 pieces of feedback a month",
    scope: "Unlimited projects and seats",
    included: [],
    adds: ["Priority support"],
  },
] as const;

export type PlanConfig = (typeof plans)[number];
