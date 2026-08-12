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

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const existing = await db.membership.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (existing) redirect("/app");

  return <OnboardingFlow defaultName={session.user.name ?? ""} />;
}
