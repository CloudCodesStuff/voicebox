/**
 * Head-to-head pages, one per competitor, at /vs/<slug>.
 *
 * ⚠️  EVERY CLAIM ABOUT A COMPETITOR HERE IS A FACTUAL STATEMENT ABOUT ANOTHER
 * COMPANY, AND THE LIABILITY FOR GETTING IT WRONG IS YOURS.
 *
 * Rules for editing this file:
 *
 *   1. Only write what you have checked on their own pricing or docs page, and
 *      put the date you checked it in `verifiedOn`. Every page renders that
 *      date, which is both honest and the thing that makes the page credible
 *      to a reader who is checking you.
 *   2. Prices move. `verifiedOn` going stale is the signal to re-check, and the
 *      page says "as of" rather than implying it is live.
 *   3. Say what they are genuinely better at. A comparison page where the
 *      competitor loses every row is an advert, and readers grade it as one.
 *      `theyreBetterAt` is required for that reason, and it is not decoration.
 *
 * Figures below were taken from published pricing pages and pricing round-ups
 * in August 2026.
 */
export type Comparison = {
  slug: string;
  /** Their product name, spelled the way they spell it. */
  name: string;
  /** One line on what they are, in their terms, not ours. */
  what: string;
  title: string;
  description: string;
  verifiedOn: string;
  /** How their pricing is metered. The usual reason people go looking. */
  pricingModel: string;
  pricingDetail: string;
  /** Honest. This is the credibility of the whole page. */
  theyreBetterAt: string[];
  /** Where we differ, stated as a difference, not a insult. */
  weDoDifferently: string[];
  /** Who should genuinely pick them. */
  pickThemIf: string;
  pickUsIf: string;
  sources: Array<{ label: string; url: string }>;
};

