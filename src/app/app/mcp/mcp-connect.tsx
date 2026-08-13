"use client";

import { useMemo, useState } from "react";
import { Check, Copy, KeyRound, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/ui";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";

/* ---------------------------------------------------------------------------
   Connect your agent (MCP)

   The whole reason someone installs a feedback tool is to know what to build.
   This is where that answer reaches the place they actually build: their coding
   agent. Pick the client, copy the block, and Claude / Cursor / Codex can read
   the ranked themes over MCP.

   Everything a client needs is (endpoint, key). The endpoint is one URL for
   everyone; the key is theirs. So the page is two things: get a key, and show
   the copy-paste for whichever client they use. The per-client shape is the
   only real content, and it lives in CLIENTS below so adding a client is a data
   change, not a layout one.
--------------------------------------------------------------------------- */

const MCP_URL = `${site.url}/api/mcp`;
const KEY_PLACEHOLDER = "sk_YOUR_KEY";

type Block = { label: string; code: string; lang: string };
type Client = {
  id: string;
  name: string;
  /** What it is, in four or five words, for someone who isn't sure. */
  kind: string;
  /** Built per (url, key) so the copy blocks are ready to paste. */
  blocks: (url: string, key: string) => Block[];
  /** One closing line: where the connection shows up, or what to do next. */
  after: string;
};

/**
 * mcp-remote bridges a remote HTTP server to the stdio a desktop/CLI client
 * speaks. It is the standard shim for clients that don't dial HTTP MCP directly
 * yet; `npx -y` fetches it on first run. The header is passed as one argument,
 * which is the form that survives the space in "Bearer <key>".
 */
const remoteArgs = (url: string, key: string) =>
  `["-y", "mcp-remote", "${url}", "--header", "Authorization: Bearer ${key}"]`;

const CLIENTS: Client[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    kind: "Anthropic's CLI",
    blocks: (url, key) => [
      {
        label: "Run this once in your terminal",
        lang: "bash",
        code: `claude mcp add --transport http voicebox \\
  ${url} \\
  --header "Authorization: Bearer ${key}"`,
      },
    ],
    after: "Then ask, mid-task: “what are my top feedback themes, and what did people say?”",
  },
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    kind: "The Claude app for Mac/Windows",
    blocks: (url, key) => [
      {
        label:
          "Settings → Developer → Edit Config, then add this and restart Claude",
        lang: "json",
        code: `{
  "mcpServers": {
    "voicebox": {
      "command": "npx",
      "args": ${remoteArgs(url, key)}
    }
  }
}`,
      },
    ],
    after: "Voicebox appears under the tools icon once Claude restarts.",
  },
  {
    id: "cursor",
    name: "Cursor",
    kind: "The AI code editor",
    blocks: (url, key) => [
      {
        label: "Add to ~/.cursor/mcp.json (or .cursor/mcp.json in a project)",
        lang: "json",
        code: `{
  "mcpServers": {
    "voicebox": {
      "url": "${url}",
      "headers": { "Authorization": "Bearer ${key}" }
    }
  }
}`,
      },
    ],
    after: "Settings → MCP shows Voicebox with a green dot when it connects.",
  },
  {
    id: "codex",
    name: "Codex CLI",
    kind: "OpenAI's coding CLI",
    blocks: (url, key) => [
      {
        label: "Add to ~/.codex/config.toml",
        lang: "toml",
        code: `[mcp_servers.voicebox]
command = "npx"
args = ${remoteArgs(url, key)}`,
      },
    ],
    after: "Codex speaks MCP over stdio, so mcp-remote bridges it to the server.",
  },
  {
    id: "vscode",
    name: "VS Code",
    kind: "Copilot agent mode",
    blocks: (url, key) => [
      {
        label: "Add to .vscode/mcp.json in your workspace",
        lang: "json",
        code: `{
  "servers": {
    "voicebox": {
      "type": "http",
      "url": "${url}",
      "headers": { "Authorization": "Bearer ${key}" }
    }
  }
}`,
      },
    ],
    after: "Run “MCP: List Servers” from the command palette to start it.",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    kind: "The agentic editor",
    blocks: (url, key) => [
      {
        label: "Add to ~/.codeium/windsurf/mcp_config.json",
        lang: "json",
        code: `{
  "mcpServers": {
    "voicebox": {
      "command": "npx",
      "args": ${remoteArgs(url, key)}
    }
  }
}`,
      },
    ],
    after: "Refresh MCP servers in Windsurf settings to pick it up.",
  },
];

