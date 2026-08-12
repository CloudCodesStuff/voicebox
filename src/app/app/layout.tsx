import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProjectProvider } from "@/components/app/project-context";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { resolveActiveMembership } from "@/server/lib/active-org";

import { AppShell } from "./app-shell";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  // Resolved server-side so a user without an org never sees an empty
  // dashboard flash before being sent to onboarding.
  const membership = await resolveActiveMembership(db, session.user.id);
  if (!membership) redirect("/onboarding");

  // Every workspace this person belongs to, for the switcher. Fetched here
  // rather than in the client so the menu is already correct the first time
  // it opens, and so someone in exactly one workspace never sees a switcher
  // appear a beat after the page settles.
  const memberships = await db.membership.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: { org: { select: { id: true, name: true } } },
  });

  return (
    <ProjectProvider>
      <AppShell
        orgName={membership.org.name}
        orgId={membership.orgId}
        workspaces={memberships.map((m) => m.org)}
        userName={session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
        userImage={session.user.image ?? null}
      >
        {children}
      </AppShell>
    </ProjectProvider>
  );
}
