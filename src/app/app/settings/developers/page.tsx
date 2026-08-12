"use client";

import Link from "next/link";
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  Send,
  Trash2,
  Webhook as WebhookIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { relativeTime } from "@/components/app/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  WEBHOOK_EVENTS,
  WEBHOOK_EVENT_LABELS,
  type WebhookEvent,
} from "@/lib/webhook-events";
import { api } from "@/trpc/client";
import { cn } from "@/lib/utils";

export default function DeveloperSettings() {
  const org = api.org.current.useQuery();

  // Ask the plan rules rather than naming plans here. Listing "PRO or SCALE"
  // in the UI is how a gate drifts out of step with the server that enforces it.
  const gated = org.data ? !org.data.limits.features.includes("api") : false;

  if (org.isLoading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <div className="space-y-6">
      {gated && <UpgradeNotice />}
      <ApiKeys locked={gated} />
      <Webhooks locked={gated} />
    </div>
  );
}

function UpgradeNotice() {
  return (
    <div className="rounded-xl border border-mint-line bg-mint-wash p-5">
      <h2 className="text-[0.95rem] font-semibold text-ink">
        The API and webhooks are on Pro.
      </h2>
      <p className="mt-1.5 max-w-[60ch] text-[0.85rem] leading-relaxed text-steel">
        You can look around, but keys and endpoints can&apos;t be created until
        you upgrade. Everything else here works exactly the same afterwards.
      </p>
      <Link
        href="/app/settings/billing"
        className="mt-4 inline-flex min-h-9 items-center rounded-lg bg-mint px-4 text-[0.83rem] font-semibold text-mint-ink"
      >
        See plans
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ keys */

function ApiKeys({ locked }: { locked: boolean }) {
  const utils = api.useUtils();
  const keys = api.developer.keys.useQuery();
  const [name, setName] = useState("");

  // Held in component state, never re-fetched: the server no longer has it.
  const [justCreated, setJustCreated] = useState<{
    name: string;
    plaintext: string;
  } | null>(null);

  const create = api.developer.createKey.useMutation({
    onSuccess(key) {
      setJustCreated({ name: key.name, plaintext: key.plaintext });
      setName("");
      void utils.developer.keys.invalidate();
    },
    onError: (e) => toast.error(friendly(e.message)),
  });

  const revoke = api.developer.revokeKey.useMutation({
    onSuccess() {
      toast.success("Key revoked. Any request using it now fails.");
      void utils.developer.keys.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <section className="rounded-xl border border-line bg-paper-2 p-6">
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 size-4 shrink-0 text-steel" />
        <div>
          <h2 className="text-[1rem] font-semibold text-ink">API keys</h2>
          <p className="mt-1 max-w-[62ch] text-[0.83rem] leading-relaxed text-steel">
            Read your feedback, themes and projects from your own code. Send the
            key as{" "}
            <code className="rounded bg-sunken px-1 py-0.5 font-mono text-[0.78rem]">
              Authorization: Bearer sk_…
            </code>
            . Keys are stored hashed, so we can show you a new one exactly once
            and never again.{" "}
            <Link href="/docs/api" className="text-mint-deep hover:underline">
              Read the API docs
            </Link>
          </p>
        </div>
      </div>

      {justCreated && (
        <RevealedKey
          name={justCreated.name}
          plaintext={justCreated.plaintext}
          onDismiss={() => setJustCreated(null)}
        />
      )}

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <Label className="text-[0.83rem] font-medium text-ink">
            What is it for?
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Production sync"
            disabled={locked}
            className="mt-1.5 h-10 border-line bg-paper"
          />
        </div>
        <button
          type="button"
          disabled={locked || name.trim().length === 0 || create.isPending}
          onClick={() => create.mutate({ name: name.trim() })}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-ink px-4 text-[0.85rem] font-semibold text-paper disabled:opacity-40"
        >
          {create.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Create key
        </button>
      </div>

      {keys.data && keys.data.length > 0 ? (
        <ul className="mt-6 divide-y divide-line border-t border-line">
          {keys.data.map((k) => (
            <li key={k.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[0.875rem] font-medium text-ink">
                  {k.name}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.75rem] text-steel">
                  <code className="font-mono">{k.prefix}…</code>
                  <span aria-hidden="true">·</span>
                  <span>
                    {k.lastUsedAt
                      ? `last used ${relativeTime(k.lastUsedAt)}`
                      : "never used"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => revoke.mutate({ id: k.id })}
                className="text-[0.78rem] text-steel hover:text-negative"
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 border-t border-line pt-5 text-[0.83rem] text-steel">
          No keys yet. Create one above and it appears here.
        </p>
      )}
    </section>
  );
}

/** The one and only chance to copy a secret, made hard to miss and hard to lose. */
function RevealedKey({
  name,
  plaintext,
  onDismiss,
}: {
  name: string;
  plaintext: string;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-5 rounded-xl border border-mint-line bg-mint-wash p-5">
      <h3 className="text-[0.9rem] font-semibold text-ink">
        Copy {name} now. You won&apos;t see it again.
      </h3>
      <p className="mt-1 text-[0.82rem] leading-relaxed text-steel">
        Only a hash is stored, so this is genuinely the last time it exists
        anywhere but your clipboard.
      </p>

      <div className="mt-3 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-mint-line bg-paper px-3 py-2.5 font-mono text-[0.78rem] text-ink">
          {plaintext}
        </code>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(plaintext);
            setCopied(true);
            toast.success("Copied. Put it somewhere safe.");
            setTimeout(() => setCopied(false), 2000);
          }}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-mint px-4 text-[0.83rem] font-semibold text-mint-ink"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="mt-3 text-[0.78rem] font-medium text-steel hover:text-ink"
      >
        I&apos;ve saved it, hide this
      </button>
    </div>
  );
}

/* -------------------------------------------------------------- webhooks */

function Webhooks({ locked }: { locked: boolean }) {
  const utils = api.useUtils();
  const webhooks = api.developer.webhooks.useQuery();

  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<WebhookEvent[]>(["feedback.analyzed"]);

  const create = api.developer.createWebhook.useMutation({
    onSuccess() {
      toast.success("Endpoint added. Send a test to check it.");
      setUrl("");
      void utils.developer.webhooks.invalidate();
    },
    onError: (e) => toast.error(friendly(e.message)),
  });

  const update = api.developer.updateWebhook.useMutation({
    onSuccess: () => utils.developer.webhooks.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const remove = api.developer.deleteWebhook.useMutation({
    onSuccess() {
      toast.success("Endpoint deleted.");
      void utils.developer.webhooks.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const test = api.developer.testWebhook.useMutation({
    onSuccess(result) {
      if (result.ok) {
        toast.success(`Endpoint answered ${result.status}. You're wired up.`);
      } else {
        toast.error(result.error ?? "Delivery failed.");
      }
      void utils.developer.webhooks.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleEvent = (event: WebhookEvent) =>
    setEvents((current) =>
      current.includes(event)
        ? current.filter((e) => e !== event)
        : [...current, event],
    );

  return (
    <section className="rounded-xl border border-line bg-paper-2 p-6">
      <div className="flex items-start gap-3">
        <WebhookIcon className="mt-0.5 size-4 shrink-0 text-steel" />
        <div>
          <h2 className="text-[1rem] font-semibold text-ink">Webhooks</h2>
          <p className="mt-1 max-w-[62ch] text-[0.83rem] leading-relaxed text-steel">
            We POST signed JSON to your endpoint as things happen. Verify the{" "}
            <code className="rounded bg-sunken px-1 py-0.5 font-mono text-[0.78rem]">
              Voicebox-Signature
            </code>{" "}
            header before trusting the body. An endpoint that keeps failing gets
            switched off rather than hammered.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <Label className="text-[0.83rem] font-medium text-ink">
            Endpoint URL
          </Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.yourapp.com/hooks/voicebox"
            disabled={locked}
            className="mt-1.5 h-10 border-line bg-paper font-mono text-[0.83rem]"
          />
        </div>

        <div>
          <Label className="text-[0.83rem] font-medium text-ink">
            Send me
          </Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {WEBHOOK_EVENTS.map((event) => {
              const on = events.includes(event);
              return (
                <button
                  key={event}
                  type="button"
                  disabled={locked}
                  onClick={() => toggleEvent(event)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left transition-colors disabled:opacity-50",
                    on
                      ? "border-mint-line bg-mint-wash"
                      : "border-line bg-paper hover:border-line-strong",
                  )}
                >
                  <span className="block text-[0.8rem] font-medium text-ink">
                    {WEBHOOK_EVENT_LABELS[event]}
                  </span>
                  <code className="mt-0.5 block font-mono text-[0.75rem] text-steel">
                    {event}
                  </code>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          disabled={locked || url.trim().length === 0 || events.length === 0 || create.isPending}
          onClick={() => create.mutate({ url: url.trim(), events })}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-ink px-4 text-[0.85rem] font-semibold text-paper disabled:opacity-40"
        >
          {create.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Add endpoint
        </button>
      </div>

      {webhooks.data && webhooks.data.length > 0 ? (
        <ul className="mt-6 space-y-3 border-t border-line pt-5">
          {webhooks.data.map((w) => (
            <li key={w.id} className="rounded-lg border border-line bg-paper p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <code className="block truncate font-mono text-[0.83rem] text-ink">
                    {w.url}
                  </code>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.75rem] text-steel">
                    <span>{w.events.length} events</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {w.lastFiredAt
                        ? `last fired ${relativeTime(w.lastFiredAt)}${
                            w.lastStatus ? ` (${w.lastStatus})` : ""
                          }`
                        : "never fired"}
                    </span>
                    {w.failureCount > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-negative">
                          {w.failureCount} failures in a row
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <Switch
                    checked={w.active}
                    onCheckedChange={(active) =>
                      update.mutate({ id: w.id, active })
                    }
                    aria-label="Enabled"
                  />
                  <button
                    type="button"
                    disabled={test.isPending}
                    onClick={() => test.mutate({ id: w.id })}
                    className="inline-flex items-center gap-1.5 text-[0.78rem] font-medium text-steel hover:text-ink disabled:opacity-50"
                  >
                    <Send className="size-3" />
                    Test
                  </button>
                  <button
                    type="button"
                    onClick={() => remove.mutate({ id: w.id })}
                    className="text-steel hover:text-negative"
                    aria-label="Delete endpoint"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <SigningSecret secret={w.secret} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 border-t border-line pt-5 text-[0.83rem] text-steel">
          No endpoints yet.
        </p>
      )}
    </section>
  );
}

function SigningSecret({ secret }: { secret: string }) {
  const [shown, setShown] = useState(false);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
      <span className="text-[0.75rem] text-steel">Signing secret</span>
      <code className="min-w-0 flex-1 truncate font-mono text-[0.75rem] text-ink">
        {shown ? secret : `${secret.slice(0, 12)}${"•".repeat(18)}`}
      </code>
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        className="text-[0.75rem] font-medium text-steel hover:text-ink"
      >
        {shown ? "Hide" : "Reveal"}
      </button>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(secret);
          toast.success("Signing secret copied.");
        }}
        className="text-[0.75rem] font-medium text-steel hover:text-ink"
      >
        Copy
      </button>
    </div>
  );
}

/** Turns the server's machine-readable gate into a sentence. */
function friendly(message: string): string {
  if (message.startsWith("UPGRADE_REQUIRED:")) {
    const plan = message.split(":")[1] ?? "Pro";
    return `That needs the ${plan.charAt(0)}${plan.slice(1).toLowerCase()} plan.`;
  }
  return message;
}