export function McpConnect() {
  const [clientId, setClientId] = useState(CLIENTS[0]!.id);
  const keys = api.developer.keys.useQuery();
  const utils = api.useUtils();

  // The plaintext only exists in this browser, for this session, right after
  // creation. If they haven't made one here, the blocks show a placeholder and
  // they paste their own saved key over it.
  const [freshKey, setFreshKey] = useState<string | null>(null);

  const create = api.developer.createKey.useMutation({
    onSuccess(key) {
      setFreshKey(key.plaintext);
      void utils.developer.keys.invalidate();
      toast.success("Key created. It's filled into the steps below.");
    },
    onError: (e) => toast.error(e.message),
  });

  const client = CLIENTS.find((c) => c.id === clientId)!;
  const keyForBlocks = freshKey ?? KEY_PLACEHOLDER;
  const hasKey = (keys.data?.length ?? 0) > 0;

  const blocks = useMemo(
    () => client.blocks(MCP_URL, keyForBlocks),
    [client, keyForBlocks],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6">
      <PageHeader
        title="Connect your agent"
        description="Read your ranked feedback themes straight from your coding agent over MCP, so “what should I build next” is answered from what your users actually said. Read-only, on every plan."
      />

      {/* Step 1: the key */}
      <section className="mt-7 rounded-xl border border-line bg-paper-2 p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-mint-wash text-[0.72rem] font-bold text-mint-deep">
            1
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[0.95rem] font-semibold text-ink">Get a key</h2>
            <p className="mt-1 text-[0.83rem] leading-relaxed text-steel">
              One secret key authenticates every client. It&apos;s stored as a
              hash, so a new one is shown once, here, and filled into the steps
              below.
            </p>

            {freshKey ? (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg border border-mint-line bg-paper px-3 py-2.5 font-mono text-[0.78rem] text-ink">
                    {freshKey}
                  </code>
                  <CopyButton value={freshKey} label="Copy key" />
                </div>
                <p className="mt-2 text-[0.78rem] text-steel">
                  Save it somewhere. You won&apos;t be able to see it again.
                </p>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={create.isPending}
                  onClick={() => create.mutate({ name: "MCP" })}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-ink px-4 text-[0.83rem] font-semibold text-paper disabled:opacity-40"
                >
                  {create.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Create a key
                </button>
                {hasKey && (
                  <span className="inline-flex items-center gap-1.5 text-[0.8rem] text-steel">
                    <KeyRound className="size-3.5" />
                    Already have one? Paste it over{" "}
                    <code className="font-mono text-[0.76rem]">
                      {KEY_PLACEHOLDER}
                    </code>{" "}
                    below.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Step 2: pick a client */}
      <section className="mt-4 rounded-xl border border-line bg-paper-2 p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-mint-wash text-[0.72rem] font-bold text-mint-deep">
            2
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[0.95rem] font-semibold text-ink">
              Pick your agent
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CLIENTS.map((c) => {
                const active = c.id === clientId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setClientId(c.id)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      active
                        ? "border-mint bg-mint-wash"
                        : "border-line hover:border-steel",
                    )}
                  >
                    <div
                      className={cn(
                        "text-[0.85rem] font-semibold",
                        active ? "text-mint-deep" : "text-ink",
                      )}
                    >
                      {c.name}
                    </div>
                    <div className="mt-0.5 text-[0.72rem] leading-snug text-steel">
                      {c.kind}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Step 3: the instructions */}
      <section className="mt-4 rounded-xl border border-line bg-paper-2 p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-mint-wash text-[0.72rem] font-bold text-mint-deep">
            3
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[0.95rem] font-semibold text-ink">
              Connect {client.name}
            </h2>

            {blocks.map((b, i) => (
              <div key={i} className="mt-3">
                <div className="mb-1.5 text-[0.8rem] text-steel">{b.label}</div>
                <div className="relative">
                  <pre className="overflow-x-auto rounded-lg bg-slab p-4 pr-12 font-mono text-[0.76rem] leading-relaxed text-slab-fg">
                    <code>{b.code}</code>
                  </pre>
                  <div className="absolute top-2.5 right-2.5">
                    <CopyButton value={b.code} label={`Copy ${b.lang}`} compact />
                  </div>
                </div>
              </div>
            ))}

            <p className="mt-3 text-[0.8rem] leading-relaxed text-steel">
              {client.after}
            </p>
          </div>
        </div>
      </section>

      <p className="mt-6 text-center text-[0.8rem] text-steel">
        Endpoint:{" "}
        <code className="font-mono text-[0.76rem] text-ink">{MCP_URL}</code> ·{" "}
        <a
          href="/docs/api#model-context-protocol"
          className="text-mint-deep hover:underline"
        >
          What the agent can read
        </a>
      </p>
    </div>
  );
}

function CopyButton({
  value,
  label,
  compact,
}: {
  value: string;
  label: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-medium transition-colors",
        compact
          ? "size-8 justify-center text-slab-fg/70 hover:bg-white/10 hover:text-slab-fg"
          : "min-h-9 border border-line bg-paper px-3 text-[0.8rem] text-ink hover:bg-sunken",
      )}
    >
      {copied ? (
        <Check className={cn("size-4", compact ? "" : "text-mint-deep")} />
      ) : (
        <Copy className="size-4" />
      )}
      {!compact && (copied ? "Copied" : label)}
    </button>
  );
}
