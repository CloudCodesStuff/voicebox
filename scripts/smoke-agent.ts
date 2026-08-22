/**
 * Agent-readiness checks: every machine-readable surface the site promises.
 *
 *   npm run smoke:agent                       # against http://localhost:3000
 *   BASE=https://www.usevoicebox.dev npm run smoke:agent
 *
 * Verifies, over HTTP against a running server:
 *   - 404 behavior: real status, recovery links in the HTML body
 *   - /llms.txt with when-to-use guidance and developer-resource links
 *   - /openapi.json: valid, unique operationIds, described + typed everywhere
 *   - unmatched /api/* paths return structured JSON errors
 *   - Accept: text/markdown negotiation with Vary: Accept on key pages
 *   - /.well-known/mcp.json manifest matching the repo's server.json
 *   - homepage: raw HTML has an h1, 500+ chars, Organization JSON-LD
 *   - /about and /contact exist with 500+ chars of content
 */

const BASE = process.env.BASE ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

let failures = 0;

function check(label: string, ok: boolean, detail?: unknown) {
  console.log(`  ${ok ? "✓" : "✗"} ${label}`);
  if (!ok) {
    failures++;
    if (detail !== undefined) console.log("      ", detail);
  }
}

async function fetchText(path: string, headers?: Record<string, string>) {
  const res = await fetch(`${BASE}${path}`, { headers, redirect: "manual" });
  return { res, text: await res.text() };
}

