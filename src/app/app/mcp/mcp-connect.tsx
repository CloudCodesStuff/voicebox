"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import { Check, Copy, FileCode2, Loader2, Plus, TerminalSquare } from "lucide-react";
import { toast } from "sonner";

import {
  ClaudeCodeLogo,
  ClaudeLogo,
  CodexLogo,
  CopilotLogo,
  CursorLogo,
  WindsurfLogo,
} from "@/components/app/agent-logos";
import { actionClass, PageHeader } from "@/components/app/ui";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";

/* ---------------------------------------------------------------------------
   Connect your agent (MCP)

   The product's answer to "what should I build next" is only useful where the
   building happens, so this page exists to get that answer into the customer's
   editor in about a minute.

   Shape: a three-step rail, because the steps are genuinely sequential (you
   cannot paste a key you have not made). Each client contributes only data,
   the mark, the destination file and the config, so adding one is an entry in
   CLIENTS rather than new layout.
--------------------------------------------------------------------------- */

const MCP_URL = `${site.url}/api/mcp`;
const KEY_PLACEHOLDER = "sk_YOUR_KEY";

type Client = {
  id: string;
  name: string;
  /** What it is, in a few words, for someone unsure which they have. */
  kind: string;
  Logo: (p: { className?: string }) => ReactNode;
  /** The mark's own colour on a dark ground. */
  tint: string;
  /** Where the config goes, or "Terminal" for a one-shot command. */
  target: string;
  /** Drives the icon in the block's chrome. */
  medium: "terminal" | "file";
  lang: string;
  code: (url: string, key: string) => string;
  /** What confirms it worked. */
  after: string;
};

/**
 * mcp-remote bridges a remote HTTP server to the stdio these clients speak.
 * `npx -y` fetches it on first run. The header goes in as a single argument so
 * the space in "Bearer <key>" survives.
 */
const remoteArgs = (url: string, key: string) =>
  `["-y", "mcp-remote", "${url}", "--header", "Authorization: Bearer ${key}"]`;

const CLIENTS: Client[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    kind: "Anthropic's CLI",
    Logo: ClaudeCodeLogo,
    tint: "#D97757",
    target: "Terminal",
    medium: "terminal",
    lang: "bash",
    code: (url, key) => `claude mcp add --transport http voicebox \\
  ${url} \\
  --header "Authorization: Bearer ${key}"`,
    after: "Run /mcp inside Claude Code and Voicebox shows as connected.",
  },
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    kind: "The Claude app",
    Logo: ClaudeLogo,
    tint: "#D97757",
    target: "claude_desktop_config.json",
    medium: "file",
    lang: "json",
    code: (url, key) => `{
  "mcpServers": {
    "voicebox": {
      "command": "npx",
      "args": ${remoteArgs(url, key)}
    }
  }
}`,
    after:
      "Settings → Developer → Edit Config, paste, then restart Claude. It appears under the tools icon.",
  },
  {
    id: "cursor",
    name: "Cursor",
    kind: "The AI editor",
    Logo: CursorLogo,
    tint: "#FFFFFF",
    target: "~/.cursor/mcp.json",
    medium: "file",
    lang: "json",
    code: (url, key) => `{
  "mcpServers": {
    "voicebox": {
      "url": "${url}",
      "headers": { "Authorization": "Bearer ${key}" }
    }
  }
}`,
    after: "Settings → MCP lists Voicebox with a green dot once it connects.",
  },
  {
    id: "codex",
    name: "Codex CLI",
    kind: "OpenAI's coding CLI",
    Logo: CodexLogo,
    tint: "#FFFFFF",
    target: "~/.codex/config.toml",
    medium: "file",
    lang: "toml",
    code: (url, key) => `[mcp_servers.voicebox]
command = "npx"
args = ${remoteArgs(url, key)}`,
    after: "Codex speaks MCP over stdio, so mcp-remote bridges it to the server.",
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    kind: "VS Code agent mode",
    Logo: CopilotLogo,
    tint: "#FFFFFF",
    target: ".vscode/mcp.json",
    medium: "file",
    lang: "json",
    code: (url, key) => `{
  "servers": {
    "voicebox": {
      "type": "http",
      "url": "${url}",
      "headers": { "Authorization": "Bearer ${key}" }
    }
  }
}`,
    after: "Open the command palette and run “MCP: List Servers” to start it.",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    kind: "The agentic editor",
    Logo: WindsurfLogo,
    tint: "#FFFFFF",
    target: "~/.codeium/windsurf/mcp_config.json",
    medium: "file",
    lang: "json",
    code: (url, key) => `{
  "mcpServers": {
    "voicebox": {
      "command": "npx",
      "args": ${remoteArgs(url, key)}
    }
  }
}`,
    after: "Hit refresh on the MCP servers panel in Windsurf settings.",
  },
];

