import type { Metadata } from "next";

import { Clause, LegalPage } from "@/components/marketing/legal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} collects, uses, stores, and shares information, including exactly what does and doesn't get sent to a language model.`,
  alternates: { canonical: "/privacy" },
};

const UPDATED = "August 12, 2026";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated={UPDATED}
      intro={
        <>
          This covers two groups. <strong>Customers</strong>, the teams who
          install {site.name}. And their <strong>end users</strong>, the people who
          type into the widget. For anything an end user submits, the customer
          is the controller and {site.name} is the processor acting on their
          instructions.
        </>
      }
    >
      <Clause n="01" heading="Who we are">
        <p>
          {site.legalEntity} operates {site.name}, a feedback widget and
          analysis service, and is the data controller for customer accounts.
          Write to us at{" "}
          <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> or{" "}
          {site.postalAddress}.
        </p>
      </Clause>

      <Clause n="02" heading="What we collect">
        <p>
          <strong>Account information.</strong> Signing in with Google gives us
          your name, email address, and profile image. We never receive your
          password. We also store the OAuth tokens Google issues and a session
          token, which is what keeps you signed in.
        </p>
        <p>
          <strong>Organization and project settings.</strong> Names, timezone,
          widget appearance, and your domain allowlist.
        </p>
        <p>
          <strong>Feedback submissions.</strong> The message text, the type and
          rating chosen, an optional email address the submitter typed, and
          context captured at the moment of submission: the page URL, the
          referring page, the browser user-agent, and the language setting.
        </p>
        <p>
          <strong>Identify traits.</strong> Whatever a customer chooses to pass
          through <code>{site.name}(&quot;identify&quot;, …)</code>, typically a user
          id, plan, or company. Customers are told not to put sensitive
          categories of data in here.
        </p>
        <p>
          <strong>Invitations.</strong> If someone invites you to their team, we
          store the email address they entered until the invitation is accepted,
          revoked, or expires.
        </p>
        <p>
          <strong>Technical information.</strong> The submitter&apos;s IP
          address, recorded against submissions solely to enforce rate limits and
          detect abuse, and deleted automatically after seven days.
        </p>
      </Clause>

      <Clause n="03" heading="Why we're allowed to (legal bases)">
        <p>
          Where the UK or EU GDPR applies, we rely on:
        </p>
        <ul>
          <li>
            <strong>Contract</strong>, to give a customer the service they signed
            up for: their account, their projects, their dashboard.
          </li>
          <li>
            <strong>Legitimate interests</strong>, to keep the service running
            and safe: rate limiting, abuse detection, and security logging. We
            think this is a low-impact and expected use.
          </li>
          <li>
            <strong>Legal obligation</strong>, where we must keep records.
          </li>
        </ul>
        <p>
          For end-user feedback, the legal basis is the{" "}
          <strong>customer&apos;s</strong> to establish, not ours. We process it
          only on their instructions.
        </p>
      </Clause>

      <Clause n="04" heading="What is, and isn't, sent to the AI model">
        <p>
          This is the section worth reading carefully, because it&apos;s the one
          people assume the worst about.
        </p>
        <p>
          <strong>Sent:</strong> the feedback message text, the type the person
          selected, and the rating they gave. For grouping, we send the
          one-sentence summaries the model itself wrote, plus the existing theme
          names so it can reuse them.
        </p>
        <p>
          <strong>Never sent:</strong> the email address the submitter typed,
          any identify traits the customer passed, the IP address, the page URL,
          or anything about the customer&apos;s account.
        </p>
        <p>
          That isn&apos;t only a promise. The function that scores a submission
          accepts three fields and no others, so there is no path through which
          the rest could travel, and the grouping step replaces record ids with
          line numbers before anything leaves.
        </p>
        <p>
          <strong>Our model provider is DeepSeek, a company based in Hangzhou,
          China.</strong> Feedback text is therefore transferred outside the UK,
          the EEA, and the United States, to a country without a UK or EU
          adequacy decision. Where that transfer is restricted, we rely on the
          UK International Data Transfer Addendum and the EU Standard
          Contractual Clauses, and customers should assess that transfer as part
          of their own compliance. We do not permit the provider to use content
          for training, and we send no direct identifiers with it.
        </p>
        <p>
          <strong>Any customer can switch AI analysis off</strong>, under
          Settings, without leaving the product. Nothing is sent to the model
          while it is off. Feedback is still collected, stored, and displayed;
          it simply arrives without sentiment or themes.
        </p>
      </Clause>

      <Clause n="05" heading="How we use information">
        <ul>
          <li>To run the service: collect, store, display, and analyze feedback.</li>
          <li>To score sentiment and cluster feedback into themes.</li>
          <li>To send product email, weekly digests and account notices.</li>
          <li>To enforce plan limits and rate limits, and to prevent abuse.</li>
          <li>To bill customers on paid plans.</li>
        </ul>
        <p>
          We do not sell or share personal information, as those terms are
          defined under California law, and we have not done so in the preceding
          twelve months. We do not use the contents of anyone&apos;s feedback to
          train models, and we run no advertising.
        </p>
      </Clause>

      <Clause n="06" heading="Cookies">
        <p>
          {site.name} sets four cookies, all of them strictly necessary, and no others.
          There is no analytics, no advertising pixel, no session recorder, and
          no third-party script anywhere on this site or in the dashboard. That
          is why you have never seen a cookie banner here: there is nothing to
          consent to.
        </p>
        <ul>
          <li>
            <code>authjs.session-token</code>, keeps you signed in.
          </li>
          <li>
            <code>authjs.csrf-token</code>, blocks cross-site request forgery.
          </li>
          <li>
            <code>authjs.callback-url</code>, returns you to the right page
            after signing in.
          </li>
          <li>
            <code>authjs.pkce.code_verifier</code>, secures the Google sign-in
            exchange. Expires in fifteen minutes.
          </li>
        </ul>
        <p>
          The dashboard also remembers which project you were last looking at,
          in your browser&apos;s local storage. It never leaves your device.
        </p>
        <p>
          <strong>The widget sets nothing at all.</strong> No cookie, no local
          storage, no identifier of any kind on the sites where it&apos;s
          installed. Installing {site.name} does not create a cookie-consent obligation
          for our customers.
        </p>
      </Clause>

      <Clause n="07" heading="Who else sees it">
        <p>We use these subprocessors:</p>
        <ul>
          <li><strong>Vercel</strong>, application hosting, United States.</li>
          <li><strong>Neon</strong>, PostgreSQL database hosting, United States.</li>
          <li><strong>Google</strong>, sign-in for customer accounts, United States.</li>
          <li><strong>DeepSeek</strong>, the language model behind analysis, China.</li>
          <li><strong>Resend</strong>, transactional and digest email, United States.</li>
          <li><strong>Stripe</strong>, subscription billing, United States. Used only once paid plans are enabled on your account.</li>
        </ul>
        <p>
          We&apos;ll give customers at least 30 days&apos; notice by email before
          adding or replacing a subprocessor, so there is time to object.
        </p>
        <p>
          <strong>Webhooks.</strong> Customers can configure {site.name} to forward each
          new submission to an endpoint of their choosing. Where they do, the
          submission, including any email address and identify traits, is sent to
          that destination. We don&apos;t control it, and the customer is
          responsible for what happens there.
        </p>
        <p>
          We also disclose information where the law requires it, and to a buyer
          if the business is ever sold, in which case this policy travels with
          it.
        </p>
      </Clause>

      <Clause n="08" heading="If you submitted feedback through a widget">
        <p>
          The business whose site you were on controls that record. The fastest
          way to have it corrected or deleted is to ask them directly. You can
          also write to{" "}
          <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> and
          we&apos;ll pass the request on and help them action it.
        </p>
        <p>
          The widget sets no cookies, stores nothing on your device, and does not
          follow you between sites. It records the page you submitted from and
          the page that referred you there, and nothing else about your browsing.
        </p>
      </Clause>

      <Clause n="09" heading="Retention">
        <p>
          Feedback and themes are retained for as long as the customer&apos;s
          account exists, their value is that they accumulate. Cancelling a paid
          plan deletes nothing; the account moves to the free tier and the
          history stays accessible and exportable.
        </p>
        <p>
          Two things expire on their own: submitter IP addresses are deleted
          after seven days, and invitations are removed once accepted, revoked,
          or expired.
        </p>
        <p>
          Deleting an organization removes it, its projects, its feedback, its
          themes, and the accounts of anyone who was only a member there. That
          happens immediately, from Settings, and cannot be undone. Backups roll
          off within 30 days.
        </p>
      </Clause>

      <Clause n="10" heading="Your rights">
        <p>
          Depending on where you live you may have the right to access, correct,
          export, or delete your personal information, to object to or restrict
          certain processing, and not to be discriminated against for asking.
        </p>
        <p>
          Two of those are buttons rather than requests.{" "}
          <strong>Export everything</strong> and{" "}
          <strong>Delete this organization</strong> are both under Settings, on
          every plan, and neither requires talking to us. For anything else,
          write to{" "}
          <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> and
          we&apos;ll respond within 30 days.
        </p>
        <p>
          If you&apos;re in the UK or EEA and think we&apos;ve got this wrong,
          you can complain to your data protection authority, in the UK the
          Information Commissioner&apos;s Office. We&apos;d rather you told us
          first so we can fix it.
        </p>
      </Clause>

      <Clause n="11" heading="Security">
        <p>
          Data is encrypted in transit. API keys are stored only as hashes and
          shown to you exactly once. Card details, when paid plans are enabled,
          are handled entirely by Stripe and never reach our servers. No system
          is perfectly secure and we won&apos;t pretend otherwise.
        </p>
        <p>
          If a breach affects your data, we&apos;ll notify affected customers
          without undue delay and within 72 hours of becoming aware, with what we
          know, what we&apos;re doing, and what you should do.
        </p>
      </Clause>

      <Clause n="12" heading="Children">
        <p>
          {site.name} is a business tool, is not directed at children under 13,
          and we do not knowingly collect their information. Customers agree not
          to install the widget on services directed at children. If you believe
          a child has submitted feedback through {site.name}, tell us and we&apos;ll
          remove it.
        </p>
      </Clause>

      <Clause n="13" heading="Changes">
        <p>
          We&apos;ll email account holders before making material changes and
          update the date at the top of this page.
        </p>
      </Clause>
    </LegalPage>
  );
}
