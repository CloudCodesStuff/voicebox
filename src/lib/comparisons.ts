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
      "Canny is a public voting board priced by tracked users. Voicebox is a widget plus an insight engine priced by feedback volume. Compared honestly, September 2026.",
    verifiedOn: "September 2026",
    pricingModel: "Per tracked user",
    // Re-checked against canny.io/pricing on 2 Sep 2026. Two changes since the
    // August reading, both worth knowing about:
    //
    //   • The Core tier at $19/mo is gone. The ladder is now Free, Pro,
    //     Business, so the entry price for a paid plan went UP, not down.
    //   • The "$275/mo at 1,000 tracked users" figure was sourced from a
    //     third-party blog and priced a plan that no longer exists. Removed
    //     rather than re-estimated: a number we cannot stand behind about
    //     another company is a liability, and the tier ladder now makes the
    //     same argument from Canny's own page.
    pricingDetail:
      "Free for 25 tracked users, then Pro from $79/mo billed yearly, then a custom-priced Business plan. A tracked user is anyone associated with feedback — anyone who posts, votes or comments. The tier ladder is the cost curve: 25 tracked users on Free, 100+ on Pro, 5,000+ on Business, so the bill is a function of how many of your customers participate rather than how much they say. Jira, Linear and ClickUp integrations start on Pro; SSO is listed with the Business plan.",
    theyreBetterAt: [
      "Public roadmaps and voting. If you want customers to see what is planned and vote on it, that is Canny's entire design and Voicebox does not do it at all.",
      "Duplicate merging on a public board, where the same request arrives from many people who can all see each other's posts.",
      "A mature integration catalogue, with the major issue trackers covered on the Pro plan.",
      "Being a known quantity. It has been around long enough that your stakeholders have probably heard of it.",
    ],
    weDoDifferently: [
      "Priced on how much feedback you collect, not how many people send it. A viral month raises your volume, not your per-user count.",
      "Feedback is private by default. Nothing your users write is published to a board other customers can read.",
      "Grouping is done by a model reading the text, so five different wordings of one problem become one theme without anyone tagging or merging by hand.",
      "The widget is the product rather than a way onto a board, so it is around 11KB over the wire, styled to your site and takes one script tag.",
    ],
    pickThemIf:
      "you want a public place where customers vote on what you build next, and you are comfortable with a bill that grows as more of them participate.",
    pickUsIf:
      "you want to hear what is wrong, privately, and be told what to fix first without running a community.",
    // Only the vendor's own page now. The third-party analysis that used to be
    // cited here was where the dead-plan figures came from, so keeping it would
    // point a reader at the stale numbers we just removed.
    sources: [{ label: "Canny pricing", url: "https://canny.io/pricing" }],
  },
  {
    slug: "featurebase",
    name: "Featurebase",
    what: "feedback boards, roadmaps, changelogs, surveys, a help centre and a support inbox in one product",
    title: "Voicebox vs Featurebase",
    description:
      "Featurebase is an all-in-one support and feedback suite priced per seat. Voicebox does one thing: collect feedback and rank what to fix. Compared, September 2026.",
    verifiedOn: "September 2026",
    pricingModel: "Per seat, plus usage for AI",
    // Re-checked against featurebase.app/pricing on 2 Sep 2026. Seat prices
    // and the startup programme are unchanged; the AI resolution charge had
    // risen from $0.29 to $0.49, so we were understating their cost by 69%.
    // Worth correcting in their favour as promptly as in ours — the whole
    // value of these pages is that the figures are checkable.
    pricingDetail:
      "A permanent Free plan with one seat and no AI, then Growth at $29, Professional at $59 and Enterprise at $99 per seat per month billed yearly, plus $0.49 per AI resolution on paid plans. There is an early-stage startup programme offering 86% off for companies founded less than two years ago with fewer than six employees.",
    theyreBetterAt: [
      "Breadth. Boards, roadmap, changelog, surveys, help centre and a live support inbox in one subscription is a lot of product.",
      "Being your support tool as well as your feedback tool, if you would rather not run both.",
      "AI deflection of support conversations, which Voicebox does not attempt at all.",
      "Their startup programme, which is a real discount if you qualify.",
    ],
    weDoDifferently: [
      "Seats are not the meter. Voicebox charges for feedback volume, and Scale includes unlimited seats, so adding a teammate to read the inbox never changes the bill.",
      "Analysis is included on every plan, including Free, with no per-resolution charge.",
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
      "Hotjar shows you what people did. Voicebox tells you what they meant. Where the two overlap, where they do not, and why plenty of teams run both. Compared, September 2026.",
    verifiedOn: "September 2026",
    // Re-checked 21 Sep 2026: hotjar.com/pricing now redirects to
    // contentsquare.com. The old Plus/Business/Scale ladder ($32/$80/$171)
    // is gone; Hotjar's tools are sold as Contentsquare products, and the
    // feedback side (surveys, widgets) is a separate product from analytics.
    pricingModel: "Per product, metered on sessions or responses",
    pricingDetail:
      "Hotjar is now sold as Contentsquare. Experience Analytics (heatmaps, replays) has a free tier and a Growth plan from $49/mo ($39 billed yearly) for 7,000 sessions. The feedback side, Voice of Customer, is a separate product: 100 responses free, then Growth from $99/mo ($79 billed yearly) for 500 responses. Pro and Enterprise are quote-only.",
    theyreBetterAt: [
      "Showing you behaviour. Heatmaps and session recordings answer 'where did they get stuck' in a way no amount of written feedback will.",
      "Funnels and drop-off analysis, which is a different question from the one Voicebox answers.",
      "Volume of signal without asking anyone anything, since recordings need no participation.",
      "Breadth: since the Contentsquare merger the same account covers analytics, surveys and product analytics, with an MCP server on the paid plans.",
    ],
    weDoDifferently: [
      "The written word is the product, not a side feature. Every submission is scored, summarised and grouped with everything describing the same problem.",
      "Output is a ranked list of things to fix, rather than a set of recordings to watch.",
      "Priced on feedback collected rather than sessions, so traffic spikes do not move the bill. Written feedback is the whole product here, not a $79/mo add-on to analytics.",
      "The MCP server is on every plan, including free, and is read-only by design.",
    ],
    pickThemIf:
      "your question is where people struggle in a flow, and you have the time to watch recordings.",
    pickUsIf:
      "your question is what people want changed and in what order, in their words.",
    sources: [
      { label: "Hotjar pricing (now Contentsquare)", url: "https://www.hotjar.com/pricing/" },
    ],
  },
  {
    slug: "usersnap",
    name: "Usersnap",
    what: "visual bug reporting with screenshots and annotation, aimed at QA and UX teams",
    title: "Voicebox vs Usersnap",
    description:
      "Usersnap is built for reporting visual bugs with annotated screenshots. Voicebox is built for understanding written feedback at volume. Compared, September 2026.",
    verifiedOn: "September 2026",
    // Re-checked against usersnap.com/pricing on 21 Sep 2026. There is no
    // free plan, only a trial; the ladder is seats and active projects.
    pricingModel: "Per seat and project tier",
    pricingDetail:
      "No free plan, a free trial. Starter $49/mo (5 projects, 5 seats), Growth $109/mo (15 projects, 10 seats), Professional $189/mo (20 projects, 20 seats), Premium from $369/mo (50 projects, 50 seats), all billed monthly; yearly billing saves up to three months. Feedback volume is unlimited on every tier; what you pay for is people and projects.",
    theyreBetterAt: [
      "Bug reports. Screen capture with annotation on top, plus browser and console metadata attached automatically, is exactly what a QA cycle needs and Voicebox has none of it.",
      "Handing a developer something reproducible without a back-and-forth.",
      "Structured QA workflows during a release, which is a different job from listening to customers.",
      "Video feedback, a form builder with thirty-odd templates, and an MCP connector on top of it all.",
    ],
    weDoDifferently: [
      "No screenshots. Voicebox deliberately collects only what someone typed, which keeps it light and keeps other people's data out of your inbox.",
      "Analysis over capture: the value is in grouping hundreds of messages, not in the fidelity of any one report.",
      "A widget your end users are meant to use, rather than a tool aimed at your own testers.",
      "A free plan that is a plan, not a trial, and a starting price of $19 rather than $49.",
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
