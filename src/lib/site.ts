/**
 * Brand strings and marketing constants. Copy that appears in more than one
 * place lives here so the landing page, metadata, emails, docs, and legal
 * pages can't drift apart.
 */

export const site = {
  name: "Voicebox",
  tagline: "Stop reading feedback. Start acting on it.",
  description:
    "A feedback widget for your site, and an AI that groups every reply into a ranked list of what to fix next.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supportEmail: "support@usevoicebox.dev",
  twitter: "@usevoicebox",

  /* -----------------------------------------------------------------------
     REQUIRED BEFORE LAUNCH, and legally load-bearing.

     These four strings are interpolated into the Terms, the Privacy Policy,
     the DPA, and the footer of every email. They are not decoration:

       legalEntity   the party the contract is actually with. A brand name is
                     not a legal person, so a contract with a product name
                     binds nobody. Use the registered company, e.g.
                     "Acme Feedback LLC".
       postalAddress a physical mailing address, REQUIRED in commercial email
                     by CAN-SPAM §7704(a)(5), and the notice address for the
                     Terms. Use a PO Box, a commercial mailbox, or a
                     registered agent. NEVER a home address: this string is
                     rendered publicly on three legal pages and in the footer
                     of every email, and cannot be un-published.
       governingLaw  the law the Terms are read under. Without it, the
                     liability cap and every other clause are of uncertain
                     enforceability.
       venue         where disputes are heard.

     `npm run env:check` fails while any of these is still a placeholder.
  ----------------------------------------------------------------------- */
  legalEntity: process.env.NEXT_PUBLIC_LEGAL_ENTITY ?? "[Your registered company name]",
  postalAddress: process.env.NEXT_PUBLIC_POSTAL_ADDRESS ?? "[Your mailing address]",
  governingLaw: process.env.NEXT_PUBLIC_GOVERNING_LAW ?? "[Your jurisdiction]",
  venue: process.env.NEXT_PUBLIC_VENUE ?? "[Your courts]",
} as const;

/** True when the legal placeholders above have been filled in. */
export const legalConfigured =
  !site.legalEntity.startsWith("[") &&
  !site.postalAddress.startsWith("[") &&
  !site.governingLaw.startsWith("[");

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
    feedbackPerMonth: 50,
    projects: 1,
    seats: 1,
    volume: "50 pieces of feedback a month",
    scope: "1 project, 1 seat",
    included: [
      "The widget, fully customizable",
      "Sentiment on every submission",
      "AI themes and priority ranking",
      "Trends and CSV export",
    ],
    adds: [],
  },
  {
    id: "PRO",
    name: "Pro",
    priceMonthly: 49,
    priceAnnual: 490,
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
      "API access and webhooks",
    ],
  },
  {
    id: "SCALE",
    name: "Scale",
    priceMonthly: 99,
    priceAnnual: 990,
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
