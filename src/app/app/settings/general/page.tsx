"use client";

import Link from "next/link";
import { Download, Loader2, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { api } from "@/trpc/client";

export default function GeneralSettings() {
  const org = api.org.current.useQuery();

  if (org.isLoading || !org.data) return <Skeleton className="h-64 rounded-xl" />;

  return (
    // Keying on the org id lets the form own its state outright. Seeding form
    // fields from a query inside an effect is the classic source of "my typing
    // got reverted" bugs; remounting on identity change sidesteps it entirely.
    <GeneralForm
      key={org.data.org.id}
      orgName={org.data.org.name}
      initialName={org.data.org.name}
      initialTimezone={org.data.org.timezone}
      digestEnabled={org.data.org.digestEnabled}
      digestLastSentAt={org.data.org.digestLastSentAt}
      analysisEnabled={org.data.org.analysisEnabled}
      hasDigest={org.data.limits.features.includes("digest")}
      role={org.data.role}
    />
  );
}

function GeneralForm({
  orgName,
  initialName,
  initialTimezone,
  digestEnabled,
  digestLastSentAt,
  analysisEnabled,
  hasDigest,
  role,
}: {
  orgName: string;
  initialName: string;
  initialTimezone: string;
  digestEnabled: boolean;
  digestLastSentAt: Date | null;
  analysisEnabled: boolean;
  hasDigest: boolean;
  role: "OWNER" | "ADMIN" | "MEMBER";
}) {
  const isAdmin = role === "OWNER" || role === "ADMIN";
  const utils = api.useUtils();
  const [name, setName] = useState(initialName);
  const [timezone, setTimezone] = useState(initialTimezone);

  const dirty = name !== initialName || timezone !== initialTimezone;

  const update = api.org.update.useMutation({
    onSuccess() {
      toast.success("Saved.");
      void utils.org.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const preview = api.org.sendDigestPreview.useMutation({
    onSuccess(result) {
      if (result.delivered) {
        toast.success(`This week's digest is on its way to ${result.to}.`);
      } else {
        toast.success("Digest rendered.", {
          description:
            "Email isn't configured, so it was written to the server log instead.",
        });
      }
    },
    onError: (e) =>
      toast.error(
        e.message.startsWith("UPGRADE_REQUIRED:")
          ? "Weekly digests start on the Pro plan."
          : e.message,
      ),
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-paper-2 p-6">
        <h2 className="text-[1rem] font-semibold text-ink">Organization</h2>
        <p className="mt-1 text-[0.85rem] text-steel">
          Shown in the dashboard and on your weekly digest emails.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="name" className="text-[0.83rem] font-medium text-ink">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 h-10 max-w-sm border-line bg-paper"
            />
          </div>

          <div>
            <Label
              htmlFor="timezone"
              className="text-[0.83rem] font-medium text-ink"
            >
              Timezone
            </Label>
            <p className="mt-0.5 text-[0.76rem] text-steel">
              Used for daily buckets on charts and when digests are sent.
            </p>
            <Input
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="America/New_York"
              className="mt-1.5 h-10 max-w-sm border-line bg-paper tnum text-[0.85rem]"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={!dirty || update.isPending}
          onClick={() => update.mutate({ name, timezone })}
          className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-lg bg-ink px-4 text-[0.85rem] font-semibold text-paper disabled:opacity-40"
        >
          {update.isPending && <Loader2 className="size-3.5 animate-spin" />}
          Save changes
        </button>
      </section>

      <section className="rounded-xl border border-line bg-paper-2 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-[52ch]">
            <h2 className="text-[1rem] font-semibold text-ink">
              Weekly digest
            </h2>
            <p className="mt-1 text-[0.85rem] leading-relaxed text-steel">
              Monday morning, everyone on the team gets the three themes worth
              acting on, how the volume moved, and a few quotes worth reading.
              Quiet weeks send nothing.
            </p>
            {digestLastSentAt && (
              <p className="mt-2 text-[0.78rem] text-steel">
                Last sent{" "}
                {new Date(digestLastSentAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                })}
                .
              </p>
            )}
          </div>

          <Switch
            checked={digestEnabled}
            // Gated on role as well as plan: a member who can't perform the
            // mutation shouldn't be shown a live-looking switch that throws.
            disabled={!hasDigest || !isAdmin || update.isPending}
            onCheckedChange={(next) => update.mutate({ digestEnabled: next })}
            aria-label="Weekly digest for the whole team"
          />
        </div>

        {hasDigest && <MyDigestPreference />}

        {hasDigest ? (
          <button
            type="button"
            disabled={preview.isPending}
            onClick={() => preview.mutate()}
            className="mt-5 inline-flex min-h-9 items-center gap-2 rounded-lg border border-line px-3.5 text-[0.83rem] font-medium text-steel transition-colors hover:text-ink disabled:opacity-50"
          >
            {preview.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            {preview.isPending
              ? "Building this week's digest…"
              : "Send me this week's digest now"}
          </button>
        ) : (
          <p className="mt-5 text-[0.83rem] text-steel">
            Digests start on the Pro plan.{" "}
            <Link
              href="/app/settings/billing"
              className="font-medium text-mint-deep hover:underline"
            >
              See plans
            </Link>
          </p>
        )}
      </section>

      <section className="rounded-xl border border-line bg-paper-2 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-[52ch]">
            <h2 className="text-[1rem] font-semibold text-ink">AI analysis</h2>
            <p className="mt-1 text-[0.85rem] leading-relaxed text-steel">
              Feedback text is sent to DeepSeek, in China, for sentiment and
              theme analysis. Email addresses and identify traits are never
              included in a prompt, that&apos;s enforced in the code, not just
              policy.
            </p>
            <p className="mt-2 text-[0.85rem] leading-relaxed text-steel">
              Turn it off and nothing leaves for the model. Feedback is still
              collected, stored, and shown to you; it just arrives without
              sentiment or themes.
            </p>
          </div>

          <Switch
            checked={analysisEnabled}
            disabled={!isAdmin || update.isPending}
            onCheckedChange={(next) => update.mutate({ analysisEnabled: next })}
            aria-label="AI analysis"
          />
        </div>

        {!isAdmin && (
          <p className="mt-4 text-[0.8rem] text-steel">
            Only an admin can change this.
          </p>
        )}
      </section>

      <PrivacySection orgName={orgName} isOwner={role === "OWNER"} />
    </div>
  );
}

/**
 * The individual's own opt-out, sitting under the org-wide switch.
 *
 * Separate control because they answer different questions: the one above is
 * "does this team get a digest", this one is "do I". Somebody who wants the
 * Monday email to stop should never have to ask an admin, and this is the same
 * switch the one-click unsubscribe in the email footer flips.
 */
function MyDigestPreference() {
  const utils = api.useUtils();
  const pref = api.org.myDigestPreference.useQuery();

  const setPref = api.org.setMyDigestPreference.useMutation({
    onSuccess(_data, variables) {
      toast.success(
        variables.optOut
          ? "You're unsubscribed from the digest."
          : "You'll get the digest again.",
      );
      void utils.org.myDigestPreference.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!pref.data) return null;

  return (
    <div className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-line bg-paper px-4 py-3">
      <div>
        <div className="text-[0.85rem] font-medium text-ink">Send it to me</div>
        <p className="mt-0.5 text-[0.78rem] text-steel">
          Your own copy. Turning this off doesn&apos;t affect anyone else.
        </p>
      </div>
      <Switch
        checked={!pref.data.optOut}
        disabled={setPref.isPending}
        onCheckedChange={(next) => setPref.mutate({ optOut: !next })}
        aria-label="Send the weekly digest to me"
      />
    </div>
  );
}

/* ------------------------------------------------------------ data controls */

/**
 * Export and deletion in one place.
 *
 * The privacy policy promises both, so they have to be buttons rather than an
 * inbox somebody remembers to action. Export is open to every member on every
 * plan: the people most likely to want their data out are the ones leaving,
 * and charging them for the exit is the wrong trade.
 */
function PrivacySection({
  orgName,
  isOwner,
}: {
  orgName: string;
  isOwner: boolean;
}) {
  const [confirmName, setConfirmName] = useState("");
  const [confirming, setConfirming] = useState(false);

  const exportData = api.org.exportData.useMutation({
    onSuccess(data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `voicebox-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded.");
    },
    onError: (e) => toast.error(e.message),
  });

  const destroy = api.org.deleteOrganization.useMutation({
    onSuccess() {
      toast.success("Organization deleted.");
      // Nothing left to render against, so leave the app entirely.
      window.location.href = "/";
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <section className="rounded-xl border border-line bg-paper-2 p-6">
        <h2 className="text-[1rem] font-semibold text-ink">Your data</h2>
        <p className="mt-1 max-w-[62ch] text-[0.85rem] leading-relaxed text-steel">
          One JSON file with every project, every piece of feedback, every
          theme, and your settings. Available on every plan, to every member.
        </p>

        <button
          type="button"
          disabled={exportData.isPending}
          onClick={() => exportData.mutate()}
          className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3.5 text-[0.84rem] font-medium text-steel transition-colors hover:text-ink disabled:opacity-50"
        >
          {exportData.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {exportData.isPending ? "Gathering everything…" : "Export everything"}
        </button>
      </section>

      {isOwner && (
        <section className="rounded-xl border border-negative/40 bg-paper-2 p-6">
          <h2 className="text-[1rem] font-semibold text-ink">
            Delete this organization
          </h2>
          <p className="mt-1 max-w-[62ch] text-[0.85rem] leading-relaxed text-steel">
            Removes every project, every piece of feedback your users sent, every
            theme, and the accounts of anyone who is only a member here. It
            happens immediately and cannot be undone. Export first.
          </p>

          {confirming ? (
            <div className="mt-5 space-y-3">
              <Label
                htmlFor="confirm-name"
                className="text-[0.83rem] font-medium text-ink"
              >
                Type <span className="font-semibold">{orgName}</span> to confirm
              </Label>
              <Input
                id="confirm-name"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                autoComplete="off"
                className="h-10 max-w-sm border-line bg-paper"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={confirmName.trim() !== orgName || destroy.isPending}
                  onClick={() => destroy.mutate({ confirmName })}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-negative px-4 text-[0.84rem] font-semibold text-paper disabled:opacity-40"
                >
                  {destroy.isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  {destroy.isPending ? "Deleting…" : "Delete permanently"}
                </button>
                <button
                  type="button"
                  disabled={destroy.isPending}
                  onClick={() => {
                    setConfirming(false);
                    setConfirmName("");
                  }}
                  className="min-h-10 rounded-lg px-3 text-[0.84rem] font-medium text-steel hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-negative/50 px-3.5 text-[0.84rem] font-medium text-negative transition-colors hover:bg-negative-wash"
            >
              <Trash2 className="size-4" />
              Delete organization
            </button>
          )}
        </section>
      )}
    </>
  );
}
