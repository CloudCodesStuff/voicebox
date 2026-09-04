# Reddit posts

Every technical claim here was checked against the source on 3 Sep 2026. The
appendix lists what was verified and what got cut for being unverifiable. Read
it before editing anything back in.

The framing changed. These used to lead with "feedback widget." That undersells
it and it's the same sentence Canny and Featurebase already own. The thing
nobody else has is the loop: your users complain in-product, the engine ranks
the complaints, and then your coding agent reads that list on a schedule and
works out what to fix. The widget is the input. The agent is the point.

What not to claim: Voicebox doesn't run the schedule. You put Claude Code on a
cron yourself, or use whatever scheduler you already have. The MCP server is
read-only, five tools, and the agent queries it. Say that plainly, because
someone will ask and the answer should already be in the post.

Rules that keep you alive:

- Post as yourself, disclosed as the founder. The disclosure line is in every
  draft. Pretending to be a happy user is astroturfing.
- One sub per day. Near-identical posts in a burst trip spam filters.
- Reply to every comment for the first three hours. The post is the ante. The
  comments are the marketing.
- Where a sub eats links, no URL in the body. People ask. Answer in comments.
- One or two of these will flop or get removed. Fine.

## Schedule from today, Thu 3 Sep

| When | Sub | Why this slot |
|---|---|---|
| Thu 3 Sep | r/SideProject | Safest, promo-native. Go today. |
| Sat 5 Sep | r/webdev | Showoff Saturday is the only day promo is allowed |
| Sun 6 Sep | r/alphaandbetausers | Straight ask. Promo is the point there. |
| Tue 8 Sep | r/shopifyDev | Work this one hardest. It's the buyer. |
| Wed 9 Sep | r/SaaS | Copy angle |
| Thu 10 Sep | r/indiehackers | Lesson post. Weakest audience for buying. |
| held | r/microsaas | See post 7 |

---

## 1. r/SideProject, Thu 3 Sep

**Title:** I made my coding agent read my users' complaints on a schedule so I
stop guessing what to build

**Body:**

Every feedback tool I tried ends at a dashboard. You still have to go look at
it, read it, and decide. I stopped doing that within a week, every time.

So the output of mine is an MCP server. Five read-only tools. Point Claude Code
or Cursor at it and your agent can ask what the top themes are and pull the
quotes behind them. Put that on a cron and Monday morning your agent has
already read what your users said last week, ranked, and can tell you what's
worth fixing before you've opened anything.

I don't run that schedule for you. That's your cron, or Claude Code's own loop.
All I do is make the feedback queryable in a shape an agent can reason about.

The input side is a widget, one script tag. It parses the host page's computed
styles and restyles itself, so a Webflow marketing site and a dark dashboard
get different-looking widgets from the same line of code with no config.

Getting that right was worse than I expected. You can't regex hex codes any
more. Half of Tailwind v4 sites express their accent as `oklch()`, and
`lab()`/`lch()` are specified against the D50 white point while sRGB is D65.
Use one matrix for both and saturated reds land about 6/255 off.
`lab(54.29 80.8 69.89)` should be exactly `#FF0000` and comes out `#FF0500`.

Between the two, the grouping. It clusters by the problem underneath rather
than by keyword, so five wordings of "your export is broken" become one theme
with a count of people affected. Ranking is volume × negative share × recency.
Arithmetic on purpose, because a ranked list nobody can audit gets ignored the
first time it disagrees with someone senior.

It runs on its own landing page. The widget in the corner is the live product,
so poke it. Free plan is 25 pieces of feedback a month with the analysis on, no
card.

Founder here, obviously. Happy to go deep on the brand-matching internals or
the MCP surface.

usevoicebox.dev

---

## 2. r/webdev, Sat 5 Sep, Showoff Saturday only

Highest-risk post in the file and the best audience for it. Every number below
came out of the source. Don't add any.

**Title:** [Showoff Saturday] Widget that restyles itself to match any host
site, and the colour-science hole I fell into

**Body:**

I built a feedback widget that reads the host page's CSS and matches it. The
"read the brand" part turned into a hole I spent a week in.

