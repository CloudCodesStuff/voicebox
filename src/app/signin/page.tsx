import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import { Wordmark } from "@/components/marketing/brand";
import {
  ActivityCard,
  ThemeCard,
  WidgetPreview,
} from "@/components/marketing/product-visuals";
import { auth, signIn } from "@/server/auth";
import { site } from "@/lib/site";

import { GoogleButton } from "./google-button";

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
    <div className="grid min-h-dvh bg-paper lg:grid-cols-[minmax(0,1fr)_minmax(0,50%)]">
      {/* Sign-in column. Header, form and footer share one column grid so the
          form centres in the leftover space rather than in the viewport,
          which is what keeps it from riding up under the wordmark. */}
      <div className="flex min-h-dvh flex-col">
        <header className="px-6 py-6 sm:px-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <Wordmark />
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 pb-16 sm:px-10">
          <div className="w-full max-w-[400px]">
            <h1 className="text-[2rem] font-bold leading-tight tracking-[-0.02em] text-balance text-ink">
              Find out what to build next.
            </h1>
            <p className="mt-3 text-[0.97rem] leading-relaxed text-steel">
              Free up to 25 pieces of feedback a month. No card.
            </p>

            <div className="mt-9">
              {authConfigured() ? (
                <form action={signInWithGoogle}>
                  <GoogleButton />
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

              <p className="mt-5 text-[0.78rem] leading-relaxed text-steel">
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

            <div className="mt-12 border-t border-line pt-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-[0.86rem] font-medium text-steel transition-colors hover:text-ink"
              >
                <ArrowLeft className="size-4" />
                Back to site
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* Product column: one story told by the product's own components.
          A visitor leaves the widget with four stars in, that comment shows
          up as a raw inbox row, and the row is already one of thirty-four in
          the theme ranked #1. Decorative end to end: one aria-hidden block,
          nothing in the tab order. */}
      <aside
        aria-hidden="true"
        // inert as well as aria-hidden: the widget preview renders real
        // buttons (type chips, stars), and aria-hidden only mutes them for
        // screen readers. Without inert, Tab still walks a keyboard user
        // through five invisible controls between the form and the footer.
        inert
        // The hairline is what separates the halves at all: paper and slab
        // are within a few points of each other in the dark theme.
        className="relative hidden overflow-hidden border-l border-line bg-slab lg:block"
      >
        {/* Atmosphere: a dot grid and one mint glow, both centred on the
            scene, which is now the only thing here. The cards carry all the
            colour, so the slab itself stays near-monochrome. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(228,234,232,0.10) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 50%, black 25%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 50%, black 25%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(620px 520px at 50% 42%, rgba(0,196,140,0.11), transparent 70%)",
          }}
        />

        <div className="relative flex h-full items-center justify-center p-10 xl:p-14">
          {/* The scene. Absolute placement inside a fixed-ratio canvas so
              the three cards genuinely overlap, each with its own slight
              rotation and its own shadow, which is what makes it read as
              objects on a surface instead of screenshots in a column. */}
          <div className="relative h-[520px] w-full max-w-[520px]">
            <div className="absolute top-0 left-0 w-[330px] -rotate-2 drop-shadow-[0_24px_48px_rgba(0,0,0,0.55)]">
              <WidgetPreview rating={4} />
            </div>

            <ActivityCard className="absolute top-[46%] right-0 z-10 rotate-[2.5deg] shadow-[0_20px_44px_-12px_rgba(0,0,0,0.65)]" />

            {/* The payoff card sits highest, front and slightly left, so the
                eye lands on it last: raw words in, ranked theme out. */}
            <ThemeCard className="absolute bottom-0 left-[8%] z-20 rotate-[-1.5deg] shadow-[0_28px_56px_-12px_rgba(0,0,0,0.7)]" />
          </div>
        </div>
      </aside>
    </div>
  );
}

