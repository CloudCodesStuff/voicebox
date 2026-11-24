# Reddit posts

Rewritten 22 Sep 2026. The old drafts read like blog posts and put "founder
here" at the very bottom, which on Reddit reads as hiding it. Every post now
says whose product it is in the first line, with the link, and then talks like
a person. The technical claims are the same ones verified on 3 Sep; the
appendix at the end still lists what's safe to say and what got cut.

The Shopify post is gone. That angle was dropped on 8 Sep.

Rules:

- You own it in line one. Name, link, done. Then be interesting.
- One sub per day. Near-identical posts in a burst trip spam filters.
- Reply to every comment for the first three hours. The post is the ante.
- Where a sub eats links, no URL in the body. People ask. Answer in comments.
- Always the tagged link. Attribution is first-touch off `?ref=`, shown as
  Acquisition in `/admin`. A bare link records nothing.
- One or two of these will flop or get removed. Fine.

## Schedule from Tue 22 Sep

| When | Sub | Link | Why this slot |
|---|---|---|---|
| Tue 22 Sep | r/SideProject | `usevoicebox.dev/?ref=r-sideproject` | Promo-native. Post in the morning, US time. |
| Sat 26 Sep | r/webdev | in comments: `?ref=r-webdev` | Showoff Saturday is the only day promo is allowed |
| Sun 27 Sep | r/alphaandbetausers | `usevoicebox.dev/?ref=r-alphabeta` | Straight ask for testers |
| Tue 29 Sep | r/SaaS | `usevoicebox.dev/?ref=r-saas` | Copy angle |
| Thu 1 Oct | r/indiehackers | `usevoicebox.dev/?ref=r-ih` | Weakest audience for buying, fine for attention |
| held | r/microsaas | `?ref=r-microsaas` | See post 6 |

---

## 1. r/SideProject, Tue 22 Sep

**Title:** I built a feedback widget where the output is an MCP server, so my
coding agent reads the complaints instead of me

**Body:**

Mine, I built it: usevoicebox.dev/?ref=r-sideproject

Every feedback tool I've installed on my own stuff ended the same way. Feedback
kept coming in, I stopped opening the dashboard within a week, and I shipped
whatever I felt like anyway.

So on this one the dashboard isn't the point. The output is an MCP server with
five read-only tools. You point Claude Code or Cursor at it and ask what people
are complaining about and what they actually wrote. Put that on a cron and the
agent has read last week's feedback before you've opened your laptop. I don't
run the cron for you, that part's yours.

The collection side is a widget, one script tag. It reads your site's colors,
corner radius and font and restyles itself to match, so a Webflow marketing
page and a dark dashboard get different looking widgets from the same line
with no config. Getting that right took a week longer than the rest of the
product, if anyone wants the color-space war stories.

Grouping puts five different wordings of "your export is broken" into one
theme with a headcount. Ranked by how many people, how unhappy, how recent.
It's arithmetic on purpose, so you can argue with the order.

Free plan is 25 pieces of feedback a month with the analysis on, no card. The
widget in the corner of the site is the real product running on its own page,
so go poke it.

I'll be in the comments all day.

---

## 2. r/webdev, Sat 26 Sep, Showoff Saturday only

Best audience for the technical story, and the one most likely to check your
numbers. Every figure came out of the source. Don't add any.

**Title:** [Showoff Saturday] I built a widget that restyles itself to match
whatever site it's dropped into. The color science was the hard part.

**Body:**

I'm the founder of Voicebox, a feedback widget. Sub rules say no link in the
body, it's in the comments if you want it. This post is about one feature
that ate a week: the widget reads the host page's CSS and matches it.

You can't regex hex codes any more. Half of Tailwind v4 sites express their
accent as `oklch()` or `oklab()`, and Ottosson's matrices handle those fine.
`lab()` and `lch()` are the trap. They're specified against a D50 white point
and sRGB is D65, and CSS Color 4 leaves the adaptation to the implementation.
Use one D65 matrix for everything and it looks right and is wrong by about
6/255 on saturated reds. `lab(54.29 80.8 69.89)` should be exactly `#FF0000`.
With the wrong matrix you get `#FF0500`. I checked that one against Chrome's
rasterizer.

Then `color-mix(in srgb, X, transparent)` unwrapping, because a lot of
Tailwind sites express the accent that way and the value you want is inside.

Shadow DOM cost me an evening. `:host { all: initial }` is what keeps host CSS
out, and it also resets `font-family` to the browser's initial value, which is
a serif. Then my own `* { font-family: inherit }` faithfully spread that serif
through the whole widget. Fix is to re-inherit on the host itself:
`:host { all: initial; font-family: inherit }`. Widget picks up the page font,
costs nothing.

