/**
 * End-to-end check of the public API and webhook signing.
 *
 *   npm run smoke:api
 *
 * Mints a temporary key against the real database, exercises every v1 endpoint
 * over HTTP against the running dev server, verifies the auth failures behave,
 * then revokes the key. Nothing is left behind.
 */

import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { apiKey } from "../src/server/lib/ids";
import { signWebhook, verifyWebhook } from "../src/server/lib/webhooks";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

let failures = 0;

function check(label: string, ok: boolean, detail?: unknown) {
  console.log(`  ${ok ? "✓" : "✗"} ${label}`);
  if (!ok) {
    failures++;
    if (detail !== undefined) console.log("      ", detail);
  }
}

async function get(path: string, token: string | null) {
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function main() {
  const org = await db.organization.findFirst({
    include: { subscription: true, projects: { take: 1 } },
    orderBy: { createdAt: "asc" },
  });

  if (!org) {
    console.log("\n  No organizations. Run `npm run db:seed` first.\n");
    process.exit(1);
  }

  console.log(`\n  Organization  ${org.name}`);
  console.log(`  Plan          ${org.subscription?.plan ?? "none"}`);
  console.log(`  Server        ${BASE}\n`);

  const generated = apiKey();
  const created = await db.apiKey.create({
    data: {
      orgId: org.id,
      name: "smoke test (temporary)",
      hashedKey: generated.hashed,
      prefix: generated.prefix,
    },
  });

  try {
    console.log("  Auth");
    const noKey = await get("/api/v1/themes", null);
    check("no key is rejected with 401", noKey.status === 401, noKey.body);

    const badKey = await get("/api/v1/themes", "sk_totally_made_up");
    check("unknown key is rejected with 401", badKey.status === 401, badKey.body);

    const plan = org.subscription?.plan ?? "FREE";
    const gated = plan === "FREE" || plan === "STARTER";

    if (gated) {
      const blocked = await get("/api/v1/themes", generated.plaintext);
      check(
        `${plan} plan is refused with 403`,
        blocked.status === 403,
        blocked.body,
      );
      console.log(
        "\n  This org is below Pro, so the read endpoints correctly refuse.",
      );
      console.log("  Point OWNER_EMAIL at a Pro/Scale org to exercise them.\n");
    } else {
      console.log("\n  Endpoints");

      const themes = await get("/api/v1/themes?limit=3", generated.plaintext);
      check("GET /api/v1/themes", themes.status === 200, themes.body);
      check(
        "  returns a data array",
        Array.isArray(themes.body?.data),
        themes.body,
      );

      const feedback = await get(
        "/api/v1/feedback?limit=3",
        generated.plaintext,
      );
      check("GET /api/v1/feedback", feedback.status === 200, feedback.body);

      const first = feedback.body?.data?.[0];
      if (first) {
        check(
          "  internal metadata is stripped",
          first.metadata === null || !("_ip" in (first.metadata ?? {})),
          first.metadata,
        );
        const one = await get(
          `/api/v1/feedback/${first.id}`,
          generated.plaintext,
        );
        check("GET /api/v1/feedback/:id", one.status === 200, one.body);
      }

      const projects = await get("/api/v1/projects", generated.plaintext);
      check("GET /api/v1/projects", projects.status === 200, projects.body);
      check(
        "  hashed key never appears in a response",
        !JSON.stringify(projects.body).includes("hashedKey"),
      );

      const missing = await get(
        "/api/v1/feedback?project_id=does_not_exist",
        generated.plaintext,
      );
      check("unknown project_id gives 404", missing.status === 404, missing.body);

      const badSince = await get(
        "/api/v1/feedback?since=yesterday",
        generated.plaintext,
      );
      check("bad `since` gives 400", badSince.status === 400, badSince.body);
    }

    console.log("\n  Webhook signing");
    const secret = "whsec_test";
    const body = JSON.stringify({ event: "feedback.created" });
    const now = Math.floor(Date.now() / 1000);
    const header = `t=${now},v1=${signWebhook(secret, now, body)}`;

    check("a valid signature verifies", verifyWebhook(secret, header, body));
    check(
      "a tampered body fails",
      !verifyWebhook(secret, header, `${body} `),
    );
    check(
      "the wrong secret fails",
      !verifyWebhook("whsec_other", header, body),
    );
    const old = now - 3600;
    check(
      "a stale timestamp fails",
      !verifyWebhook(secret, `t=${old},v1=${signWebhook(secret, old, body)}`, body),
    );

    console.log("\n  Revocation");
    await db.apiKey.update({
      where: { id: created.id },
      data: { revokedAt: new Date() },
    });
    const revoked = await get("/api/v1/themes", generated.plaintext);
    check("a revoked key is rejected", revoked.status === 401, revoked.body);
  } finally {
    await db.apiKey.delete({ where: { id: created.id } }).catch(() => {});
  }

  console.log(
    failures === 0
      ? "\n  All checks passed.\n"
      : `\n  ${failures} check(s) failed.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main()
  .catch((error) => {
    console.error("\n  Smoke test crashed:", error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
