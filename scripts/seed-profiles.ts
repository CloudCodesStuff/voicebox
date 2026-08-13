/**
 * Demo workspaces, as data.
 *
 * Each profile is a whole believable account: who owns it, what they ship, and
 * a body of feedback written to *cluster*. That last part is the point. Real
 * feedback is several distinct underlying problems, each described in different
 * words by different people, wrapped in praise and one-offs that must not get
 * merged into anything. Feedback written as thirty unrelated sentences proves
 * nothing about the pipeline, because any clustering at all looks fine on it.
 *
 * So when adding a profile: pick four or five real problems, write each one
 * four or five times the way four or five different people would say it, and
 * then add genuine singletons the clustering has to leave alone.
 *
 * Consumed by scripts/seed-owner.ts:
 *
 *   npm run seed:owner                      (atacana)
 *   OWNER_PROFILE=lanci npm run seed:owner
 */

import type { FeedbackType } from "@prisma/client";

export type SeedFeedback = {
  body: string;
  type: FeedbackType;
  rating?: number;
  /** How many days ago it arrived. Recency feeds the priority score. */
  days: number;
  email?: string;
  /** Lands in Feedback.metadata, so the inbox filters have something to show. */
  meta?: Record<string, string>;
};

export type SeedProfile = {
  email: string;
  name: string;
  orgName: string;
  projectName: string;
  /** The real site. Also becomes the domain allowlist. */
  url: string;
  /** Path the widget is embedded on, for the inbox's page column. */
  pageUrl: string;
  accentColor: string;
  heading: string;
  subheading: string;
  feedback: SeedFeedback[];
};

