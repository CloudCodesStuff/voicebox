import type { Metadata } from "next";

import { CodeBlock } from "@/components/marketing/docs";

export const metadata: Metadata = {
  title: "Install the widget",
  description:
    "Add the Voicebox feedback widget to any site with one script tag, plain HTML, Next.js, or React.",
  alternates: { canonical: "/docs/install" },
};

export default function InstallDocs() {
  return (
    <>
      <h1 className="text-[2.1rem] font-bold tracking-[-0.025em] text-ink">
        Install the widget
      </h1>
      <p className="mt-4 text-[1rem] leading-relaxed text-steel">
        One script tag, anywhere before the closing <code className="font-mono">&lt;/body&gt;</code>.
        Grab your project key from the Widget page in the dashboard.
      </p>

      <h2 className="mt-10 text-[1.25rem] font-bold tracking-tight text-ink">
        Plain HTML
      </h2>
      <CodeBlock
        className="mt-4"
        filename="index.html"
        code={`<script async
  src="https://usevoicebox.dev/widget.js"
  data-project="pk_live_your_key"></script>`}
      />

      <h2 className="mt-10 text-[1.25rem] font-bold tracking-tight text-ink">
        Next.js
      </h2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Use the <code className="font-mono">Script</code> component with{" "}
        <code className="font-mono">lazyOnload</code> so it never competes with
        your own hydration.
      </p>
      <CodeBlock
        className="mt-4"
        filename="app/layout.tsx"
        code={`import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://usevoicebox.dev/widget.js"
          data-project="pk_live_your_key"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}`}
      />

      <h2 className="mt-10 text-[1.25rem] font-bold tracking-tight text-ink">
        Opening it yourself
      </h2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Hide the floating button in the Widget studio and trigger it from your
        own UI instead, either with a data attribute on any element, or
        programmatically.
      </p>
      <CodeBlock
        className="mt-4"
        filename="anywhere"
        code={`<!-- Any element with this attribute opens the widget -->
<button data-voicebox-trigger>Send feedback</button>

<!-- Or from code -->
<script>
  Voicebox("open");
  Voicebox("close");
</script>`}
      />

      <h2 className="mt-10 text-[1.25rem] font-bold tracking-tight text-ink">
        Attaching who they are
      </h2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Pass traits and every submission arrives already attached to the account
        it came from. These are stored on the feedback record and shown in the
        inbox, and they are <strong className="text-ink">never</strong> sent to
        the language model.
      </p>
      <CodeBlock
        className="mt-4"
        filename="app.js"
        code={`Voicebox("identify", {
  userId: "usr_8123",
  plan: "pro",
  company: "Acme",
  signedUpAt: "2026-02-14",
});`}
      />

      <h2 className="mt-10 text-[1.25rem] font-bold tracking-tight text-ink">
        Locking it to your domains
      </h2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Your project key is publishable, it lives in your page source, so treat
        it as public. To stop anyone else posting with it, add your domains
        under <strong className="text-ink">Settings → Projects</strong>.
        Submissions from any other origin are rejected.
      </p>
    </>
  );
}
