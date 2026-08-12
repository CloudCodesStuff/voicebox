"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  Loader2,
  Radio,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Wordmark } from "@/components/marketing/brand";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";

export function OnboardingFlow({
  defaultName,
  additional = false,
  atFreeLimit = false,
  freeLimit = 2,
}: {
  defaultName: string;
  /** True when this is a second workspace, not a first run. */
  additional?: boolean;
  /** Already at the Free workspace cap, known before the form is touched. */
  atFreeLimit?: boolean;
  freeLimit?: number;
}) {
  const utils = api.useUtils();

  const [step, setStep] = useState<1 | 2>(1);
  const [orgName, setOrgName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectKey, setProjectKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  /** A refusal that needs to stay on screen, not a toast that slides away. */
  const [blocked, setBlocked] = useState<string | null>(
    atFreeLimit
      ? `Free accounts can have ${freeLimit} workspaces, and you already have ${freeLimit}. Upgrade one of them to Pro and you can add more, or delete one you have finished with.`
      : null,
  );

  const create = api.org.create.useMutation({
    onSuccess(org) {
      const project = org.projects[0];
      if (project) {
        setProjectId(project.id);
        setProjectKey(project.key);
      }
      setStep(2);
      void utils.org.invalidate();
    },
    onError(e) {
      // The server sends a code rather than a sentence so the number and the
      // wording live in one place each. Anything else is already readable.
      if (e.message.startsWith("FREE_WORKSPACE_LIMIT:")) {
        const limit = e.message.split(":")[1];
        setBlocked(
          `Free accounts can have ${limit} workspaces, and you already have ${limit}. Upgrade one of them to Pro and you can add more, or delete one you have finished with.`,
        );
        return;
      }
      toast.error(e.message);
    },
  });

  // Polls until the widget's first submission lands, then flips to success.
  // Seeing it connect live is the moment the product becomes real.
  const connection = api.project.hasFeedback.useQuery(
    { id: projectId ?? "" },
    {
      enabled: Boolean(projectId) && step === 2,
      refetchInterval: (query) => (query.state.data?.connected ? false : 3000),
    },
  );

  const connected = connection.data?.connected ?? false;

  const snippet = `<script async
  src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js"
  data-project="${projectKey ?? ""}"></script>`;

  async function copySnippet() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success("Copied.");
    setTimeout(() => setCopied(false), 2000);
  }

  const canContinue =
    orgName.trim().length >= 2 && projectName.trim().length >= 1;

  /**
   * Sends one real submission through the public ingest endpoint.
   *
   * The hardest moment in onboarding is the person who signed up to evaluate
   * the product and has no site in front of them to paste a script into. They
   * hit step 2 and stall. This gives them the whole loop, collect → score →
   * appear on the dashboard, in one click, using the real endpoint rather than
   * a simulation, so what they see is what they'd get.
   */
  async function sendTestFeedback() {
    if (!projectKey) return;
    setSendingTest(true);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: projectKey,
          body: "Loving the product so far, but exporting a report takes way too many clicks. Could that be one button?",
          type: "IDEA",
          rating: 4,
          pageUrl: `${window.location.origin}/onboarding`,
          // Comfortably past the bot-timing gate, since a script filling the
          // form instantly is exactly what that gate exists to catch.
          _elapsed: 4_000,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Sent. Watch it land below.");
      void connection.refetch();
    } catch {
      toast.error("Couldn't send the test. Try the snippet instead.");
    } finally {
      setSendingTest(false);
    }
  }

  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line px-6 py-5">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Wordmark />
          <div className="flex items-center gap-2" aria-label={`Step ${step} of 2`}>
            {[1, 2].map((n) => (
              <span
                key={n}
                aria-hidden="true"
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  n === step ? "w-7 bg-mint" : "w-3 bg-line-strong",
                  n < step && "bg-mint/50",
                )}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12 pb-32">
        {step === 1 ? (
          <>
            <h1 className="text-[2rem] font-bold leading-tight tracking-[-0.02em] text-ink">
              {additional ? "New workspace." : "Let's set you up."}
            </h1>
            <p className="mt-3 text-[0.97rem] leading-relaxed text-steel">
              {additional
                ? "Separate from the workspaces you're already in: its own projects, its own team, its own plan. Switch between them from the account menu."
                : "One workspace, one project to start. You can add more projects any time, each gets its own widget and its own themes."}
            </p>

            <div className="mt-10 space-y-7">
              <div>
                <Label htmlFor="org" className="text-[0.86rem] font-semibold text-ink">
                  Organization
                </Label>
                <p className="mt-0.5 text-[0.8rem] text-steel">
                  Usually your company or product name.
                </p>
                <Input
                  id="org"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder={defaultName ? `${defaultName.split(" ")[0]}'s team` : "Acme"}
                  autoFocus
                  className="mt-2 h-12 border-line bg-paper-2 text-[1rem]"
                />
              </div>

              <div>
                <Label
                  htmlFor="project"
                  className="text-[0.86rem] font-semibold text-ink"
                >
                  First project
                </Label>
                <p className="mt-0.5 text-[0.8rem] text-steel">
                  The site or app you&apos;ll collect feedback from.
                </p>
                <Input
                  id="project"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Web app"
                  className="mt-2 h-12 border-line bg-paper-2 text-[1rem]"
                />
              </div>

              <div>
                <Label htmlFor="url" className="text-[0.86rem] font-semibold text-ink">
                  URL <span className="font-normal text-steel">(optional)</span>
                </Label>
                <Input
                  id="url"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="https://app.example.com"
                  className="mt-2 h-12 border-line bg-paper-2 text-[1rem]"
                />
              </div>
            </div>

            {blocked && (
              <div className="mt-8 rounded-xl border border-mixed/30 bg-mixed-wash p-4">
                <div className="flex gap-3">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-mixed" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.88rem] font-semibold text-ink">
                      You&apos;ve used all your free workspaces
                    </p>
                    <p className="mt-1 text-[0.85rem] leading-relaxed text-steel">
                      {blocked}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href="/app/settings/billing"
                        className="inline-flex min-h-9 items-center rounded-lg bg-ink px-3.5 text-[0.83rem] font-semibold text-paper"
                      >
                        See plans
                      </Link>
                      <Link
                        href="/app"
                        className="inline-flex min-h-9 items-center rounded-lg px-3 text-[0.83rem] font-medium text-steel hover:text-ink"
                      >
                        Back to dashboard
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={!canContinue || create.isPending || Boolean(blocked)}
              onClick={() => {
                setBlocked(null);
                create.mutate({
                  name: orgName.trim(),
                  projectName: projectName.trim(),
                  projectUrl: projectUrl.trim() || undefined,
                });
              }}
              className="mt-10 inline-flex min-h-12 items-center gap-2 rounded-lg bg-mint px-6 text-[0.94rem] font-semibold text-mint-ink transition-opacity disabled:opacity-40"
            >
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Continue
              <ArrowRight className="size-4" />
            </button>
          </>
        ) : (
          <>
            <h1 className="text-[2rem] font-bold leading-tight tracking-[-0.02em] text-ink">
              Paste one line and you&apos;re live.
            </h1>
            <p className="mt-3 text-[0.97rem] leading-relaxed text-steel">
              Drop this anywhere before the closing{" "}
              <code className="font-mono text-[0.9rem]">&lt;/body&gt;</code> tag.
              We&apos;ll tell you the moment your first feedback arrives.
            </p>

            <div className="mt-8 overflow-hidden rounded-xl border border-line bg-slab">
              <div className="flex items-center gap-2 border-b border-slab-fg/10 px-4 py-2.5">
                <span className="size-2 rounded-full bg-slab-fg/20" />
                <span className="size-2 rounded-full bg-slab-fg/20" />
                <span className="size-2 rounded-full bg-slab-fg/20" />
              </div>
              <pre className="overflow-x-auto px-4 py-4 font-mono text-[0.78rem] leading-relaxed text-slab-fg/85">
                <code>{snippet}</code>
              </pre>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copySnippet}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-4 text-[0.85rem] font-medium text-steel hover:text-ink"
              >
                {copied ? (
                  <Check className="size-3.5 text-positive" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? "Copied" : "Copy snippet"}
              </button>

              {!connected && (
                <button
                  type="button"
                  disabled={sendingTest}
                  onClick={sendTestFeedback}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-mint-line bg-mint-wash px-4 text-[0.85rem] font-medium text-ink transition-colors hover:brightness-110 disabled:opacity-50"
                >
                  {sendingTest ? (
                    <Loader2 className="size-3.5 animate-spin text-mint-deep" />
                  ) : (
                    <Sparkles className="size-3.5 text-mint-deep" />
                  )}
                  {sendingTest ? "Sending…" : "Nowhere to paste it? Send a test one"}
                </button>
              )}
            </div>

            {/* Live connection state */}
            <div
              className={cn(
                "mt-8 flex items-start gap-3 rounded-xl border px-5 py-4 transition-colors",
                connected
                  ? "border-positive/30 bg-positive-wash"
                  : "border-line bg-paper-2",
              )}
            >
              {connected ? (
                <Check className="mt-0.5 size-4 shrink-0 text-positive" />
              ) : (
                <Radio className="mt-0.5 size-4 shrink-0 animate-pulse text-mint-deep" />
              )}
              <div>
                <div
                  className={cn(
                    "text-[0.9rem] font-semibold",
                    connected ? "text-positive" : "text-ink",
                  )}
                >
                  {connected
                    ? "Connected, your first feedback landed."
                    : "Waiting for your first submission…"}
                </div>
                <p className="mt-1 text-[0.83rem] leading-relaxed text-steel">
                  {connected
                    ? "Sentiment is already scored. Themes appear once there's enough to see a pattern."
                    : "Install the snippet, then open the widget on your site and send something. This updates on its own."}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  // Hard load: creating a workspace made it the active one,
                  // and anything cached here belongs to whichever workspace
                  // was active before.
                  window.location.replace("/app");
                }}
                className={cn(
                  "inline-flex min-h-12 items-center gap-2 rounded-lg px-6 text-[0.94rem] font-semibold transition-opacity",
                  connected
                    ? "bg-mint text-mint-ink"
                    : "border-[1.5px] border-line text-ink",
                )}
              >
                {connected ? "See your dashboard" : "Skip for now"}
                <ArrowRight className="size-4" />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