const atacana: SeedProfile = {
  email: "eashaan.bhattacharyya@atacana.com",
  name: "Eashaan",
  orgName: "Atacana",
  projectName: "Atacana Web App",
  url: "https://app.atacana.com",
  pageUrl: "https://app.atacana.com/dashboard",
  accentColor: "#00C48C",
  heading: "Share your feedback",
  subheading: "We read every one of these. It's how we pick what to build.",
  feedback: [
    // Onboarding friction, the loudest cluster, mostly unhappy.
    { body: "Signed up and then just stared at an empty screen. No idea what I was meant to do next.", type: "ISSUE", rating: 2, days: 1, meta: { plan: "free" } },
    { body: "The setup flow lost me at the second step. What is a workspace and why do I need two?", type: "ISSUE", rating: 2, days: 2, email: "priya@example.com", meta: { plan: "free" } },
    { body: "Took me 20 minutes to find where to invite my team. It's buried.", type: "ISSUE", rating: 3, days: 3, meta: { plan: "pro" } },
    { body: "Genuinely could not work out how to get started without watching a YouTube video.", type: "ISSUE", rating: 2, days: 5, meta: { plan: "free" } },
    { body: "Onboarding assumes I already know your vocabulary. I didn't.", type: "ISSUE", rating: 2, days: 8, meta: { plan: "free" } },

    // Slow dashboard, the performance cluster.
    { body: "Dashboard takes about 8 seconds to load every morning. Painful.", type: "ISSUE", rating: 2, days: 1, meta: { plan: "pro" } },
    { body: "Everything is fast until I filter by date, then it hangs for ages.", type: "ISSUE", rating: 2, days: 2, meta: { plan: "pro" } },
    { body: "The main page is so slow I've started leaving it open in a tab so I don't have to reload.", type: "ISSUE", rating: 1, days: 4, email: "marcus@example.com", meta: { plan: "scale" } },
    { body: "Loading spinner for 10+ seconds on the reports view. Every single time.", type: "ISSUE", rating: 2, days: 6, meta: { plan: "pro" } },

    // Exports, different words, same underlying request.
    { body: "Please let me export to CSV. I need to get this into a spreadsheet for my board.", type: "IDEA", rating: 4, days: 2, meta: { plan: "pro" } },
    { body: "Any way to download the raw data? Copy-pasting 200 rows is not viable.", type: "QUESTION", rating: 3, days: 5, meta: { plan: "free" } },
    { body: "Would be great to pull this into Excel rather than screenshotting it.", type: "IDEA", rating: 4, days: 9, meta: { plan: "pro" } },

    // Mobile, small but consistent.
    { body: "On my phone the sidebar covers the whole screen and I can't dismiss it.", type: "ISSUE", rating: 2, days: 3, meta: { plan: "free" } },
    { body: "Mobile layout is basically unusable. Tables overflow off the side.", type: "ISSUE", rating: 2, days: 7, meta: { plan: "pro" } },
    { body: "Tried to check this on my iPad and half the buttons are off screen.", type: "ISSUE", rating: 2, days: 11, meta: { plan: "pro" } },

    // Integrations, the feature-request cluster.
    { body: "A Slack integration would be huge for us. We live in Slack.", type: "IDEA", rating: 5, days: 1, email: "dana@example.com", meta: { plan: "scale" } },
    { body: "Do you have a Zapier connector? We want this feeding into Notion automatically.", type: "QUESTION", rating: 4, days: 4, meta: { plan: "pro" } },
    { body: "Notifications in Slack instead of email please. Email gets buried.", type: "IDEA", rating: 4, days: 10, meta: { plan: "pro" } },
    { body: "Is there an API? I couldn't find docs anywhere.", type: "QUESTION", rating: 3, days: 12, meta: { plan: "scale" } },

    // Pricing confusion.
    { body: "I upgraded but my limits didn't change for two days. Support sorted it but that was stressful.", type: "ISSUE", rating: 3, days: 6, meta: { plan: "pro" } },
    { body: "The pricing page says one thing and my invoice says another. Which is right?", type: "QUESTION", rating: 2, days: 9, email: "tom@example.com", meta: { plan: "pro" } },

    // Praise, should collapse into one theme, not five.
    { body: "Honestly the cleanest tool we've adopted this year. Setup aside, it's lovely.", type: "PRAISE", rating: 5, days: 1, meta: { plan: "pro" } },
    { body: "Support replied in under an hour on a Sunday. Genuinely impressed.", type: "PRAISE", rating: 5, days: 3, meta: { plan: "scale" } },
    { body: "This replaced two other tools for us. Well built.", type: "PRAISE", rating: 5, days: 5, meta: { plan: "scale" } },
    { body: "Love the new design. Much easier to scan than the old one.", type: "PRAISE", rating: 5, days: 8, meta: { plan: "pro" } },
    { body: "Whoever wrote your empty states, thank you. They actually tell me what to do.", type: "PRAISE", rating: 5, days: 13, meta: { plan: "free" } },

    // Genuine one-offs, so the clustering has to decide what not to merge.
    { body: "Dark mode when? My eyes are begging.", type: "IDEA", rating: 4, days: 2, meta: { plan: "pro" } },
    { body: "Search doesn't tolerate typos at all. One wrong letter and I get nothing.", type: "IDEA", rating: 3, days: 7, meta: { plan: "free" } },
    { body: "Can I change the currency? Everything shows in dollars and we bill in euros.", type: "QUESTION", rating: 3, days: 14, meta: { plan: "pro" } },
    { body: "The date picker defaults to today and I always want last month. Small thing, adds up.", type: "IDEA", rating: 4, days: 15, meta: { plan: "pro" } },
  ],
};

/**
 * Lanci (withlanci.com) finds scholarships, programs, internships and
 * fellowships a student actually qualifies for and sends them as a feed.
 *
 * Two things shape this set. The audience is split, students and the parents
 * paying attention over their shoulder, and they complain about different
 * things in different registers, which is exactly the case where keyword
 * grouping fails and reading the text does not. And the product's whole promise
 * is relevance, so the loudest cluster is the promise not being kept: a feed
 * full of things you cannot apply to. `grade` and `role` ride along in metadata
 * because "who is saying this" is the first question you ask of a complaint.
 */
