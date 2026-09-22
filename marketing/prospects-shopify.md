# Shopify app developers — the enumerable list

> **PARKED, 7 Sep 2026.** Cold outbound to marketplace developers is out of
> scope: it's sales rather than marketing, and it was cut on request. The list
> and the method below are still sound if that changes, but nothing in
> `index.html` references this file any more, and an agent working the runbook
> should not pick it up.

Built 3 Sep 2026 from Shopify App Store category pages. Every name below has a
**public review count between roughly 50 and 900**, which is the only
qualification that matters: a review count is a customer count, visible from
outside, so it takes five seconds and needs nobody to have posted their MRR.

Why this list and not Indie Hackers: these people have paying customers *and*
their only feedback channel is a public review page, where a complaint is
already marketing damage. They are not going to build a feedback platform to
service one line item. That is the whole pitch.

**Sanity check that the method works:** `NA Bulk Price Editor`, `Ablestar` and
`MIDA` were already in `prospects-day1.md`, found by hand. The same three fell
out of two category pages in about a minute.

---

## Skip these, they are on the list by accident

Filtered out already, but worth knowing why so the next refill does the same:

- **First-party**: Shopify Forms, Shopify Collabs, Shopify Collective, Shopify
  Inbox, Shopify Flow, TikTok, Facebook & Instagram, Google & YouTube,
  Microsoft Channel, Snapchat Ads. No buyer.
- **Well funded**: Gorgias, Klaviyo, Omnisend, Recharge, Tidio. They have a
  feedback stack and a team that owns it.
- **Competitors and adjacents — do not pitch, and watch them**: Zigpoll
  Customer Surveys (546), Propel Replay/Survey/Heatmap (667), Grapevine Post
  Purchase Survey (218), MIDA Replay/Heatmap (552), Microsoft Clarity (2085).
  These sell surveys or session replay into the same stores. `prospects-day1.md`
  lists MIDA as a prospect; it is closer to a competitor, and pitching it reads
  badly.

---

## Track A — store management (best fit)

Utility apps bought by operators. Small teams, unglamorous problems, real
revenue, and no feedback channel except the review page.

| App | Reviews | Listing (append to `apps.shopify.com/`) |
|---|---|---|
| Ablestar Bulk Product Editor | 901 | `bulk-product-editor` |
| Redo | 741 | `redo` |
| SEOWILL — Trust Badges & Icon | 699 | `trust-badge-by-giraffly` |
| Rewind Backups | 631 | `backup` |
| TnC: Terms and Conditions Box | 546 | `terms-and-conditions-checkbox` |
| Revoq — EU Withdrawal Button | 534 | `eu-withdrawal-form` |
| Simple Invoice — Order Printer | 440 | `simple-invoice-order-printer` |
| TA MAPPY: Store Locator & Maps | 437 | `dealer-store-locator` |
| Qikify Contact Form Builder | 432 | `contact-form-by-qikify` |
| Chargeflow Prevent Chargebacks | 414 | `chargeflow` |
| Helium Customer Fields | 337 | `customr` |
| WhatFlow: WhatsApp Automation | 334 | `whatflow` |
| Cozy AntiTheft | 250 | `cozy-antitheft-for-images-and-more` |
| NA Bulk Price Editor | 249 | `price-scheduler-plus` |
| Metafields Guru | 242 | `metafields-editor-2` |
| EAZE Button | 144 | `eaze-chat-button` |
| Sort'd — Prime Collection Sort | 143 | `stock-app` |
| IndexGPT: AI SEO for ChatGPT | 137 | `index-gpt` |
| Disputifier: Smart Chargebacks | 114 | `disputifier` |
| NA Age Verification | 93 | `age-checker-3` |

Slugs are not derivable from app names — `Metafields Guru` is
`metafields-editor-2`, `Sort'd` is `stock-app`. Pull them from the category
page's links, not by guessing.

## Track B — store design

Theme and page-builder apps. Same economics, slightly larger teams.

| App | Reviews | Contact found? |
|---|---|---|
| TS: AI Translate Language | 794 | needed |
| Nova: Multi Currency Converter | 760 | needed |
| Seguno Email Marketing | 728 | needed |
| Orbe Geolocation | 335 | needed |
| Geolocation & Markets — Selecty | 335 | needed |
| Instant AI Page Builder | 327 | needed |
| Theme Updater & Backups (OOTS) | 289 | needed |
| Replo Landing Page Builder | 188 | needed |

## Track C — marketing and conversion

| App | Reviews | Contact found? |
|---|---|---|
| GSC Countdown Timer Bar | 592 | needed |
| MetaShop: Instagram & Facebook | 564 | needed |
| Wiz — AI Email Marketing | 232 | needed |
| Parkour: Facebook Pixel & Feed | 190 | needed |
| Elevar Conversion Tracking | 167 | needed |
| Abandoned Cart Email Marketing | 162 | needed |

**36 qualified names.** Roughly two weeks of sending at 10 a day.

---

## Getting the contact, and the message

Each app's listing page has a Support section with a developer website and
often a support email. That is the contact path: `apps.shopify.com/<app-slug>`
→ Support → developer site → contact or founder email. Two minutes per
prospect, and it is the part that cannot be batched.

The message writes itself from the review page, and this is the version to
send — not the generic one:

> Subject: your 1-stars are your only feedback channel
>
> You've got [N] reviews on the Shopify app store, which means [N]+ merchants
> who care enough to write something. Right now that review page is also the
> only way they can tell you anything — so by the time you hear about a
> problem, it's public and it's costing you installs.
>
> I built a widget that sits inside your embedded app and catches it first. One
> script tag, four minutes, and it groups everything merchants submit into a
> ranked list of what to fix. [screenshot of it brand-matched to their app]
>
> Free tier is real. Worth 15 minutes?

The screenshot is the pitch, not the text. Make a project against their app or
marketing site first, let the widget brand-match it, and attach that.

---

## Refilling this list

The categories are enumerable and the review count is on the category page, so
this is clerical work rather than research:

1. `apps.shopify.com/categories/<category>` — store-management, store-design,
   marketing-and-conversion are done. Remaining: orders-and-shipping,
   finding-and-adding-products, selling-products, customer-support-and-service.
2. Keep anything between 50 and 900 reviews.
3. Drop first-party, funded, and anything that sells surveys or session replay.
4. Chrome Web Store and WordPress.org work the same way. WordPress.org's
   `browse/popular` page is all giants (Yoast is at 27,819 reviews) — use tag
   and search pages to reach the mid-tail instead.
