"use client";

import {
  Check,
  Copy,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { relativeTime } from "@/components/app/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/client";
import { SectionHeader } from "../section-header";

export default function ProjectSettings() {
  const utils = api.useUtils();
  const projects = api.project.list.useQuery();
  const org = api.org.current.useQuery();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const invalidate = () => {
    void utils.project.invalidate();
    void utils.org.invalidate();
  };

  const create = api.project.create.useMutation({
    onSuccess() {
      toast.success("Project created.");
      setCreating(false);
      setNewName("");
      setNewUrl("");
      invalidate();
    },
    onError(e) {
      if (e.message.startsWith("PROJECT_LIMIT:")) {
        toast.error(
          `Your plan allows ${e.message.split(":")[1]} projects. Upgrade to add more.`,
        );
        return;
      }
      toast.error(e.message);
    },
  });

  const update = api.project.update.useMutation({
    onSuccess() {
      toast.success("Saved.");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const regenerate = api.project.regenerateKey.useMutation({
    onSuccess() {
      toast.success("New key issued. Update your install snippet.");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = api.project.delete.useMutation({
    onSuccess() {
      toast.success("Project deleted.");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  async function copyKey(key: string) {
    await navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success("Key copied.");
    setTimeout(() => setCopiedKey(null), 2000);
  }

  if (projects.isLoading) return <Skeleton className="h-64 rounded-xl" />;

  const limit = org.data?.limits.projects;

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Projects"
        description="One project per site or app you collect from, each with its own widget, its own feedback and its own themes. This is also where you get a project's key and lock it to your domains."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.85rem] text-steel">
          {projects.data?.length} of {limit ?? "unlimited"} projects
        </p>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-ink px-4 text-[0.85rem] font-semibold text-paper"
        >
          <Plus className="size-4" />
          New project
        </button>
      </div>

      {creating && (
        <div className="rounded-xl border border-line bg-paper-2 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-[0.83rem] font-medium text-ink">Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Marketing site"
                autoFocus
                className="mt-1.5 h-10 border-line bg-paper"
              />
            </div>
            <div>
              <Label className="text-[0.83rem] font-medium text-ink">
                URL <span className="font-normal text-steel">(optional)</span>
              </Label>
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com"
                className="mt-1.5 h-10 border-line bg-paper"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={newName.trim().length === 0 || create.isPending}
              onClick={() =>
                create.mutate({ name: newName.trim(), url: newUrl.trim() })
              }
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-mint px-4 text-[0.85rem] font-semibold text-mint-ink disabled:opacity-40"
            >
              {create.isPending && <Loader2 className="size-3.5 animate-spin" />}
              Create
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="inline-flex min-h-10 items-center rounded-lg border border-line px-4 text-[0.85rem] font-medium text-steel"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {projects.data?.map((p) => (
        <section
          key={p.id}
          className="rounded-xl border border-line bg-paper-2 p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[1rem] font-semibold text-ink">{p.name}</h2>
              <p className="mt-1 text-[0.8rem] text-steel">
                {p._count.feedback} feedback · {p._count.themes} themes
                {p.lastActivityAt
                  ? ` · last ${relativeTime(p.lastActivityAt)}`
                  : ""}
              </p>
            </div>
            {(projects.data?.length ?? 0) > 1 && (
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      `Delete "${p.name}"? This permanently removes its feedback and themes.`,
                    )
                  ) {
                    remove.mutate({ id: p.id });
                  }
                }}
                className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-steel hover:border-negative hover:text-negative"
                aria-label="Delete project"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>

          <div className="mt-5">
            <Label className="text-[0.83rem] font-medium text-ink">
              Project key
            </Label>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-3 py-2.5 font-mono text-[0.78rem] text-steel">
                {p.key}
              </code>
              <button
                type="button"
                onClick={() => copyKey(p.key)}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-[0.82rem] font-medium text-steel hover:text-ink"
              >
                {copiedKey === p.key ? (
                  <Check className="size-3.5 text-positive" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      "Issue a new key? The old one stops working immediately and you'll need to update your install snippet.",
                    )
                  ) {
                    regenerate.mutate({ id: p.id });
                  }
                }}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-[0.82rem] font-medium text-steel hover:text-ink"
              >
                <RefreshCw className="size-3.5" />
                Rotate
              </button>
            </div>
          </div>

          {/* Directly under the key, because the key is the thing at risk.
              This is the default state of every new project, so it has to be
              impossible to skim past: full amber panel, not a tinted line of
              small print. */}
          {p.allowedDomains.length === 0 && (
            <div className="mt-4 rounded-xl border-2 border-mixed/50 bg-mixed-wash p-4 sm:p-5">
              <div className="flex gap-3">
                <TriangleAlert className="mt-0.5 size-5 shrink-0 text-mixed" />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.98rem] font-bold tracking-tight text-ink">
                    Anyone can use this key on their own site
                  </p>
                  <p className="mt-1.5 text-[0.87rem] leading-relaxed text-steel">
                    You haven&apos;t set any allowed domains, so this project
                    accepts feedback from{" "}
                    <strong className="font-semibold text-ink">
                      any website in the world
                    </strong>
                    . The key above is visible in your page source. Anyone who
                    views it can paste your widget onto their site, and whatever
                    their visitors send lands in your inbox and counts against
                    your monthly limit.
                  </p>
                  <p className="mt-2 text-[0.87rem] font-medium text-ink">
                    Add your domains below to stop that.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DomainAllowlist
            projectId={p.id}
            domains={p.allowedDomains}
            onSave={(domains) => update.mutate({ id: p.id, allowedDomains: domains })}
            pending={update.isPending}
          />
        </section>
      ))}
    </div>
  );
}

/**
 * Turns anything that looks like a URL into the bare hostname.
 *
 * People paste what's in their address bar, which is
 * `https://app.example.com/dashboard?tab=1`. Making them hand-edit that down
 * to `app.example.com` is exactly the kind of small tax that makes software
 * feel unfinished, so the field does it. A leading `*.` is kept, since that is
 * a real wildcard the allowlist understands.
 */
function normalizeDomain(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const wildcard = trimmed.startsWith("*.");
  const rest = wildcard ? trimmed.slice(2) : trimmed;

  let host = rest;
  try {
    host = new URL(rest.includes("://") ? rest : `https://${rest}`).hostname;
  } catch {
    // Not URL-shaped. Fall back to trimming the obvious noise by hand.
    host = rest.split("/")[0].split("?")[0].split("#")[0];
  }

  host = host.toLowerCase().replace(/^www\./, "");
  return wildcard ? `*.${host}` : host;
}

function DomainAllowlist({
  domains,
  onSave,
  pending,
}: {
  projectId: string;
  domains: string[];
  onSave: (domains: string[]) => void;
  pending: boolean;
}) {
  const [value, setValue] = useState(domains.join("\n"));

  const cleaned = value
    .split(/[\n,\s]+/)
    .map(normalizeDomain)
    .filter(Boolean);

  const dirty = cleaned.join("\n") !== domains.join("\n");
  const changedByCleaning = cleaned.join("\n") !== value.trim();

  return (
    <div className="mt-5">
      <Label className="text-[0.83rem] font-medium text-ink">
        Allowed domains
      </Label>
      <p className="mt-0.5 text-[0.76rem] leading-relaxed text-steel">
        One per line. Submissions from any other site are rejected. Subdomains
        are covered, so <code className="font-mono">acme.com</code> also allows{" "}
        <code className="font-mono">app.acme.com</code>.
      </p>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => setValue(cleaned.join("\n"))}
        rows={3}
        placeholder={"example.com\napp.example.com"}
        className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2.5 font-mono text-[0.8rem] text-ink"
      />

      {changedByCleaning && cleaned.length > 0 && (
        <p className="mt-1.5 text-[0.75rem] text-steel">
          Saving as{" "}
          <code className="font-mono text-ink">{cleaned.join(", ")}</code>. Paste a whole URL if that is easier.
        </p>
      )}

      {dirty && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setValue(cleaned.join("\n"));
            onSave(cleaned);
          }}
          className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-lg bg-ink px-3.5 text-[0.82rem] font-semibold text-paper disabled:opacity-40"
        >
          {pending && <Loader2 className="size-3.5 animate-spin" />}
          Save domains
        </button>
      )}
    </div>
  );
}
