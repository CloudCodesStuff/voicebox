/**
 * Renders every email the product sends to `.email-preview/`, then prints the
 * paths.
 *
 *   npm run email:preview
 *
 * Nothing is sent and no database is touched: the digest is built from a
 * fixture rather than a query, so this runs on a clone with an empty .env.
 *
 * It exists because email is the one surface you cannot see while you work on
 * it. Every template here was written blind at least once, and the defects
 * that produced — Times New Roman in half the digest, a button with no
 * padding in Outlook, a card that ignored its own max-width — are all things
 * a thirty-second look would have caught.
 *
 * Open the files in a browser for layout and dark mode (devtools can force
 * `prefers-color-scheme`). A browser is not a mail client, so it will not tell
 * you what Outlook does with any of it; for that the files are small enough to
 * paste into Litmus or just mail one to yourself.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { renderDigest, type Digest } from "@/server/lib/emails/digest";
import { renderInvite } from "@/server/lib/emails/invite";
import { renderSignIn } from "@/server/lib/emails/signin";

const OUT = resolve(process.cwd(), ".email-preview");

/**
 * A digest with something in every branch: a project with themes and quotes,
 * a new theme, a project below the threshold for a pattern, a rise and a fall
 * week on week. Rendering only the happy path is how the empty states stay
 * ugly.
 */
const digestFixture: Digest = {
  orgName: "Northwind",
  since: new Date("2026-08-26T00:00:00Z"),
  total: 148,
  projects: [
    {
      name: "Northwind Dashboard",
      total: 132,
      previous: 94,
      negativeShare: 0.41,
      themes: [
        {
          id: "thm_1",
          title: "CSV export times out on ranges over a year",
          itemCount: 34,
          negativeShare: 0.88,
          isNew: false,
        },
        {
          id: "thm_2",
          title: "No way to invite a teammate as read-only",
          itemCount: 19,
          negativeShare: 0.21,
          isNew: true,
        },
        {
          id: "thm_3",
          title: "Positive feedback",
          itemCount: 12,
          negativeShare: 0,
          isNew: false,
        },
      ],
      quotes: [
        {
          body: "Tried to export last year's invoices four times and it spins forever, then gives me a 502. Ended up copying rows out by hand.",
          sentiment: "NEGATIVE",
        },
        {
          body: "I want to give our accountant a login that can look but not touch. Right now the only option makes them an admin, which I'm not doing.",
          sentiment: "NEGATIVE",
        },
        {
          body: "The weekly summary is genuinely the only product email I read.",
          sentiment: "POSITIVE",
        },
      ],
    },
    {
      name: "Northwind Marketing Site",
      total: 16,
      previous: 31,
      negativeShare: 0.12,
      themes: [],
      quotes: [
        {
          body: "Pricing page doesn't say whether the seat count is per month or per year.",
          sentiment: "NEUTRAL",
        },
      ],
    },
  ],
};

function write(name: string, html: string, subject: string): string {
  const path = join(OUT, `${name}.html`);
  writeFileSync(path, html, "utf8");
  console.log(`  ${name.padEnd(10)} ${path}\n             subject: ${subject}`);
  return path;
}

function main(): void {
  mkdirSync(OUT, { recursive: true });
  console.log("\n  Rendered:\n");

  const signIn = renderSignIn({
    to: "reader@example.com",
    url: "https://www.usevoicebox.dev/api/auth/callback/resend?token=example-single-use-token&email=reader%40example.com",
    expiresInMinutes: 30,
  });
  write("signin", signIn.html, signIn.subject);

  const invite = renderInvite({
    to: "reader@example.com",
    orgName: "Northwind",
    inviterName: "Dana Okonjo",
    inviterEmail: "dana@northwind.example",
    token: "example-invite-token",
    expiresAt: new Date("2026-09-16T00:00:00Z"),
  });
  write("invite", invite.html, invite.subject);

  const digest = renderDigest(
    digestFixture,
    "https://www.usevoicebox.dev/api/email/unsubscribe?t=example",
  );
  write(
    "digest",
    digest.html,
    `Northwind: ${digestFixture.total} new pieces of feedback, and what to do about it`,
  );

  // The plain-text alternative is what a screen reader and a text-only client
  // get, and it is never looked at. Printing it is the cheapest way to keep it
  // honest.
  console.log("\n  ── digest, plain text ──\n");
  console.log(
    digest.text
      .split("\n")
      .map((l) => `  │ ${l}`)
      .join("\n"),
  );
  console.log("");
}

main();