CSS Color 4 means you can't regex hex codes any more. `oklch()` and `oklab()`
are everywhere now and Ottosson's matrices convert them fine. But `lab()` and
`lch()` are specified against a D50 white point while sRGB is D65, and CSS
Color 4 leaves the adaptation to the implementation. Use a D65 matrix for both
and it looks almost right and is wrong by about 6/255 on saturated reds.
`lab(54.29 80.8 69.89)` is exactly `#FF0000` with D50 and Bradford adaptation
folded into the matrix. With D65 you get `#FF0500`. Checked against Chrome's
rasterizer.

Then `color-mix(in srgb, X, transparent)` unwrapping, because that's how a lot
of Tailwind sites express an accent and the value you want is inside it.

The Shadow DOM one cost me an evening. `:host { all: initial }` is what stops
host CSS reaching in, and it also resets `font-family` to the browser's initial
value, which is a serif. Then `* { font-family: inherit }` faithfully
propagated that serif to every element in the widget. The fix is re-inheriting
on the host itself: `:host { all: initial; font-family: inherit }`. Costs
nothing and the widget picks up the page font.

Corner radius comes from the site's `--radius` token when there is one, since
shadcn ships it under exactly that name, and falls back to the median of
sampled border-radius rules. A design token beats an inference.

Rest of it: ~11KB gzipped, zero dependencies, no build step, mounts on
`requestIdleCallback` so it never blocks the host page. If the API is
unreachable it renders nothing instead of throwing into someone else's error
tracking.

Demo is the widget on the site itself. Founder, link in comments if anyone
wants it. Happy to go deep on any of this.

---

## 3. r/alphaandbetausers, Sun 6 Sep

**Title:** [Beta] Feedback widget your coding agent can query. Free plan, want
it broken

**Body:**

Voicebox. One script tag, the widget reads your site's colours, radius and font
and matches them. Users reply in-product. The engine groups everything into
themes ranked by volume, negative share and recency. Then it's an MCP server,
so Claude Code or Cursor can query the ranked list and the quotes behind it,
which means you can put an agent on a schedule and never open the dashboard.

Free plan: 25 pieces of feedback a month, analysis included, no card.

What I want broken:

1. The brand-match on your site. It's the feature most likely to look wrong.
   Break it and tell me what your CSS does.
2. The install. Time yourself. If it takes more than a few minutes the docs are
   wrong and I want to know where you stalled.
3. The MCP loop. Connect your agent, ask it what to fix, and tell me whether
   the answer was useful or whether it just read the list back to you.
4. Whether the ranked order matches your intuition about your own users. If it
   doesn't, that's the most useful thing you could tell me.

I'll fix what you find and report back in this thread. Founder here.

usevoicebox.dev

---

## 4. r/shopifyDev, Tue 8 Sep, discussion-first, NO link in body

This is the post that matters commercially. App devs with public review counts
have paying merchants and a review page as their only feedback channel. Engage
harder here than anywhere else.

**Title:** App devs: how do you hear about a problem before it's a 1-star
review?

**Body:**

The review page is a brutal feedback channel. By the time a merchant is annoyed
enough to write there it's public, permanent, and costing you installs. The
silent uninstalls never say anything at all.

Curious what this sub does in practice. In-app chat widget? Email on the
`app/uninstalled` webhook asking why? Support inbox and hope? Nothing, and read
the reviews?

The pattern I keep seeing is that devs with any in-app channel hear about
problems roughly a review-cycle earlier than devs relying on the store page.
I'd rather pressure-test that against experience here than assert it.

Disclosure: I build feedback tooling, so I'm not neutral. Keeping the body
link-free per sub rules. Happy to say what it is if anyone asks.

---

## 5. r/SaaS, Wed 9 Sep

**Title:** I deleted the word "AI" from my entire marketing site. Here's the
before and after

**Body:**

Every SaaS site right now says "AI-powered insights." Mine said it too, in
about nine places. A couple of weeks ago I removed all of them.

Not because the product doesn't use models. It does, that's the whole backend.
Because "AI" stopped carrying information. It says what I spent, not what the
customer gets.

- "AI themes" became "automatic themes"
- "The AI is on every plan" became "the insight engine is on every plan"
- FAQ heading "The AI" became "The insight engine"
- "What if the AI is wrong?" became "What if the grouping is wrong?", which is
  the question people actually have

I kept "AI" in two places. The privacy policy and the DPA, where naming the
model provider is disclosure rather than pitch.

