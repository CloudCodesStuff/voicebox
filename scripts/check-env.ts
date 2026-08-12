/**
 * Environment doctor.
 *
 *   npm run env:check
 *
 * Prints what's configured, what's missing, and what each gap actually costs,
 * so a fresh clone can be brought up without reading source to find out why a
 * feature is quiet.
 *
 * The Resend section does a live check rather than only looking for a key.
 * A key can be present and correct and still refuse to deliver, which is what
 * the shared `onboarding@resend.dev` sender does: it only reaches the account
 * owner's own address. That fails silently in the product and looks like a
 * bug in the invite code, so it gets caught here instead.
 */

import "dotenv/config";

type Check = { name: string; present: boolean; problem?: string };

type Group = {
  title: string;
  required: boolean;
  /** What stops working when this group is incomplete. */
  consequence: string;
  checks: Check[];
};

const has = (key: string) => Boolean(process.env[key]?.trim());

function check(name: string, validate?: (v: string) => string | null): Check {
  const raw = process.env[name]?.trim();
  if (!raw) return { name, present: false };
  const problem = validate ? validate(raw) : null;
  return { name, present: !problem, problem: problem ?? undefined };
}

const startsWith = (prefix: string) => (v: string) =>
  v.startsWith(prefix) ? null : `should start with "${prefix}"`;

const isUrl = (v: string) => {
  try {
    new URL(v);
    return null;
  } catch {
    return "is not a valid URL";
  }
};

const groups: Group[] = [
  {
    title: "Core",
    required: true,
    consequence: "Nobody can sign in and no feedback can be stored.",
    checks: [
      check("DATABASE_URL", (v) =>
        v.startsWith("postgres") ? null : 'should be a "postgresql://..." URL',
      ),
      check("AUTH_SECRET", (v) =>
        v.length >= 32 ? null : `is ${v.length} chars, needs 32+`,
      ),
      check("AUTH_GOOGLE_ID"),
      check("AUTH_GOOGLE_SECRET"),
      check("NEXT_PUBLIC_APP_URL", isUrl),
    ],
  },
  {
    // These are not decoration. They are interpolated into the Terms, the
    // Privacy Policy, the DPA, and the footer of every email. Shipping with the
    // placeholders means the contract names no legal party, the Terms have no
    // governing law, and commercial email carries no postal address.
    title: "Legal identity",
    required: true,
    consequence:
      "The Terms name no contracting party, have no governing law, and email lacks the postal address CAN-SPAM requires.",
    checks: [
      check("NEXT_PUBLIC_LEGAL_ENTITY", (v) =>
        v.startsWith("[")
          ? "is still the placeholder, use your registered company name"
          : null,
      ),
      check("NEXT_PUBLIC_POSTAL_ADDRESS", (v) =>
        v.startsWith("[") ? "is still the placeholder" : null,
      ),
      check("NEXT_PUBLIC_GOVERNING_LAW", (v) =>
        v.startsWith("[") ? "is still the placeholder" : null,
      ),
      check("NEXT_PUBLIC_VENUE", (v) =>
        v.startsWith("[") ? "is still the placeholder" : null,
      ),
    ],
  },
  {
    title: "AI analysis",
    required: false,
    consequence:
      "Feedback is still collected, but nothing is scored and no themes are found.",
    checks: [check("DEEPSEEK_API_KEY")],
  },
  {
    title: "Email",
    required: false,
    consequence:
      "Invites and weekly digests are written to the console instead of sent.",
    checks: [
      check("RESEND_API_KEY", startsWith("re_")),
      check("EMAIL_FROM", (v) =>
        v.includes("@") ? null : "should contain an email address",
      ),
    ],
  },
  {
    title: "Scheduled jobs",
    required: false,
    consequence:
      "Failed analysis is never retried, themes only regroup when you click the button, and no digests go out.",
    checks: [
      check("CRON_SECRET", (v) =>
        v.length >= 16 ? null : `is ${v.length} chars, needs 16+`,
      ),
    ],
  },
  {
    title: "Billing",
    required: false,
    consequence: "Every organization stays on Free and upgrades are disabled.",
    checks: [
      check("STRIPE_SECRET_KEY", startsWith("sk_")),
      check("STRIPE_WEBHOOK_SECRET", startsWith("whsec_")),
      check("STRIPE_PRICE_STARTER_MONTHLY", startsWith("price_")),
      check("STRIPE_PRICE_STARTER_ANNUAL", startsWith("price_")),
      check("STRIPE_PRICE_PRO_MONTHLY", startsWith("price_")),
      check("STRIPE_PRICE_PRO_ANNUAL", startsWith("price_")),
      check("STRIPE_PRICE_SCALE_MONTHLY", startsWith("price_")),
      check("STRIPE_PRICE_SCALE_ANNUAL", startsWith("price_")),
    ],
  },
];

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

