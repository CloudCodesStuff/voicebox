"use client";

import Link from "next/link";
import { AlertTriangle, TriangleAlert } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";

export default function AdminOverview() {
  const overview = api.admin.overview.useQuery();
  const trend = api.admin.trend.useQuery();

  if (overview.isLoading || !overview.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const d = overview.data;
  const health = d.health;
  const problems =
    health.failedRuns7 + health.disabledWebhooks + d.openErrors;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[1.55rem] font-bold tracking-tight text-ink">
          Overview
        </h1>
        <p className="mt-1.5 text-[0.88rem] text-steel">
          Aggregates across every workspace. No customer feedback content is
          shown here, by design.
        </p>
      </div>

      {/* Anything actively wrong, above everything else. A dashboard where
          problems are mixed in with vanity metrics buries them. */}
      {problems > 0 && (
        <section className="rounded-xl border border-mixed/40 bg-mixed-wash p-5">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-mixed" />
            <div className="min-w-0 flex-1">
              <h2 className="text-[1rem] font-bold text-ink">Needs attention</h2>
              <ul className="mt-2 space-y-1 text-[0.88rem] text-steel">
                {d.openErrors > 0 && (
                  <li>
                    <Link
                      href="/admin/errors"
                      className="font-medium text-ink underline underline-offset-2"
                    >
                      {d.openErrors} unresolved error
                      {d.openErrors === 1 ? "" : "s"}
                    </Link>
                  </li>
                )}
                {health.failedRuns7 > 0 && (
                  <li>
                    {health.failedRuns7} failed analysis run
                    {health.failedRuns7 === 1 ? "" : "s"} in the last 7 days
                  </li>
                )}
                {health.disabledWebhooks > 0 && (
                  <li>
                    {health.disabledWebhooks} webhook
                    {health.disabledWebhooks === 1 ? "" : "s"} auto-disabled
                    after repeated delivery failures
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Revenue and scale */}
      <section>
        <h2 className="label">Business</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="MRR" value={`$${d.mrr}`} hint="From plan records" />
          <Stat label="Workspaces" value={d.orgs} hint={`${d.users} users`} />
          <Stat
            label="Paying"
            value={(d.planCounts.PRO ?? 0) + (d.planCounts.SCALE ?? 0)}
            hint={`${d.planCounts.FREE ?? 0} on free`}
            accent={(d.planCounts.PRO ?? 0) + (d.planCounts.SCALE ?? 0) > 0}
          />
          <Stat
            label="Feedback, 30d"
            value={d.feedback30.toLocaleString()}
            hint={`${d.feedbackTotal.toLocaleString()} all time`}
          />
        </div>
      </section>

      {/* Activation funnel */}
      <section>
        <h2 className="label">Activation</h2>
        <p className="mt-1 text-[0.83rem] text-steel">
          Each step is a subset of the one above it. The biggest drop is where
          the product is losing people.
        </p>
        <div className="mt-3 space-y-2">
          <FunnelRow
            label="Signed up"
            value={d.funnel.signedUp}
            of={d.funnel.signedUp}
          />
          <FunnelRow
            label="Created a workspace with a project"
            value={d.funnel.madeWorkspace}
            of={d.funnel.signedUp}
          />
          <FunnelRow
            label="Installed the widget (first feedback arrived)"
            value={d.funnel.installedWidget}
            of={d.funnel.signedUp}
          />
          <FunnelRow
            label="Active in the last 7 days"
            value={d.funnel.activeLast7}
            of={d.funnel.signedUp}
          />
        </div>
      </section>

      {/* Trend */}
      <section>
        <h2 className="label">Last 30 days</h2>
        {trend.data ? (
          <TrendChart data={trend.data} />
        ) : (
          <Skeleton className="mt-3 h-32 rounded-xl" />
        )}
      </section>

      {/* Operational health */}
      <section>
        <h2 className="label">System</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Projects"
            value={d.projects}
            hint={`${d.funnel.installedWidget} have received feedback`}
          />
          <Stat
            label="Awaiting analysis"
            value={d.unanalyzed}
            hint={d.unanalyzed > 50 ? "Backlog building" : "Healthy"}
            accent={d.unanalyzed > 50}
          />
          <Stat
            label="Failed runs, 7d"
            value={health.failedRuns7}
            accent={health.failedRuns7 > 0}
          />
          <Stat
            label="Open errors"
            value={d.openErrors}
            accent={d.openErrors > 0}
          />
        </div>

        {health.openAllowlists > 0 && (
          <div className="mt-3 flex gap-3 rounded-xl border border-line bg-paper-2 p-4">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-mixed" />
            <p className="text-[0.86rem] leading-relaxed text-steel">
              <strong className="font-semibold text-ink">
                {health.openAllowlists} of {health.totalProjects} projects
              </strong>{" "}
              accept feedback from any domain. That is the default for a new
              project, so some of this is expected, but it is also the setting
              that lets anyone who reads a project key post into that workspace.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-paper-2 p-4">
      <div className="label">{label}</div>
      <div
        className={cn(
          "tnum mt-1.5 text-[1.6rem] font-bold tracking-tight",
          accent ? "text-mixed" : "text-ink",
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[0.78rem] text-steel">{hint}</div>}
    </div>
  );
}

function FunnelRow({
  label,
  value,
  of,
}: {
  label: string;
  value: number;
  of: number;
}) {
  const pct = of > 0 ? Math.round((value / of) * 100) : 0;
  return (
    <div className="rounded-xl border border-line bg-paper-2 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[0.88rem] text-ink">{label}</span>
        <span className="tnum text-[0.88rem] text-steel">
          <strong className="font-semibold text-ink">{value}</strong> · {pct}%
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-mint transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Two series, one chart, no dependency.
 *
 * Bars are feedback volume, dots are new workspaces. Both are scaled to their
 * own maximum, which is the honest thing to do when one series is routinely
 * two orders of magnitude larger than the other.
 */
function TrendChart({
  data,
}: {
  data: Array<{ date: string; feedback: number; orgs: number }>;
}) {
  const maxFeedback = Math.max(1, ...data.map((d) => d.feedback));
  const totalOrgs = data.reduce((s, d) => s + d.orgs, 0);
  const totalFeedback = data.reduce((s, d) => s + d.feedback, 0);

  return (
    <div className="mt-3 rounded-xl border border-line bg-paper-2 p-5">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[0.8rem] text-steel">
        <span>
          <strong className="text-ink">{totalFeedback.toLocaleString()}</strong>{" "}
          feedback
        </span>
        <span>
          <strong className="text-ink">{totalOrgs}</strong> new workspaces
        </span>
      </div>

      <div className="mt-4 flex h-28 items-end gap-[3px]">
        {data.map((d) => (
          <div
            key={d.date}
            className="group relative flex-1"
            title={`${d.date}: ${d.feedback} feedback, ${d.orgs} new workspaces`}
          >
            <div
              className="w-full rounded-t-[2px] bg-mint/70 transition-colors group-hover:bg-mint"
              style={{
                height: `${Math.max(2, (d.feedback / maxFeedback) * 100)}px`,
              }}
            />
            {d.orgs > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-2 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-ink"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-2 flex justify-between text-[0.72rem] text-faint">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
