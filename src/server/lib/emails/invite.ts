import "server-only";

import { clientEnv } from "@/env";
import { site } from "@/lib/site";
import {
  emailButton,
  emailShell,
  escapeHtml,
  emailStyles,
  sendEmail,
  type RenderedEmail,
  type SendResult,
} from "@/server/lib/email";

export type InviteInput = {
  to: string;
  orgName: string;
  inviterName: string | null;
  inviterEmail: string | null;
  token: string;
  expiresAt: Date;
};

/**
 * The invite notification.
 *
 * Names the person who invited you and the organization you're joining,
 * because "you have been invited to join a workspace" from an unfamiliar
 * product is indistinguishable from phishing and gets deleted.
 *
 * Rendering is split from sending so this can be previewed without a mail
 * provider and without a recipient. `digest.ts` was already shaped this way;
 * the other two now match, which is what makes `npm run email:preview`
 * possible.
 */
export function renderInvite(input: InviteInput): RenderedEmail {
  const url = `${clientEnv.NEXT_PUBLIC_APP_URL}/invite/${input.token}`;
  const inviter = input.inviterName?.trim() || input.inviterEmail || "A teammate";
  const org = input.orgName;

  const expires = input.expiresAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const body = `
    <p class="vb-ink" style="margin:0 0 14px;font-size:19px;line-height:1.35;font-weight:650;letter-spacing:-0.021em;color:${emailStyles.INK}">
      ${escapeHtml(inviter)} added you to ${escapeHtml(org)}.
    </p>
    <p class="vb-steel" style="margin:0 0 26px;color:${emailStyles.STEEL};font-size:15px;line-height:1.6">
      ${site.name} collects feedback from inside your product and groups it into
      a ranked list of what to fix next. Joining takes one click and a sign-in,
      with Google or a link sent to this address.
    </p>
    ${emailButton(url, `Join ${escapeHtml(org)}`)}
    <p class="vb-steel" style="margin:26px 0 0;color:${emailStyles.STEEL};font-size:13px;line-height:1.6">
      This link expires on ${expires}. If you weren't expecting it, ignore this
      message and nothing happens.
    </p>`;

  return {
    subject: `${inviter} invited you to ${org} on ${site.name}`,
    html: emailShell({
      title: `Join ${org} on ${site.name}`,
      preview: `${inviter} added you to ${org}. The link expires ${expires}.`,
      body,
      // Not the shell's default footer: that one offers to manage email
      // preferences, which for an invite points a person with no account yet
      // at a signed-in settings page.
      footer: `Sent by ${site.name} because ${escapeHtml(inviter)} invited you to ${escapeHtml(org)}.`,
    }),
    text: [
      `${inviter} added you to ${org} on ${site.name}.`,
      "",
      `Join here: ${url}`,
      "",
      `This link expires on ${expires}.`,
    ].join("\n"),
  };
}

export function sendInviteEmail(input: InviteInput): Promise<SendResult> {
  const { subject, html, text } = renderInvite(input);

  return sendEmail({
    to: input.to,
    replyTo: input.inviterEmail ?? undefined,
    subject,
    html,
    text,
  });
}
