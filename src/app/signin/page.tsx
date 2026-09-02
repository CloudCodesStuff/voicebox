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
import { features } from "@/env";
import { auth, signIn } from "@/server/auth";
import { site } from "@/lib/site";

import { EmailSignInForm, type EmailSignInState } from "./email-form";
import { GoogleButton } from "./google-button";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to ${site.name} to see your feedback inbox, themes and trends. Google or a link by email, no password to remember.`,
  robots: { index: false, follow: false },
};

const authConfigured = () =>
  Boolean(
    process.env.AUTH_GOOGLE_ID &&
      process.env.AUTH_GOOGLE_SECRET &&
      process.env.AUTH_SECRET,
  );

/**
 * Email sign-in needs a working mailer and the shared Auth.js secret. It is
 * offered independently of Google, so a deployment missing OAuth credentials
 * still has a way in.
 */
const emailAuthConfigured = () =>
  Boolean(features.email && process.env.AUTH_SECRET);

/**
 * Loose on purpose. The address is about to be handed to a mail provider that
 * will make the real judgement, and a regex that rejects a valid but unusual
 * address is a worse failure than one that accepts a typo: the typo produces
 * an email nobody receives, the false rejection produces a person who cannot
 * sign in and has no idea why.
 */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

/**
 * Auth.js redirects here with `?error=` when a provider fails, because
 * `pages.error` points at this page.
 *
 * Only the codes below can actually arrive. Auth.js forwards a fixed
 * allowlist of error types to the browser (`clientErrors` in
 * @auth/core/errors) and collapses **everything else** — including a failed
 * sign-in email, a bad adapter query, and a genuine misconfiguration — into
 * `Configuration`. So there is deliberately no case here for a send failure:
 * it is unreachable, and a case for it would be dead code that reads like a
 * feature.
 *
 * That collapsing is why `Configuration` gets the longest message and offers
 * the other route in. It is the bucket that means "we cannot tell you", and
 * the useful thing to give someone in that state is an alternative, not an
 * apology. The real cause lands in /admin/errors instead.
 */
function errorMessage(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "Verification":
      return "That link has expired or was already used. Request a new one below.";
    case "OAuthAccountNotLinked":
    case "AccountNotLinked":
      return "That email is already registered with a different sign-in method. Try the other button.";
    case "AccessDenied":
      return "Sign-in was declined.";
    case "MissingCSRF":
      return "That form went stale. Reload the page and try again.";
    case "OAuthCallbackError":
      return "Google didn't complete the sign-in. Try again, or use a sign-in link instead.";
    case "Configuration":
      return "Sign-in isn't working right now, and it's on our end, not yours. Try the other option below — if both fail, email support and we'll fix it.";
    default:
      return "Something went wrong signing in. Try again.";
  }
}

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
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const providerError = errorMessage(params.error);

  // Only check the session when auth is actually wired; on a fresh clone with
  // an empty .env this page must still render rather than crash.
  if (authConfigured() || emailAuthConfigured()) {
    const session = await auth();
    if (session?.user) redirect(next);
  }

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: next });
  }

  async function signInWithEmail(
    _state: EmailSignInState,
    formData: FormData,
  ): Promise<EmailSignInState> {
    "use server";

    const email = String(formData.get("email") ?? "").trim();
    if (!looksLikeEmail(email)) {
      return { error: "That doesn't look like an email address." };
    }

    // Not wrapped in try/catch: a successful call throws the redirect that
    // takes the browser to /signin/sent, and catching it here would swallow
    // the navigation and leave the form sitting there looking broken.
    await signIn("resend", { email, redirectTo: next });
    return { error: null };
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
              {providerError && (
                <div
                  role="alert"
                  className="mb-5 flex gap-3 rounded-lg border border-negative/25 bg-negative-wash p-4"
                >
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-negative"
                    aria-hidden="true"
                  />
                  <p className="text-[0.86rem] leading-relaxed text-ink">
                    {providerError}
                  </p>
                </div>
              )}

              {authConfigured() || emailAuthConfigured() ? (
                <div className="space-y-4">
                  {authConfigured() && (
                    <form action={signInWithGoogle}>
                      <GoogleButton />
                    </form>
                  )}

                  {/* The divider only earns its space when there are in fact
                      two choices to separate. */}
                  {authConfigured() && emailAuthConfigured() && (
                    <div className="flex items-center gap-3">
                      <span className="h-px flex-1 bg-line" />
                      <span className="text-[0.74rem] font-medium tracking-wide text-faint uppercase">
                        or
                      </span>
                      <span className="h-px flex-1 bg-line" />
                    </div>
                  )}

                  {emailAuthConfigured() && (
                    <EmailSignInForm action={signInWithEmail} />
                  )}
                </div>
              ) : (
                <div className="flex gap-3 rounded-lg bg-mint-wash p-4">
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-mint-deep"
                    aria-hidden="true"
                  />
                  <div className="text-[0.86rem] leading-relaxed text-mint-deep">
                    <strong className="font-semibold">
                      Sign-in isn&apos;t configured yet.
                    </strong>
                    <p className="mt-1.5">
                      For Google, add{" "}
                      <code className="font-mono text-[0.8rem]">AUTH_SECRET</code>,{" "}
                      <code className="font-mono text-[0.8rem]">AUTH_GOOGLE_ID</code>, and{" "}
                      <code className="font-mono text-[0.8rem]">AUTH_GOOGLE_SECRET</code>{" "}
                      to <code className="font-mono text-[0.8rem]">.env</code>. For
                      sign-in links by email, add{" "}
                      <code className="font-mono text-[0.8rem]">RESEND_API_KEY</code>{" "}
                      and <code className="font-mono text-[0.8rem]">EMAIL_FROM</code>.
                      Either one is enough. Restart the dev server afterwards, and
                      see <code className="font-mono text-[0.8rem]">.env.example</code>{" "}
                      for where to get each value.
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

