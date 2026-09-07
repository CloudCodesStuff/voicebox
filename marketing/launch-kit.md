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
**Short:** Your users' feedback, grouped and ranked, queryable by your coding agent.
**Long:**
> Voicebox collects feedback with a one-line widget and groups it into themes
> ranked by how many people, how unhappy and how recently. The MCP server
> exposes those themes read-only, so you can ask Claude Code, Cursor or Codex
> what to fix next and the answer comes from what your users actually said,
> with the quotes behind it. Put it on a cron and the agent reads last week's
> feedback before you open anything. Five tools: list_projects, list_themes,
> get_theme, list_feedback, project_overview. Free tier included.

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
> Every feedback tool I tried ends at a dashboard. I stopped opening mine
> within a week, every time, and then shipped by vibes anyway. So I built the
> version whose output is a read-only MCP server instead of a page.
>
> Point Claude Code / Cursor / Codex at it and the agent can ask what the top
> themes are and pull the verbatim quotes behind each one. Put that on a cron
> and Monday morning your agent has already read what users said last week,
> grouped and ranked, and can tell you what is worth fixing. Five tools:
> list_projects, list_themes, get_theme, list_feedback, project_overview.
>
> I don't run that schedule. That's your cron, or Claude Code's own loop. What
> I do is get the feedback into a shape an agent can reason about, which is the
> part that didn't exist.
>
> The collection side is a widget, one script tag, ~11KB gzipped, rendered in
> a shadow root so it can't fight the host page's CSS.
>
> Implementation notes, in case they're the interesting part:
> - Grouping is by the problem underneath rather than the keyword, so five
>   wordings of one complaint become one theme and the number next to it is
>   people affected, not term frequency.
> - Ranking is volume × negative share × recency. Arithmetic you can audit,
>   because a ranked list nobody can interrogate gets ignored the first time it
>   disagrees with someone senior.
> - Only the message text, the type and the rating reach the model. The
>   function that builds the prompt takes three fields, so emails and
>   identify() traits can't get there structurally rather than by policy.
> - The brand-matcher reads oklch/oklab/lab/lch. lab()/lch() are D50 while sRGB
>   is D65, and using one matrix for both is wrong by ~6/255 on saturated reds.
> - The widget boots on requestIdleCallback and renders nothing if the API is
>   unreachable, rather than throwing into someone else's error tracking.
>
> Free tier is 25 pieces of feedback a month with the analysis on. Paid plans
> only buy volume. It runs on its own landing page, so the widget in the corner
> is the live thing.
>
> Happy to answer anything about the clustering, the MCP surface, or the widget
> isolation.

**First-hour rules:** reply to every comment, concede valid criticism
instantly, never argue tone. If someone asks "why not Canny", link the /vs
page and summarize honestly in the comment itself.

---

## 3. Product Hunt **[you — schedule 12:01am PT, a week after HN]**

**Tagline (60 chars):** Feedback in. Fix list out.
**Alt tagline:** The feedback widget your coding agent can read.

**Description:**
> Voicebox collects feedback with a one-line widget and groups it into themes
> ranked by how many people, how unhappy, and how recently. Then it's an MCP
> server, so Claude Code or Cursor can answer "what should I build next?" from
> your actual users, with the quotes behind it. Put it on a schedule and the
> agent reads your feedback so you don't have to. Free for 25 pieces a month,
> analysis included.

**First comment (from you, the maker):**
> Hey PH, I'm Eashaan. I built this because every feedback tool I tried ended
> at a dashboard I stopped opening within a week. Voicebox groups the five
> wordings of one complaint into a single theme and ranks the list, and then
> hands it to your coding agent over MCP, so the thing that decides what to fix
> has already read your users. Ask me anything, and the widget in the corner of
> the site is the live product, so poke it.

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
> one-line widget, replies get grouped into ranked themes, and your coding
> agent can query the list over MCP so you never open a dashboard. Free for 25
> a month. Install is about four minutes: usevoicebox.dev/?ref=dm-t1. Either
> way, curious what you ended up doing about [pain].

**Template B (launch-congrats, for group 3):**
> Congrats on the launch, [specific detail]. When the launch-day feedback wave
> hits, I built something that turns it into a ranked fix list instead of an
> inbox, and your agent can read that list over MCP:
> usevoicebox.dev/?ref=dm-t1. Free tier covers launch week. Happy to set it up
> with you if useful.

Rules: two lines max before the link, always reference their actual words,
never follow up more than once.

---

## 5. Build-in-public thread + 7 posts **[needs your X connected to Zernio]**

**Launch thread (pin it):**
1/ I put my coding agent on a schedule so it reads what my users complained
about and tells me what to fix. Here's how 🧵
2/ Every feedback tool ends at a dashboard. You stop opening it within a week
and go back to shipping by vibes. The dashboard is the problem, not the
feature.
3/ So the output of mine is a read-only MCP server. Claude Code or Cursor
queries it: top themes, and the verbatim quotes behind each one.
[terminal screenshot]
4/ Cron it. Monday morning the agent has already read last week's feedback,
grouped and ranked, before you've opened anything. I don't run the schedule.
That's your cron. I just make feedback queryable by an agent.
5/ Collection is one script tag, ~11KB gzipped, shadow root so it can't fight
your CSS. It reads your site's own colours and radius and restyles itself.
[widget screenshot]
6/ Grouping is by the problem, not the keyword. Ranking is volume × negative
share × recency, so it's arithmetic you can check rather than a score you have
to trust.
7/ Free for 25 pieces of feedback a month with the analysis on. Paid only buys
volume. usevoicebox.dev/?ref=x

**Daily posts (one/day after the thread):**
- D1: screenshot of a real Lanci theme forming from 5 differently-worded complaints
- D2: the oklch brand-matching story (before: dark green, after: exact blue — with screenshots)
- D3: "why the free plan includes the insight engine" (pricing philosophy, quote the FAQ)
- D4: the widget-on-our-own-site loop: feedback about Voicebox, in Voicebox
- D5: MCP demo clip: asking Claude Code what to fix, getting quotes back
- D6: changelog screenshot + "shipping in the open"
- D7: week-one numbers, honest, whatever they are

---

## 6. Site follow-ups (mine, queued)
- PH badge slot in the hero for launch day.
- Swap RatingProof to the Lanci line: **done**.
- The landing page currently claims **no** customers, which is correct and
  worth keeping until one exists. Verified 2 Sep 2026: nothing in `src/` names
  Lanci or asserts a customer, so there is no claim to walk back. Add the
  claim line only when a customer who is not your own project agrees to be
  named.
