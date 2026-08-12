import "server-only";

import { clientEnv } from "@/env";
import { site } from "@/lib/site";
import {
  emailButton,
  emailShell,
  escapeHtml,
  emailStyles,
  sendEmail,
  type SendResult,
} from "@/server/lib/email";

/**
 * The invite notification.
 *
 * Names the person who invited you and the organization you're joining,
 * because "you have been invited to join a workspace" from an unfamiliar
 * product is indistinguishable from phishing and gets deleted.
 */
export function sendInviteEmail(input: {
  to: string;
  orgName: string;
  inviterName: string | null;
  inviterEmail: string | null;
  token: string;
  expiresAt: Date;
}): Promise<SendResult> {
  const url = `${clientEnv.NEXT_PUBLIC_APP_URL}/invite/${input.token}`;
  const inviter = input.inviterName?.trim() || input.inviterEmail || "A teammate";
  const org = input.orgName;

  const expires = input.expiresAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const body = `
    <p style="margin:0 0 18px">
      <strong>${escapeHtml(inviter)}</strong> added you to
      <strong>${escapeHtml(org)}</strong> on ${site.name}.
    </p>
    <p style="margin:0 0 24px;color:${emailStyles.STEEL}">
      ${site.name} collects feedback from your product and groups it into a
      ranked list of what to fix next. Joining takes one click and a Google
      sign-in.
    </p>
    <p style="margin:0 0 24px">${emailButton(url, `Join ${org}`)}</p>
    <p style="margin:0;color:${emailStyles.STEEL};font-size:13px">
      This link expires on ${expires}. If you weren't expecting it, ignore this
      message and nothing happens.
    </p>`;

  return sendEmail({
    to: input.to,
    replyTo: input.inviterEmail ?? undefined,
    subject: `${inviter} invited you to ${org} on ${site.name}`,
    html: emailShell({
      title: `Join ${org} on ${site.name}`,
      preview: `${inviter} added you to ${org}. The link expires ${expires}.`,
      body,
    }),
    text: [
      `${inviter} added you to ${org} on ${site.name}.`,
      "",
      `Join here: ${url}`,
      "",
      `This link expires on ${expires}.`,
    ].join("\n"),
  });
}
