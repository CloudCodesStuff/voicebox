import Link from "next/link";

import { SiteButton } from "@/components/site/button";
import { site } from "@/lib/site";

const TOOLS = ["list_projects", "list_themes", "get_theme", "list_feedback", "project_overview"];

/** The MCP server, as one command and the five tools. Nothing animated. */
export function AgentBlock() {
  return (
    <div className="grid gap-px border-t border-line bg-line lg:grid-cols-2">
      <div className="bg-black p-6 sm:p-10">
        <p className="text-[16px] font-light leading-[1.65] text-steel">
          Add Voicebox to Claude Code or Cursor with one command. Then ask what to fix, and it
          answers from what your users wrote, with the quotes.
        </p>
        <p className="mt-4 text-[14px] text-faint">Read-only. On every plan, including free.</p>
        <div className="mt-7">
          <SiteButton asChild variant="ghost" size="lg">
            <Link href="/docs/api#model-context-protocol">Set it up</Link>
          </SiteButton>
        </div>
      </div>
      <div className="min-w-0 bg-black p-6 sm:p-10">
        <div className="overflow-hidden rounded-[12px] border border-line bg-[#09090B]">
          <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-[1.8] text-ink/85">
            <span className="text-faint">$</span> <span className="text-mint">claude mcp add</span> --transport http voicebox \{"\n"}
            {"    "}
            {site.url}/api/mcp \{"\n"}
            {"    "}--header &quot;Authorization: Bearer sk_…&quot;
          </pre>
        </div>
        <ul className="mt-5 flex flex-wrap gap-2">
          {TOOLS.map((t) => (
            <li key={t} className="rounded-md border border-line px-2 py-1 font-mono text-[12px] text-steel">
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
