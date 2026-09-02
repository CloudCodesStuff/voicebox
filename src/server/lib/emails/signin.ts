import "server-only";

import { site } from "@/lib/site";
import {
  emailButton,
  emailShell,
  emailStyles,
  sendEmail,
  type SendResult,
} from "@/server/lib/email";

/**
 * The sign-in link.
 *
 * Auth.js ships its own template for this. Ours exists for two reasons: it
 * uses the same shell as every other message the product sends, so a sign-in
 * link does not look like it came from a different company than the invite
 * that preceded it, and it goes through `sendEmail`, so it inherits one sender
 * address, one failure policy, and the log-instead-of-send behaviour on a
 * clone with no Resend key.
 *
 * The URL is a single-use credential, so nothing here is clever: no tracking
 * wrapper, no shortener, no preview text quoting the link. The expiry is
 * stated because a link that has gone stale is the most common support
 * question this flow produces.
 */
export function sendSignInEmail(input: {
  to: string;
  url: string;
  /** Minutes until the token expires, from the provider's own maxAge. */
  expiresInMinutes: number;
}): Promise<SendResult> {
  const { to, url, expiresInMinutes } = input;

  const expiry =
    expiresInMinutes >= 120
      ? `${Math.round(expiresInMinutes / 60)} hours`
      : `${expiresInMinutes} minutes`;

  const body = `
    <p style="margin:0 0 22px;font-size:16px">
      Click below to sign in to <strong>${site.name}</strong>.
    </p>
    <p style="margin:0 0 24px">${emailButton(url, "Sign in")}</p>
    <p style="margin:0 0 18px;color:${emailStyles.STEEL};font-size:13px">
      The link works once and expires in ${expiry}.
    </p>
    <p style="margin:0;color:${emailStyles.STEEL};font-size:13px">
      If you didn't ask to sign in, someone typed your address by mistake.
      Ignore this message and nothing happens, and no account is created.
    </p>`;

  return sendEmail({
    to,
    subject: `Sign in to ${site.name}`,
    html: emailShell({
      title: `Sign in to ${site.name}`,
      preview: `Your sign-in link, good for one use in the next ${expiry}.`,
      body,
      // No preference-management footer: this is a transactional message
      // somebody asked for seconds ago, and offering to unsubscribe from
      // sign-in links would be an odd thing to do.
      footer: `Sent by ${site.name} because someone entered this address on the sign-in page.`,
    }),
    text: [
      `Sign in to ${site.name}:`,
      "",
      url,
      "",
      `The link works once and expires in ${expiry}.`,
      "If you didn't ask to sign in, ignore this message.",
    ].join("\n"),
  });
}
