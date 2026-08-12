import "server-only";

import { Resend } from "resend";

import { clientEnv, features } from "@/env";
import { site } from "@/lib/site";

/* ---------------------------------------------------------------------------
   Email
   ---------------------------------------------------------------------------
   One sender, one visual shell, one failure policy.

   Sending is never allowed to break the thing that triggered it. An invite is
   worth creating even if the notification bounces, and a digest job that
   throws because Resend had a bad minute would retry forever. Every function
   here returns a result object instead of raising.

   With no RESEND_API_KEY the message is logged instead. That keeps the whole
   product usable on a fresh clone with an empty .env, which is the same
   promise the rest of the app makes.
--------------------------------------------------------------------------- */

export type SendResult =
  | { ok: true; id: string | null; delivered: boolean }
  | { ok: false; error: string };

let client: Resend | null = null;

function resend(): Resend {
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

export async function sendEmail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /**
   * Extra SMTP headers. Recurring mail passes `List-Unsubscribe` and
   * `List-Unsubscribe-Post` here so Gmail and Yahoo render their own
   * one-click unsubscribe control, which is now a bulk-sender requirement
   * rather than a courtesy.
   */
  headers?: Record<string, string>;
}): Promise<SendResult> {
  if (!features.email) {
    console.info(
      `\n  [email] not configured, would have sent to ${message.to}\n` +
        `  subject: ${message.subject}\n` +
        `  set RESEND_API_KEY and EMAIL_FROM to send for real\n`,
    );
    return { ok: true, id: null, delivered: false };
  }

  try {
    const { data, error } = await resend().emails.send({
      from: process.env.EMAIL_FROM as string,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo,
      ...(message.headers ? { headers: message.headers } : {}),
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id ?? null, delivered: true };
  } catch (cause) {
    return {
      ok: false,
      error: cause instanceof Error ? cause.message : "Unknown email failure",
    };
  }
}

/* --------------------------------------------------------------------------
   Template shell

   Tables and inline styles, because Outlook is still Outlook. The palette is
   the product's, hard-coded rather than tokenised: an email renders in a
   client that has never heard of our stylesheet.
-------------------------------------------------------------------------- */

const INK = "#09090b";
const STEEL = "#62626b";
const LINE = "#ebebed";
const MINT = "#00c48c";
const MINT_INK = "#04231b";
const MINT_DEEP = "#00785a";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function emailButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${MINT};color:${MINT_INK};font-weight:600;font-size:15px;text-decoration:none;padding:13px 24px;border-radius:8px">${escapeHtml(label)}</a>`;
}

/**
 * Wraps body HTML in the branded frame.
 *
 * `preview` is the line mail clients show next to the subject in the list.
 * Without it they helpfully preview your first paragraph of boilerplate.
 */
export function emailShell(options: {
  title: string;
  preview: string;
  body: string;
  footer?: string;
}): string {
  const appUrl = clientEnv.NEXT_PUBLIC_APP_URL;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(options.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:14px;overflow:hidden">
      <tr>
        <td style="padding:22px 28px;border-bottom:1px solid ${LINE}">
          <a href="${appUrl}" style="text-decoration:none;color:${INK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:17px;font-weight:700;letter-spacing:-0.02em">
            <span style="color:${MINT_DEEP}">≡</span>&nbsp;${site.name}
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:30px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};font-size:15px;line-height:1.65">
          ${options.body}
        </td>
      </tr>
      <tr>
        <td style="padding:18px 28px;border-top:1px solid ${LINE};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${STEEL};font-size:12.5px;line-height:1.6">
          ${options.footer ?? `Sent by ${site.name}. <a href="${appUrl}/app/settings/general" style="color:${STEEL}">Manage your email preferences</a>.`}
          <div style="margin-top:10px;color:${STEEL};opacity:.75">${escapeHtml(site.legalEntity)}, ${escapeHtml(site.postalAddress)}</div>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export const emailStyles = { INK, STEEL, LINE, MINT, MINT_INK, MINT_DEEP };
