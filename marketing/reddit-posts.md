# Reddit — 7 posts for 7 subreddits

Rules that keep you alive there:

- **Post as yourself, disclosed as the founder, every time.** Pretending to
  be a happy random user is astroturfing — ban + reputational damage +
  actual FTC problem. The disclosure line is included in each draft.
- One sub per day, not all in one afternoon — identical-ish posts across
  subs in a burst trips spam filters and mods.
- Reply to every comment for the first 3 hours. The post is the ante; the
  comments are the marketing.
- Some subs eat links: where noted, no URL in the body — people will ask,
  answer in comments.
- Expect one or two posts to flop or get removed. Fine. The winners get
  recycled as X threads.

---

## 1. r/SideProject — promo allowed, demo-first

**Title:** I made a feedback widget that steals your site's design so you
don't have to configure anything

**Body:**
Paste one script tag and the widget reads your site's colors, corner
radius, and font, and styles itself to match — a Webflow site and a dark
dashboard get two completely different-looking widgets from the same line
of code. Getting that right meant parsing oklch/oklab/lab colors (the
lab/lch ones are D50, not D65, which cost me a whole evening) and fighting
Shadow DOM font inheritance.

Backend groups every reply by problem and ranks what to fix by how many
people, how unhappy, how recent. There's also an MCP server, so if you use
Claude Code or Cursor, your agent can read the ranked list and go fix
things.

It's live on the landing page (bottom-right corner is the actual widget) —
happy to answer anything about the brand-matching internals.

Founder here, obviously. Free plan is 25 replies/month, no card.

*(Link in body is OK in this sub: usevoicebox.dev)*

---

## 2. r/microsaas — story + numbers culture

**Title:** Sold my first customer before the product had a pricing page —
what actually moved

**Body:**
First paying customer closed [X weeks] ago. What worked wasn't the launch
post or a directory — it was installing the product on their site *for
them* as the pitch. My widget auto-matches a site's brand, so I ran it
against their product, screenshotted it sitting there like it already
belonged, and sent that instead of a deck.

What I've learned since, trying to find customer #2–#10:
1. "SaaS founders" is not a market. Founders with revenue and a visible
   pain is.
2. Directories and launch platforms are builders looking at builders.
   Zero buyers so far from any of them.
3. The demo-as-first-message outperforms every written pitch I've tried.

Product is a feedback widget + an engine that ranks replies into a fix
list (I'm the founder — usevoicebox.dev). But the takeaway I'd defend:
whatever you sell, find the version of "install it on their site before
they asked" for your product.

---

## 3. r/indiehackers — lesson post, soft mention

**Title:** Your users' feedback is dying in your DMs and you're shipping
by vibes

**Body:**
Watching #buildinpublic founders at $5–30K MRR, there's a pattern: they
know their #1 complaint (it's loud), and nothing past it. Priorities #2–#5
are getting decided by whoever DMed most recently.

The loud-few problem is real: users who bother to complain publicly are a
weird, unrepresentative slice. The quiet ones just churn. If your feedback
"system" is DMs + support email + memory, you're sampling the loudest 5%
and calling it a roadmap.

What I'd do at that stage (and what I built after wanting it —
disclosure: founder of usevoicebox.dev): collect where users already are
(in-product beats "go visit our board" by miles), and rank by volume ×
negativity × recency instead of recall. Even a spreadsheet version of that
beats vibes.

Question for people past $10K MRR: what's actually deciding your next
sprint — data or the last angry DM?

---

## 4. r/shopifyDev — discussion-first, NO link in body

**Title:** App devs: how do you hear about problems before they're a
1-star review?

**Body:**
The review page is a brutal feedback channel — by the time someone's angry
enough to write there, it's public and permanent, and the silent
uninstalls never say anything at all.

Curious what this sub actually does: in-app intercom-style chat? Email on
uninstall webhook? Nothing and pray?

I build feedback tooling (disclosure: founder — happy to share what it is
if anyone asks, keeping the body link-free per sub rules), and the pattern
I keep seeing is that devs with an in-app channel catch issues roughly a
review-cycle earlier than devs relying on the review page. Want to
pressure-test that against real experience here.

---

## 5. r/webdev — technical writeup, Showoff Saturday only

**Title:** [Showoff Saturday] Widget that matches any site's brand
automatically — the color-science rabbit hole

**Body:**
Built a feedback widget that styles itself from the host site. The
"read the brand" part turned into a genuine rabbit hole:

- CSS Color 4 means you can't just regex hex codes anymore — oklch() and
  oklab() are everywhere now. Ottosson's matrices convert them, BUT
  lab()/lch() are specified against D50 white point while everything else
  is D65. Saturated reds come out 6/255 wrong if you use one matrix for
  both. Verified all 20 test colors against Chrome's own rasterizer.
- color-mix(in srgb, X, transparent) unwrapping, because half of Tailwind
  sites express their brand color that way.
- Shadow DOM `:host { all: initial }` resets font-family to the *browser
  default* (serif!), not the page font — inheriting the host font takes
  `!important` host rules, which beat `:host` rules for inherited props.
- Corner radius comes from the site's `--radius` token when present,
  falling back to the median of sampled rules.

Demo is the widget on the site itself (founder, link in comments if
wanted). Happy to go deep on any of this.

---

## 6. r/SaaS — contrarian copy story

**Title:** We deleted the word "AI" from our entire marketing site
yesterday. Here's the before/after thinking

**Body:**
Every SaaS site right now: "AI-powered insights." Ours said it too, in
about nine places. Yesterday we removed every one.

Not because the product doesn't use models — it does, that's the whole
backend. Because "AI" stopped being information. It doesn't say what the
customer gets; it says what we spent. "AI themes" became "automatic
themes." "The AI is on every plan" became "the insight engine is on every
plan." The FAQ heading "The AI" became "The insight engine," and "What if
the AI is wrong?" became "What if the grouping is wrong?" — which is the
question users actually have.

Kept "AI" only in the privacy policy and DPA, where naming the model
provider is disclosure, not pitch.

Too early for conversion data; the legibility difference in user tests of
one was immediate. Curious if anyone here has A/B'd de-AI-ing their copy —
does "AI" still lift signups in 2026, or is it wallpaper now?

(Founder of usevoicebox.dev, the site in question.)

---

## 7. r/alphaandbetausers — the straight ask (promo is the point here)

**Title:** [Beta] Feedback widget that auto-matches your brand + ranks
replies into a fix list — free plan, want blunt feedback

**Body:**
Voicebox (usevoicebox.dev): one script tag, the widget reads your site's
colors/radius/font and matches them, users reply in-product, and the
engine groups everything into themes ranked by volume, negativity, and
recency. MCP server included if you want your coding agent reading the
list.

Free plan: 25 replies/month, analysis included, no card.

What I want roasted: the 4-minute install claim (time yourself), the
brand-match accuracy on YOUR site (it's the flagship feature — break it),
and whether the ranked themes match your intuition of your own users.

I'll fix what you find and report back in comments. Founder here.

---

## Posting order (one/day)

1. r/SideProject (safest, promo-native)
2. r/alphaandbetausers
3. r/webdev — wait for Saturday
4. r/microsaas
5. r/SaaS
6. r/indiehackers
7. r/shopifyDev (discussion post — engage hardest here, it's avatar A2)
