/**
 * Widget playground.
 *
 *   npm run playground   →   http://localhost:3001
 *
 * Deliberately a separate server on a separate port. Testing the widget from a
 * page served by the app itself proves almost nothing: same origin, no preflight,
 * no allowlist check. Port 3001 is a genuinely foreign origin to the app on 3000,
 * so this exercises the real path a customer's site takes, CORS and all.
 *
 * Paste your script tag, hit run, and the page injects it exactly as a customer
 * would. There's also a hostile-CSS toggle to prove the Shadow DOM isolation.
 */

import { createServer } from "node:http";

const PORT = Number(process.env.PLAYGROUND_PORT ?? 3001);
const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const page = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Voicebox widget playground</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 48px 24px 140px;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: #ffffff; color: #09090b;
  }
  .wrap { max-width: 720px; margin: 0 auto; }
  .brand { display: flex; align-items: center; gap: 9px; font-weight: 700; font-size: 17px; letter-spacing: -.02em; }
  h1 { font-size: 30px; letter-spacing: -.03em; margin: 22px 0 8px; }
  .sub { color: #6e6e78; line-height: 1.65; margin: 0 0 28px; max-width: 56ch; }
  label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 7px; }
  textarea {
    width: 100%; min-height: 96px; padding: 13px 14px; resize: vertical;
    border: 1px solid #e6e5e3; border-radius: 10px; background: #fff; color: #09090b;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; line-height: 1.6;
    outline: none;
  }
  textarea:focus { border-color: #00c48c; box-shadow: 0 0 0 3px #00c48c22; }
  .row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; align-items: center; }
  button {
    height: 40px; padding: 0 18px; border: none; border-radius: 10px; cursor: pointer;
    font-size: 14px; font-weight: 600; font-family: inherit;
  }
  .primary { background: #09090b; color: #ffffff; }
  .primary:hover { opacity: .9; }
  .ghost { background: transparent; border: 1.5px solid #e6e5e3; color: #09090b; }
  .ghost:hover { border-color: #09090b; }
  .status {
    margin-top: 18px; padding: 13px 15px; border-radius: 10px; font-size: 13.5px; line-height: 1.6;
    border: 1px solid #e6e5e3; background: #fff;
  }
  .status.ok { border-color: #10896a44; background: #dcf2ea; color: #0b5f4a; }
  .status.err { border-color: #d1483b44; background: #fce9e7; color: #93251b; }
  .hint { font-size: 12.5px; color: #6e6e78; margin-top: 10px; line-height: 1.6; }
  code { background: #eeedec; padding: 2px 5px; border-radius: 4px; font-size: 12px; }
  .origin {
    display: inline-flex; align-items: center; gap: 7px; margin-top: 30px;
    font-family: ui-monospace, monospace; font-size: 12px; color: #6e6e78;
  }
  .dot { width: 7px; height: 7px; border-radius: 999px; background: #10896a; }
  .filler { margin-top: 46px; padding-top: 30px; border-top: 1px solid #e6e5e3; }
  .filler p { color: #6e6e78; line-height: 1.75; max-width: 60ch; }

  /* Toggled on to prove Shadow DOM isolation holds under abuse. */
  body.hostile button:not(.pg) {
    background: red !important; color: yellow !important;
    font-size: 28px !important; font-family: cursive !important;
    border: 5px dashed lime !important;
  }
  body.hostile textarea:not(.pg), body.hostile input { border: 5px solid magenta !important; }
  body.hostile svg { transform: rotate(12deg) !important; }

  @media (prefers-color-scheme: dark) {
    body { background: #09090b; color: #f2f2f4; }
    textarea, .status { background: #16161a; border-color: #26262c; color: #f2f2f4; }
    .primary { background: #f2f2f4; color: #09090b; }
    .ghost { border-color: #26262c; color: #f2f2f4; }
    code { background: #22222a; }
    .filler { border-color: #26262c; }
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="brand">
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 5h18M6 12h12M10 19h4" stroke="#00C48C" stroke-width="2.4" stroke-linecap="round"/>
    </svg>
    Voicebox playground
  </div>

  <h1>Try your widget on a foreign origin.</h1>
  <p class="sub">
    This page is served from port 3001, so to your Voicebox project it looks like
    somebody else's website. Same CORS preflight, same domain allowlist check,
    same everything a real customer hits.
  </p>

  <label for="snippet">Your script tag</label>
  <textarea id="snippet" class="pg" spellcheck="false" placeholder='&lt;script async src="${APP_ORIGIN}/widget.js" data-project="pk_..."&gt;&lt;/script&gt;'></textarea>

  <div class="row">
    <button class="primary pg" id="run">Load widget</button>
    <button class="ghost pg" id="hostile">Add hostile CSS</button>
    <button class="ghost pg" id="reset">Reset</button>
  </div>

  <p class="hint">
    Run <code>npm run keys</code> in the project to print the snippet for every
    project. If nothing appears, check that your allowed domains include
    <code>localhost</code> or are left empty.
  </p>

  <div class="status" id="status">Waiting for a script tag.</div>

  <div class="origin"><span class="dot"></span><span id="originLabel"></span></div>

  <div class="filler">
    <p>
      Some filler so the page scrolls and you can see how the widget behaves
      against a real page rather than an empty one. Scroll down, open the panel,
      leave it open, keep scrolling. It's fixed, so it should stay exactly where
      you put it.
    </p>
    <p>
      The hostile CSS button forces <code>button { background: red !important }</code>
      and friends onto this page. Everything outside the widget will look
      dreadful. The widget itself should not flinch, because it lives in a
      shadow root that your styles cannot reach into.
    </p>
  </div>
</div>

<script>
  var statusEl = document.getElementById("status");
  var originEl = document.getElementById("originLabel");
  originEl.textContent = "this page: " + location.origin + "  •  app: ${APP_ORIGIN}";

  function say(msg, kind) {
    statusEl.textContent = msg;
    statusEl.className = "status" + (kind ? " " + kind : "");
  }

  document.getElementById("run").addEventListener("click", function () {
    var raw = document.getElementById("snippet").value.trim();
    if (!raw) return say("Paste a script tag first.", "err");

    var key = (raw.match(/data-project=["']([^"']+)["']/) || [])[1];
    var src = (raw.match(/src=["']([^"']+)["']/) || [])[1];

    if (!key) return say("Couldn't find data-project in that snippet.", "err");
    if (!src) return say("Couldn't find src in that snippet.", "err");

    if (window.__voiceboxLoaded) {
      return say("A widget is already loaded. Hit Reset to swap keys.", "err");
    }

    say("Loading " + key + " from " + src + "…");

    var s = document.createElement("script");
    s.async = true;
    s.src = src;
    s.setAttribute("data-project", key);
    s.onerror = function () {
      say("Couldn't load widget.js. Is the app running on ${APP_ORIGIN}?", "err");
    };
    document.body.appendChild(s);

    // The widget fetches its config, then mounts. Give it a beat, then report
    // what actually happened rather than claiming success optimistically.
    setTimeout(function () {
      if (document.querySelector("[data-voicebox]")) {
        say("Widget mounted. Look bottom-right, submit something, then check your Inbox.", "ok");
      } else {
        say(
          "Script loaded but nothing mounted. Usually that's an unknown project key, " +
          "or this origin isn't in the project's allowed domains.",
          "err"
        );
      }
    }, 2500);
  });

  document.getElementById("hostile").addEventListener("click", function () {
    document.body.classList.toggle("hostile");
    var on = document.body.classList.contains("hostile");
    this.textContent = on ? "Remove hostile CSS" : "Add hostile CSS";
    say(on
      ? "Hostile CSS applied. This page now looks terrible. The widget should not."
      : "Hostile CSS removed.");
  });

  document.getElementById("reset").addEventListener("click", function () {
    location.reload();
  });
</script>
</body>
</html>`;

const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(page);
});

server.listen(PORT, () => {
  console.log(`\n  Voicebox playground   http://localhost:${PORT}`);
  console.log(`  Talking to        ${APP_ORIGIN}`);
  console.log(`\n  Run 'npm run keys' to get a script tag to paste in.\n`);
});
