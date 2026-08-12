import type { Metadata } from "next";
import Link from "next/link";

import { Callout, CodeBlock, H2 } from "@/components/marketing/docs";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Security & privacy",
  description: `How ${site.name} keys work, how to lock the widget to your domains, what to put in your Content Security Policy, and exactly what data leaves your page.`,
  alternates: { canonical: "/docs/security" },
};

const WIDGET_ORIGIN = new URL(site.url).origin;

export default function SecurityDocs() {
  return (
    <>
      <h1 className="text-[2.1rem] font-bold tracking-[-0.025em] text-ink">
        Security &amp; privacy
      </h1>
      <p className="mt-4 text-[1rem] leading-relaxed text-steel">
        The widget runs on your users&apos; browsers, on your domain. This page
        is the full account of what it can do, what it sends, and how to lock it
        down.
      </p>

      <H2 id="keys">Your project key is public</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Keys starting <code className="font-mono">pk_</code> are{" "}
        <strong className="text-ink">publishable</strong>. They sit in your page
        source where anyone can read them, and that is fine, by design. A
        project key can do exactly one thing: submit feedback to that project.
      </p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-paper-2">
              <th className="label px-4 py-3">A project key can</th>
              <th className="label px-4 py-3">A project key cannot</th>
            </tr>
          </thead>
          <tbody className="bg-paper-2">
            <tr className="border-b border-line last:border-0">
              <td className="px-4 py-3 align-top text-[0.84rem] text-steel">
                Post a new piece of feedback
                <br />
                Read the widget&apos;s own appearance settings
              </td>
              <td className="px-4 py-3 align-top text-[0.84rem] text-steel">
                Read any feedback, yours or anyone else&apos;s
                <br />
                See themes, members, or account data
                <br />
                Change any setting
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Callout type="warning" title="API keys are different">
        Keys starting <code className="font-mono">sk_</code>, created under{" "}
        <strong className="text-ink">Settings → Developers</strong>, read your
        feedback and themes. Those are secret. Never put one in front-end code,
        and rotate it immediately if it leaks.
      </Callout>

      <H2 id="allowlist">Lock it to your domains</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Add your domains under{" "}
        <strong className="text-ink">Settings → Projects</strong>. Once the list
        is non-empty, submissions are only accepted from those origins, so
        somebody who copies your key out of your page source cannot post with it
        from theirs.
      </p>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        An empty list means any origin, which is the right default for getting
        started and the wrong one to stay on. Subdomains are matched, so{" "}
        <code className="font-mono">acme.com</code> covers{" "}
        <code className="font-mono">app.acme.com</code>.
      </p>
      <Callout type="note" title="Server-side calls and the allowlist">
        A request from your backend has no <code className="font-mono">Origin</code>{" "}
        header, and a project with an allowlist refuses those rather than
        waving them through, since a missing header is trivially forged. If you
        post from a server or a mobile app, use a project with an empty
        allowlist for that traffic.
      </Callout>

      <H2 id="csp">Content Security Policy</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        If your site sends a CSP header, the widget needs two entries: one to
        load the script, one to reach the API. Without them the browser blocks
        it silently and the only trace is a console error.
      </p>
      <CodeBlock
        className="mt-4"
        filename="Content-Security-Policy"
        code={`script-src  'self' ${WIDGET_ORIGIN};
connect-src 'self' ${WIDGET_ORIGIN};`}
      />
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        That is the whole list. The widget loads no fonts, no images, and no
        third-party code, so <code className="font-mono">font-src</code>,{" "}
        <code className="font-mono">img-src</code> and{" "}
        <code className="font-mono">frame-src</code> need nothing added.
      </p>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Its styles live inside a shadow root and are injected as a stylesheet,
        so a <code className="font-mono">style-src</code> without{" "}
        <code className="font-mono">&apos;unsafe-inline&apos;</code> can still
        block them, leaving an unstyled panel rather than no panel. If yours is
        strict, allow the widget origin there too.
      </p>

      <H2 id="isolation">It cannot break your page</H2>
      <ul className="mt-4 space-y-3 text-[0.9rem] leading-relaxed text-steel">
        <li>
          <strong className="text-ink">Style isolation.</strong> Everything
          renders in a Shadow DOM root with{" "}
          <code className="font-mono">:host &#123; all: initial &#125;</code>.
          Your CSS cannot reach in, including{" "}
          <code className="font-mono">!important</code> rules on{" "}
          <code className="font-mono">*</code>, and nothing we ship leaks out.
        </li>
        <li>
          <strong className="text-ink">No globals but one.</strong> The script
          defines <code className="font-mono">window.Voicebox</code> and nothing
          else. It does not patch built-ins, add polyfills, or touch{" "}
          <code className="font-mono">fetch</code>.
        </li>
        <li>
          <strong className="text-ink">Fails quietly.</strong> If our API is
          unreachable the widget does not render and throws nothing into your
          error tracking. A feedback tool having a bad day must never take a
          customer&apos;s site with it.
        </li>
        <li>
          <strong className="text-ink">Never blocks.</strong> Loaded async and
          mounted on an idle callback, so it renders after your page is
          interactive, not before.
        </li>
      </ul>

      <H2 id="data">What actually gets sent</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        On submit, and only on submit. Nothing is transmitted while somebody is
        merely browsing your site.
      </p>
      <CodeBlock
        className="mt-4"
        filename="one submission"
        code={`{
  "body":     "the message they wrote",
  "type":     "IDEA | ISSUE | PRAISE | QUESTION | OTHER",
  "rating":   1-5, or null if you turned the scale off,
  "email":    only if they chose to type one,
  "pageUrl":  the page they were on when they sent it,
  "referrer": document.referrer, if any,
  "locale":   navigator.language,
  "metadata": whatever you passed to identify()
}`}
      />
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        There are no cookies, no localStorage, no fingerprinting, and no
        cross-site tracking of any kind. The widget cannot see your other pages,
        your users&apos; sessions, or anything they type outside its own
        textarea.
      </p>

      <H2 id="ai">What reaches the AI provider</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Three fields, and no others: the message body, the type they picked, and
        the rating. The email address and every identity trait are held back by
        construction, not by a filter that could be forgotten, so the model
        never receives anything that names a person.
      </p>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        You can switch analysis off entirely under{" "}
        <strong className="text-ink">Settings → General</strong>. Feedback is
        still collected, stored and shown, it simply is not scored or grouped,
        and nothing leaves for a model at all.
      </p>

      <H2 id="abuse">Spam and abuse</H2>
      <ul className="mt-4 space-y-3 text-[0.9rem] leading-relaxed text-steel">
        <li>
          <strong className="text-ink">No captcha.</strong> A honeypot field and
          a timing check catch scripted submissions without making a real person
          identify traffic lights.
        </li>
        <li>
          <strong className="text-ink">Rate limited per IP</strong>, so one
          source cannot flood a project.
        </li>
        <li>
          <strong className="text-ink">Origin checked</strong> against your
          allowlist on every request.
        </li>
      </ul>

      <H2 id="retention">Retention and your users&apos; rights</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Submitter IP addresses are kept for seven days, purely to make the rate
        limit work, and then deleted automatically. Everything else is kept
        until you delete it.
      </p>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        You can export everything your workspace holds as JSON, or delete the
        workspace and all of it, from{" "}
        <strong className="text-ink">Settings → General</strong>, without asking
        us. For the contractual side, see the{" "}
        <Link href="/dpa" className="text-ink underline">
          Data Processing Agreement
        </Link>{" "}
        and the{" "}
        <Link href="/privacy" className="text-ink underline">
          Privacy Policy
        </Link>
        .
      </p>
      <Callout type="note" title="You are the controller">
        Feedback your users submit is your data. We process it on your
        instructions to run the service, and we do not sell it, share it, or use
        it to train anything.
      </Callout>
    </>
  );
}
