import type { Metadata } from "next";

import { CodeBlock } from "@/components/marketing/docs";
import { WEBHOOK_EVENTS, WEBHOOK_EVENT_LABELS } from "@/lib/webhook-events";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "API & webhooks",
  description: "Submit feedback programmatically, read your themes back out, and get signed webhooks when things change.",
  path: "/docs/api",
});

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/feedback",
    note: "Newest first. Filter by project_id, status, type, sentiment, since.",
  },
  {
    method: "GET",
    path: "/api/v1/feedback/:id",
    note: "A single submission with its theme attached.",
  },
  {
    method: "GET",
    path: "/api/v1/themes",
    note: "Ordered by priority, so the first item is what to work on next.",
  },
  {
    method: "GET",
    path: "/api/v1/projects",
    note: "Every project in your organization, with its widget key.",
  },
];

export default function ApiDocs() {
  return (
    <>
      <h1 className="text-[2.1rem] font-bold tracking-[-0.025em] text-ink">
        API &amp; webhooks
      </h1>
      <p className="mt-4 text-[1rem] leading-relaxed text-steel">
        Feedback doesn&apos;t have to come from the widget, and it doesn&apos;t
        have to stay in Voicebox.
      </p>

      {/* ------------------------------------------------------------ in */}

      <h2 className="mt-10 text-[1.25rem] font-bold tracking-tight text-ink">
        Submitting feedback
      </h2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        The same endpoint the widget uses. It takes your publishable key, so
        it&apos;s safe from a browser. Pipe in support tickets, app-store
        reviews, or anything else you already collect.
      </p>
      <CodeBlock
        className="mt-4"
        filename="POST /api/ingest"
        code={`curl -X POST ${site.url}/api/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "key": "pk_your_project_key",
    "body": "The CSV export times out on large ranges.",
    "type": "ISSUE",
    "rating": 2,
    "email": "user@example.com",
    "pageUrl": "https://app.example.com/reports",
    "metadata": { "plan": "pro", "userId": "usr_8123" }
  }'`}
      />

      <div className="mt-4 rounded-xl border border-line bg-paper-2 p-4">
        <div className="label">Fields</div>
        <dl className="mt-3 space-y-2 text-[0.85rem]">
          {[
            ["key", "required, your publishable project key"],
            ["body", "required, the feedback text, up to 5,000 characters"],
            ["type", "IDEA · ISSUE · PRAISE · QUESTION · OTHER (default OTHER)"],
            ["rating", "optional integer, 1 to 5"],
            ["email", "optional, never sent to the model"],
            ["pageUrl, locale, referrer", "optional context"],
            ["metadata", "optional object, never sent to the model"],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-wrap gap-x-3">
              <dt className="font-mono text-[0.8rem] text-ink">{k}</dt>
              <dd className="text-steel">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* ----------------------------------------------------------- out */}

      <h2 className="mt-12 text-[1.25rem] font-bold tracking-tight text-ink">
        Reading data back
      </h2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Create a secret key under{" "}
        <strong className="text-ink">Settings → Developers</strong>, available
        on Pro and above. It&apos;s shown once and stored only as a hash, so
        keep it somewhere safe. Send it as a bearer token.
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-line">
        <table className="w-full text-left text-[0.85rem]">
          <tbody className="divide-y divide-line">
            {endpoints.map((e) => (
              <tr key={e.path} className="bg-paper-2">
                <td className="w-16 py-3 pl-4 align-top">
                  <span className="rounded bg-mint-wash px-1.5 py-0.5 font-mono text-[0.7rem] font-semibold text-mint-deep">
                    {e.method}
                  </span>
                </td>
                <td className="py-3 pr-4 align-top">
                  <code className="font-mono text-[0.82rem] text-ink">
                    {e.path}
                  </code>
                  <p className="mt-1 text-[0.8rem] leading-relaxed text-steel">
                    {e.note}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CodeBlock
        className="mt-5"
        filename="GET /api/v1/themes"
        code={`curl "${site.url}/api/v1/themes?limit=2" \\
  -H "Authorization: Bearer sk_your_secret_key"

{
  "data": [
    {
      "id": "cm4x8k2p90001",
      "project_id": "cm4x8k1a70000",
      "title": "CSV export times out on large ranges",
      "description": "Exports of more than six months fail silently.",
      "sentiment": "NEGATIVE",
      "item_count": 34,
      "negative_share": 0.82,
      "priority_score": 3.41,
      "status": "ACTIVE",
      "last_seen_at": "2026-08-11T09:14:22.000Z"
    }
  ],
  "has_more": true,
  "next_cursor": "cm4x8k2p90001"
}`}
      />

      <h3 className="mt-8 text-[1rem] font-semibold text-ink">Paging</h3>
      <p className="mt-2 text-[0.9rem] leading-relaxed text-steel">
        Pass <code className="font-mono text-[0.82rem]">next_cursor</code> back
        as <code className="font-mono text-[0.82rem]">?cursor=</code> to get the
        following page. Cursors rather than offsets, because feedback arrives
        while you&apos;re paging and an offset would quietly skip rows.
        <code className="font-mono text-[0.82rem]"> limit</code> tops out at 100.
      </p>

      <h3 className="mt-8 text-[1rem] font-semibold text-ink">Errors</h3>
      <p className="mt-2 text-[0.9rem] leading-relaxed text-steel">
        Every failure is a JSON body with a stable{" "}
        <code className="font-mono text-[0.82rem]">error.code</code> and a
        message written for a human reading a log.
      </p>
      <CodeBlock
        className="mt-3"
        filename="401 Unauthorized"
        code={`{
  "error": {
    "code": "invalid_key",
    "message": "That API key is not valid."
  }
}`}
      />

      {/* ------------------------------------------------------------ mcp */}

      <h2
        id="model-context-protocol"
        className="mt-12 scroll-mt-24 text-[1.25rem] font-bold tracking-tight text-ink"
      >
        Model Context Protocol
      </h2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        The same read access, but for your coding agent. Point Claude Code,
        Cursor, or any MCP client at Voicebox and it can pull your ranked themes
        straight into wherever you write code, so &ldquo;what should I build
        next&rdquo; is answered from what your users actually said. It&apos;s a
        remote server, so there&apos;s nothing to install.
      </p>

      <CodeBlock
        className="mt-4"
        filename="Add it to Claude Code"
        code={`claude mcp add --transport http voicebox \\
  ${site.url}/api/mcp \\
  --header "Authorization: Bearer sk_your_secret_key"`}
      />

      <p className="mt-4 text-[0.9rem] leading-relaxed text-steel">
        Same secret key as the API above, so it&apos;s behind the same plan and
        the same rate limit, and revoking the key cuts off the agent too. Every
        tool is read-only, an agent can read your feedback but never change it.
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-line">
        <table className="w-full text-left text-[0.85rem]">
          <tbody className="divide-y divide-line">
            {[
              ["list_projects", "Your projects, to get a project_id."],
              ["list_themes", "The ranked list of what to work on, top item first."],
              ["get_theme", "One theme plus the real messages behind it."],
              ["list_feedback", "Raw feedback, filterable by type, sentiment, and date."],
              ["project_overview", "Totals, sentiment split, and negative share."],
            ].map(([name, note]) => (
              <tr key={name} className="bg-paper-2">
                <td className="py-3 pr-4 pl-4 align-top">
                  <code className="font-mono text-[0.82rem] text-ink">{name}</code>
                </td>
                <td className="py-3 pr-4 align-top text-[0.8rem] leading-relaxed text-steel">
                  {note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------- webhooks */}

      <h2 className="mt-12 text-[1.25rem] font-bold tracking-tight text-ink">
        Webhooks
      </h2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Point Voicebox at an HTTPS URL under{" "}
        <strong className="text-ink">Settings → Developers</strong> and get a
        signed POST when something happens. Useful for routing angry feedback
        into Slack the moment it lands, or opening a ticket when a new theme
        appears.
      </p>

      <ul className="mt-4 space-y-2">
        {WEBHOOK_EVENTS.map((event) => (
          <li
            key={event}
            className="flex flex-wrap items-baseline gap-x-3 rounded-lg border border-line bg-paper-2 px-4 py-2.5"
          >
            <code className="font-mono text-[0.82rem] text-ink">{event}</code>
            <span className="text-[0.83rem] text-steel">
              {WEBHOOK_EVENT_LABELS[event]}
            </span>
          </li>
        ))}
      </ul>

      <CodeBlock
        className="mt-5"
        filename="POST your-endpoint"
        code={`Voicebox-Event: feedback.analyzed
Voicebox-Signature: t=1786521600,v1=8f3c…

{
  "event": "feedback.analyzed",
  "createdAt": "2026-08-11T09:14:22.000Z",
  "data": {
    "id": "cm4x8k9d10007",
    "project_id": "cm4x8k1a70000",
    "body": "The CSV export times out on large ranges.",
    "type": "ISSUE",
    "sentiment": "NEGATIVE",
    "sentiment_score": -0.7,
    "category": "Data export",
    "summary": "Export fails on ranges longer than six months.",
    "theme": { "id": "cm4x8k2p90001", "title": "CSV export times out" }
  }
}`}
      />

      <h3 className="mt-8 text-[1rem] font-semibold text-ink">
        Verifying the signature
      </h3>
      <p className="mt-2 text-[0.9rem] leading-relaxed text-steel">
        The timestamp is inside the signed string, so a captured request
        can&apos;t be replayed at you later. Compare in constant time and reject
        anything older than five minutes.
      </p>
      <CodeBlock
        className="mt-3"
        filename="verify.ts"
        code={`import { createHmac, timingSafeEqual } from "node:crypto";

export function verify(header: string, rawBody: string, secret: string) {
  const parts = Object.fromEntries(
    header.split(",").map((p) => p.split("=")),
  );

  const age = Math.abs(Date.now() / 1000 - Number(parts.t));
  if (age > 300) return false;

  const expected = createHmac("sha256", secret)
    .update(\`\${parts.t}.\${rawBody}\`)
    .digest();

  const received = Buffer.from(parts.v1, "hex");
  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
}`}
      />

      <p className="mt-6 rounded-xl border border-line bg-paper-2 px-4 py-3 text-[0.85rem] leading-relaxed text-steel">
        <strong className="text-ink">Retries.</strong> A delivery times out
        after 8 seconds and any non-2xx counts as a failure. We don&apos;t
        replay individual events, but an endpoint that fails twelve times in a
        row is switched off rather than hammered, and you&apos;ll see the last
        status code in settings. Turn it back on once it&apos;s fixed and the
        counter resets.
      </p>

      {/* -------------------------------------------------------- limits */}

      <h2 className="mt-12 text-[1.25rem] font-bold tracking-tight text-ink">
        Rate limits
      </h2>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-steel">
        Ten submissions per IP per hour per project on ingest. Over-quota
        accounts keep accepting feedback up to a hard ceiling, we won&apos;t
        discard your users&apos; words because of a billing state, but new items
        stop being analyzed until the period resets or you upgrade.
      </p>
    </>
  );
}
