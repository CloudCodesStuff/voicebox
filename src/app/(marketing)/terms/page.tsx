import type { Metadata } from "next";

import { Clause, LegalPage } from "@/components/marketing/legal";
import { site } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description: `The agreement between your team and ${site.name}, what the service does, what it costs, and what happens to your data.`,
  path: "/terms",
});

const UPDATED = "August 12, 2026";

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated={UPDATED}
      intro={
        <>
          These govern your use of {site.name}. The short version: you install
          the widget, we collect and analyze the feedback, you can leave
          whenever you like, and your data stays yours on the way out.
        </>
      }
    >
      <Clause n="01" heading="The agreement">
        <p>
          This is between {site.legalEntity} (&ldquo;we&rdquo;) and whoever
          creates an account (&ldquo;you&rdquo;). Creating one means you accept
          these terms. If you&apos;re accepting for a company, you confirm you
          can bind it.
        </p>
      </Clause>

      <Clause n="02" heading="What the service does">
        <p>
          {site.name} provides an embeddable widget that collects feedback from
          your users, stores it, scores it for sentiment and intent, groups it
          into themes, and ranks those themes.
        </p>
        <p>
          The ranking is a decision aid, not a decision. Themes and priority
          scores are generated from what your users wrote; what you build is
          your call.
        </p>
      </Clause>

      <Clause n="03" heading="Your account and your key">
        <p>
          You&apos;re responsible for activity under your account. Your project
          key is <strong>publishable</strong>, it sits in your page source and
          should be treated as public. Restrict it with the domain allowlist
          under Settings → Projects. Secret API keys are different: keep those
          secret, and rotate them if exposed.
        </p>
      </Clause>

      <Clause n="04" heading="Your data and your users' data">
        <p>
          Everything you and your users put into {site.name} remains yours. You
          grant us only the permission needed to host it, analyze it as
          described in the privacy policy, and show it back to you.
        </p>
        <p>
          <strong>You are responsible for the notice you give your own
          users.</strong> If your jurisdiction requires you to disclose that
          feedback is processed by a third party or analyzed by AI, that
          disclosure is yours to make. Our privacy policy describes exactly what
          we do so you can point at it.
        </p>
      </Clause>

      <Clause n="05" heading="Acceptable use">
        <ul>
          <li>Don&apos;t use the widget to collect passwords, payment details, health records, or government identifiers. It&apos;s a feedback box, not a form builder.</li>
          <li>Don&apos;t install it on sites you don&apos;t control.</li>
          <li>Don&apos;t attempt to access another organization&apos;s data, probe our systems, or work around rate limits.</li>
          <li>Don&apos;t resell or white-label the service without a written agreement with us.</li>
        </ul>
        <p>
          We may suspend an account causing ongoing harm. Where it&apos;s
          reasonable, we&apos;ll warn you first.
        </p>
      </Clause>

      <Clause n="06" heading="Plans, limits, and billing">
        <p>
          Where paid plans are enabled, they are billed in advance through
          Stripe and metered on feedback volume per period. Stripe handles the
          card; we never see or store the number.
        </p>
        <p>
          Going over your limit does <strong>not</strong> discard your
          users&apos; feedback. We keep accepting submissions up to a hard
          ceiling and pause AI analysis on the excess until the period resets or
          you upgrade. Throwing away someone&apos;s words because of a billing
          state would be the wrong trade.
        </p>
        <p>
          Cancel any time; you move to the free plan at the end of the period
          you&apos;ve paid for. No refunds for partial periods. Price increases
          come with at least 30 days&apos; notice.
        </p>
      </Clause>

      <Clause n="07" heading="AI-generated output">
        <p>
          Sentiment scores, categories, summaries, theme titles, and priority
          rankings are produced by a language model and simple arithmetic over
          its output. They will occasionally be wrong. Every theme links to the
          verbatim feedback behind it precisely so you can check, read the
          quotes before you act on the ranking.
        </p>
      </Clause>

      <Clause n="08" heading="Availability">
        <p>
          We work to keep the service running but don&apos;t promise it will be
          uninterrupted or error-free, and there&apos;s no formal uptime
          guarantee on these plans. The widget is designed to fail silently:
          if our servers are unreachable, it does nothing rather than breaking
          your page.
        </p>
      </Clause>

      <Clause n="09" heading="If you leave">
        <p>
          Cancelling deletes nothing. Your feedback, themes, and history stay
          accessible on the free plan. <strong>Export everything</strong> under
          Settings gives you the lot as a single file, on every plan including
          Free, with no upgrade and no request to us. If we ever discontinue the
          service, you get at least 60 days to export before anything is removed.
        </p>
      </Clause>

      <Clause n="10" heading="Processing your users' data">
        <p>
          For feedback your users submit, you are the controller and we are the
          processor. Our <a href="/dpa">Data Processing Agreement</a> forms part
          of these terms and sets out what that means: that we act only on your
          documented instructions, keep the people who handle it under
          confidentiality, help you answer data subject requests, tell you about
          a breach without undue delay, and delete or return the data when you
          leave.
        </p>
        <p>
          You don&apos;t need to sign anything separate. Using the service
          accepts it.
        </p>
      </Clause>

      <Clause n="11" heading="Liability">
        <p>
          To the extent the law allows, the service is provided &ldquo;as
          is&rdquo; and without warranties of any kind, express or implied,
          including merchantability and fitness for a particular purpose. Our
          total liability for any claim is limited to what you paid us in the
          twelve months before it arose. We&apos;re not liable for lost profits
          or indirect damages. Nothing here limits liability that cannot
          lawfully be limited, including for death or personal injury caused by
          negligence, or for fraud.
        </p>
      </Clause>

      <Clause n="12" heading="Indemnity">
        <p>
          You&apos;ll cover us against claims arising from the feedback you
          collect through {site.name}, from installing the widget somewhere you
          weren&apos;t entitled to, or from breaking clause 05. We&apos;ll cover
          you against a claim that the service itself infringes someone
          else&apos;s intellectual property. Either way, the one being covered
          tells the other promptly and lets them run the defense.
        </p>
      </Clause>

      <Clause n="13" heading="Ending the agreement">
        <p>
          You may close your account at any time.{" "}
          <strong>Delete this organization</strong> under Settings does it
          immediately and removes everything, so export first if you want a copy.
          We may end this agreement if you materially breach these terms and
          don&apos;t fix it within 14 days of us asking, or immediately where the
          breach is causing ongoing harm.
        </p>
      </Clause>

      <Clause n="14" heading="Governing law and disputes">
        <p>
          These terms are governed by the laws of {site.governingLaw}, without
          regard to conflict-of-law rules, and the courts of {site.venue} have
          exclusive jurisdiction. If you&apos;re a consumer, this doesn&apos;t
          take away rights you have under the law of the place you live.
        </p>
        <p>
          Talk to us first. Almost everything is faster to resolve by email than
          by filing.
        </p>
      </Clause>

      <Clause n="15" heading="The rest">
        <ul>
          <li>
            <strong>Severability.</strong> If one clause turns out to be
            unenforceable, the rest still stands.
          </li>
          <li>
            <strong>Entire agreement.</strong> These terms, the privacy policy,
            and the DPA are the whole deal, and they replace anything said
            beforehand.
          </li>
          <li>
            <strong>No waiver.</strong> Not enforcing something once doesn&apos;t
            mean giving it up.
          </li>
          <li>
            <strong>Assignment.</strong> You may not transfer this agreement
            without our consent. We may transfer it to a buyer of the business,
            and we&apos;ll tell you if that happens.
          </li>
          <li>
            <strong>Force majeure.</strong> Neither of us is liable for a failure
            caused by something genuinely outside our control.
          </li>
          <li>
            <strong>Notices.</strong> To you, by email to your account address.
            To us, by email to{" "}
            <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>.
            Email is the agreed channel for formal notice under this agreement,
            and a notice is given when sent.
          </li>
          <li>
            <strong>No third-party beneficiaries.</strong> This agreement is
            between the two of us.
          </li>
        </ul>
      </Clause>

      <Clause n="16" heading="Changes and contact">
        <p>
          We&apos;ll email account holders before material changes. Questions to{" "}
          <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>. This
          agreement is with {site.legalEntity}.
        </p>
      </Clause>
    </LegalPage>
  );
}
