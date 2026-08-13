import type { Metadata } from "next";
import Link from "next/link";

import { Callout, CodeBlock, CodeTabs, H2 } from "@/components/marketing/docs";
import { site } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Install the widget",
  description: "Add the Voicebox feedback widget to any site: plain HTML, Next.js, React, Vue, Nuxt, Svelte, Astro, WordPress, Shopify, Webflow, or Google Tag Manager.",
  path: "/docs/install",
});

const SRC = `${site.url}/widget.js`;
const KEY = "pk_live_your_key";

const tabs = [
  {
    label: "HTML",
    filename: "index.html",
    code: `<!-- Anywhere before </body> -->
<script async
  src="${SRC}"
  data-project="${KEY}"></script>`,
  },
  {
    label: "Next.js",
    filename: "app/layout.tsx",
    code: `import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="${SRC}"
          data-project="${KEY}"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}`,
  },
  {
    label: "React",
    filename: "index.html",
    code: `<!-- Vite, Create React App, or any bundler: put it in the
     HTML shell, not in a component. The widget mounts itself
     outside React's tree, so re-renders never touch it. -->
<body>
  <div id="root"></div>
  <script async
    src="${SRC}"
    data-project="${KEY}"></script>
</body>`,
  },
  {
    label: "Vue / Nuxt",
    filename: "nuxt.config.ts",
    code: `export default defineNuxtConfig({
  app: {
    head: {
      script: [
        {
          src: "${SRC}",
          "data-project": "${KEY}",
          async: true,
        },
      ],
    },
  },
});

// Plain Vue (Vite): add the same <script> tag to index.html.`,
  },
  {
    label: "Svelte",
    filename: "src/app.html",
    code: `<!-- SvelteKit: src/app.html. Plain Svelte: index.html -->
<body data-sveltekit-preload-data="hover">
  <div style="display: contents">%sveltekit.body%</div>
  <script async
    src="${SRC}"
    data-project="${KEY}"></script>
</body>`,
  },
  {
    label: "Astro",
    filename: "src/layouts/Layout.astro",
    code: `---
// is:inline keeps Astro from bundling it, which would
// break the data-project attribute lookup.
---
<html lang="en">
  <body>
    <slot />
    <script
      is:inline
      async
      src="${SRC}"
      data-project="${KEY}"></script>
  </body>
</html>`,
  },
];

const noCode = [
  {
    label: "WordPress",
    filename: "no plugin required",
    code: `Appearance → Theme File Editor → footer.php
Paste immediately before </body>:

<script async
  src="${SRC}"
  data-project="${KEY}"></script>

Using a block theme with no footer.php? Any
"insert headers and footers" plugin works, or add it
under Site Kit / Custom HTML in the footer template.`,
  },
  {
    label: "Shopify",
    filename: "no app required",
    code: `Online Store → Themes → ⋯ → Edit code
Open layout/theme.liquid, paste before </body>:

<script async
  src="${SRC}"
  data-project="${KEY}"></script>

It loads on every storefront page, including checkout
pages you control.`,
  },
  {
    label: "Webflow",
    filename: "no plugin required",
    code: `Site settings → Custom code → Footer code
Paste, then publish (custom code does not run in
the Designer preview, only on the published site):

<script async
  src="${SRC}"
  data-project="${KEY}"></script>`,
  },
  {
    label: "Squarespace",
    filename: "Business plan or above",
    code: `Settings → Advanced → Code Injection → Footer

<script async
  src="${SRC}"
  data-project="${KEY}"></script>

Code injection needs a Business plan or above.`,
  },
  {
    label: "Tag Manager",
    filename: "Google Tag Manager",
    code: `Tags → New → Custom HTML
Trigger: All Pages

<script async
  src="${SRC}"
  data-project="${KEY}"></script>

Leave "Support document.write" unchecked. GTM injects
the tag after load, which the widget handles: it falls
back to querying for script[data-project] when
document.currentScript is unavailable.`,
  },
];

export default function InstallDocs() {
  return (
    <>
      <h1 className="text-[2.1rem] font-bold tracking-[-0.025em] text-ink">
        Install the widget
      </h1>
      <p className="mt-4 text-[1rem] leading-relaxed text-steel">
        One script tag, anywhere before the closing{" "}
        <code className="font-mono">&lt;/body&gt;</code>. No package to install,
        no build step, no dependency on your framework. Takes about a minute.
      </p>

      <H2 id="key">Get your project key</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Open the{" "}
        <Link href="/app/widget" className="text-ink underline">
          Widget
        </Link>{" "}
        page in your dashboard. The snippet there already has your key filled
        in, so the fastest path is to copy it from there rather than from this
        page. Keys look like{" "}
        <code className="font-mono">pk_live_a1b2c3…</code> and are safe to put
        in your page source, see{" "}
        <Link href="/docs/security" className="text-ink underline">
          Security &amp; privacy
        </Link>
        .
      </p>

      <H2 id="framework">Add the script</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Pick your stack. Every one of these does the same thing, the only
        difference is where the tag lives.
      </p>
      <CodeTabs className="mt-5" tabs={tabs} />

      <H2 id="no-code">Site builders and no-code</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        No developer needed. Each of these is a paste into a settings field.
      </p>
      <CodeTabs className="mt-5" tabs={noCode} />

      <H2 id="verify">Check that it worked</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Load your site and look for the feedback button in the corner. If it is
        there, you are done, send yourself a test message and watch it land in
        the inbox within a few seconds.
      </p>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        If you would rather confirm from the console, this tells you whether
        the script ran and whether it mounted:
      </p>
      <CodeBlock
        className="mt-4"
        filename="browser console"
        code={`// Did the script execute?
typeof window.Voicebox === "function"   // → true

// Did it mount?
!!document.querySelector("[data-voicebox]")   // → true

// Force it open, regardless of your trigger settings
Voicebox("open")`}
      />

      <Callout type="tip" title="Nothing appears?">
        Almost always one of three things: a Content Security Policy blocking
        the script, the domain allowlist not including the site you are testing
        on, or the floating button switched off in the studio.{" "}
        <Link href="/docs/troubleshooting" className="text-ink underline">
          Troubleshooting
        </Link>{" "}
        walks through each in order.
      </Callout>

      <H2 id="spa">Single-page apps</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Nothing to do. The widget mounts once and lives outside your
        framework&apos;s DOM tree, in its own shadow root attached to{" "}
        <code className="font-mono">&lt;body&gt;</code>, so client-side route
        changes leave it untouched. It does not re-mount, re-fetch its config,
        or flicker between routes.
      </p>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        The page a submission came from is captured at the moment it is sent,
        not at page load, so feedback written after three route changes records
        the URL the person was actually looking at.
      </p>

      <H2 id="staging">Staging and production</H2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Use a separate project per environment rather than one key everywhere.
        Staging noise stays out of your real themes, and each project keeps its
        own allowlist so a leaked staging key cannot post to production.
      </p>
      <CodeBlock
        className="mt-4"
        filename="app/layout.tsx"
        code={`<Script
  src="${SRC}"
  data-project={process.env.NEXT_PUBLIC_VOICEBOX_KEY}
  strategy="lazyOnload"
/>`}
      />
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Create the second project under{" "}
        <strong className="text-ink">Settings → Projects</strong>, then set the
        variable per environment in your host.
      </p>

      <Callout type="note" title="Weight and timing">
        Around 11KB over the wire, no dependencies, and nothing renders until the browser is
        idle. It never blocks your page, and if our server is unreachable the
        script fails quietly rather than throwing into your error tracking.
      </Callout>
    </>
  );
}
