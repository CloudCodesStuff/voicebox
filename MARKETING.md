# Launch kit

Everything written and ready to paste. The posting is yours: these land better
from a person than from an account that appeared this morning, and every one of
them is irreversible.

Two pieces of live intel shaped all the copy below.

**Someone on r/SaaS wrote, more or less verbatim:** *"Outgrew Canny's 25-user
free plan and the jump to $79/mo for Pro felt steep. We're now evaluating
alternatives with flat pricing."* That is your customer describing your wedge
in their own words.

**A near-identical Show HN ran about a week ago**, "An AI-Powered Widget for
Collecting User Feedback". The top critique in that thread was not about the
product. It was: *B2C products need too many clicks to submit feedback, and
users have no motivation to bother unless something major happens.*

That objection will be the first comment on your post too. Answer it before
anyone asks, or the thread becomes about it.

---

## Pre-flight, before any traffic

Two hours. In this order.

- [ ] **Buy Pro from yourself with a real card.** Confirm the workspace flips,
      then refund in Stripe. Five live checkout sessions exist and none
      completed. Sending strangers to an untested checkout is the one mistake
      you cannot recover from in a launch week.
- [ ] **`EMAIL_FROM` in Vercel** = `Voicebox <hello@mail.usevoicebox.dev>`.
- [ ] **`ADMIN_EMAILS` in Vercel**, so `/admin` works and you can watch signups
      arrive live.
- [ ] **Domain allowlists** on your own projects.
- [ ] **`git push`.** The blog and comparison pages are not deployed yet, and
      three of the posts below link to them.
- [ ] **Record a 30-second screen capture**: paste the tag, submit feedback,
      watch it appear scored and grouped. This one clip is your entire
      marketing asset. Everything below reuses it.

---

## 1. Show HN

Best posted **Tuesday to Thursday, 8–10am ET**. One shot; you cannot repost.

**Title** (79 chars, under the limit):

```
Show HN: Voicebox – A feedback widget that groups replies into a ranked fix list
```

**URL:** `https://www.usevoicebox.dev`

**First comment, post it immediately after submitting:**

```
I kept hitting the same problem on my own projects: collecting feedback is
easy, and reading 400 messages is not. You end up remembering that "several
people" complained about the export being slow, without knowing whether it was
four or fourteen, or whether it is getting worse.

So Voicebox is two things. A widget you install with one script tag, and an
analysis layer that scores each submission and groups the ones describing the
same underlying problem into a single ranked theme. "Export is slow" and "the
download keeps failing" end up in the same bucket, so the count is people
affected rather than keyword frequency.

Technical bits that were actually interesting to build:

- The widget renders entirely in a Shadow DOM root with `all: initial`, so host
  CSS cannot reach in and nothing leaks out. It is about 11KB over the wire,
  zero dependencies, and mounts on requestIdleCallback so it never blocks the
  host page. If our API is unreachable it renders nothing rather than throwing
  into someone else's error tracking.
- Grouping is the part where an LLM is genuinely the right tool: not writing
  your roadmap, just recognising that two differently-worded complaints are one
  problem. Ranking on top of that is plain arithmetic you can check — volume ×
  negative share × recency decay — because a ranked list nobody can interrogate
  gets ignored the first time it disagrees with someone senior.
- Only three fields ever reach the model: message text, the type the user
  picked, and the rating. The email address and any identify() traits are
  excluded by the function signature rather than by a filter someone could
  forget. You can also switch analysis off entirely, in which case nothing
  leaves at all.

The obvious objection, and the one I would raise: most users never submit
anything, and a feedback button is not going to change that. That is true, and
the widget cannot fix it. What it does is make the feedback you *do* get worth
having — someone who just hit a problem writes about that problem specifically,
and the tool exists to stop those messages dying in an inbox. If you get ten
pieces a month you should just read them, and no tool beats that. It starts
earning its place somewhere around the point you can no longer hold the whole
picture in your head.

Pricing is on feedback volume rather than tracked users or seats, which is the
thing I actually wanted to build differently. Free tier is 50 pieces a month
with the AI included.

No customers yet. Genuinely want to hear where this is wrong.
```

**Notes:** HN punishes marketing voice and rewards specifics and hedging where
hedging is honest. Do not say "revolutionary". Do say "no customers yet" —
it buys enormous goodwill and is true. Stay in the thread for the first three
hours and reply to everything.

---

## 2. Reddit

Different subs want different things. Do not cross-post the same text.

### r/SideProject — most permissive, post first