No conversion data. I don't have the traffic for that to mean anything and I'd
rather say so than dress up an anecdote. What did change immediately: people
stopped asking "so what does the AI do" and started asking about the grouping.

Has anyone here A/B'd de-AI-ing their copy? Does "AI" still lift signups in
2026 or is it wallpaper now?

Founder of usevoicebox.dev, the site in question, so you can check the copy.

---

## 6. r/indiehackers, Thu 10 Sep

**Title:** Your users' feedback is dying in your DMs and you're shipping by
vibes

**Body:**

Watching #buildinpublic founders in the $5-30K MRR range, there's a pattern.
They know their number one complaint, because it's loud. They don't know
anything past it. Priorities two through five get decided by whoever DMed most
recently.

The loud-few problem is the part people underrate. Users who bother to complain
are an unrepresentative slice. The quiet ones churn without telling you
anything. If your feedback system is DMs plus support email plus memory, you're
sampling the loudest few percent and calling it a roadmap.

What I'd do at that stage, and what I eventually built because I wanted it
(disclosure: founder of usevoicebox.dev): collect where users already are,
because in-product beats "go visit our feedback board" by a mile. Then rank by
volume × negative share × recency instead of by recall. A spreadsheet version
of that beats vibes.

Question for anyone past $10K MRR. What's deciding your next sprint, data or
the last angry DM?

---

## 7. r/microsaas, held

> Do not post until you have actually sold someone.
>
> The previous draft was titled "Sold my first customer before the product had
> a pricing page" and described the sale, the timing, and the pitch that closed
> it. Checked 3 Sep 2026 against the live Stripe account: zero completed
> checkout sessions, ever. All five Voicebox sessions are `expired` /
> `payment_status=unpaid`. The only subscriptions on the account are two
> cancelled $7 ones belonging to a different product.
>
> Every factual claim in that post was false. r/microsaas and HN share readers,
> and a made-up revenue story is the one mistake in this file you can't walk
> back.
>
> Precondition: one paying customer who isn't another project of yours and
> isn't family, with a completed Stripe subscription you can point at. The post
> is good the week after that. Write it then, with the real numbers.

---

## Appendix: what was verified, what was cut

Checked against the source on 3 Sep 2026.

Safe to claim:

| Claim | Where it's true |
|---|---|
| D50 vs D65, ~6/255 on saturated reds, `lab(54.29 80.8 69.89)` gives `#FF0000` vs `#FF0500` | `src/server/lib/brand-color.ts:690-699`, verbatim |
| Ottosson matrices for oklch/oklab | `brand-color.ts` |
| `color-mix(in srgb, X, transparent)` unwrapping | `brand-color.ts` |
| `--radius` token outranks inferred radii | `brand-color.ts:195, 317` |
| `:host{all:initial;font-family:inherit}` and the serif propagation | `widget/widget.js:222-232` |
| ~11KB gzipped | measured: 24,991 B raw, 11,216 B gzipped |
| MCP server, 5 read-only tools | `list_projects, list_themes, get_theme, list_feedback, project_overview` |
| Free tier 25/month with analysis, no card | `src/lib/site.ts` |
| Ranking is volume × negative share × recency | `priorityScore` in `analyze.ts` |
| Site says "insight engine", never "AI" | live site: 0 "AI", 11 "insight engine" on `/`, 15 on `/pricing` |

Cut, because it wasn't true:

- "Verified all 20 test colors against Chrome's own rasterizer." There are no
  test files in this repo. The source records one colour checked against
  Chrome. Claiming a test suite to r/webdev, where someone will ask to see it,
  is the worst possible place to overstate.
- "The fix takes `!important` host rules, which beat `:host` rules for
  inherited props." Not what the code does. It's `font-family: inherit` on
  `:host`. The true version is shorter and reads better.
- "We deleted the word AI yesterday." It was 18 Aug, commit `1a98ad9`. Also
  "we" to "I", since you're solo.
- "No customers yet, so you'd be early." Scarcity framing, and it invites the
  obvious reply: early to what? Cut from every post. The free tier and the
  disclosure line carry the honesty without asking for credit for having no
  customers.
- The whole r/microsaas post. See above.
- "bottom-right corner" became "the corner". Widget position is configurable
  (`c.position`, `widget/widget.js:177`) and I couldn't confirm what the
  landing page sets.
