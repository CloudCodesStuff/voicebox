import { cookies } from "next/headers";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import type { Provider } from "next-auth/providers";

import { features } from "@/env";
import { REF_COOKIE, normalizeRef } from "@/lib/attribution";
import { db } from "@/server/db";
import { sendSignInEmail } from "@/server/lib/emails/signin";
import { captureError } from "@/server/lib/errors";

/**
 * Auth.js v5.
 *
 * Two ways in, and the second one exists as insurance rather than as a
 * feature. Google is the front door: shop owners already have an account and
 * one fewer password is one fewer support ticket. But an OAuth app that has
 * not been through Google's verification is capped at 100 users while it sits
 * in Testing mode, and that ceiling arrives on the single best traffic day a
 * product ever gets, silently, one signup at a time. A sign-in link over
 * email has no such cap and no third party in the path, so it removes Google
 * from the critical path entirely.
 *
 * AUTH_SECRET, AUTH_GOOGLE_ID, and AUTH_GOOGLE_SECRET are read from the
 * environment by Auth.js convention. The email provider reuses RESEND_API_KEY
 * and EMAIL_FROM, which the rest of the product already needs.
 */

/** How long a sign-in link stays valid. */
const SIGNIN_LINK_MINUTES = 30;

/**
 * Email sign-in is offered only when mail actually works.
 *
 * Rendering the option without a Resend key would produce a form that accepts
 * an address, says "check your inbox", and sends nothing, which is worse than
 * not offering it: the person waits instead of trying the other button.
 */
const providers: Provider[] = [
  Google({
    allowDangerousEmailAccountLinking: true,
  }),
];

if (features.email) {
  providers.push(
    Resend({
      from: process.env.EMAIL_FROM,
      maxAge: SIGNIN_LINK_MINUTES * 60,
      // Our own template and our own sender, rather than the provider's
      // built-in fetch to the Resend API. See emails/signin.ts.
      async sendVerificationRequest({ identifier, url }) {
        const result = await sendSignInEmail({
          to: identifier,
          url,
          expiresInMinutes: SIGNIN_LINK_MINUTES,
        });

        if (!result.ok) {
          // Recorded here because it is the only way anyone finds out. Auth.js
          // forwards just a fixed allowlist of error types to the browser
          // (`clientErrors` in @auth/core/errors) and an email failure is not
          // on it, so whatever we throw below reaches the user as the generic
          // "Configuration" and the real reason exists only in a serverless
          // log. Capturing it puts the provider's actual message in
          // /admin/errors, grouped, which is the difference between "sign-in
          // is broken" and "the sending domain is unverified".
          //
          // No recipient address in the context: `captureError` would redact
          // it anyway, and an operator does not need it to fix a bad key.
          await captureError({
            source: "email",
            error: new Error(`Sign-in link send failed: ${result.error}`),
            context: { provider: "resend" },
          });

          // Then throw, because this is the one place in the product where a
          // failed send must fail loudly. Every other message is a
          // notification about something that already happened; this one *is*
          // the sign-in. Swallowing it would send the person to a
          // "check your inbox" page to wait for mail that was never accepted.
          throw new Error(`Sign-in email failed: ${result.error}`);
        }
      },
    }),
  );
}

/**
 * Reads the first-touch channel tag, if the visitor arrived on a tagged link.
 *
 * Never throws and never blocks a signup. A missing cookie, a cookie store
 * that is unavailable in this context, or a value that fails the slug filter
 * all mean the same thing: this user has no channel, which is exactly what
 * every user before this feature existed also has.
 */
async function firstTouchRef(): Promise<string | null> {
  try {
    const store = await cookies();
    return normalizeRef(store.get(REF_COOKIE)?.value);
  } catch {
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db) as Adapter,

  session: { strategy: "database" },

  pages: {
    signIn: "/signin",
    error: "/signin",
    verifyRequest: "/signin/sent",
  },

  providers,

  callbacks: {
    session({ session, user }) {
      // Expose the user id so tRPC can resolve membership without a second
      // lookup keyed on email (emails change; ids don't).
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },

  events: {
    /**
     * Attribution, written once, at the only moment it is knowable.
     *
     * A separate update rather than a field passed through the adapter's
     * `createUser`: the adapter hands its argument straight to Prisma, so
     * smuggling an extra key through it works right up until a library version
     * validates its input, and a signup is not a thing to make fragile for one
     * nullable column.
     *
     * Wrapped so that no failure here can fail a signup. Losing one row's
     * channel label costs a line in a report; failing the create costs the
     * customer.
     */
    async createUser({ user }) {
      try {
        const refSource = await firstTouchRef();
        if (!refSource) return;
        await db.user.update({ where: { id: user.id }, data: { refSource } });
      } catch {
        // Deliberately silent, and deliberately not captureError: an
        // unattributed user is not a fault, and an error row per untagged
        // signup would bury the ones that matter.
      }
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
