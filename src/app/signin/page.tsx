import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import { Wordmark } from "@/components/marketing/brand";
import { auth, signIn } from "@/server/auth";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to ${site.name} with Google to see your feedback inbox, themes and trends. No password to remember.`,
  robots: { index: false, follow: false },
};

const authConfigured = () =>
  Boolean(
    process.env.AUTH_GOOGLE_ID &&
      process.env.AUTH_GOOGLE_SECRET &&
      process.env.AUTH_SECRET,
  );

/**
 * Only same-origin paths are allowed through. `next` arrives in a URL anyone
 * can craft, so passing it to the OAuth redirect unchecked turns sign-in into
 * an open redirect that fires right after a real Google auth flow.
 *
 * It must start with a single "/" and be nothing but a path. The traps:
 *   • "//evil.com" and "/\evil.com" are both protocol-relative — a browser
 *     treats "\" as "/" for special schemes, so the second char is normalised
 *     and checked here;
 *   • a control char or whitespace can smuggle past a naive prefix test;
 *   • the value must still parse as a same-origin URL, which is the real proof.
 */
function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/")) return "/app";
  // Reject protocol-relative ("//", "/\") and any control/space character.
  if (/^\/[/\\]/.test(value) || /[\x00-\x1f\x7f\s]/.test(value)) return "/app";
  try {
    const url = new URL(value, "https://voicebox.local");
    if (url.origin !== "https://voicebox.local") return "/app";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/app";
  }
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next);

  // Only check the session when auth is actually wired; on a fresh clone with
  // an empty .env this page must still render rather than crash.
  if (authConfigured()) {
    const session = await auth();
    if (session?.user) redirect(next);
  }

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: next });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="px-6 py-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <Wordmark />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-24">
        <div className="w-full max-w-[400px]">
          <h1 className="text-[2rem] font-bold leading-tight tracking-[-0.02em] text-ink">
            Find out what to build next.
          </h1>
          <p className="mt-3 text-[0.97rem] leading-relaxed text-steel">
            Free up to 25 pieces of feedback a month. No card.
          </p>

          <div className="mt-9 rounded-2xl border border-line bg-paper-2 p-7">
            {authConfigured() ? (
              <form action={signInWithGoogle}>
                <button
                  type="submit"
                  className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border-[1.5px] border-line bg-paper-2 px-5 text-[0.94rem] font-semibold text-ink transition-colors hover:border-ink"
                >
                  <GoogleMark />
                  Continue with Google
                </button>
              </form>
            ) : (
              <div className="flex gap-3 rounded-lg bg-mint-wash p-4">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-mint-deep"
                  aria-hidden="true"
                />
                <div className="text-[0.86rem] leading-relaxed text-mint-deep">
                  <strong className="font-semibold">
                    Google sign-in isn&apos;t configured yet.
                  </strong>
                  <p className="mt-1.5">
                    Add <code className="font-mono text-[0.8rem]">AUTH_SECRET</code>,{" "}
                    <code className="font-mono text-[0.8rem]">AUTH_GOOGLE_ID</code>, and{" "}
                    <code className="font-mono text-[0.8rem]">AUTH_GOOGLE_SECRET</code>{" "}
                    to <code className="font-mono text-[0.8rem]">.env</code>, then
                    restart the dev server. See{" "}
                    <code className="font-mono text-[0.8rem]">.env.example</code>{" "}
                    for where to get each one.
                  </p>
                </div>
              </div>
            )}

            <p className="mt-6 text-center text-[0.78rem] leading-relaxed text-steel">
              By continuing you agree to our{" "}
              <Link href="/terms" className="text-ink underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-ink underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 text-[0.86rem] font-medium text-steel transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            Back to site
          </Link>
        </div>
      </main>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.14 6.16-4.14Z"
      />
    </svg>
  );
}