/**
 * Asks Resend which domains are verified, and says plainly whether the
 * configured sender can actually reach anyone.
 */
async function probeResend(): Promise<string[]> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!key || !from) return [];

  const address = from.match(/<([^>]+)>/)?.[1] ?? from;
  const domain = address.split("@")[1]?.toLowerCase() ?? "";
  const notes: string[] = [];

  if (domain === "resend.dev") {
    notes.push(
      `${YELLOW}EMAIL_FROM uses Resend's shared test sender.${RESET}\n` +
        `   It will only deliver to the email address that owns the Resend account.\n` +
        `   Every other recipient gets a 403, so invites and digests appear to vanish.\n` +
        `   Fix: verify a domain at ${BOLD}resend.com/domains${RESET}, then set\n` +
        `   ${BOLD}EMAIL_FROM="Voicebox <hello@yourdomain.com>"${RESET}.`,
    );
  }

  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (res.status === 401) {
      notes.push(`${RED}RESEND_API_KEY was rejected by Resend (401).${RESET}`);
      return notes;
    }

    const body = (await res.json()) as {
      data?: Array<{ name: string; status: string }>;
    };
    const domains = body.data ?? [];
    const verified = domains.filter((d) => d.status === "verified");

    if (verified.length === 0) {
      notes.push(
        `${YELLOW}No verified domains on this Resend account.${RESET}\n` +
          `   Until one is verified you can only email yourself.`,
      );
    } else if (domain !== "resend.dev" && !verified.some((d) => domain.endsWith(d.name))) {
      notes.push(
        `${RED}EMAIL_FROM is @${domain}, which is not verified.${RESET}\n` +
          `   Verified: ${verified.map((d) => d.name).join(", ")}`,
      );
    } else if (domain !== "resend.dev") {
      notes.push(`${GREEN}Sending domain @${domain} is verified.${RESET}`);
    }
  } catch {
    notes.push(`${DIM}Could not reach Resend to check domains.${RESET}`);
  }

  return notes;
}

async function main() {
  console.log(`\n${BOLD}Voicebox, environment check${RESET}\n`);

  let coreBroken = false;
  let optionalIncomplete = 0;

  for (const group of groups) {
    const ok = group.checks.every((c) => c.present);
    const icon = ok
      ? `${GREEN}●${RESET}`
      : group.required
        ? `${RED}●${RESET}`
        : `${YELLOW}○${RESET}`;

    console.log(`${icon} ${BOLD}${group.title}${RESET}`);

    for (const c of group.checks) {
      if (c.present) {
        console.log(`   ${GREEN}✓${RESET} ${DIM}${c.name}${RESET}`);
      } else if (c.problem) {
        console.log(`   ${RED}✗${RESET} ${c.name} ${DIM}, ${c.problem}${RESET}`);
      } else {
        const mark = group.required ? `${RED}✗${RESET}` : `${YELLOW}·${RESET}`;
        console.log(`   ${mark} ${c.name} ${DIM}, not set${RESET}`);
      }
    }

    if (!ok) {
      console.log(`   ${DIM}→ ${group.consequence}${RESET}`);
      if (group.required) coreBroken = true;
      else optionalIncomplete++;
    }

    console.log();
  }

  for (const note of await probeResend()) {
    console.log(`   ${note}\n`);
  }

  if (coreBroken) {
    console.log(
      `${RED}${BOLD}Core configuration is incomplete.${RESET} The app will not run.\n` +
        `Copy ${BOLD}.env.example${RESET} to ${BOLD}.env${RESET} and fill in the CORE block.\n` +
        `Every variable has a comment saying exactly where to get it.\n`,
    );
    process.exit(1);
  }

  if (optionalIncomplete > 0) {
    console.log(
      `${GREEN}${BOLD}Core is ready.${RESET} ${optionalIncomplete} optional group(s) are off.\n` +
        `The app runs without them. Add them when you need them.\n`,
    );
  } else {
    console.log(`${GREEN}${BOLD}Everything is configured.${RESET}\n`);
  }

  if (process.env.NEXT_PUBLIC_APP_URL?.endsWith("/")) {
    console.log(
      `${YELLOW}NEXT_PUBLIC_APP_URL ends with a slash.${RESET} It is pasted straight into\n` +
        `the widget install snippet, so drop it to avoid a double slash.\n`,
    );
  }

  if (has("DEEPSEEK_API_KEY") && !has("CRON_SECRET")) {
    console.log(
      `${YELLOW}AI is on but CRON_SECRET is not set.${RESET} Analysis that fails at\n` +
        `submission time will never be retried, and themes only regroup on demand.\n`,
    );
  }
}

void main();
