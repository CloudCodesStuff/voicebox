"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

export type EmailSignInState = { error: string | null };

/**
 * Email sign-in, the fallback that has no user cap.
 *
 * Second in the visual order and quieter than the Google button, because it
 * is the slower path: it costs a round trip through an inbox. It is here so
 * that Google being unavailable, unverified, or capped is an inconvenience
 * rather than a closed door.
 */
export function EmailSignInForm({
  action,
}: {
  action: (
    state: EmailSignInState,
    formData: FormData,
  ) => Promise<EmailSignInState>;
}) {
  const [state, formAction] = useActionState<EmailSignInState, FormData>(
    action,
    { error: null },
  );

  return (
    <form action={formAction} className="space-y-2.5">
      <div>
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "email-error" : undefined}
          className="min-h-12 w-full rounded-lg border-[1.5px] border-line bg-paper-2 px-4 text-[0.94rem] text-ink transition-colors placeholder:text-faint focus:border-ink focus:outline-none aria-[invalid=true]:border-negative"
        />
      </div>

      {state.error && (
        <p id="email-error" role="alert" className="text-[0.82rem] text-negative">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

/**
 * Split out so `useFormStatus` reads this form's own pending state. Read in
 * the parent it would return the status of whatever form encloses it, which
 * here would be nothing at all.
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-12 w-full items-center justify-center gap-2.5 rounded-lg border-[1.5px] border-transparent bg-ink px-5 text-[0.94rem] font-semibold text-paper transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-70"
    >
      {pending && (
        <Loader2 className="size-[17px] animate-spin" aria-hidden="true" />
      )}
      {pending ? "Sending the link…" : "Email me a sign-in link"}
    </button>
  );
}
