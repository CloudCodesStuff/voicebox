import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, Link2Off } from "lucide-react";

import { Wordmark } from "@/components/marketing/brand";
import { AcceptInvite } from "@/app/invite/[token]/accept-invite";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Join a team",
  robots: { index: false, follow: false },
};

/**
 * Where an invite link lands.
 *
 * Read directly from the database rather than through tRPC: this is the first
 * page an invited person ever sees, and it should render its answer on the
 * server rather than flashing a spinner while a query resolves.
 *
 * The page deliberately shows the organization name before asking anyone to
 * sign in. Being asked to authenticate before you're told what you're joining
 * is how phishing feels, and it is the reason invite emails get ignored.
 */
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await db.invite.findUnique({
    where: { token },
    select: {
      email: true,
      role: true,
      expiresAt: true,
      org: { select: { name: true } },
    },
  });

  const session = await auth().catch(() => null);
  const signedInAs = session?.user?.email ?? null;

  if (!invite) {
    return (
      <Shell>
        <Notice
          icon={<Link2Off className="size-5 text-steel" />}
          title="This link isn't valid."
          body="It has either been used already or revoked. Ask for a new one."
        />
      </Shell>
    );
  }

  if (invite.expiresAt < new Date()) {
    return (
      <Shell>
        <Notice
          icon={<Clock className="size-5 text-steel" />}
          title="This invite has expired."
          body={`Invites last fourteen days. Ask ${invite.org.name} for a new one.`}
        />
      </Shell>
    );
  }

  const wrongAccount =
    signedInAs !== null &&
    signedInAs.toLowerCase() !== invite.email.toLowerCase();

  return (
    <Shell>
      <p className="text-[0.85rem] font-medium text-mint-deep">
        You&apos;ve been invited
      </p>
      <h1 className="mt-2 text-[2rem] font-bold leading-tight tracking-[-0.025em] text-ink">
        Join {invite.org.name} on {site.name}.
      </h1>
      <p className="mt-3 text-[0.97rem] leading-relaxed text-steel">
        You&apos;ll see every piece of feedback this team collects, and the
        themes it turns into.{" "}
        {invite.role === "ADMIN"
          ? "As an admin you can also manage projects, the widget and the team."
          : "As a member you can read everything and change nothing."}
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-paper-2 p-7">
        <dl className="grid gap-3 text-[0.875rem]">
          <div className="flex justify-between gap-4">
            <dt className="text-steel">Organization</dt>
            <dd className="font-medium text-ink">{invite.org.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-steel">Invited address</dt>
            <dd className="truncate font-medium text-ink">{invite.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-steel">Role</dt>
            <dd className="font-medium text-ink capitalize">
              {invite.role.toLowerCase()}
            </dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-line pt-6">
          {signedInAs === null ? (
            <>
              <Link
                href={`/signin?next=${encodeURIComponent(`/invite/${token}`)}`}
                className="flex min-h-12 w-full items-center justify-center rounded-lg bg-mint px-5 text-[0.94rem] font-semibold text-mint-ink transition-all hover:brightness-[0.96]"
              >
                Sign in to accept
              </Link>
              <p className="mt-3 text-center text-[0.78rem] text-steel">
                Use {invite.email}.
              </p>
            </>
          ) : wrongAccount ? (
            <div className="text-[0.875rem] leading-relaxed text-steel">
              <p>
                You&apos;re signed in as{" "}
                <strong className="font-semibold text-ink">{signedInAs}</strong>,
                but this invite was sent to{" "}
                <strong className="font-semibold text-ink">
                  {invite.email}
                </strong>
                .
              </p>
              <p className="mt-3">
                Sign out and back in with that address, or ask for a new invite.
              </p>
            </div>
          ) : (
            <AcceptInvite token={token} orgName={invite.org.name} />
          )}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="px-6 py-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <Wordmark />
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 pt-8 pb-24">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  );
}

function Notice({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper-2 p-7">
      <div className="flex size-10 items-center justify-center rounded-full bg-sunken">
        {icon}
      </div>
      <h1 className="mt-4 text-[1.3rem] font-bold tracking-tight text-ink">
        {title}
      </h1>
      <p className="mt-2 text-[0.9rem] leading-relaxed text-steel">{body}</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 text-[0.86rem] font-medium text-steel transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Back to site
      </Link>
    </div>
  );
}
