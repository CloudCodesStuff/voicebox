import type { Metadata } from "next";
import Link from "next/link";

import { Callout, CodeBlock, H2 } from "@/components/marketing/docs";
import { site } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Triggers & JavaScript API",
  description: `Open the ${site.name} widget from your own button, attach who the user is, and hook it into your app's own flows.`,
  path: "/docs/triggers",
});

export default function TriggersDocs() {
  return (
    <>
      <h1 className="text-[2.1rem] font-bold tracking-[-0.025em] text-ink">
        Triggers &amp; JavaScript API
      </h1>
      <p className="mt-4 text-[1rem] leading-relaxed text-steel">
        The floating button is the default, not the only option. You can open
        the panel from your own UI, from a keyboard shortcut, or at a moment
        that matters in your product, and attach who the person is before they
        write a word.
      </p>

      <H2 id="attribute">Open it from your own button</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Put <code className="font-mono">data-voicebox-trigger</code> on any
        element. No JavaScript, and it works on elements added to the page
        later, since the listener is delegated from{" "}
        <code className="font-mono">document</code>.
      </p>
      <CodeBlock
        className="mt-4"
        filename="anywhere in your markup"
        code={`<button data-voicebox-trigger>Send feedback</button>

<!-- Works on links, menu items, anything clickable -->
<a href="#" data-voicebox-trigger>Report a problem</a>`}
      />
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Turn off the floating button under{" "}
        <strong className="text-ink">Widget → Trigger</strong> when you are
        supplying your own, otherwise you will have two ways in.
      </p>

      <Callout type="note" title="Clicks during page load are not lost">
        The listener is attached the moment the script executes, before the
        widget has finished loading its configuration. A click in that window
        is remembered and the panel opens as soon as it is ready, so your
        button is never inert.
      </Callout>

      <H2 id="api">The JavaScript API</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        A single global function, available as soon as the script runs.
      </p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[540px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-paper-2">
              <th className="label px-4 py-3">Call</th>
              <th className="label px-4 py-3">Does</th>
            </tr>
          </thead>
          <tbody className="bg-paper-2">
            {[
              [`Voicebox("open")`, "Opens the panel. Queues if still loading."],
              [`Voicebox("close")`, "Closes the panel."],
              [
                `Voicebox("identify", {…})`,
                "Attaches traits to every submission from this visitor.",
              ],
            ].map(([call, does]) => (
              <tr key={call} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono text-[0.78rem] whitespace-nowrap text-ink">
                  {call}
                </td>
                <td className="px-4 py-3 text-[0.84rem] text-steel">{does}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2 id="shortcut">A keyboard shortcut</H2>
      <CodeBlock
        className="mt-4"
        filename="app.js"
        code={`document.addEventListener("keydown", (e) => {
  // ⌘/ or Ctrl+/ opens feedback from anywhere
  if ((e.metaKey || e.ctrlKey) && e.key === "/") {
    e.preventDefault();
    Voicebox("open");
  }
});`}
      />
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        <code className="font-mono">Esc</code> closes the panel already, you do
        not need to wire that up.
      </p>

      <H2 id="moments">Ask at the right moment</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        The best feedback arrives just after something notable happened. Open
        the panel then, rather than hoping people find the button later.
      </p>
      <CodeBlock
        className="mt-4"
        filename="app.js"
        code={`// After a task that took real effort
async function onExportFinished() {
  Voicebox("identify", { lastAction: "export", exportRows: 12400 });
  Voicebox("open");
}

// After someone hits an error, while it's fresh
function onPaymentFailed(code) {
  Voicebox("identify", { errorCode: code, screen: "checkout" });
  Voicebox("open");
}`}
      />
      <Callout type="warning" title="Do this sparingly">
        An unprompted panel is an interruption. Once, after a meaningful moment,
        reads as attentive. On every page load it reads as a pop-up and people
        learn to dismiss it without reading.
      </Callout>

      <H2 id="identify">Attaching who they are</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Call <code className="font-mono">identify</code> once you know who the
        visitor is, usually right after your own auth resolves. Traits are held
        for the session and attached to anything they submit, so feedback
        arrives with the account already on it and you can reply without asking
        who they are.
      </p>
      <CodeBlock
        className="mt-4"
        filename="app.js"
        code={`Voicebox("identify", {
  userId: "usr_8123",
  plan: "pro",
  company: "Acme",
  signedUpAt: "2026-02-14",
  seats: 25,
});`}
      />
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Calls merge rather than replace, so you can add traits as you learn
        them. Up to 30 keys and 4KB per submission. Go over and the extra traits
        are trimmed, never the message: an over-filled{" "}
        <code className="font-mono">identify</code> call should not cost you
        what somebody took the time to write.
      </p>

      <Callout type="tip" title="Traits never reach the model">
        Only the message text, the chosen type, and the rating are sent for
        analysis. Identity traits and the optional email address are stored on
        the record and shown to you, and are deliberately excluded from what
        goes to the AI provider. See{" "}
        <Link href="/docs/security" className="text-ink underline">
          Security &amp; privacy
        </Link>
        .
      </Callout>

      <H2 id="collecting-elsewhere">Collecting without the widget</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        A mobile app, a CLI, a support inbox, a Discord bot: anything that can
        make an HTTP request can file feedback, and it lands in the same inbox
        and the same themes as widget submissions.
      </p>
      <CodeBlock
        className="mt-4"
        filename="POST /api/ingest"
        code={`curl -X POST ${site.url}/api/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "key": "pk_live_your_key",
    "body": "The CSV export drops the last row.",
    "type": "ISSUE",
    "rating": 2,
    "email": "sam@acme.com",
    "metadata": { "source": "ios-app", "version": "3.4.1" }
  }'`}
      />
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Full request and response shape is in the{" "}
        <Link href="/docs/api" className="text-ink underline">
          API reference
        </Link>
        . Note that server-to-server calls have no{" "}
        <code className="font-mono">Origin</code> header, so if you have set a
        domain allowlist you will need to send from the browser or leave the
        allowlist empty for that project.
      </p>
    </>
  );
}