const lanci: SeedProfile = {
  email: "vasubhatt60@gmail.com",
  name: "Eashaan",
  orgName: "Lanci",
  projectName: "Lanci",
  url: "https://withlanci.com",
  pageUrl: "https://withlanci.com/feed",
  accentColor: "#006400",
  heading: "How's your feed?",
  subheading: "Tell us what's landing and what isn't. It's how we tune matching.",
  feedback: [
    // Relevance. The loudest cluster and the one that matters, because it is
    // the product's actual promise. Five people, five framings, one problem.
    { body: "Half my feed is grad school fellowships and I'm a high school sophomore. I can't apply to any of it.", type: "ISSUE", rating: 2, days: 1, meta: { role: "student", grade: "10" } },
    { body: "It keeps showing me US-only scholarships. I put down that I'm in Ontario during signup.", type: "ISSUE", rating: 2, days: 2, email: "amrita.k@example.com", meta: { role: "student", grade: "11" } },
    { body: "Matched me with three things that require a 3.9 GPA. Mine is on my profile and it is not a 3.9.", type: "ISSUE", rating: 2, days: 2, meta: { role: "student", grade: "12" } },
    { body: "My daughter is going into engineering and she is getting art contests and creative writing awards.", type: "ISSUE", rating: 2, days: 4, email: "d.moreau@example.com", meta: { role: "parent" } },
    { body: "The filtering feels loose. I said computer science and I'm getting anything vaguely technical, including things for professionals with five years experience.", type: "ISSUE", rating: 3, days: 6, meta: { role: "student", grade: "11" } },
    { body: "Would rather see 5 things I actually qualify for than 40 I have to read and reject.", type: "IDEA", rating: 3, days: 9, meta: { role: "student", grade: "12" } },

    // Stale listings. Adjacent to relevance and a real trust problem, but a
    // different fix. Worth watching whether these get merged into the above.
    { body: "Spent an hour on an application and then found the deadline was in March. The listing still says open.", type: "ISSUE", rating: 1, days: 1, email: "jtorres@example.com", meta: { role: "student", grade: "12" } },
    { body: "Clicked through to three programs today and two of the pages were 404.", type: "ISSUE", rating: 2, days: 3, meta: { role: "student", grade: "11" } },
    { body: "A listing said rolling admissions and the actual site said applications closed last year.", type: "ISSUE", rating: 2, days: 5, meta: { role: "parent" } },
    { body: "Please check the links. If half of them are dead I have to verify everything myself and then what am I paying for.", type: "ISSUE", rating: 2, days: 8, meta: { role: "parent" } },

    // Deadline reminders. The clearest single request in the set: several
    // people arriving at the same feature from different directions.
    { body: "I need a reminder a few days before a deadline. I save things and then completely forget them.", type: "IDEA", rating: 4, days: 2, meta: { role: "student", grade: "11" } },
    { body: "Can I get the deadlines into Google Calendar? I live out of my calendar and not out of a feed.", type: "QUESTION", rating: 4, days: 4, meta: { role: "student", grade: "12" } },
    { body: "Email me on Sunday with what closes that week. That is the only thing I actually need from this.", type: "IDEA", rating: 5, days: 7, email: "s.nakamura@example.com", meta: { role: "parent" } },
    { body: "Missed two deadlines that were sitting in my saved list. Some kind of nudge would have caught both.", type: "ISSUE", rating: 3, days: 11, meta: { role: "student", grade: "12" } },

    // Onboarding. Same shape of problem as any product, different specifics:
    // the profile is the thing matching runs on, so a rushed one poisons the feed.
    { body: "The interest picker went on forever. I gave up and just clicked things to get through it.", type: "ISSUE", rating: 2, days: 3, meta: { role: "student", grade: "10" } },
    { body: "Asked for my GPA and test scores before telling me what it was going to do with them. I nearly closed the tab.", type: "ISSUE", rating: 2, days: 6, meta: { role: "student", grade: "11" } },
    { body: "I could not find how to change my major after setup. Ended up making a second account.", type: "ISSUE", rating: 2, days: 10, email: "leo.fisher@example.com", meta: { role: "student", grade: "12" } },
    { body: "Let me edit my profile from the feed. If the matches are wrong the fix is three menus away.", type: "IDEA", rating: 3, days: 12, meta: { role: "student", grade: "11" } },

    // Tracking what you applied to. Distinct from saving.
    { body: "There's no way to mark something as applied, so my saved list is now a mix of done and not done.", type: "ISSUE", rating: 3, days: 2, meta: { role: "student", grade: "12" } },
    { body: "I'm tracking applications in a spreadsheet next to this, which sort of defeats the point.", type: "IDEA", rating: 3, days: 5, meta: { role: "student", grade: "12" } },
    { body: "Some kind of status on each one. Applied, waiting, rejected, in. I have 14 of these going.", type: "IDEA", rating: 4, days: 9, email: "hannah.o@example.com", meta: { role: "student", grade: "12" } },

    // Parents. A whole second audience with one shared need.
    { body: "I'm the one paying and I can only see any of this by logging in as my son, which he hates.", type: "ISSUE", rating: 2, days: 4, meta: { role: "parent" } },
    { body: "Is there a parent view? I want to see what he's applied to without reading over his shoulder.", type: "QUESTION", rating: 3, days: 7, email: "rachel.b@example.com", meta: { role: "parent" } },
    { body: "Would pay more for a version where I get the weekly summary and my kid gets the feed.", type: "IDEA", rating: 4, days: 13, meta: { role: "parent" } },

    // Mobile.
    { body: "The feed is unusable on my phone. Cards run off the side and I can't scroll them.", type: "ISSUE", rating: 2, days: 3, meta: { role: "student", grade: "11" } },
    { body: "Is there an app? Everyone I know does everything on their phone, nobody is opening a laptop for this.", type: "QUESTION", rating: 3, days: 8, meta: { role: "student", grade: "10" } },

    // Praise. Should collapse to one theme, not five.
    { body: "Found a summer research program through this that I'd never have heard of otherwise. Got in.", type: "PRAISE", rating: 5, days: 1, email: "wei.zhang@example.com", meta: { role: "student", grade: "11" } },
    { body: "Genuinely saved me hours. I was searching random sites every weekend before this.", type: "PRAISE", rating: 5, days: 4, meta: { role: "student", grade: "12" } },
    { body: "My son has applied to more in a month than he did all of last year. That alone is worth it.", type: "PRAISE", rating: 5, days: 6, meta: { role: "parent" } },
    { body: "The feed is beautiful and it loads instantly. Rare combination.", type: "PRAISE", rating: 5, days: 10, meta: { role: "student", grade: "12" } },
    { body: "Recommended it to my whole robotics team.", type: "PRAISE", rating: 5, days: 14, meta: { role: "student", grade: "11" } },

    // Singletons. Each one real, none of them a theme, and the clustering has
    // to decide to leave them alone.
    { body: "I'm an international student on an F-1 and I can't tell which of these I'm eligible for. A filter for that would change everything.", type: "IDEA", rating: 3, days: 5, meta: { role: "student", grade: "12" } },
    { body: "Any chance of essay help? Finding the scholarship turns out to be the easy half.", type: "IDEA", rating: 4, days: 8, meta: { role: "student", grade: "12" } },
    { body: "Is the free version limited by how many matches I see, or by time? The pricing page wasn't clear to me.", type: "QUESTION", rating: 3, days: 11, meta: { role: "parent" } },
    { body: "Three emails a day is too many. Once a week and I'd read all of it.", type: "ISSUE", rating: 3, days: 12, meta: { role: "student", grade: "11" } },
  ],
};

export const seedProfiles = { atacana, lanci } as const;

export type SeedProfileKey = keyof typeof seedProfiles;
