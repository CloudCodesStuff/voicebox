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


/** A message rendered but not yet sent. Lets every template be previewed. */
export type RenderedEmail = { subject: string; html: string; text: string };

/* --------------------------------------------------------------------------
   Template shell
   --------------------------------------------------------------------------
   Tables and inline styles, because Outlook is still Outlook. The palette is
   the product's, hard-coded rather than tokenised: an email renders in a
   client that has never heard of our stylesheet.

   Five things here are not decoration, and every one of them was a visible
   defect before:

   1. FONT ON EVERY CELL. Outlook does not inherit font-family into nested
      tables, so any text in a cell that does not name a font renders in Times
      New Roman. Half the digest did exactly that. `FONT` below is applied at
      every level rather than once at the top.
   2. A FIXED WIDTH FOR OUTLOOK. `max-width` is ignored by Word's rendering
      engine, so the card used to stretch the full width of the window. The
      MSO conditional wrapper pins it to 600px there and nowhere else.
   3. A REAL BUTTON. A padded inline `<a>` is not a button in Outlook, which
      drops the padding and leaves bare underlined text. `emailButton` is a
      table with the padding on the cell, plus a VML rounded rectangle that
      only Outlook sees.
   4. PREHEADER PADDING. Without the zero-width filler, Gmail pulls the first
      words of the body into the preview line after the intended text.
   5. DARK MODE, DECIDED RATHER THAN INFLICTED. `color-scheme` plus one media
      query means clients that invert colours use our dark surfaces. Without
      it, Apple Mail auto-inverts a white card and turns mint-on-mint-ink into
      an unreadable smear.

      The trap, which cost a round of this: an inline `color` on a nested
      element beats an inherited override from a class on its ancestor. So the
      dark-mode class has to sit on the SAME element that carries the inline
      colour, not on the cell containing it. A `<td class="vb-ink">` wrapping a
      `<div style="color:#09090b">` renders black text on a black card.
-------------------------------------------------------------------------- */

const INK = "#09090b";
const STEEL = "#62626b";
const FAINT = "#8f8f98";
const LINE = "#ebebed";
const PAPER = "#ffffff";
const SUNKEN = "#f4f4f5";
const MINT = "#00c48c";
const MINT_INK = "#04231b";
const MINT_DEEP = "#00785a";
const MINT_WASH = "#e6f9f1";
const SLAB = "#0a0d0c";
const SLAB_FG = "#e4eae8";

/**
 * One font stack, named at every level.
 *
 * No webfont. Inter is the product's typeface and cannot be relied on in
 * mail, and a `@font-face` that fails leaves you with whatever the client
 * picked instead — usually a serif. The system stack renders as the reader's
 * own UI font, which is the closest thing to Inter available here.
 */
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The brand mark, in table cells rather than as an image.
 *
 * Three bars narrowing downward: many comments in, few themes out. It is the
 * site's `BrandMark` SVG, which no mail client renders, rebuilt out of things
 * every client does render.
 *
 * Drawn rather than linked on purpose. Most clients block remote images by
 * default, so an `<img>` logo is invisible on first open — which is the only
 * open that matters. This one cannot be blocked. The previous version used a
 * literal `≡`, whose three equal bars read as a hamburger menu and threw away
 * the one idea the mark contains.
 */
function brandMark(color = MINT_DEEP): string {
  const bar = (width: number, last = false) =>
    `<tr><td align="center" style="padding:0${last ? "" : " 0 4px"};line-height:0;font-size:0">` +
    `<div style="width:${width}px;height:3px;background:${color};border-radius:2px;line-height:0;font-size:0">&nbsp;</div>` +
    `</td></tr>`;

  // 18 / 12 / 4, which is the SVG's own geometry (x from 3→21, 6→18, 10→14 on
  // a 24 viewBox). Getting these ratios wrong is what made the old `≡` read as
  // a menu icon: the narrowing *is* the meaning.
  return (
    `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="18" style="border-collapse:collapse">` +
    bar(18) +
    bar(12) +
    bar(4, true) +
    `</table>`
  );
}

/**
 * A button that survives Outlook.
 *
 * The VML block is invisible to every other client; Outlook ignores the
 * `<table>` fallback's border-radius and renders the rounded rectangle
 * instead. `mso-hide:all` on the anchor stops Outlook drawing both.
 */