**Title:** `I built a feedback widget that groups replies by the underlying problem instead of tagging them`

```
Every feedback tool I tried made me tag things. Tagging works for about three
weeks, then it stops, and a half-tagged inbox is worse than an untagged one
because the counts look authoritative and are wrong.

So I built the version I wanted. One script tag, and the analysis groups
messages describing the same problem into a single theme with a count. Five
different wordings of "your export is broken" become one item, ranked against
everything else by how many people, how unhappy, and how recently.

It is about 11KB, renders in a Shadow DOM root so it cannot collide with your
CSS, and takes about four minutes to install.

Free tier is 50 pieces of feedback a month with the AI on. No customers yet,
this is the first time I have shown it to anyone.

https://www.usevoicebox.dev

Happy to answer anything, and genuinely interested in what would stop you using
it.
```

### r/SaaS — Saturday self-promo thread only

Check the sidebar rules the day you post; they change. Lead with the pricing
argument, since that is the conversation already happening there.

**Title:** `Built a feedback tool priced on volume instead of tracked users`

```
I kept seeing the same complaint here: you adopt a feedback board when it is
cheap, your product gets more popular, more people vote, and the bill goes up
without your revenue going up. Pricing on tracked users means a good launch
costs you money.

So I built one metered on how much feedback you collect. $0 for 50 a month,
$19 for 3,000, $49 for 15,000 with unlimited seats. AI analysis on every plan
including free, because gating the useful part behind a tier is the other thing
that annoyed me.

It is a widget plus an analysis layer that groups replies by the problem
underneath rather than by keyword, so you get a ranked list of what to fix
rather than an inbox.

What it does not do: no public voting board, no roadmap. If you want customers
voting in public, Canny and Featurebase are genuinely the right tools and I
wrote a comparison saying so: https://www.usevoicebox.dev/vs/canny

No customers yet. https://www.usevoicebox.dev
```

### r/indiehackers — the build story works better here

**Title:** `Shipped a feedback widget in a few weeks. Here is what I got wrong first.`

```
Three things I had to redo, in case they save someone else the time.

1. The widget's trigger button was dead for the first second of every page
   load. I registered the click listener at the end of mount(), which only runs
   after an idle callback plus a config fetch. Anyone clicking a custom "Send
   feedback" button in that window got nothing, silently, on their own site.
   Now the listener binds at script execution and an early click is queued.

2. Oversized metadata destroyed the feedback attached to it. I had caps on
   identify() traits implemented as validation, so one over-filled call meant
   every submission from that visitor was rejected. The person typing has no
   idea a developer over-filled an object, and their words are the part worth
   keeping. Now the traits get trimmed and the message always goes through.

3. My own activation funnel read over 100% because I counted workspaces at one
   step and users at another.

Product is a feedback widget plus an analysis layer that groups replies into a
ranked list of what to fix. Free tier is 50/month with the AI included.

https://www.usevoicebox.dev
```

**Reddit rules that will get you banned if ignored:** never post the same text
to multiple subs on the same day, always reply to every comment, and never post
your own "what Reddit says" article *to* Reddit. Those pages exist to rank in
search, not to survive contact with the community they describe.

---

## 3. Product Hunt

Needs a day of prep. Tuesday or Wednesday, live at 12:01am PT.

**The images are done.** `marketing/product-hunt/`, generated by
`node scripts/product-hunt-images.mjs`. Upload the six gallery files in
filename order; the first one is the card people see in the feed.

| File | Size | What it does |
| --- | --- | --- |
| `thumbnail.png` | 512×512 | The mark alone. It renders at about 48px in the feed, where any word would be a smudge. |
| `01-hero.png` | 1270×760 | Says what this is before anyone decides to scroll on. |
| `02-what-it-does.png` | 1270×760 | 400 messages on the left, six things to fix on the right. The whole idea in one picture. |
| `03-ranked-themes.png` | 1270×760 | The ranked list, drawn the way the app draws it, with verbatim output from a real run. |
| `04-install.png` | 1270×760 | The script tag, and the three numbers a developer wants. |
| `05-widget.png` | 1270×760 | The only part your customers' users ever see. |
| `06-pricing.png` | 1270×760 | The wedge: metered on feedback, not on people. |

Every colour comes from `globals.css` and every figure from `src/lib/site.ts`,
so when a price moves, regenerate rather than editing a PNG. If you shoot the
30-second clip, upload it ahead of `01-hero.png`; Product Hunt plays video first
and a working demo outperforms any still.

**Name:** Voicebox
**Tagline (60 max):** `Feedback in. Fix list out.`

