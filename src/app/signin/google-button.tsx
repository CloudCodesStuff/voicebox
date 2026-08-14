"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

/**
 * The one interactive control on the page, so it carries the page's only
 * loading state. Between click and the OAuth redirect there is a real network
 * round trip; without this the button gives nothing back on a slow
 * connection, and a second click queues a second sign-in POST.
 */
export function GoogleButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border-[1.5px] border-line bg-paper-2 px-5 text-[0.94rem] font-semibold text-ink shadow-[0_1px_2px_rgba(9,9,11,0.04)] transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-70"
    >
      {pending ? (
        <Loader2 className="size-[17px] animate-spin" aria-hidden="true" />
      ) : (
        <GoogleMark />
      )}
      {pending ? "Opening Google…" : "Continue with Google"}
    </button>
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