function textOnly(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

async function main() {
  console.log(`Agent-readiness smoke against ${BASE}\n`);

  // --- 404 behavior ---------------------------------------------------
  console.log("404s");
  {
    const { res, text } = await fetchText("/some-path-that-does-not-exist");
    check("nonexistent path returns HTTP 404", res.status === 404, res.status);
    check("404 body links the sitemap", text.includes("/sitemap.xml"));
    check("404 body links llms.txt", text.includes("/llms.txt"));
    check("404 body links the docs index", text.includes("/docs"));
  }
  {
    const { res, text } = await fetchText("/some-path-that-does-not-exist", {
      accept: "text/markdown",
    });
    check(
      "markdown-preferring agent gets a markdown 404",
      res.status === 404 &&
        (res.headers.get("content-type") ?? "").includes("text/markdown"),
      `${res.status} ${res.headers.get("content-type")}`,
    );
    check("markdown 404 body has recovery links", text.includes("/sitemap.xml") && text.includes("/llms.txt"));
  }

  // --- llms.txt ---------------------------------------------------------
  console.log("llms.txt");
  {
    const { res, text } = await fetchText("/llms.txt");
    check("served 200 text/plain", res.status === 200 && (res.headers.get("content-type") ?? "").includes("text/plain"));
    check("has a when-to-use section", /## When to use/i.test(text));
    check("names the OpenAPI spec", text.includes("/openapi.json"));
    check("names the MCP endpoint and manifest", text.includes("/api/mcp") && text.includes("/.well-known/mcp.json"));
    check("states what it does not do", /does not do/i.test(text));
  }

  // --- OpenAPI ----------------------------------------------------------
  console.log("openapi.json");
  {
    const { res, text } = await fetchText("/openapi.json");
    check("served 200 application/json", res.status === 200 && (res.headers.get("content-type") ?? "").includes("json"));
    let spec: {
      openapi?: string;
      paths?: Record<string, Record<string, { operationId?: string; description?: string; responses?: Record<string, unknown> }>>;
      components?: { securitySchemes?: Record<string, unknown> };
    } | null = null;
    try {
      spec = JSON.parse(text);
    } catch {
      /* falls through to the checks below */
    }
    check("parses as JSON with openapi 3.1", spec?.openapi === "3.1.0", spec?.openapi);
    const ops = Object.values(spec?.paths ?? {}).flatMap((methods) => Object.values(methods));
    const ids = ops.map((o) => o.operationId).filter(Boolean);
    check("every operation has an operationId", ops.length > 0 && ids.length === ops.length);
    check("operationIds are unique", new Set(ids).size === ids.length, ids);
    check("every operation has a description", ops.every((o) => (o.description ?? "").length > 20));
    check("every operation declares responses", ops.every((o) => o.responses && Object.keys(o.responses).length > 0));
    check("declares bearer security scheme", Boolean(spec?.components?.securitySchemes?.bearerAuth));
  }

  // --- JSON errors on unmatched API paths -------------------------------
  console.log("API JSON errors");
  {
    const { res, text } = await fetchText("/api/nonexistent-endpoint");
    const body = (() => {
      try {
        return JSON.parse(text) as { error?: { code?: string; message?: string; hint?: string } };
      } catch {
        return null;
      }
    })();
    check("unmatched /api path returns 404 JSON", res.status === 404 && body !== null, `${res.status} ${text.slice(0, 80)}`);
    check("error carries code, message and hint", Boolean(body?.error?.code && body.error.message && body.error.hint));
  }
  {
    const res = await fetch(`${BASE}/api/v1/feedback`);
    const body = (await res.json().catch(() => null)) as { error?: { code?: string } } | null;
    check("v1 without a key returns 401 JSON with code", res.status === 401 && body?.error?.code === "missing_key", body);
  }

  // --- Markdown negotiation ----------------------------------------------
  console.log("markdown negotiation");
  for (const path of ["/", "/pricing", "/docs/api", "/about"]) {
    const { res, text } = await fetchText(path, { accept: "text/markdown" });
    const ct = res.headers.get("content-type") ?? "";
    const vary = res.headers.get("vary") ?? "";
    check(
      `${path} Accept: text/markdown → text/markdown`,
      res.status === 200 && ct.includes("text/markdown"),
      `${res.status} ${ct}`,
    );
    check(`${path} markdown Vary includes Accept`, /(\b|,\s*)accept(\b|,)/i.test(vary), vary);
    check(`${path} markdown starts with an H1`, text.trimStart().startsWith("# "));
  }
  {
    const { res } = await fetchText("/", { accept: "text/html" });
    const vary = res.headers.get("vary") ?? "";
    check("HTML variant Vary includes Accept", /(\b|,\s*)accept(\b|,)/i.test(vary), vary);
    check("HTML variant still serves text/html", (res.headers.get("content-type") ?? "").includes("text/html"));
  }

  // --- MCP manifest -------------------------------------------------------
  console.log("MCP manifest");
  {
    const { res, text } = await fetchText("/.well-known/mcp.json");
    const manifest = (() => {
      try {
        return JSON.parse(text) as { name?: string; remotes?: Array<{ type?: string; url?: string }> };
      } catch {
        return null;
      }
    })();
    check("/.well-known/mcp.json serves JSON", res.status === 200 && manifest !== null, res.status);
    check(
      "manifest names a streamable-http remote at /api/mcp",
      manifest?.remotes?.[0]?.type === "streamable-http" && (manifest.remotes[0].url ?? "").endsWith("/api/mcp"),
      manifest?.remotes,
    );
  }

  // --- No-JS content and Organization JSON-LD ------------------------------
  console.log("raw HTML");
  {
    const { res, text } = await fetchText("/");
    check("homepage serves 200", res.status === 200);
    check("raw HTML contains an <h1>", /<h1[\s>]/.test(text));
    check("raw HTML has 500+ chars of text", textOnly(text).length >= 500, textOnly(text).length);
    const ld = [...text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((m) => {
        try {
          return JSON.parse(m[1]) as { "@type"?: string; contactPoint?: unknown; legalName?: string };
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    const org = ld.find((x) => x?.["@type"] === "Organization");
    check("Organization JSON-LD present", Boolean(org));
    check("Organization has contactPoint and legalName", Boolean(org?.contactPoint && org.legalName));
  }
  for (const path of ["/about", "/contact"]) {
    const { res, text } = await fetchText(path);
    check(`${path} serves 200 with 500+ chars`, res.status === 200 && textOnly(text).length >= 500, textOnly(text).length);
  }

  console.log(failures === 0 ? "\nAll agent-readiness checks passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
