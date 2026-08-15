# Voicebox launch kit

Everything here is paste-ready. Items marked **[you]** need your accounts;
everything else I can revise on request. Order matters: directories first
(slow to approve), Show HN mid-week morning US time, Product Hunt only after
HN has taught us which pitch lands.

---

## 1. MCP directory submissions **[you — free, ~30 min total]**

The one distribution channel where the buyer is exactly a developer with a
product. Submit the same blurb everywhere:

**Name:** Voicebox
**Category:** Developer tools / Product feedback
**Short:** Your users' feedback themes, ranked and readable from your coding agent.
**Long:**
> Voicebox is a feedback widget plus an AI layer that scores every reply and
> groups it into ranked themes. The MCP server exposes those themes read-only:
> ask Claude Code, Cursor or Codex "what should I fix next?" and the answer
> comes from what your users actually said, with the quotes to prove it.
> Five tools: list_projects, list_themes, get_theme, list_feedback,
> project_overview. Free tier included.

**Remote endpoint:** `https://www.usevoicebox.dev/api/mcp`
**Auth:** `Authorization: Bearer sk_…` (API key from Settings → Developers)
**Transport:** Streamable HTTP, stateless.

Submit to:
- Smithery — smithery.ai (submit as a remote/hosted server)
- PulseMCP — pulsemcp.com/submit
- mcp.so — via their GitHub "add server" issue/PR flow
- Cursor directory — cursor.directory/mcp (has a submit form)
- Glama — glama.ai/mcp/servers (submission form)

If a form asks for an install command:
```
claude mcp add --transport http voicebox https://www.usevoicebox.dev/api/mcp --header "Authorization: Bearer sk_YOUR_KEY"
```

---

## 2. Show HN **[you — post from your HN account, Tue–Thu, 8–10am ET]**

**Title (78 chars, leads with the mechanism not the product):**
> Show HN: An MCP server so your coding agent knows what users want fixed

**Body:**
> I built Voicebox: a small feedback widget (one script tag, ~11KB, Shadow
> DOM so it can't fight your CSS) plus an analysis layer that scores every
> submission and clusters them into themes ranked by volume × negative share
> × recency.
>
> The part I think HN might find interesting: it runs as an MCP server. Point
> Claude Code / Cursor / Codex at it and mid-task you can ask "what are my top
> feedback themes, and what did people actually say?" — the agent reads the
> ranked list and the underlying quotes, read-only, and you fix things without
> ever opening a dashboard.
>
> Some implementation notes:
> - The widget renders in a shadow root and boots on requestIdleCallback, so
>   host-page CSS can't leak in and page speed isn't spent.
> - Only the message text goes to the model. The function that builds the
>   prompt accepts three fields; emails and identify() traits can't reach it
>   structurally, not by policy.
> - Ranking is plain arithmetic you can audit, not an opaque score.
> - The brand-matcher reads oklch/oklab/lab/lch (Tailwind v4 sites) to pick up
>   your accent colour from your live site.
>
> Free tier is 25 pieces of feedback a month with the full AI included; paid
> plans only buy volume. It's live on its own landing page (the widget in the
> corner is the product), and our first customer is a student-jobs platform
> whose feedback inbox we now drink from daily.
>
> Happy to answer anything about the clustering, the MCP surface, or the
> widget isolation.

**First-hour rules:** reply to every comment, concede valid criticism
instantly, never argue tone. If someone asks "why not Canny", link the /vs
page and summarize honestly in the comment itself.

---

## 3. Product Hunt **[you — schedule 12:01am PT, a week after HN]**

**Tagline (60 chars):** Feedback in. Fix list out.
**Alt tagline:** The feedback widget your coding agent can read.

**Description:**
> Voicebox collects feedback with a one-line widget, scores every reply with
> AI, and groups it into themes ranked by how many people, how unhappy, and
> how recently. New: it's an MCP server, so Claude Code or Cursor can answer
> "what should I build next?" from your actual users. Free for 25 pieces a
> month, AI included.

**First comment (from you, the maker):**
> Hey PH — I'm Eashaan, I built Voicebox because every feedback tool I tried
> either buried me in a raw inbox or wanted $100/mo to tell me what I could
> read myself. Voicebox reads every reply, groups the five wordings of the
> same complaint into one theme, and ranks the list. The twist I'm most proud
> of: it speaks MCP, so your coding agent can read your ranked themes while
> you code. Ask me anything — and the widget in the corner of our site is the
> live product, feel free to poke it.

Gallery: use the six 1270×760 images already in the repo
(`scripts/product-hunt-images.mjs` regenerates them).

---

## 4. Outreach — 20 hand-picked notes **[drafts below, you send]**

Targets, in order of warmth:
1. Founders posting complaints about Canny/Featurebase pricing (X search:
   `canny pricing`, `featurebase expensive`, reddit r/SaaS search same).
2. Indie hackers who tweeted "drowning in feedback" / "feedback all over the
   place" in the last 90 days.
3. Recent Show HN / PH launchers with visible traction but no feedback
   widget on their site (view-source check takes 10 seconds).

**Template A (pain-first, for group 1/2):**
> Saw your post about [their words]. I built a small tool for exactly that:
> one-line widget, AI groups every reply into ranked themes, free for 25
> replies/mo with the AI included. If you want, install takes ~4 min:
> usevoicebox.dev. Either way, curious what you ended up doing about [pain].

**Template B (launch-congrats, for group 3):**
> Congrats on the launch — [genuine specific detail]. Once the launch-day
> feedback wave hits, I built something that turns it into a ranked fix list
> instead of an inbox: usevoicebox.dev. Free tier covers launch week. Happy
> to set it up for you if useful.

Rules: two lines max before the link, always reference their actual words,
never follow up more than once.

---

## 5. Build-in-public thread + 7 posts **[needs your X connected to Zernio]**

**Launch thread (pin it):**
1/ I'm 17 and I just shipped Voicebox: a feedback widget whose AI turns
hundreds of replies into a ranked list of what to fix. Here's the whole
thing in 60 seconds 🧵
2/ The problem: feedback tools either show you a raw inbox (you read 400
messages) or a public board (your roadmap becomes a popularity contest).
3/ Voicebox: one script tag → every reply scored for sentiment + intent →
grouped by the *problem*, not the keyword → ranked by volume × unhappiness ×
recency. [dashboard screenshot]
4/ The part I'm most proud of: it's an MCP server. Claude Code and Cursor
can read your ranked themes mid-task. "What should I fix next?" answered
from real users. [terminal screenshot]
5/ Engineering bits: 11KB widget, Shadow DOM isolation, boots on idle,
emails structurally can't reach the model prompt, ranking is auditable
arithmetic.
6/ Free for 25 pieces/mo with the full AI. Paid plans only buy volume.
First customer already live: @[lanci handle]. usevoicebox.dev

**Daily posts (one/day after the thread):**
- D1: screenshot of a real Lanci theme forming from 5 differently-worded complaints
- D2: the oklch brand-matching story (before: dark green, after: exact blue — with screenshots)
- D3: "why the free plan has the full AI" (pricing philosophy, quote the FAQ)
- D4: the widget-on-our-own-site loop: feedback about Voicebox, in Voicebox
- D5: MCP demo clip: asking Claude Code what to fix, getting quotes back
- D6: changelog screenshot + "shipping in the open"
- D7: week-one numbers, honest, whatever they are

---

## 6. Site follow-ups (mine, queued)
- PH badge slot in the hero for launch day.
- Swap RatingProof to the Lanci line: **done**.
- When customer #2 agrees to be named, extend the claim line.
