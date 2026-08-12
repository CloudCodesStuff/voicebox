import type { Metadata } from "next";

import { Clause, LegalPage } from "@/components/marketing/legal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Data Processing Agreement",
  description: `The Article 28 processor terms between you and ${site.name}, covering the feedback your users submit.`,
  alternates: { canonical: "/dpa" },
};

const UPDATED = "August 12, 2026";

export default function DpaPage() {
  return (
    <LegalPage
      title="Data Processing Agreement"
      updated={UPDATED}
      intro={
        <>
          When your users type into the widget, you decide why that data is
          collected and we act on your instructions. In GDPR terms you are the{" "}
          <strong>controller</strong> and we are the <strong>processor</strong>,
          and Article 28 requires the arrangement to be written down. This is
          it. It forms part of the <a href="/terms">Terms of Service</a>, and
          using {site.name} accepts it, so there is nothing to sign or send back.
        </>
      }
    >
      <Clause n="01" heading="What we process, and why">
        <ul>
          <li>
            <strong>Subject matter.</strong> Providing the {site.name} feedback
            collection and analysis service.
          </li>
          <li>
            <strong>Duration.</strong> For as long as your account exists, plus
            the backup window in clause 08.
          </li>
          <li>
            <strong>Nature and purpose.</strong> Collecting, storing, analyzing,
            grouping, displaying, and exporting end-user feedback.
          </li>
          <li>
            <strong>Types of personal data.</strong> Feedback text, feedback type
            and rating, an optional email address the submitter provides, page
            URL and referring page, browser user-agent, language, the identify
            traits you choose to send, and the submitter&apos;s IP address.
          </li>
          <li>
            <strong>Categories of data subject.</strong> Your users and site
            visitors, and the members of your team who use the dashboard.
          </li>
        </ul>
        <p>
          Do not send special category data (health, biometrics, political or
          religious views, and the rest of Article 9) through the widget. The
          product is not built for it and the acceptable use clause forbids it.
        </p>
      </Clause>

      <Clause n="02" heading="We act on your instructions">
        <p>
          We process end-user personal data only on your documented
          instructions. Your configuration in the product is those instructions:
          which projects exist, what the widget asks for, whether AI analysis is
          on, where webhooks point, and who is on your team.
        </p>
        <p>
          If we ever have to process something because the law requires it, we
          will tell you first unless that law forbids the warning.
        </p>
      </Clause>

      <Clause n="03" heading="Confidentiality">
        <p>
          Access is limited to people who need it to run or support the service,
          each under a duty of confidentiality that survives them leaving.
        </p>
      </Clause>

      <Clause n="04" heading="Security">
        <p>
          Our technical and organizational measures include: encryption in
          transit; tenant isolation enforced on the server for every read and
          write, so one customer&apos;s data cannot be addressed by another;
          API keys stored only as hashes; signed webhook payloads; role-based
          access inside an organization; automatic deletion of submitter IP
          addresses after seven days; and outbound request filtering that
          prevents the service being pointed at private networks.
        </p>
        <p>
          Measures change as the product does. They will not get materially
          weaker while you are a customer.
        </p>
      </Clause>

      <Clause n="05" heading="Subprocessors">
        <p>
          You give general authorization for the subprocessors listed in the{" "}
          <a href="/privacy">privacy policy</a>, which names each one, what it
          does, and where it is. Each is bound by terms no less protective than
          these.
        </p>
        <p>
          We&apos;ll give you at least 30 days&apos; notice by email before
          adding or replacing one. If you object on reasonable data-protection
          grounds, tell us within those 30 days and we&apos;ll work it out or
          you may terminate the affected part of the service without penalty.
        </p>
      </Clause>

      <Clause n="06" heading="International transfers">
        <p>
          The AI analysis provider, DeepSeek, is in China, which has no UK or EU
          adequacy decision. Where restricted transfer rules apply we rely on the
          EU Standard Contractual Clauses and the UK International Data Transfer
          Addendum, and we minimize what is transferred: feedback text, type, and
          rating only, never email addresses, identify traits, IP addresses, or
          page URLs.
        </p>
        <p>
          If that transfer doesn&apos;t work for your risk assessment, switch AI
          analysis off in Settings. Nothing goes to the provider while it&apos;s
          off, and the rest of the product carries on working.
        </p>
        <p>Our other subprocessors are in the United States.</p>
      </Clause>

      <Clause n="07" heading="Helping you with your obligations">
        <p>
          <strong>Data subject requests.</strong> Mostly you won&apos;t need us:
          search the inbox by email address to find someone&apos;s submissions,
          delete them from the same screen, and export everything from Settings.
          Where you do need us, we&apos;ll help, and we&apos;ll forward any
          request that reaches us directly rather than answering it ourselves.
        </p>
        <p>
          <strong>Breach notification.</strong> We&apos;ll tell you without undue
          delay and within 72 hours of becoming aware, with what happened, who is
          affected, the likely consequences, and what we&apos;re doing about it,
          so you can meet your own Article 33 deadline.
        </p>
        <p>
          <strong>Assessments.</strong> We&apos;ll give you the information you
          reasonably need for a DPIA or a prior consultation.
        </p>
      </Clause>

      <Clause n="08" heading="Deletion and return">
        <p>
          Export everything, any time, from Settings, as a single file covering
          every project, submission, and theme.
        </p>
        <p>
          Deleting your organization erases it and everything belonging to it
          immediately. Backups containing deleted data roll off within 30 days,
          and are not restored except in a disaster-recovery event.
        </p>
      </Clause>

      <Clause n="09" heading="Audit">
        <p>
          On reasonable written request, no more than once a year unless a
          regulator requires otherwise, we&apos;ll answer a security
          questionnaire and provide the information needed to show we&apos;re
          meeting this agreement. Where an on-site audit is genuinely required,
          we&apos;ll agree scope and timing in advance so it doesn&apos;t
          interfere with other customers.
        </p>
      </Clause>

      <Clause n="10" heading="Contact">
        <p>
          Data protection questions go to{" "}
          <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>, or{" "}
          {site.legalEntity}, {site.postalAddress}. Where this agreement and the
          Terms of Service disagree about personal data, this one wins.
        </p>
      </Clause>
    </LegalPage>
  );
}
