"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  Layers,
  Palette,
  Radio,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useProject } from "@/components/app/project-context";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";

/**
 * What you see before your first piece of feedback arrives.
 *
 * This replaced an empty state whose only action was a link to another page to
 * fetch the snippet. Nobody needs the dashboard's chrome before there is any
 * data to put in it, and the one thing standing between a new account and a
 * working product is a line of HTML. So the line is right here, the page
 * watches for the first submission, and it says plainly what happens next.
 */
export function FirstRun() {
  const { activeProject } = useProject();
  const [copied, setCopied] = useState(false);

  const projectId = activeProject?.id ?? "";

  // Same live poll the onboarding screen uses. Watching it flip is the moment
  // the product stops being an idea.
  const connection = api.project.hasFeedback.useQuery(
    { id: projectId },
    {
      enabled: Boolean(projectId),
      refetchInterval: (query) => (query.state.data?.connected ? false : 4000),
    },
  );

  const connected = connection.data?.connected ?? false;

  const snippet = `<script async
  src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js"
  data-project="${activeProject?.key ?? ""}"></script>`;

  async function copySnippet() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success("Copied.");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 pb-24 sm:px-6">
      <h1 className="text-[1.9rem] font-bold leading-tight tracking-[-0.03em] text-ink">
        One line and you&apos;re collecting.
      </h1>
      <p className="mt-3 max-w-[52ch] text-[1rem] leading-relaxed text-steel">
        Paste this into{" "}
        <span className="font-medium text-ink">
          {activeProject?.name ?? "your site"}
        </span>
        , before the closing{" "}
        <code className="rounded bg-sunken px-1 py-0.5 font-mono text-[0.85rem]">
          &lt;/body&gt;
        </code>{" "}
        tag. This page updates the moment something arrives.
      </p>

      <div className="mt-7 overflow-hidden rounded-xl border border-line bg-slab">
        <div className="flex items-center gap-2 border-b border-slab-fg/10 px-4 py-2.5">
          <span className="size-2 rounded-full bg-slab-fg/20" />
          <span className="size-2 rounded-full bg-slab-fg/20" />
          <span className="size-2 rounded-full bg-slab-fg/20" />
          <span className="ml-2 font-mono text-[0.75rem] text-slab-fg/40">
            index.html
          </span>
        </div>
        <pre className="overflow-x-auto px-4 py-4 font-mono text-[0.78rem] leading-relaxed text-slab-fg/85">
          <code>{snippet}</code>
        </pre>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copySnippet}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-mint px-4 text-[0.86rem] font-semibold text-mint-ink transition-all hover:brightness-[0.96]"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy snippet"}
        </button>
        <Link
          href="/docs/install"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-4 text-[0.86rem] font-medium text-steel transition-colors hover:text-ink"
        >
          Framework guides
        </Link>
      </div>

      {/* Live connection state */}
      <div
        className={cn(
          "mt-8 flex items-start gap-3 rounded-xl border px-5 py-4 transition-colors",
          connected
            ? "border-mint-line bg-mint-wash"
            : "border-line bg-paper-2",
        )}
      >
        {connected ? (
          <Check className="mt-0.5 size-4 shrink-0 text-mint-deep" />
        ) : (
          <Radio className="mt-0.5 size-4 shrink-0 animate-pulse text-mint-deep" />
        )}
        <div className="min-w-0">
          <div className="text-[0.9rem] font-semibold text-ink">
            {connected
              ? "Connected. Your first feedback landed."
              : "Waiting for your first submission"}
          </div>
          <p className="mt-1 text-[0.85rem] leading-relaxed text-steel">
            {connected
              ? "Reload and the dashboard takes over."
              : "Once the snippet is live, open the widget on your site and send something."}
          </p>
        </div>
      </div>

      {/* What happens next */}
      <div className="mt-12 border-t border-line pt-8">
        <h2 className="text-[0.95rem] font-semibold text-ink">
          What happens after that
        </h2>
        <ol className="mt-5 space-y-5">
          {[
            {
              icon: Sparkles,
              title: "Everything gets scored",
              body: "Tone, intent, category and summary, within seconds.",
            },
            {
              icon: Layers,
              title: "Themes appear around twenty pieces",
              body: "The same problem, however people worded it, becomes one theme.",
            },
            {
              icon: Palette,
              title: "Restyle it any time",
              body: "Colour, copy, typeface and position, without touching your site again.",
            },
          ].map((step) => (
            <li key={step.title} className="flex gap-4">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-sunken">
                <step.icon className="size-4 text-steel" strokeWidth={1.9} />
              </span>
              <div>
                <div className="text-[0.9rem] font-semibold text-ink">
                  {step.title}
                </div>
                <p className="mt-1 max-w-[62ch] text-[0.86rem] leading-relaxed text-steel">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <Link
          href="/app/widget"
          className="mt-7 inline-flex items-center gap-1.5 text-[0.86rem] font-medium text-mint-deep hover:underline"
        >
          Style the widget first
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
