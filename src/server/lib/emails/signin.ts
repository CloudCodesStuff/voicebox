import "server-only";

import { site } from "@/lib/site";
import {
  emailButton,
  emailShell,
  emailStyles,
  sendEmail,
  type RenderedEmail,
  type SendResult,
} from "@/server/lib/email";

export type SignInInput = {
  to: string;
  url: string;
  /** Minutes until the token expires, from the provider's own maxAge. */
  expiresInMinutes: number;
};

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
 * wrapper, no shortener, and the preview text does not quote the link. The
 * expiry is stated because a link that has gone stale is the most common
 * support question this flow produces.
 */
export function renderSignIn(input: SignInInput): RenderedEmail {
  const { url, expiresInMinutes } = input;

  const expiry =
    expiresInMinutes >= 120
      ? `${Math.round(expiresInMinutes / 60)} hours`
      : `${expiresInMinutes} minutes`;

  const body = `
    <p class="vb-ink" style="margin:0 0 14px;font-size:19px;line-height:1.35;font-weight:650;letter-spacing:-0.021em;color:${emailStyles.INK}">
      Here's your sign-in link.
    </p>
    <p class="vb-steel" style="margin:0 0 26px;color:${emailStyles.STEEL};font-size:15px;line-height:1.6">
      It works once, and only for ${expiry}.
    </p>
    ${emailButton(url, `Sign in to ${site.name}`)}
    <p class="vb-steel" style="margin:26px 0 0;color:${emailStyles.STEEL};font-size:13px;line-height:1.6">
      Didn't ask for this? Someone typed your address by mistake. Ignore this
      message and nothing happens &mdash; no account is created and nobody gets
      access to anything.
    </p>`;

  return {
    subject: `Sign in to ${site.name}`,
    html: emailShell({
      title: `Sign in to ${site.name}`,
      preview: `Your sign-in link, good for one use in the next ${expiry}.`,
      body,
      // No preference-management footer: this is a transactional message
      // somebody asked for seconds ago, and offering to unsubscribe from
      // sign-in links would be an odd thing to do.
      footer: `Sent because someone entered this address on the ${site.name} sign-in page.`,
    }),
    text: [
      `Sign in to ${site.name}:`,
      "",
      url,
      "",
      `The link works once and expires in ${expiry}.`,
      "If you didn't ask to sign in, ignore this message.",
    ].join("\n"),
  };
}

export function sendSignInEmail(input: SignInInput): Promise<SendResult> {
  const { subject, html, text } = renderSignIn(input);
  return sendEmail({ to: input.to, subject, html, text });
}