export function McpConnect() {
  const [clientId, setClientId] = useState(CLIENTS[0]!.id);
  const utils = api.useUtils();

  // The plaintext exists in this browser, for this session, and nowhere else.
  // Until there is one the blocks carry a placeholder the customer overwrites.
  const [freshKey, setFreshKey] = useState<string | null>(null);

  const create = api.developer.createKey.useMutation({
    onSuccess(key) {
      setFreshKey(key.plaintext);
      void utils.developer.keys.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const client = CLIENTS.find((c) => c.id === clientId)!;
  const secret = freshKey ?? KEY_PLACEHOLDER;
  const code = useMemo(() => client.code(MCP_URL, secret), [client, secret]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6">
      <PageHeader
        title="Connect your agent"
        description="Read your ranked feedback themes from your coding agent."
      />

      <ol className="mt-9">
        {/* ------------------------------------------------------------ key */}
        <Step n={1} title="Create a key">
          {freshKey ? (
            <div>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-mint-line bg-mint-wash px-3 py-2.5 font-mono text-[0.78rem] text-ink">
                  {freshKey}
                </code>
                <CopyButton value={freshKey} label="Copy" />
              </div>
              <p className="mt-2 text-[0.78rem] text-steel">
                Save it somewhere. You won&apos;t see it again. It is already
                in the config below.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="button"
                disabled={create.isPending}
                onClick={() => create.mutate({ name: "MCP" })}
                className={actionClass("primary", "sm")}
              >
                {create.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Create a key
              </button>
              <p className="text-[0.8rem] text-steel">
                Or paste one you already have over{" "}
                <code className="font-mono text-[0.76rem] text-ink">
                  {KEY_PLACEHOLDER}
                </code>
                .
              </p>
            </div>
          )}
        </Step>

        {/* --------------------------------------------------------- client */}
        <Step n={2} title="Pick your agent">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CLIENTS.map((c) => {
              const active = c.id === clientId;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setClientId(c.id)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl border p-3 pr-8 text-left transition-colors",
                    active
                      ? "border-mint bg-mint-wash/40"
                      : "border-line bg-paper-2 hover:border-line-strong hover:bg-sunken",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                      active ? "bg-paper" : "bg-sunken group-hover:bg-paper-2",
                    )}
                  >
                    {/* Each mark in its own colour on the dark ground, so the
                        row reads as a set of recognisable products. */}
                    <span style={{ color: c.tint }} className="flex">
                      <c.Logo className="size-[18px]" />
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[0.85rem] font-semibold text-ink">
                      {c.name}
                    </span>
                    <span className="block truncate text-[0.72rem] text-steel">
                      {c.kind}
                    </span>
                  </span>
                  {active && (
                    <Check className="absolute top-3 right-3 size-3.5 text-mint-deep" />
                  )}
                </button>
              );
            })}
          </div>
        </Step>

        {/* ---------------------------------------------------------- config */}
        <Step n={3} title={`Add it to ${client.name}`} last>
          <div className="overflow-hidden rounded-xl border border-line-strong bg-slab">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-3.5 py-2">
              <span className="flex min-w-0 items-center gap-2">
                {client.medium === "terminal" ? (
                  <TerminalSquare className="size-3.5 shrink-0 text-slab-fg/40" />
                ) : (
                  <FileCode2 className="size-3.5 shrink-0 text-slab-fg/40" />
                )}
                <code className="truncate font-mono text-[0.72rem] text-slab-fg/70">
                  {client.target}
                </code>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="rounded bg-white/[0.07] px-1.5 py-0.5 font-mono text-[0.62rem] tracking-wide text-slab-fg/50 uppercase">
                  {client.lang}
                </span>
                <CopyButton value={code} label="Copy" onSlab />
              </span>
            </div>

            <pre className="overflow-x-auto p-4 font-mono text-[0.76rem] leading-[1.8] text-slab-fg/90">
              <code>
                <Highlighted code={code} secret={secret} live={Boolean(freshKey)} />
              </code>
            </pre>
          </div>

          <p className="mt-2.5 text-[0.8rem] leading-relaxed text-steel">
            {client.after}
          </p>

          {/* The payoff, shown rather than described. */}
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-line bg-paper-2 px-3.5 py-3">
            <span className="mt-px font-mono text-[0.85rem] leading-none text-mint-deep">
              &rsaquo;
            </span>
            <p className="text-[0.83rem] leading-relaxed text-ink">
              What are my top feedback themes, and what did people actually say?
            </p>
          </div>
        </Step>
      </ol>

      <p className="mt-8 text-center text-[0.78rem] text-steel">
        Endpoint <code className="font-mono text-ink">{MCP_URL}</code> ·{" "}
        <a
          href="/docs/api#model-context-protocol"
          className="text-mint-deep hover:underline"
        >
          what the agent can read
        </a>
      </p>
    </div>
  );
}

