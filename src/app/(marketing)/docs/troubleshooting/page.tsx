import type { Metadata } from "next";
import Link from "next/link";

import { Callout, CodeBlock, H2 } from "@/components/marketing/docs";
import { site } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Troubleshooting",
  description: `Why the ${site.name} widget isn't appearing, why submissions are rejected, and how to diagnose both in under a minute.`,
  path: "/docs/troubleshooting",
});

export default function TroubleshootingDocs() {
  return (
    <>
      <h1 className="text-[2.1rem] font-bold tracking-[-0.025em] text-ink">
        Troubleshooting
      </h1>
      <p className="mt-4 text-[1rem] leading-relaxed text-steel">
        Almost every problem is one of five things. This page is ordered by how
        often each one turns out to be the cause.
      </p>

      <H2 id="triage">Start here</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Open your site, open the browser console, and paste this. It tells you
        which of the three stages failed.
      </p>
      <CodeBlock
        className="mt-4"
        filename="browser console"
        code={`typeof window.Voicebox              // script executed?
!!document.querySelector("[data-voicebox]")  // mounted?
Voicebox("open")                    // renders?`}
      />
      <ul className="mt-5 space-y-3 text-[0.9rem] leading-relaxed text-steel">
        <li>
          <code className="font-mono">&quot;undefined&quot;</code> on the first
          line: the script never ran. Jump to{" "}
          <a href="#not-loading" className="text-ink underline">
            the script isn&apos;t loading
          </a>
          .
        </li>
        <li>
          Function, but <code className="font-mono">false</code> on the second:
          the script ran and the config request failed. See{" "}
          <a href="#wrong-key" className="text-ink underline">
            wrong or inactive key
          </a>
          .
        </li>
        <li>
          Both fine, no button on screen: the floating trigger is switched off.
          See{" "}
          <a href="#no-button" className="text-ink underline">
            no button
          </a>
          .
        </li>
      </ul>

      <H2 id="not-loading">1. The script isn&apos;t loading</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Open the Network tab and filter for{" "}
        <code className="font-mono">widget.js</code>.
      </p>
      <ul className="mt-4 space-y-3 text-[0.9rem] leading-relaxed text-steel">
        <li>
          <strong className="text-ink">Not in the list at all.</strong> The tag
          isn&apos;t on the page. On Webflow and Squarespace, custom code only
          runs on the published site, never in the editor preview. On WordPress,
          check you edited the active theme.
        </li>
        <li>
          <strong className="text-ink">
            Blocked by Content Security Policy.
          </strong>{" "}
          The console says so explicitly. Add the two entries in{" "}
          <Link href="/docs/security#csp" className="text-ink underline">
            Security &amp; privacy
          </Link>
          . This is the single most common cause on established sites.
        </li>
        <li>
          <strong className="text-ink">Blocked by an ad blocker.</strong> Some
          lists catch anything that looks like third-party analytics. Test in a
          private window with extensions disabled to rule it in or out.
        </li>
        <li>
          <strong className="text-ink">A bundler ate it.</strong> In Astro use{" "}
          <code className="font-mono">is:inline</code>. In React, put the tag in
          the HTML shell rather than importing it from a component.
        </li>
      </ul>

      <H2 id="wrong-key">2. Wrong or inactive project key</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Look for the request to{" "}
        <code className="font-mono">/api/widget/pk_…</code> in the Network tab.
        A 404 means the key doesn&apos;t match a project, usually a copied
        placeholder, a truncated paste, or a key regenerated after you installed
        it.
      </p>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Copy it fresh from the{" "}
        <Link href="/app/widget" className="text-ink underline">
          Widget
        </Link>{" "}
        page. Keys are <code className="font-mono">pk_</code> followed by a long
        random string, with no spaces or line breaks.
      </p>

      <H2 id="no-button">3. It loaded, but there&apos;s no button</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        If <code className="font-mono">Voicebox(&quot;open&quot;)</code> opens
        the panel, everything works and the floating trigger is simply hidden.
        Turn it back on under <strong className="text-ink">Widget → Trigger</strong>
        , or keep it hidden and open the panel from your own button, which is
        what{" "}
        <Link href="/docs/triggers" className="text-ink underline">
          Triggers
        </Link>{" "}
        covers.
      </p>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        If the button is there but sits under something else, the widget takes a
        very high stacking position inside its own root. An element on your page
        with an extreme <code className="font-mono">z-index</code> can still win.
        Check what is overlapping that corner, or move the widget to a different
        one in the studio.
      </p>

      <H2 id="rejected">4. Submissions are rejected</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        The panel opens, the message is written, and sending shows an error. The
        response from <code className="font-mono">/api/ingest</code> says which:
      </p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-paper-2">
              <th className="label px-4 py-3">Status</th>
              <th className="label px-4 py-3">Meaning</th>
              <th className="label px-4 py-3">Fix</th>
            </tr>
          </thead>
          <tbody className="bg-paper-2">
            {[
              [
                "403",
                "Origin not allowed for this project",
                "Add the domain under Settings → Projects. Include staging.",
              ],
              [
                "403",
                "Origin required",
                "A server-side call to a project that has an allowlist. Use a project without one.",
              ],
              [
                "429",
                "Too many submissions",
                "That IP hit the hourly cap. Expected while testing repeatedly.",
              ],
              [
                "429",
                "Not accepting feedback right now",
                "The plan's allowance for this period is used up. Upgrade, or wait for the window to reset.",
              ],
              [
                "400",
                "Validation failed",
                "Usually an empty message or a rating outside 1-5.",
              ],
              [
                "404",
                "Unknown project",
                "The key doesn't match a project. See section 2 above.",
              ],
            ].map(([status, meaning, fix], i) => (
              <tr key={i} className="border-b border-line last:border-0">
                <td className="px-4 py-3 tnum align-top text-[0.8rem] text-ink">
                  {status}
                </td>
                <td className="px-4 py-3 align-top text-[0.82rem] text-ink">
                  {meaning}
                </td>
                <td className="px-4 py-3 align-top text-[0.82rem] text-steel">
                  {fix}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout type="note" title="Your users' words are never lost to metadata">
        If you pass more identity traits than fit, the extra traits are trimmed
        and the message still goes through. An over-filled{" "}
        <code className="font-mono">identify()</code> call cannot cost you
        someone&apos;s feedback.
      </Callout>

      <H2 id="no-themes">5. Feedback arrives but no themes appear</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Themes need a pattern before there is one to name. Below roughly twenty
        submissions per project you will see individual feedback in the inbox,
        scored and summarised, but few or no groups. That is the system being
        honest rather than inventing structure.
      </p>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        If you have plenty and still see nothing, check that analysis is
        switched on under{" "}
        <strong className="text-ink">Settings → General</strong>. The dashboard
        says so explicitly when it is paused. You can also force a pass with{" "}
        <strong className="text-ink">Regroup now</strong> on the overview rather
        than waiting for the scheduled run.
      </p>

      <H2 id="styles">Styling looks wrong</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        An unstyled panel, rather than no panel, almost always means a{" "}
        <code className="font-mono">style-src</code> policy blocking the
        stylesheet inside the shadow root. Your page&apos;s own CSS cannot cause
        this, it genuinely cannot reach inside.
      </p>

      <H2 id="stuck">Still stuck</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Email{" "}
        <a
          href={`mailto:${site.supportEmail}`}
          className="text-ink underline"
        >
          {site.supportEmail}
        </a>{" "}
        with the URL, your project key (it&apos;s publishable, safe to send),
        and whatever the console printed. That is usually enough to answer
        without a back-and-forth.
      </p>
    </>
  );
}
