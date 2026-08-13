import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isAdminRequest } from "@/server/lib/admin";

import { AdminNav } from "./admin-nav";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The gate.
 *
 * Server-side and unconditional: nothing below renders for a non-operator, so
 * there is no client-side check to bypass and no flash of admin content while a
 * query resolves. Every procedure behind it re-checks independently, because a
 * layout guard protects pages and not the API those pages call.
 *
 * `notFound()` rather than a redirect or a 403. A 403 confirms /admin exists to
 * anyone who guesses the URL; a 404 is indistinguishable from a typo.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdminRequest())) notFound();

  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-paper-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-ink px-2 py-1 text-[0.7rem] font-bold tracking-wide text-paper uppercase">
              Admin
            </span>
            <AdminNav />
          </div>
          <Link
            href="/app"
            className="text-[0.82rem] text-steel transition-colors hover:text-ink"
          >
            Back to app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 pb-24 sm:px-6">
        {children}
      </main>
    </div>
  );
}