/**
 * One rung of the rail. The connecting line is drawn from the marker down to
 * the next one, so the three read as a sequence rather than as three cards.
 */
function Step({
  n,
  title,
  children,
  last,
}: {
  n: number;
  title: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <li className={cn("relative pl-11", last ? "pb-0" : "pb-9")}>
      {!last && (
        <span
          aria-hidden="true"
          className="absolute top-9 bottom-0 left-[13px] w-px bg-line"
        />
      )}
      <span className="absolute top-0 left-0 flex size-7 items-center justify-center rounded-full border border-line bg-paper-2 text-[0.75rem] font-semibold text-steel tabular-nums">
        {n}
      </span>
      <h2 className="pt-1 text-[1rem] font-semibold text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </li>
  );
}

/**
 * Renders the config with the key picked out, so the one value that is theirs
 * is the one thing the eye lands on. Amber while it is still a placeholder,
 * mint once it is a real key.
 */
function Highlighted({
  code,
  secret,
  live,
}: {
  code: string;
  secret: string;
  live: boolean;
}) {
  const parts = code.split(secret);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 && (
            <span
              className={cn(
                "rounded px-1 py-px",
                live
                  ? "bg-mint/15 text-mint"
                  : "bg-mixed/20 text-mixed",
              )}
            >
              {secret}
            </span>
          )}
        </Fragment>
      ))}
    </>
  );
}

function CopyButton({
  value,
  label,
  onSlab,
}: {
  value: string;
  label: string;
  onSlab?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`${label} to clipboard`}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-medium transition-colors",
        onSlab
          ? "size-7 justify-center text-slab-fg/60 hover:bg-white/10 hover:text-slab-fg"
          : "min-h-10 shrink-0 border border-line bg-paper-2 px-3 text-[0.8rem] text-ink hover:bg-sunken",
      )}
    >
      {copied ? (
        <Check className={cn("size-4", onSlab ? "text-mint" : "text-mint-deep")} />
      ) : (
        <Copy className="size-4" />
      )}
      {!onSlab && (copied ? "Copied" : label)}
    </button>
  );
}
