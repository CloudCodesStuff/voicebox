import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/server/db";
import { authorizeCron } from "@/server/lib/cron-auth";
import { buildDigest, sendDigest } from "@/server/lib/emails/digest";
import { captureError } from "@/server/lib/errors";
import { ensureUsageWindow, hasFeature } from "@/server/lib/plan";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Weekly insight digest.
 *
 * Scheduled Monday morning (see vercel.json). Three guards decide who gets one:
 *
 *   1. The org has the digest switched on.
 *   2. Their plan includes it.
 *   3. They haven't already had one in the last six days, so a retried or
 *      manually triggered run can't double-send.
 *
 * Orgs with nothing to report are skipped rather than sent an empty email,
 * which is the fastest way to teach someone to filter you.
 */

const MIN_DAYS_BETWEEN = 6;
const MAX_ORGS_PER_RUN = 50;

export async function GET(req: NextRequest) {
  const denied = authorizeCron(req);
  if (denied) return denied;

  try {
    return await run();
  } catch (error) {
    // This job has already failed in production once, on a 403 from the mail
    // provider, and the only trace was a 500 status on a Monday morning cron
    // invocation. Recording it is the difference between finding that out on
    // the day and finding it out when someone mentions they have not had a
    // digest in a month.
    await captureError({ source: "cron", error, context: { job: "digest" } });
    return NextResponse.json(
      { ok: false, error: "Digest run failed" },
      { status: 500 },
    );
  }
}

async function run(): Promise<NextResponse> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - MIN_DAYS_BETWEEN);

  const orgs = await db.organization.findMany({
    where: {
      digestEnabled: true,
      OR: [{ digestLastSentAt: null }, { digestLastSentAt: { lt: cutoff } }],
    },
    select: { id: true, name: true },
    take: MAX_ORGS_PER_RUN,
  });

  const sent: string[] = [];
  const skipped: Array<{ org: string; why: string }> = [];

  let failed = 0;

  for (const org of orgs) {
    // One workspace's failure must not cost the rest of the list their
    // digest. A single org with unexpected data would otherwise end the run
    // for everyone after it in the query, differently every week depending on
    // the ordering.
    try {
      const subscription = await ensureUsageWindow(db, org.id);
      if (!hasFeature(subscription.plan, "digest")) {
        skipped.push({ org: org.name, why: "plan" });
        continue;
      }

      const digest = await buildDigest(db, org.id);
      if (!digest) {
        skipped.push({ org: org.name, why: "nothing to report" });
        continue;
      }

      // Individual opt-outs are honored at the query, so someone who clicked
      // "unsubscribe" is never even considered as a recipient.
      const recipients = await db.membership.findMany({
        where: { orgId: org.id, digestOptOut: false },
        select: { id: true, user: { select: { email: true } } },
      });

      let delivered = 0;
      for (const membership of recipients) {
        if (!membership.user.email) continue;
        // Each message carries its own signed unsubscribe link, so the footer
        // and the List-Unsubscribe header stop this person's mail and nobody
        // else's.
        const result = await sendDigest(
          membership.user.email,
          digest,
          membership.id,
        );
        if (result.ok) {
          delivered++;
        } else {
          // `sendEmail` returns failures rather than throwing, by design, so
          // without this a rejected send is a number that quietly does not
          // go up. Fingerprinting means a misconfigured sender rejecting
          // every message in the run is one row with a count, not one per
          // recipient — which is what makes it safe to record here at all.
          await captureError({
            source: "email",
            error: new Error(`Digest send rejected: ${result.error}`),
            context: { job: "digest", orgId: org.id },
          });
        }
      }

      // Stamped even when zero landed. Retrying a broken mailbox every hour
      // for a week is worse than missing one digest.
      await db.organization.update({
        where: { id: org.id },
        data: { digestLastSentAt: new Date() },
      });

      sent.push(`${org.name} (${delivered})`);
    } catch (error) {
      failed += 1;
      await captureError({
        source: "cron",
        error,
        context: { job: "digest", orgId: org.id },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    considered: orgs.length,
    sent,
    skipped,
    failed,
    ranAt: new Date().toISOString(),
  });
}