**Description:**

```
Voicebox is a feedback widget you install with one script tag, plus an AI that
reads every reply, groups the ones describing the same problem, and ranks them
by how many people are affected and how unhappy they were.

You get a list of six things to fix instead of four hundred messages you keep
meaning to read.

- One line to install. No package, no build step, about 11KB.
- Renders in a Shadow DOM root, so it cannot collide with your styles.
- Every submission scored for tone and intent within seconds.
- Priced on feedback volume, not tracked users and not per seat.
- Free for 50 pieces a month, with the AI included.
```

**First comment:**

```
Hi PH 👋

I built this because collecting feedback was never the hard part. Reading it
was. You end up half-remembering that "a few people" mentioned something,
without knowing if it was three or thirty.

The bit I care about most is the grouping. It works on the problem underneath
rather than the keyword, so "export is slow" and "the download never finishes"
land in the same theme, and the number next to it is people affected rather
than how often a word appeared.

Two honest notes. There is no public voting board — if you want customers
voting on features in public, Canny or Featurebase do that properly and I have
a comparison page saying where each of them wins. And there are no customers
yet, so you would be early.

Free tier is real: 50 pieces a month with the analysis on, no card.

Would love to know what would stop you installing it.
```

---

## 4. X / Twitter

Post the 30-second clip as the first tweet. The clip does the work.

```
1/ Collecting feedback is easy. Reading 400 messages is not.

I built a widget that groups replies by the problem underneath, so you get a
ranked list of what to fix instead of an inbox.

One script tag. 11KB. Four minutes.

[clip]

2/ The grouping is the point.

"Export is slow" and "the download keeps failing" are one problem and two tags.
Tagging splits them and undercounts. Voicebox puts them in one theme, and the
number next to it is people affected.

3/ Ranked by volume × negative share × recency.

Deliberately arithmetic you can check, not a black box. A ranked list nobody
can interrogate gets ignored the first time it disagrees with someone senior.

4/ Priced on feedback volume. Not tracked users, not seats.

Tools that meter on tracked users charge you more the better your product does.
A good launch should not raise your bill.

$0 for 50/mo with the AI on. $19 for 3,000.

5/ No customers yet. Free tier is real and the AI is on it.

https://www.usevoicebox.dev
```

---

## 5. Direct outreach — the highest-converting thing here

Twenty relevant replies will beat every launch above. Nobody does this because
it is not glamorous.

**Search these, sorted by recent, on both X and Reddit:**

- `canny pricing`
- `canny alternative`
- `tracked users pricing`
- `featurebase pricing`
- `feedback widget recommendation`
- `canny cancel` — Canny took public criticism for removing the in-dashboard
  cancel button and making people email support. People in those threads are
  actively looking to leave.

**Reply template. Adapt every single one; a copy-paste is obvious and works
against you:**

```
The tracked-user model is what gets most people — you pay more as more of your
customers participate, so a good launch costs you money.

I built an alternative that meters on feedback volume instead ($19/mo for
3,000). Fair warning that it does not do public voting boards at all, so if
that is the part you need, Featurebase is the closer swap. I wrote up the
comparison including where Canny genuinely wins: usevoicebox.dev/vs/canny
```

**Why this works:** you are answering the question, naming a competitor as
better for their case, and linking a page that proves it. That is the opposite
of spam and it reads that way.

**Offer free migration.** Anyone leaving a paid tool will pay attention to
"I'll import your existing feedback for you." You have an ingest API; doing it
by hand for the first five customers is a completely reasonable use of a week.

---

## 6. What to measure

Open `/admin` each morning. It shows signups, the activation funnel, and
feedback volume, so you can see which day's post actually moved anything.

**The number that matters in week one is installs, not payments.** Your free
tier covers a small site indefinitely, so most signups will not pay for weeks.
Judging the launch on revenue will make you conclude something false.

Every free install also carries "Powered by Voicebox" linking back with
`?ref=widget`. Fifty free installs is fifty billboards on other people's
traffic. That is why the free tier is generous, and why shrinking it to force
conversions would be a mistake.

---

## Do not

- Fake testimonials, upvote rings, sockpuppet accounts. HN and PH detect it,
  it is unrecoverable, and it poisons the flip at diligence.
- Post the same text to several subreddits in one day.
- Buy ads. At $19/mo with no conversion data you will burn money learning what
  a free launch teaches you.
- Claim customers, uptime, or benchmarks you do not have. Every number in this
  kit is one you can currently stand behind. Keep it that way.