export const comparisons: Comparison[] = [
  {
    slug: "canny",
    name: "Canny",
    what: "a public feedback board with voting, a roadmap and a changelog",
    title: "Voicebox vs Canny",
    description:
      "Canny is a public voting board priced by tracked users. Voicebox is a widget plus AI analysis priced by feedback volume. Compared honestly, August 2026.",
    verifiedOn: "August 2026",
    pricingModel: "Per tracked user",
    pricingDetail:
      "Free for 25 tracked users, then Core from $19/mo and Pro from $79/mo billed annually ($99 monthly). A tracked user is anyone who submits, votes or comments. Reported costs climb steeply with engagement: around $275/mo on Core and $579/mo on Pro at 1,000 tracked users. Jira, Linear and ClickUp integrations start on Pro; SSO is on the custom-priced Business plan.",
    theyreBetterAt: [
      "Public roadmaps and voting. If you want customers to see what is planned and vote on it, that is Canny's entire design and Voicebox does not do it at all.",
      "Duplicate merging on a public board, where the same request arrives from many people who can all see each other's posts.",
      "A mature integration catalogue, with the major issue trackers covered on the Pro plan.",
      "Being a known quantity. It has been around long enough that your stakeholders have probably heard of it.",
    ],
    weDoDifferently: [
      "Priced on how much feedback you collect, not how many people send it. A viral month raises your volume, not your per-user count.",
      "Feedback is private by default. Nothing your users write is published to a board other customers can read.",
      "Grouping is done by an AI reading the text, so five different wordings of one problem become one theme without anyone tagging or merging by hand.",
      "The widget is the product rather than a way onto a board, so it is around 11KB over the wire, styled to your site and takes one script tag.",
    ],
    pickThemIf:
      "you want a public place where customers vote on what you build next, and you are comfortable with a bill that grows as more of them participate.",
    pickUsIf:
      "you want to hear what is wrong, privately, and be told what to fix first without running a community.",
    sources: [
      { label: "Canny pricing", url: "https://canny.io/pricing" },
      {
        label: "Canny pricing analysis, ProductLift",
        url: "https://www.productlift.dev/blog/canny-pricing/",
      },
    ],
  },
  {
    slug: "featurebase",
    name: "Featurebase",
    what: "feedback boards, roadmaps, changelogs, surveys, a help centre and a support inbox in one product",
    title: "Voicebox vs Featurebase",
    description:
      "Featurebase is an all-in-one support and feedback suite priced per seat. Voicebox does one thing: collect feedback and rank what to fix. Compared, August 2026.",
    verifiedOn: "August 2026",
    pricingModel: "Per seat, plus usage for AI",
    pricingDetail:
      "A permanent Free plan with one seat and no AI, then Growth at $29, Professional at $59 and Enterprise at $99 per seat per month billed yearly, plus $0.29 per AI resolution on paid plans. There is an early-stage startup programme offering a large discount for companies under two years old with fewer than six employees.",
    theyreBetterAt: [
      "Breadth. Boards, roadmap, changelog, surveys, help centre and a live support inbox in one subscription is genuinely a lot of product.",
      "Being your support tool as well as your feedback tool, if you would rather not run both.",
      "AI deflection of support conversations, which Voicebox does not attempt at all.",
      "Their startup programme, which is a real discount if you qualify.",
    ],
    weDoDifferently: [
      "Seats are not the meter. Voicebox charges for feedback volume, and Scale includes unlimited seats, so adding a teammate to read the inbox never changes the bill.",
      "AI analysis is included on every plan, including Free, with no per-resolution charge.",
      "One job rather than six. There is no help centre or support inbox here, which is a real limitation and also why it takes four minutes to set up.",
    ],
    pickThemIf:
      "you want one subscription to cover support and feedback together, and per-seat pricing suits a small fixed team.",
    pickUsIf:
      "you already have support handled and want the feedback half to be sharp, cheap to run and readable by the whole team.",
    sources: [
      { label: "Featurebase pricing", url: "https://www.featurebase.app/pricing" },
      {
        label: "Featurebase pricing breakdown, FeatureOS",
        url: "https://featureos.com/blog/featurebase-pricing",
      },
    ],
  },
  {
    slug: "hotjar",
    name: "Hotjar",
    what: "behavioural analytics: heatmaps, session recordings and funnels, with survey and feedback widgets alongside",
    title: "Voicebox vs Hotjar",
    description:
      "Hotjar shows you what people did. Voicebox tells you what they meant. Where the two overlap, where they do not, and why plenty of teams run both. August 2026.",
    verifiedOn: "August 2026",
    pricingModel: "Per session volume",
    pricingDetail:
      "A free tier, then paid plans reported from around $32/mo (Plus), $80/mo (Business) and $171+/mo (Scale), metered on sessions rather than on feedback.",
    theyreBetterAt: [
      "Showing you behaviour. Heatmaps and session recordings answer 'where did they get stuck' in a way no amount of written feedback will.",
      "Funnels and drop-off analysis, which is a different question from the one Voicebox answers.",
      "Volume of signal without asking anyone anything, since recordings need no participation.",
    ],
    weDoDifferently: [
      "The written word is the product, not a side feature. Every submission is scored, summarised and grouped with everything describing the same problem.",
      "Output is a ranked list of things to fix, rather than a set of recordings to watch.",
      "Priced on feedback collected rather than sessions, so traffic spikes do not move the bill.",
    ],
    pickThemIf:
      "your question is where people struggle in a flow, and you have the time to watch recordings.",
    pickUsIf:
      "your question is what people want changed and in what order, in their words.",
    sources: [
      { label: "Hotjar pricing", url: "https://www.hotjar.com/pricing/" },
    ],
  },
  {
    slug: "usersnap",
    name: "Usersnap",
    what: "visual bug reporting with screenshots and annotation, aimed at QA and UX teams",
    title: "Voicebox vs Usersnap",
    description:
      "Usersnap is built for reporting visual bugs with annotated screenshots. Voicebox is built for understanding written feedback at volume. Compared, August 2026.",
    verifiedOn: "August 2026",
    pricingModel: "Per user and feature tier",
    pricingDetail:
      "A limited free plan, with paid tiers by number of users and features; higher tiers are reported to reach several hundred euros a month.",
    theyreBetterAt: [
      "Bug reports. Screen capture with annotation on top, plus browser and console metadata attached automatically, is exactly what a QA cycle needs and Voicebox has none of it.",
      "Handing a developer something reproducible without a back-and-forth.",
      "Structured QA workflows during a release, which is a different job from listening to customers.",
    ],
    weDoDifferently: [
      "No screenshots. Voicebox deliberately collects only what someone typed, which keeps it light and keeps other people's data out of your inbox.",
      "Analysis over capture: the value is in grouping hundreds of messages, not in the fidelity of any one report.",
      "A widget your end users are meant to use, rather than a tool aimed at your own testers.",
    ],
    pickThemIf:
      "you are collecting bug reports from testers or clients and need annotated screenshots and environment detail.",
    pickUsIf:
      "you are collecting opinions from real users and need to know which of them add up to something.",
    sources: [
      { label: "Usersnap pricing", url: "https://usersnap.com/pricing" },
    ],
  },
];

export function getComparison(slug: string): Comparison | undefined {
  return comparisons.find((c) => c.slug === slug);
}
