import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProjectProvider } from "@/components/app/project-context";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

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
  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: { org: { select: { name: true } } },
  });
  if (!membership) redirect("/onboarding");

  return (
    <ProjectProvider>
      <AppShell
        orgName={membership.org.name}
        userName={session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
        userImage={session.user.image ?? null}
      >
        {children}
      </AppShell>
    </ProjectProvider>
  );
}
