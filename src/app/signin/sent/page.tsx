import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";

import { Wordmark } from "@/components/marketing/brand";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Check your email",
  robots: { index: false, follow: false },
};

/**
 * Where Auth.js sends someone after a sign-in link goes out
 * (`pages.verifyRequest`).
 *
 * It deliberately does not echo the address back. This page is reachable by
 * anyone who types the URL, so printing whatever was submitted would turn it
 * into a reflection surface, and the person who just typed their own address
 * does not need reminding what it was.
 *
 * The spam-folder line is not filler. It is the single most common reason a
 * magic-link flow gets abandoned, and one sentence here costs less than the
 * support message it prevents.
 */
export default function SignInSentPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="px-6 py-6 sm:px-10">
        <Link href="/" className="inline-flex items-center gap-2">
          <Wordmark />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-16 sm:px-10">
        <div className="w-full max-w-[420px]">
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-mint-wash">
            <MailCheck className="size-5 text-mint-deep" aria-hidden="true" />
          </span>

          <h1 className="mt-5 text-[1.75rem] font-bold leading-tight tracking-[-0.02em] text-ink">
            Check your email.
          </h1>
          <p className="mt-3 text-[0.97rem] leading-relaxed text-steel">
            We sent you a sign-in link. It works once and expires in 30 minutes.
          </p>
          <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
            Nothing there after a minute? Check spam, and confirm the address
            you typed. You can{" "}
            <Link href="/signin" className="text-ink underline underline-offset-2">
              request another link
            </Link>{" "}
            at any time.
          </p>

          <div className="mt-10 border-t border-line pt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[0.86rem] font-medium text-steel transition-colors hover:text-ink"
            >
              <ArrowLeft className="size-4" />
              Back to {site.name}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
