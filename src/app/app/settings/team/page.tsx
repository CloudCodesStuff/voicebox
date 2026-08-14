"use client";

import Link from "next/link";
import {
  Copy,
  Crown,
  Loader2,
  LogOut,
  Mail,
  Plus,
  TriangleAlert,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/app/avatar";
import { actionClass, relativeTime } from "@/components/app/ui";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/client";
import { SectionHeader } from "../section-header";

/**
 * Pulls addresses out of whatever got pasted.
 *
 * People invite a team by copying a column out of a spreadsheet or a line out
 * of Slack, so the field accepts commas, semicolons, newlines, spaces, and
 * `Name <addr@x.com>` all at once rather than making them tidy it up first.
 */
function parseEmails(input: string): string[] {
  const found = input.match(/[^\s<>,;]+@[^\s<>,;]+\.[^\s<>,;]+/g) ?? [];
  return [...new Set(found.map((e) => e.replace(/[.,;]+$/, "").toLowerCase()))];
}

type InviteOutcome = {
  email: string;
  status: "sent" | "created" | "already-member";
  reason?: string;
};

export default function TeamSettings() {
  const utils = api.useUtils();
  const members = api.org.members.useQuery();
  const invites = api.org.invites.useQuery();
  const org = api.org.current.useQuery();

  const [raw, setRaw] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [outcomes, setOutcomes] = useState<InviteOutcome[] | null>(null);
  /** Membership awaiting a confirmed ownership handover, if any. */
  const [transferTo, setTransferTo] = useState<string | null>(null);

  const emails = useMemo(() => parseEmails(raw), [raw]);

  const invite = api.org.invite.useMutation({
    onSuccess({ results }) {
      setOutcomes(results);
      setRaw("");
      void utils.org.invalidate();

      const sent = results.filter((r) => r.status === "sent").length;
      if (sent === results.length) {
        toast.success(sent === 1 ? "Invite sent." : `${sent} invites sent.`);
      }
    },
    onError(e) {
      if (e.message.startsWith("SEAT_LIMIT:")) {
        toast.error(
          `Your plan includes ${e.message.split(":")[1]} seats. Upgrade to add more.`,
        );
        return;
      }
      toast.error(e.message);
    },
  });

  const revoke = api.org.revokeInvite.useMutation({
    onSuccess() {
      toast.success("Invite revoked.");
      void utils.org.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const removeMember = api.org.removeMember.useMutation({
    onSuccess() {
      toast.success("Member removed.");
      void utils.org.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateRole = api.org.updateMemberRole.useMutation({
    onSuccess() {
      toast.success("Role updated.");
      void utils.org.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const transfer = api.org.transferOwnership.useMutation({
    onSuccess({ newOwner }) {
      toast.success(`${newOwner} owns this workspace now. You're an admin.`);
      setTransferTo(null);
      void utils.org.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (members.isLoading) return <Skeleton className="h-64 rounded-xl" />;

  const seats = org.data?.limits.seats;
  const used = (members.data?.length ?? 0) + (invites.data?.length ?? 0);
  const undelivered = outcomes?.filter((o) => o.status === "created") ?? [];
  const me = org.data?.me;
  const isOwner = me?.role === "OWNER";
  const canManage = me?.role === "OWNER" || me?.role === "ADMIN";
  const pendingTransfer = members.data?.find((m) => m.id === transferTo);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Team"
        description="Who can see this workspace and what they can change. Admins invite people and manage projects; members read feedback and act on it. Everyone can leave on their own."
      />
      <section className="rounded-xl border border-line bg-paper-2 p-6">
        <h2 className="text-[1rem] font-semibold text-ink">Members</h2>
        <p className="mt-1 text-[0.83rem] text-steel">
          {used} of {seats ?? "unlimited"} seats used
        </p>

        <ul className="mt-5 divide-y divide-line">
          {members.data?.map((m) => {
            const isMe = m.id === me?.membershipId;
            // Your own row and the owner's row are both read-only here: you
            // leave rather than remove yourself, and the owner changes only by
            // an explicit handover.
            const editable = canManage && !isMe && m.role !== "OWNER";

            return (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                <Avatar
                  src={m.user.image}
                  name={m.user.name}
                  email={m.user.email}
                  size={32}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[0.875rem] font-medium text-ink">
                      {m.user.name || m.user.email}
                    </span>
                    {isMe && (
                      <span className="shrink-0 text-[0.72rem] text-steel">
                        you
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[0.76rem] text-steel">
                    {m.user.email}
                  </div>
                </div>

                {editable ? (
                  <Select
                    value={m.role}
                    onValueChange={(v) =>
                      updateRole.mutate({
                        membershipId: m.id,
                        role: v as "ADMIN" | "MEMBER",
                      })
                    }
                  >
                    <SelectTrigger
                      aria-label={`Role for ${m.user.name || m.user.email}`}
                      className="w-28 rounded-lg border-line bg-paper text-[0.8rem] text-ink shadow-none data-[size=default]:h-9 dark:bg-paper dark:hover:bg-paper"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="rounded-full bg-sunken px-2.5 py-1 text-[0.75rem] font-medium text-steel capitalize">
                    {m.role.toLowerCase()}
                  </span>
                )}

                {/* Handing over the workspace is the owner's only way out, so
                    it sits next to the person they'd hand it to. */}
                {isOwner && !isMe && m.role !== "OWNER" && (
                  <button
                    type="button"
                    onClick={() => setTransferTo(m.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[0.78rem] font-medium text-steel hover:bg-muted hover:text-ink"
                  >
                    <Crown className="size-3.5" />
                    Make owner
                  </button>
                )}

                {editable && (
                  <button
                    type="button"
                    onClick={() => removeMember.mutate({ membershipId: m.id })}
                    className="grid size-8 place-items-center rounded-lg text-steel hover:bg-muted hover:text-negative"
                    aria-label={`Remove ${m.user.name || m.user.email}`}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {pendingTransfer && (
          <div className="mt-5 rounded-lg border border-mixed/30 bg-mixed-wash p-4">
            <p className="text-[0.85rem] font-semibold text-ink">
              Make {pendingTransfer.user.name || pendingTransfer.user.email} the
              owner?
            </p>
            <p className="mt-1 text-[0.8rem] leading-relaxed text-steel">
              They take over billing and the ability to delete this workspace.
              You stay on as an admin, and only they can hand it back.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={transfer.isPending}
                onClick={() =>
                  transfer.mutate({ membershipId: pendingTransfer.id })
                }
                className={actionClass("primary", "sm")}
              >
                {transfer.isPending && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                Transfer ownership
              </button>
              <button
                type="button"
                disabled={transfer.isPending}
                onClick={() => setTransferTo(null)}
                className="min-h-9 rounded-lg px-3 text-[0.82rem] font-medium text-steel hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Inviting is an admin action server-side, so showing the form to a
          member would only be a button that always fails. */}
      {canManage && (
      <section className="rounded-xl border border-line bg-paper-2 p-6">
        <h2 className="text-[1rem] font-semibold text-ink">Invite people</h2>
        <p className="mt-1 text-[0.83rem] text-steel">
          Paste as many addresses as you like. They get access to every project
          here.
        </p>

        <div className="mt-4">
          <Label htmlFor="invite-emails" className="sr-only">
            Email addresses
          </Label>
          <Textarea
            id="invite-emails"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="ana@acme.com, sam@acme.com"
            rows={3}
            className="border-line bg-paper text-[0.875rem]"
          />
          <p className="mt-1.5 h-4 text-[0.76rem] text-steel">
            {emails.length > 0 &&
              `${emails.length} address${emails.length === 1 ? "" : "es"} found`}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Select
            value={role}
            onValueChange={(v) => setRole(v as "ADMIN" | "MEMBER")}
          >
            <SelectTrigger
              aria-label="Role"
              className="rounded-lg border-line bg-paper text-[0.875rem] text-ink shadow-none data-[size=default]:h-10 dark:bg-paper dark:hover:bg-paper"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="MEMBER">Member</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
          <button
            type="button"
            disabled={emails.length === 0 || invite.isPending}
            onClick={() => invite.mutate({ emails, role })}
            className={actionClass("primary", "md")}
          >
            {invite.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {emails.length > 1 ? `Invite ${emails.length}` : "Invite"}
          </button>
        </div>

        {undelivered.length > 0 && (
          <UndeliveredNotice
            outcomes={undelivered}
            onDismiss={() => setOutcomes(null)}
          />
        )}

        {invites.data && invites.data.length > 0 && (
          <ul className="mt-6 divide-y divide-line border-t border-line">
            {invites.data.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 py-3">
                <Mail className="size-4 shrink-0 text-steel" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[0.875rem] text-ink">
                    {i.email}
                  </div>
                  <div className="text-[0.75rem] text-steel">
                    <span className="capitalize">{i.role.toLowerCase()}</span>,
                    invited {relativeTime(i.createdAt)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      `${window.location.origin}/invite/${i.token}`,
                    );
                    toast.success("Invite link copied.");
                  }}
                  className="inline-flex items-center gap-1.5 text-[0.78rem] text-steel hover:text-ink"
                >
                  <Copy className="size-3" />
                  Copy link
                </button>
                <button
                  type="button"
                  onClick={() => revoke.mutate({ id: i.id })}
                  className="text-[0.78rem] text-steel hover:text-negative"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      )}

      <LeaveWorkspace orgName={org.data?.org.name ?? ""} isOwner={isOwner} />
    </div>
  );
}

/**
 * The way out.
 *
 * Being added to a team has to be reversible by the person who was added,
 * otherwise an invite is something done *to* you: your account ends up
 * attached to someone else's workspace with no way off except asking them
 * nicely. This is the door, and it's on the same page as the invite form on
 * purpose.
 *
 * The owner sees the same section explaining why theirs is a two-step exit,
 * rather than no section at all, which would read as the door being missing.
 */
function LeaveWorkspace({
  orgName,
  isOwner,
}: {
  orgName: string;
  isOwner: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  const leave = api.org.leave.useMutation({
    onSuccess({ orgName: left, remaining }) {
      toast.success(`You left ${left}.`);
      // A hard navigation, not a router push: the active workspace is resolved
      // on the server and every cached query still belongs to the org that
      // just became unreachable.
      window.location.href = remaining > 0 ? "/app" : "/onboarding";
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <section className="rounded-xl border border-line bg-paper-2 p-6">
      <h2 className="text-[1rem] font-semibold text-ink">Leave workspace</h2>

      {isOwner ? (
        <p className="mt-1.5 max-w-prose text-[0.83rem] leading-relaxed text-steel">
          You own {orgName || "this workspace"}, so there&apos;s one step first:
          make someone else the owner above, then you can leave. If you&apos;d
          rather shut it down entirely, delete it from{" "}
          <Link
            href="/app/settings/general"
            className="font-medium text-ink underline underline-offset-2"
          >
            General
          </Link>
          .
        </p>
      ) : (
        <>
          <p className="mt-1.5 max-w-prose text-[0.83rem] leading-relaxed text-steel">
            Removes your access to {orgName || "this workspace"} and everything
            in it. Nothing here is deleted, and an admin can invite you back.
            Your own workspaces aren&apos;t affected.
          </p>

          {confirming ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={leave.isPending}
                onClick={() => leave.mutate()}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-negative px-4 text-[0.84rem] font-semibold text-paper disabled:opacity-40"
              >
                {leave.isPending && <Loader2 className="size-4 animate-spin" />}
                {leave.isPending ? "Leaving…" : "Yes, leave"}
              </button>
              <button
                type="button"
                disabled={leave.isPending}
                onClick={() => setConfirming(false)}
                className="min-h-10 rounded-lg px-3 text-[0.84rem] font-medium text-steel hover:text-ink"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3.5 text-[0.84rem] font-medium text-ink transition-colors hover:bg-muted"
            >
              <LogOut className="size-4" />
              Leave {orgName || "workspace"}
            </button>
          )}
        </>
      )}
    </section>
  );
}

/**
 * Shown when the invite exists but the email didn't leave the building.
 *
 * A toast is wrong here: the invite is still perfectly usable via its link, and
 * the admin needs that link in front of them long enough to send it themselves.
 */
function UndeliveredNotice({
  outcomes,
  onDismiss,
}: {
  outcomes: InviteOutcome[];
  onDismiss: () => void;
}) {
  return (
    <div className="mt-5 rounded-lg border border-mixed/30 bg-mixed-wash p-4">
      <div className="flex items-start gap-2.5">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-mixed" />
        <div className="min-w-0 flex-1">
          <p className="text-[0.85rem] font-semibold text-ink">
            {outcomes.length === 1 ? "Invite created" : "Invites created"}, but
            the email didn&apos;t send.
          </p>
          <p className="mt-1 text-[0.8rem] leading-relaxed text-steel">
            {outcomes[0]?.reason ?? "Email delivery failed."} Copy the link
            below and send it yourself.
          </p>
          <button
            type="button"
            onClick={onDismiss}
            className="mt-2.5 text-[0.78rem] font-medium text-steel hover:text-ink"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