export function emailButton(href: string, label: string): string {
  const text = escapeHtml(label);

  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:separate">
  <tr><td align="center" bgcolor="${MINT}" style="border-radius:8px" class="vb-btn">
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:46px;v-text-anchor:middle;width:240px" arcsize="18%" stroke="f" fillcolor="${MINT}">
      <w:anchorlock/>
      <center style="color:${MINT_INK};font-family:${FONT};font-size:15px;font-weight:bold">${text}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-- -->
    <a href="${href}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:15px;font-weight:600;line-height:1;color:${MINT_INK};text-decoration:none;border-radius:8px">${text}</a>
    <!--<![endif]-->
  </td></tr>
</table>`;
}

/**
 * A small uppercase label above a group of rows.
 *
 * The one place mint appears as text. Their design rule is that mint marks the
 * live thing and is never the primary control, so it labels sections here and
 * fills exactly one button.
 */
export function emailEyebrow(label: string): string {
  return `<div class="vb-mint" style="font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:${MINT_DEEP};padding:0 0 9px">${escapeHtml(label)}</div>`;
}

/** A hairline. Structure here is carried by rules, not shadows. */
export function emailDivider(top = 26, bottom = 26): string {
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr><td class="vb-rule" height="1" style="padding:${top}px 0 ${bottom}px;line-height:0;font-size:0"><div style="height:1px;background:${LINE};line-height:0;font-size:0">&nbsp;</div></td></tr></table>`;
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
<html lang="en" style="color-scheme:light dark;supported-color-schemes:light dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(options.title)}</title>
<!--[if mso]>
<style>
  /* Word has no font fallback chain of its own; without this every cell
     that names a webfont-ish stack lands on Times New Roman. */
  * { font-family: Arial, Helvetica, sans-serif !important; }
  table { border-collapse: collapse !important; }
</style>
<![endif]-->
<style>
  /* Gmail and Outlook.com strip most of this. Everything it does is an
     enhancement, so losing it costs nothing. */
  a { color: ${MINT_DEEP}; }
  @media only screen and (max-width: 620px) {
    .vb-pad { padding-left: 22px !important; padding-right: 22px !important; }
    .vb-outer { padding: 20px 10px !important; }
    .vb-h1 { font-size: 18px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .vb-bg { background: #050706 !important; }
    .vb-card { background: ${SLAB} !important; border-color: #1e2422 !important; }
    .vb-ink, .vb-ink a { color: ${SLAB_FG} !important; }
    .vb-steel, .vb-steel a { color: #9aa3a0 !important; }
    .vb-faint { color: #7c8582 !important; }
    .vb-rule > div { background: #1e2422 !important; }
    .vb-wash { background: #0f1613 !important; border-color: #24302c !important; }
    /* mint-deep is picked for 5.4:1 on white and reads as sludge on black, so
       anything using it as *text* switches to the vivid mint here. */
    .vb-mint, .vb-mint a { color: ${MINT} !important; }
    .vb-chip { color: ${MINT} !important; }
    /* The pale mint hairline is a bright bar on black. */
    .vb-quote { border-left-color: #1f4d3f !important; }
    /* Must come after .vb-ink a. The button lives inside the body cell, so
       that rule's !important was overriding the anchor's inline colour and
       putting near-white text on a bright mint fill. Same specificity, so
       source order decides, and mint-ink is the only colour allowed on mint. */
    .vb-btn a { color: ${MINT_INK} !important; }
  }
</style>
</head>
<body class="vb-bg" style="margin:0;padding:0;width:100%;background:${SUNKEN};font-family:${FONT};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;-webkit-font-smoothing:antialiased">

<!-- Preview line, then filler. The filler is what stops Gmail appending the
     first words of the body to it in the inbox list. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${escapeHtml(options.preview)}</div>
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${"&#8203;&nbsp;".repeat(60)}</div>

<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="vb-bg" style="border-collapse:collapse;background:${SUNKEN}">
  <tr>
  <td align="center" class="vb-outer" style="padding:40px 16px">

    <!--[if mso]><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center"><tr><td><![endif]-->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="vb-card" style="border-collapse:separate;max-width:600px;background:${PAPER};border:1px solid ${LINE};border-radius:14px">

      <!-- Header. Mark plus wordmark, on one baseline. -->
      <tr>
      <td class="vb-pad" style="padding:24px 34px 22px">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <tr>
          <td valign="middle" style="padding-right:11px;line-height:0;font-size:0">${brandMark()}</td>
          <td valign="middle" style="font-family:${FONT};font-size:17.5px;font-weight:700;letter-spacing:-0.025em;line-height:1">
            <a href="${appUrl}" class="vb-ink" style="color:${INK};text-decoration:none">${site.name}</a>
          </td>
        </tr>
        </table>
      </td>
      </tr>

      <tr><td class="vb-rule" style="padding:0 34px;line-height:0;font-size:0"><div style="height:1px;background:${LINE};line-height:0;font-size:0">&nbsp;</div></td></tr>

      <!-- Body -->
      <tr>
      <td class="vb-pad vb-ink" style="padding:30px 34px 34px;font-family:${FONT};font-size:15px;line-height:1.6;color:${INK}">
        ${options.body}
      </td>
      </tr>

      <tr><td class="vb-rule" style="padding:0 34px;line-height:0;font-size:0"><div style="height:1px;background:${LINE};line-height:0;font-size:0">&nbsp;</div></td></tr>

      <!-- Footer -->
      <tr>
      <td class="vb-pad vb-steel" style="padding:20px 34px 24px;font-family:${FONT};font-size:12.5px;line-height:1.6;color:${STEEL}">
        ${options.footer ?? `Sent by ${site.name}. <a href="${appUrl}/app/settings/general" class="vb-steel" style="color:${STEEL};text-decoration:underline">Manage your email preferences</a>.`}
        <div class="vb-faint" style="font-family:${FONT};font-size:11.5px;color:${FAINT};padding-top:9px">${escapeHtml(site.legalEntity)}</div>
      </td>
      </tr>

    </table>
    <!--[if mso]></td></tr></table><![endif]-->

  </td>
  </tr>
</table>
</body>
</html>`;
}

export const emailStyles = {
  INK,
  STEEL,
  FAINT,
  LINE,
  PAPER,
  SUNKEN,
  MINT,
  MINT_INK,
  MINT_DEEP,
  MINT_WASH,
  SLAB,
  SLAB_FG,
  FONT,
};