Corner radius comes from the site's `--radius` token when there is one (shadcn
ships it under that name), otherwise the median of sampled border-radius
rules. A real token beats a guess.

Rest: about 11KB gzipped, no dependencies, no build step, mounts on
`requestIdleCallback`. If the API is down it renders nothing rather than
throwing into someone else's error tracking.

Happy to go deeper on any of it.

---

## 3. r/alphaandbetausers, Sun 27 Sep

**Title:** [Beta] Feedback widget your coding agent can query. Free plan, I
want it broken.

**Body:**

I made this: usevoicebox.dev/?ref=r-alphabeta

Voicebox. One script tag. The widget reads your site's colors, radius and font
and matches them. Your users reply in-product, the engine groups the replies
into themes ranked by how many people, how negative, how recent. Then it's an
MCP server, so Claude Code or Cursor can pull the ranked list and the quotes
behind it, and you can stop opening the dashboard.

Free plan is 25 pieces of feedback a month, analysis included, no card.

What I want broken:

1. The brand-match on your site. It's the feature most likely to look wrong.
   Break it and tell me what your CSS does.
2. The install. Time yourself. If it takes more than a few minutes the docs
   are wrong and I want to know where you stalled.
3. The MCP loop. Connect your agent, ask it what to fix, tell me whether the
   answer was useful or whether it just read the list back to you.
4. Whether the ranked order matches your gut about your own users. If it
   doesn't, that's the most useful thing you could tell me.

I'll fix what you find and report back in this thread.

---

## 4. r/SaaS, Tue 29 Sep

**Title:** I deleted the word "AI" from my whole marketing site. Before and
after.

**Body:**

My site: usevoicebox.dev/?ref=r-saas. Go check the copy, that's the point of
this post.

Every SaaS site right now says "AI-powered insights." Mine said it too, in
about nine places. On 18 Aug I removed all of them.

Not because the product doesn't use models. It does, that's the whole backend.
"AI" just stopped carrying information. It says what I spent, not what the
customer gets.

- "AI themes" became "automatic themes"
- "The AI is on every plan" became "the insight engine is on every plan"
- FAQ heading "The AI" became "The insight engine"
- "What if the AI is wrong?" became "What if the grouping is wrong?", which is
  what people actually ask

I kept "AI" in two places. The privacy policy and the DPA, where naming the
model provider is disclosure rather than pitch.

I have no conversion data. Traffic's too low for a number to mean anything
and I'd rather say that than dress up an anecdote. What changed immediately:
people stopped asking "so what does the AI do" and started asking about the
grouping.

Has anyone here A/B'd this? Does "AI" still lift signups in 2026 or is it
wallpaper?

---

## 5. r/indiehackers, Thu 1 Oct

**Title:** Your users' feedback is dying in your DMs and you're shipping by
vibes

**Body:**

Founder of usevoicebox.dev/?ref=r-ih, a feedback tool, so read this knowing
that.

Watching #buildinpublic founders in the $5-30K MRR range, there's a pattern.
They know their number one complaint because it's loud. They don't know
anything past it. Priorities two through five get decided by whoever DMed
most recently.

The loud-few problem is the underrated part. Users who bother to complain are
a weird slice. The quiet ones churn without saying anything. If your feedback
system is DMs plus support email plus memory, you're sampling the loudest few
percent and calling it a roadmap.

What I'd do at that stage, and what I ended up building because I wanted it:
collect where users already are, because in-product beats "go visit our
feedback board" by a mile. Then rank by how many people, how negative, how
recent, instead of by recall. A spreadsheet version of that beats vibes.

Anyone past $10K MRR: what's actually deciding your next sprint, data or the
last angry DM?

---

## 6. r/microsaas, held

> Do not post until you have actually sold someone.
>
> The old draft was titled "Sold my first customer before the product had a
> pricing page." Checked 3 Sep 2026 against the live Stripe account: zero
> completed checkout sessions, ever. Every factual claim in it was false.
> r/microsaas and HN share readers, and a made-up revenue story is the one
> mistake in this file you can't walk back.
>
> Precondition: one paying customer who isn't another project of yours and
> isn't family, with a completed Stripe subscription you can point at. Write
> the post the week after that, with the real numbers.

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
| "AI" removed 18 Aug | commit `1a98ad9` |

Cut, because it wasn't true:

- "Verified all 20 test colors against Chrome's own rasterizer." There are no
  test files in this repo. The source records one colour checked against
  Chrome.
- "The fix takes `!important` host rules." Not what the code does. It's
  `font-family: inherit` on `:host`.
- "No customers yet, so you'd be early." Scarcity framing. Cut from every post.
- The whole r/microsaas post. See above.
- "bottom-right corner" became "the corner". Widget position is configurable
  (`c.position`, `widget/widget.js:177`).
