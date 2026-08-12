import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { site } from "@/lib/site";

import { OnboardingFlow } from "./onboarding-flow";

export const metadata: Metadata = {
  title: `Set up ${site.name}`,
  robots: { index: false, follow: false },
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  // `?new=1` is someone deliberately adding a second workspace from the
  // switcher, so the "you already have one, go to the dashboard" redirect
  // would be exactly wrong for them.
  const wantsAnother = (await searchParams).new === "1";

  if (!wantsAnother) {
    const existing = await db.membership.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (existing) redirect("/app");
  }

  return (
    <OnboardingFlow
      defaultName={session.user.name ?? ""}
      additional={wantsAnother}
    />
  );
}
